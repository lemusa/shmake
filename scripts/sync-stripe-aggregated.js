/**
 * Aggregated sync - Groups subscriptions by app_name
 * Creates ONE row per app with total subscribers and MRR
 */

import 'dotenv/config'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
})

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * Normalize app names - group old user-specific products
 * Old version created products like "abc123 user@email.com"
 * We want to group all myMECA subscriptions together
 */
function normalizeAppName(name) {
  // If name contains email or hash pattern, it's likely a user-specific product
  if (name.includes('@') || /^[a-f0-9]{16,}/.test(name)) {
    return 'myMECA Premium'
  }
  return name
}

async function syncAggregated() {
  console.log('╔══════════════════════════════════════╗')
  console.log('║  Stripe → Supabase Aggregated Sync   ║')
  console.log('╚══════════════════════════════════════╝\n')

  try {
    // Fetch all subscriptions
    console.log('📥 Fetching subscriptions from Stripe...')
    const subscriptions = await stripe.subscriptions.list({
      limit: 100,
      status: 'all',
    })

    console.log(`✅ Found ${subscriptions.data.length} subscriptions\n`)

    // Group by app_name
    const appGroups = {}

    for (const sub of subscriptions.data) {
      const priceData = sub.items.data[0]?.price
      const mrr = priceData?.unit_amount ? priceData.unit_amount / 100 : 0
      const currency = priceData?.currency?.toUpperCase() || 'NZD'

      // Get app name
      let appName = sub.metadata.app_name
      if (!appName && sub.items.data[0]?.price.product) {
        const productId = typeof sub.items.data[0].price.product === 'string'
          ? sub.items.data[0].price.product
          : sub.items.data[0].price.product.id
        const product = await stripe.products.retrieve(productId)
        appName = product.name
      }
      appName = appName || 'Unknown App'

      // Normalize app names - group old user-specific products into myMECA Premium
      appName = normalizeAppName(appName)

      // Skip test subscriptions (< $1)
      if (mrr < 1) {
        console.log(`  ⏭️  Skipping test subscription: ${appName} ($${mrr})`)
        continue
      }

      // Initialize app group
      if (!appGroups[appName]) {
        appGroups[appName] = {
          appName,
          currency,
          activeSubscriptions: [],
          canceledSubscriptions: [],
          totalMrr: 0,
          totalGross: 0,
          totalFees: 0,
          totalNet: 0,
          totalGst: 0,
        }
      }

      // Add subscription to group
      const gstRate = currency === 'NZD' ? 0.15 : 0
      const gross = mrr
      const gst = gross * gstRate / (1 + gstRate)
      const net = gross - gst

      if (sub.status === 'active') {
        appGroups[appName].activeSubscriptions.push({
          id: sub.id,
          created: sub.created,
          mrr,
        })
        appGroups[appName].totalMrr += mrr
        appGroups[appName].totalGross += gross
        appGroups[appName].totalGst += gst
        appGroups[appName].totalNet += net
      } else {
        appGroups[appName].canceledSubscriptions.push({
          id: sub.id,
          canceled: sub.canceled_at || sub.ended_at,
        })
      }
    }

    // Fetch actual Stripe fees from charges this financial year (Apr-Mar)
    console.log('📥 Fetching charges from Stripe for fee data...')
    const now = new Date()
    const fyStart = now.getMonth() >= 3
      ? new Date(now.getFullYear(), 3, 1)   // Apr this year
      : new Date(now.getFullYear() - 1, 3, 1) // Apr last year
    const yearStart = fyStart
    const allCharges = []
    for await (const charge of stripe.charges.list({
      limit: 100,
      created: { gte: Math.floor(yearStart.getTime() / 1000) },
    })) {
      allCharges.push(charge)
    }
    const charges = { data: allCharges }
    console.log(`✅ Found ${charges.data.length} charges this FY\n`)

    // Sum charges YTD (gross, fees, net) from balance transactions
    let ytdGross = 0, ytdFees = 0, ytdNet = 0
    for (const charge of charges.data) {
      if (charge.status !== 'succeeded') continue
      const g = charge.amount / 100
      let f = 0
      if (charge.balance_transaction) {
        try {
          const bt = await stripe.balanceTransactions.retrieve(
            typeof charge.balance_transaction === 'string'
              ? charge.balance_transaction
              : charge.balance_transaction.id
          )
          f = bt.fee / 100
        } catch { f = g * 0.029 + 0.30 }
      } else {
        f = g * 0.029 + 0.30
      }
      ytdGross += g
      ytdFees += f
      ytdNet += g - f

      // Also upsert into stripe_transactions
      await supabase.from('stripe_transactions').upsert({
        id: charge.id,
        type: 'charge',
        date: new Date(charge.created * 1000).toISOString().split('T')[0],
        gross: g,
        fee: Math.round(f * 100) / 100,
        net: Math.round((g - f) * 100) / 100,
        description: charge.description || 'Stripe charge',
        stripe_customer_id: typeof charge.customer === 'string' ? charge.customer : charge.customer?.id,
        status: charge.status,
      }, { onConflict: 'id' })
    }

    ytdGross = Math.round(ytdGross * 100) / 100
    ytdFees = Math.round(ytdFees * 100) / 100
    ytdNet = Math.round(ytdNet * 100) / 100

    console.log(`💰 YTD totals: Gross $${ytdGross} | Fees $${ytdFees} | Net $${ytdNet}\n`)
    console.log('📊 Aggregated by app:\n')

    // Delete existing Stripe sources (will be re-created fresh)
    // Non-Stripe sources (BuyMeACoffee etc.) are left untouched
    const { error: delErr } = await supabase
      .from('subscription_sources')
      .delete()
      .eq('platform', 'Stripe')
    if (delErr) console.error('⚠️  Failed to clear old Stripe sources:', delErr.message)

    // Insert fresh aggregated rows
    for (const [appName, group] of Object.entries(appGroups)) {
      const subscribers = group.activeSubscriptions.length

      // Build subscriber trend (last 7 data points based on creation dates)
      const trend = buildTrend(group.activeSubscriptions, subscribers)

      // Calculate MRR trend (not subscriber trend)
      const mrrTrend = subscribers > 0
        ? trend.map((subCount) => Math.round((subCount / subscribers) * group.totalMrr * 100) / 100)
        : []

      console.log(`📱 ${appName}`)
      console.log(`   Active subscribers: ${subscribers}`)
      console.log(`   Total MRR: $${group.totalMrr.toFixed(2)}`)
      console.log(`   Subscriber trend: [${trend.join(', ')}]`)
      console.log(`   MRR trend: [$${mrrTrend.join(', $')}]`)
      console.log(`   YTD Gross: $${ytdGross} | Fees: $${ytdFees} | Net: $${ytdNet}`)

      const { error } = await supabase.from('subscription_sources').insert({
        app_name: appName,
        platform: 'Stripe',
        subscribers: subscribers,
        mrr: group.totalMrr,
        gross_jan: ytdGross,
        fees_jan: ytdFees,
        net_jan: ytdNet,
        gst_jan: group.totalGst,
        metadata: {
          trend: mrrTrend,
          subscriberTrend: trend,
          activeSubscriptionIds: group.activeSubscriptions.map(s => s.id),
        }
      })

      if (error) {
        console.error(`   ❌ Error: ${error.message}`)
      } else {
        console.log(`   ✅ Synced!`)
      }
      console.log()
    }

    console.log('✨ Aggregated sync complete!\n')

  } catch (error) {
    console.error('💥 Fatal error:', error)
    process.exit(1)
  }
}

/**
 * Build subscriber trend array
 * Uses subscription creation dates to estimate historical subscriber counts
 */
function buildTrend(activeSubscriptions, currentCount) {
  if (activeSubscriptions.length === 0) return []

  // Sort by creation date
  const sorted = activeSubscriptions.sort((a, b) => a.created - b.created)

  // Get date range (oldest to now)
  const oldestDate = new Date(sorted[0].created * 1000)
  const now = new Date()

  // Calculate months between oldest and now
  const monthsDiff = Math.floor((now - oldestDate) / (30 * 24 * 60 * 60 * 1000))

  // Build trend with max 7 data points
  const trendSize = Math.min(7, monthsDiff + 1)
  const trend = []

  if (trendSize === 1) {
    // All subscriptions created recently, just return current count
    return [currentCount]
  }

  // Calculate subscriber count at each interval
  const intervalMonths = monthsDiff / (trendSize - 1)

  for (let i = 0; i < trendSize; i++) {
    const targetDate = new Date(oldestDate)
    targetDate.setMonth(targetDate.getMonth() + Math.floor(i * intervalMonths))

    // Count how many subscriptions existed at this date
    const count = sorted.filter(s => {
      const createdDate = new Date(s.created * 1000)
      return createdDate <= targetDate
    }).length

    trend.push(count)
  }

  // Ensure last value matches current count
  trend[trend.length - 1] = currentCount

  return trend
}

// Run sync
syncAggregated()
