/**
 * One-time script to sync existing Stripe subscriptions to Supabase
 *
 * Usage:
 *   node scripts/sync-stripe-subscriptions.js
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY - Your Stripe secret key (sk_live_... or sk_test_...)
 *   SUPABASE_URL - Your Supabase project URL (or VITE_SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY - Service role key (bypasses RLS)
 */

import 'dotenv/config'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Initialize clients
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
})

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function syncSubscriptions() {
  console.log('🔄 Starting Stripe subscription sync...\n')

  try {
    // Fetch all subscriptions (active, past_due, canceled, etc.)
    console.log('📥 Fetching subscriptions from Stripe...')
    const subscriptions = await stripe.subscriptions.list({
      limit: 100,
      status: 'all', // Include all statuses
    })

    console.log(`✅ Found ${subscriptions.data.length} subscriptions\n`)

    let successCount = 0
    let errorCount = 0

    for (const subscription of subscriptions.data) {
      try {
        console.log(`Processing: ${subscription.id}`)

        // Extract subscription data (same logic as webhook)
        const priceData = subscription.items.data[0]?.price
        const mrr = priceData?.unit_amount ? priceData.unit_amount / 100 : 0
        const currency = priceData?.currency?.toUpperCase() || 'NZD'

        // Get product name
        let appName = subscription.metadata.app_name
        if (!appName && subscription.items.data[0]?.price.product) {
          const productId = typeof subscription.items.data[0].price.product === 'string'
            ? subscription.items.data[0].price.product
            : subscription.items.data[0].price.product.id
          const product = await stripe.products.retrieve(productId)
          appName = product.name
        }
        appName = appName || 'Unknown App'

        // Calculate GST (15% for NZD)
        const gstRate = currency === 'NZD' ? 0.15 : 0
        const grossAmount = mrr
        const gstAmount = grossAmount * gstRate / (1 + gstRate)
        const netAmount = grossAmount - gstAmount

        // Get customer to count subscribers
        const customer = await stripe.customers.retrieve(subscription.customer)
        const subscriberCount = customer.deleted ? 0 : 1

        // Upsert to database
        const { error } = await supabase.from('subscription_sources').upsert({
          stripe_subscription_id: subscription.id,
          stripe_customer_id: subscription.customer,
          app_name: appName,
          subscribers: subscriberCount,
          mrr: mrr,
          gross_jan: grossAmount,
          fees_jan: 0,
          net_jan: netAmount,
          gst_jan: gstAmount,
          status: subscription.status,
          current_period_start: subscription.current_period_start
            ? new Date(subscription.current_period_start * 1000).toISOString()
            : new Date().toISOString(),
          current_period_end: subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : new Date().toISOString(),
        }, {
          onConflict: 'stripe_subscription_id'
        })

        if (error) {
          console.error(`  ❌ Error: ${error.message}`)
          errorCount++
        } else {
          console.log(`  ✅ Synced: ${appName} ($${mrr}/mo) - ${subscription.status}`)
          successCount++
        }

      } catch (err) {
        console.error(`  ❌ Failed to process ${subscription.id}:`, err.message)
        errorCount++
      }
    }

    console.log('\n📊 Sync complete:')
    console.log(`  ✅ Success: ${successCount}`)
    console.log(`  ❌ Errors: ${errorCount}`)

  } catch (error) {
    console.error('💥 Fatal error:', error)
    process.exit(1)
  }
}

async function syncCharges() {
  console.log('\n💰 Starting charge history sync...\n')

  try {
    // Fetch charges from last 90 days (adjust as needed)
    const charges = await stripe.charges.list({
      limit: 100,
      created: {
        gte: Math.floor(Date.now() / 1000) - (90 * 24 * 60 * 60), // 90 days ago
      },
    })

    console.log(`✅ Found ${charges.data.length} charges\n`)

    let successCount = 0
    let errorCount = 0

    for (const charge of charges.data) {
      try {
        // Skip if charge already exists
        const { data: existing } = await supabase
          .from('stripe_transactions')
          .select('id')
          .eq('id', charge.id)
          .single()

        if (existing) {
          console.log(`  ⏭️  Skipped (exists): ${charge.id}`)
          continue
        }

        const gross = charge.amount / 100
        const fee = charge.application_fee_amount
          ? charge.application_fee_amount / 100
          : gross * 0.029 + 0.30 // Estimate
        const net = gross - fee

        const { error } = await supabase.from('stripe_transactions').insert({
          id: charge.id,
          type: 'charge',
          date: new Date(charge.created * 1000).toISOString().split('T')[0], // Date only
          gross: gross,
          fee: fee,
          net: net,
          description: charge.description || 'Stripe charge',
        })

        if (error) {
          console.error(`  ❌ Error: ${error.message}`)
          errorCount++
        } else {
          console.log(`  ✅ Synced: $${amount} - ${charge.description || 'charge'}`)
          successCount++
        }

      } catch (err) {
        console.error(`  ❌ Failed to process ${charge.id}:`, err.message)
        errorCount++
      }
    }

    console.log('\n📊 Charge sync complete:')
    console.log(`  ✅ Success: ${successCount}`)
    console.log(`  ❌ Errors: ${errorCount}`)

  } catch (error) {
    console.error('💥 Fatal error:', error)
  }
}

// Run sync
(async () => {
  console.log('╔══════════════════════════════════════╗')
  console.log('║  Stripe → Supabase Historical Sync   ║')
  console.log('╚══════════════════════════════════════╝\n')

  await syncSubscriptions()
  await syncCharges()

  console.log('\n✨ All done!')
})()
