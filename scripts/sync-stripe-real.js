/**
 * Real data sync - Uses actual charge/payment history
 * Calculates real fees, gross income, net income
 * NO GST (not registered)
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

function normalizeAppName(name) {
  if (name.includes('@') || /^[a-f0-9]{16,}/.test(name)) {
    return 'myMECA Premium'
  }
  return name
}

async function syncRealData() {
  console.log('╔══════════════════════════════════════╗')
  console.log('║  Stripe → Real Transaction Data     ║')
  console.log('╚══════════════════════════════════════╝\n')

  try {
    // Fetch all active subscriptions
    console.log('📥 Fetching active subscriptions...')
    const subscriptions = await stripe.subscriptions.list({
      limit: 100,
      status: 'active',
    })

    console.log(`✅ Found ${subscriptions.data.length} active subscriptions\n`)

    // Fetch charges from last 12 months to calculate actual revenue
    console.log('💰 Fetching charge history (last 12 months)...')
    const oneYearAgo = Math.floor(Date.now() / 1000) - (365 * 24 * 60 * 60)
    const charges = await stripe.charges.list({
      limit: 100,
      created: { gte: oneYearAgo },
    })

    console.log(`✅ Found ${charges.data.length} charges\n`)

    // Group subscriptions by app
    const appGroups = {}

    for (const sub of subscriptions.data) {
      const priceData = sub.items.data[0]?.price
      const mrr = priceData?.unit_amount ? priceData.unit_amount / 100 : 0

      // Get app name
      let appName = sub.metadata.app_name
      if (!appName && sub.items.data[0]?.price.product) {
        const productId = typeof sub.items.data[0].price.product === 'string'
          ? sub.items.data[0].price.product
          : sub.items.data[0].price.product.id
        const product = await stripe.products.retrieve(productId)
        appName = product.name
      }
      appName = normalizeAppName(appName || 'Unknown App')

      // Skip test subscriptions
      if (mrr < 1) continue

      if (!appGroups[appName]) {
        appGroups[appName] = {
          subscriptions: [],
          charges: [],
          totalMrr: 0,
        }
      }

      appGroups[appName].subscriptions.push({
        id: sub.id,
        customer: sub.customer,
        created: sub.created,
        mrr: mrr,
      })
      appGroups[appName].totalMrr += mrr
    }

    // Match charges to apps (by customer ID)
    for (const charge of charges.data) {
      // Skip failed charges
      if (!charge.paid) continue

      // Find which app this charge belongs to
      for (const [appName, group] of Object.entries(appGroups)) {
        const belongsToApp = group.subscriptions.some(s => s.customer === charge.customer)
        if (belongsToApp) {
          group.charges.push({
            id: charge.id,
            amount: charge.amount / 100,
            fee: charge.balance_transaction
              ? await getActualFee(charge.balance_transaction)
              : charge.amount / 100 * 0.029 + 0.30,
            created: charge.created,
          })
          break
        }
      }
    }

    console.log('📊 Aggregated data:\n')

    // Calculate totals and insert
    for (const [appName, group] of Object.entries(appGroups)) {
      const subscribers = group.subscriptions.length

      // Calculate actual revenue from charges (current month estimate)
      const currentMonthRevenue = group.totalMrr
      const currentMonthFees = subscribers * 0.44 // Avg fee per charge

      // Calculate year-to-date from actual charges
      const ytdGross = group.charges.reduce((sum, c) => sum + c.amount, 0)
      const ytdFees = group.charges.reduce((sum, c) => sum + c.fee, 0)
      const ytdNet = ytdGross - ytdFees

      // Build subscriber growth trend
      const { trend, monthLabels } = buildSubscriberTrend(group.subscriptions)
      const mrrTrend = trend.map(count => Math.round(count * (group.totalMrr / subscribers) * 100) / 100)

      console.log(`📱 ${appName}`)
      console.log(`   Active subscribers: ${subscribers}`)
      console.log(`   Current MRR: $${group.totalMrr.toFixed(2)}`)
      console.log(`   YTD Gross: $${ytdGross.toFixed(2)}`)
      console.log(`   YTD Fees: $${ytdFees.toFixed(2)}`)
      console.log(`   YTD Net: $${ytdNet.toFixed(2)}`)
      console.log(`   Subscriber trend (${monthLabels[0]} - ${monthLabels[monthLabels.length - 1]}): [${trend.join(', ')}]`)

      const { error } = await supabase.from('subscription_sources').insert({
        app_name: appName,
        platform: 'Stripe',
        subscribers: subscribers,
        mrr: group.totalMrr,
        gross_jan: currentMonthRevenue, // Current month estimate
        fees_jan: currentMonthFees,
        net_jan: currentMonthRevenue - currentMonthFees,
        gst_jan: 0, // NOT GST registered
        metadata: {
          trend: mrrTrend,
          subscriberTrend: trend,
          monthLabels: monthLabels,
          ytdGross: ytdGross,
          ytdFees: ytdFees,
          ytdNet: ytdNet,
          activeSubscriptionIds: group.subscriptions.map(s => s.id),
        }
      })

      if (error) {
        console.error(`   ❌ Error: ${error.message}`)
      } else {
        console.log(`   ✅ Synced!`)
      }
      console.log()
    }

    console.log('✨ Real data sync complete!\n')

  } catch (error) {
    console.error('💥 Fatal error:', error)
    process.exit(1)
  }
}

async function getActualFee(balanceTransactionId) {
  try {
    const bt = await stripe.balanceTransactions.retrieve(balanceTransactionId)
    return bt.fee / 100
  } catch (error) {
    return 0
  }
}

function buildSubscriberTrend(subscriptions) {
  if (subscriptions.length === 0) return { trend: [], monthLabels: [] }

  // Sort by creation date
  const sorted = subscriptions.sort((a, b) => a.created - b.created)

  // Get date range (oldest subscription to current month)
  const oldestDate = new Date(sorted[0].created * 1000)
  oldestDate.setDate(1) // Start of month

  const now = new Date()
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  // Build monthly trend from oldest to current month
  const trend = []
  const monthLabels = []
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  let year = oldestDate.getFullYear()
  let monthIndex = oldestDate.getMonth()

  while (year < now.getFullYear() || (year === now.getFullYear() && monthIndex <= now.getMonth())) {
    // Count subscriptions created by end of this month
    const monthEnd = new Date(year, monthIndex + 1, 0, 23, 59, 59)

    const count = sorted.filter(s => {
      const createdDate = new Date(s.created * 1000)
      return createdDate <= monthEnd
    }).length

    trend.push(count)
    monthLabels.push(`${monthNames[monthIndex]} ${year}`)

    // Move to next month
    monthIndex++
    if (monthIndex > 11) {
      monthIndex = 0
      year++
    }
  }

  return { trend, monthLabels }
}

// Run sync
syncRealData()
