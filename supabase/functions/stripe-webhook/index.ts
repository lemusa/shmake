import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@14.0.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2024-11-20.acacia',
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      return new Response(JSON.stringify({ error: 'No signature' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const body = await req.text()

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        Deno.env.get('STRIPE_WEBHOOK_SECRET')!
      )
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message)
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('Received event:', event.type, event.id)

    // Create Supabase client with service role (bypass RLS)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Check if event already processed (idempotency)
    const { data: existing } = await supabase
      .from('stripe_webhook_events')
      .select('id')
      .eq('event_id', event.id)
      .single()

    if (existing) {
      console.log('Event already processed:', event.id)
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Process event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(supabase, event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(supabase, event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(supabase, event.data.object as Stripe.Invoice)
        break

      case 'charge.succeeded':
        await handleChargeSucceeded(supabase, event.data.object as Stripe.Charge)
        break

      case 'charge.refunded':
        await handleChargeRefunded(supabase, event.data.object as Stripe.Charge)
        break

      default:
        console.log('Unhandled event type:', event.type)
    }

    // Mark event as processed
    await supabase.from('stripe_webhook_events').insert({
      event_id: event.id,
      event_type: event.type,
      processed_at: new Date().toISOString()
    })

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Normalize app names — group old user-specific Stripe products
 * (e.g. "abc123 user@email.com") into their canonical app name.
 */
function normalizeAppName(name: string): string {
  if (name.includes('@') || /^[a-f0-9]{16,}/.test(name)) {
    return 'myMECA Premium'
  }
  return name
}

/**
 * Extract app name and MRR from a Stripe subscription object.
 */
async function extractSubscriptionInfo(subscription: Stripe.Subscription) {
  const priceData = subscription.items.data[0]?.price
  const mrr = priceData?.unit_amount ? priceData.unit_amount / 100 : 0
  const currency = priceData?.currency?.toUpperCase() || 'NZD'

  let appName = subscription.metadata.app_name
  if (!appName && subscription.items.data[0]?.price.product) {
    const productId = typeof subscription.items.data[0].price.product === 'string'
      ? subscription.items.data[0].price.product
      : subscription.items.data[0].price.product.id
    const product = await stripe.products.retrieve(productId)
    appName = product.name
  }
  appName = normalizeAppName(appName || 'Unknown App')

  return { appName, mrr, currency }
}

// ─── Event Handlers ─────────────────────────────────────────────────────────

async function handleSubscriptionUpdate(supabase: any, subscription: Stripe.Subscription) {
  console.log('Processing subscription update:', subscription.id)

  const { appName, mrr, currency } = await extractSubscriptionInfo(subscription)
  const gstRate = currency === 'NZD' ? 0.15 : 0

  // Find existing aggregated source by app_name
  const { data: existing } = await supabase
    .from('subscription_sources')
    .select('*')
    .eq('app_name', appName)
    .limit(1)
    .single()

  if (existing) {
    const meta = existing.metadata || {}
    const activeIds = new Set<string>(meta.activeSubscriptionIds || [])
    const wasTracked = activeIds.has(subscription.id)

    if (subscription.status === 'active') {
      // Add this subscription to tracking
      activeIds.add(subscription.id)
      const newMrr = wasTracked ? existing.mrr : existing.mrr + mrr
      const newSubs = activeIds.size
      const grossTotal = newMrr
      const gstTotal = grossTotal * gstRate / (1 + gstRate)
      const netTotal = grossTotal - gstTotal

      const { error } = await supabase.from('subscription_sources').update({
        subscribers: newSubs,
        mrr: newMrr,
        gross_jan: grossTotal,
        net_jan: netTotal,
        gst_jan: gstTotal,
        status: 'active',
        metadata: { ...meta, activeSubscriptionIds: [...activeIds] },
      }).eq('id', existing.id)

      if (error) { console.error('Failed to update subscription source:', error); throw error }
      console.log(`Merged into "${appName}": ${newSubs} subs, $${newMrr.toFixed(2)} MRR`)
    } else {
      // Subscription no longer active — remove from tracking
      activeIds.delete(subscription.id)
      const newMrr = Math.max(0, wasTracked ? existing.mrr - mrr : existing.mrr)
      const grossTotal = newMrr
      const gstTotal = grossTotal * gstRate / (1 + gstRate)
      const netTotal = grossTotal - gstTotal

      const { error } = await supabase.from('subscription_sources').update({
        subscribers: activeIds.size,
        mrr: newMrr,
        gross_jan: grossTotal,
        net_jan: netTotal,
        gst_jan: gstTotal,
        metadata: { ...meta, activeSubscriptionIds: [...activeIds] },
      }).eq('id', existing.id)

      if (error) { console.error('Failed to update subscription source:', error); throw error }
      console.log(`Removed from "${appName}": ${activeIds.size} subs, $${newMrr.toFixed(2)} MRR`)
    }
  } else {
    // No existing source — create new aggregated entry
    const isActive = subscription.status === 'active'
    const grossAmount = isActive ? mrr : 0
    const gstAmount = grossAmount * gstRate / (1 + gstRate)
    const netAmount = grossAmount - gstAmount

    const { error } = await supabase.from('subscription_sources').insert({
      app_name: appName,
      platform: 'Stripe',
      subscribers: isActive ? 1 : 0,
      mrr: isActive ? mrr : 0,
      gross_jan: grossAmount,
      fees_jan: 0,
      net_jan: netAmount,
      gst_jan: gstAmount,
      status: subscription.status,
      metadata: {
        activeSubscriptionIds: isActive ? [subscription.id] : [],
      },
    })

    if (error) { console.error('Failed to create subscription source:', error); throw error }
    console.log(`Created new source "${appName}": $${mrr.toFixed(2)} MRR`)
  }
}

async function handleSubscriptionDeleted(supabase: any, subscription: Stripe.Subscription) {
  console.log('Processing subscription deletion:', subscription.id)

  const { appName, mrr, currency } = await extractSubscriptionInfo(subscription)
  const gstRate = currency === 'NZD' ? 0.15 : 0

  // Find aggregated source by app_name
  const { data: existing } = await supabase
    .from('subscription_sources')
    .select('*')
    .eq('app_name', appName)
    .limit(1)
    .single()

  if (existing) {
    const meta = existing.metadata || {}
    const activeIds = new Set<string>(meta.activeSubscriptionIds || [])
    const wasTracked = activeIds.has(subscription.id)
    activeIds.delete(subscription.id)

    const newMrr = Math.max(0, wasTracked ? existing.mrr - mrr : existing.mrr)
    const grossTotal = newMrr
    const gstTotal = grossTotal * gstRate / (1 + gstRate)
    const netTotal = grossTotal - gstTotal

    const { error } = await supabase.from('subscription_sources').update({
      subscribers: activeIds.size,
      mrr: newMrr,
      gross_jan: grossTotal,
      net_jan: netTotal,
      gst_jan: gstTotal,
      metadata: { ...meta, activeSubscriptionIds: [...activeIds] },
    }).eq('id', existing.id)

    if (error) { console.error('Failed to update subscription source:', error); throw error }
    console.log(`Subscription canceled from "${appName}": ${activeIds.size} subs remaining`)
  } else {
    console.log(`No source found for "${appName}", nothing to update`)
  }
}

async function handleInvoicePaymentSucceeded(supabase: any, invoice: Stripe.Invoice) {
  console.log('Processing invoice payment:', invoice.id)

  // invoice.subscription can be a string ID — look up the subscription to get app_name
  if (invoice.subscription) {
    const subId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription.id
    try {
      const subscription = await stripe.subscriptions.retrieve(subId)
      const { appName } = await extractSubscriptionInfo(subscription)
      const fee = invoice.application_fee_amount ? invoice.application_fee_amount / 100 : 0

      await supabase
        .from('subscription_sources')
        .update({ fees_jan: fee })
        .eq('app_name', appName)
    } catch (err: unknown) {
      console.error('Failed to update fees for invoice:', (err as Error).message)
    }
  }
}

async function handleChargeSucceeded(supabase: any, charge: Stripe.Charge) {
  console.log('Processing charge:', charge.id)

  // Calculate fees (Stripe typically charges 2.9% + 30¢ for NZ)
  const amount = charge.amount / 100
  const fee = charge.application_fee_amount
    ? charge.application_fee_amount / 100
    : (charge.balance_transaction
        ? await getActualFee(charge.balance_transaction as string)
        : amount * 0.029 + 0.30) // Estimate if balance_transaction not available

  const net = amount - fee

  // Upsert transaction (column names match stripe_transactions table schema)
  const { error } = await supabase.from('stripe_transactions').upsert({
    id: charge.id,
    type: 'charge',
    gross: amount,
    fee: Math.round(fee * 100) / 100,
    net: Math.round(net * 100) / 100,
    date: new Date(charge.created * 1000).toISOString().split('T')[0],
    description: charge.description || 'Stripe charge',
    stripe_customer_id: typeof charge.customer === 'string' ? charge.customer : charge.customer?.id,
    status: charge.status
  }, { onConflict: 'id' })

  if (error) {
    console.error('Failed to insert charge transaction:', error)
    throw error
  }

  console.log('Charge recorded:', charge.id)
}

async function handleChargeRefunded(supabase: any, charge: Stripe.Charge) {
  console.log('Processing refund:', charge.id)

  const refundAmount = charge.amount_refunded / 100

  // Upsert refund transaction (column names match stripe_transactions table schema)
  const { error } = await supabase.from('stripe_transactions').upsert({
    id: `${charge.id}_refund`,
    type: 'refund',
    gross: -refundAmount,
    fee: 0,
    net: -refundAmount,
    date: new Date().toISOString().split('T')[0],
    description: `Refund for ${charge.description || 'charge'}`,
    stripe_customer_id: typeof charge.customer === 'string' ? charge.customer : charge.customer?.id,
    status: 'refunded'
  }, { onConflict: 'id' })

  if (error) {
    console.error('Failed to insert refund transaction:', error)
    throw error
  }

  console.log('Refund recorded:', charge.id)
}

async function getActualFee(balanceTransactionId: string): Promise<number> {
  try {
    const balanceTransaction = await stripe.balanceTransactions.retrieve(balanceTransactionId)
    return balanceTransaction.fee / 100
  } catch (error) {
    console.error('Failed to retrieve balance transaction:', error)
    return 0
  }
}
