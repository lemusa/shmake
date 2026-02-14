/**
 * Import Buy Me A Coffee supporters from CSV into Supabase
 * Creates a BMC subscription_source and manual_payments for each supporter
 */

import 'dotenv/config'
import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function importBMC() {
  console.log('Importing Buy Me A Coffee supporters...\n')

  // Read CSV
  const csv = readFileSync('Supporters_list_2026-02-14.csv', 'utf-8')
  const lines = csv.trim().split('\n').slice(1) // skip header

  const supporters = lines.map(line => {
    // Parse CSV with quoted fields
    const parts = []
    let current = ''
    let inQuotes = false
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; continue }
      if (ch === ',' && !inQuotes) { parts.push(current.trim()); current = ''; continue }
      current += ch
    }
    parts.push(current.trim())
    return {
      email: parts[0],
      name: parts[1],
      count: parseInt(parts[2]) || 1,
      price: parseFloat(parts[3]) || 5.00,
      currency: parts[4] || 'USD',
      date: parts[5],
    }
  })

  console.log(`Found ${supporters.length} supporters:\n`)
  for (const s of supporters) {
    console.log(`  ${s.name} (${s.email}) - ${s.count} x $${s.price} ${s.currency} on ${s.date}`)
  }

  // Check if BMC source already exists
  const { data: existing } = await supabase
    .from('subscription_sources')
    .select('*')
    .eq('platform', 'Buy Me A Coffee')
    .limit(1)
    .single()

  let sourceId
  if (existing) {
    sourceId = existing.id
    console.log(`\nBMC source already exists (id: ${sourceId})`)
  } else {
    // Create BMC source — use actual NZD payout amounts
    // USD $30 total → NZD $51.10 gross, $43.21 net after BMC fees
    const totalGross = 51.10
    const totalNet = 43.21
    const totalFees = Math.round((totalGross - totalNet) * 100) / 100

    const { data: newSource, error } = await supabase.from('subscription_sources').insert({
      app_name: 'Buy Me A Coffee',
      platform: 'Buy Me A Coffee',
      subscribers: supporters.length,
      mrr: 0, // one-time donations, not recurring
      gross_jan: totalGross,
      fees_jan: totalFees,
      net_jan: totalNet,
      gst_jan: 0,
      status: 'active',
      metadata: {
        currency: 'NZD',
        note: 'One-time donations imported from CSV (converted from USD)',
      },
    }).select().single()

    if (error) {
      console.error('Failed to create BMC source:', error)
      process.exit(1)
    }
    sourceId = newSource.id
    console.log(`\nCreated BMC source (id: ${sourceId})`)
  }

  // Import each supporter as a manual payment (NZD amounts, divided equally)
  const perGross = Math.floor(totalGross / supporters.length * 100) / 100
  const perFee = Math.floor(totalFees / supporters.length * 100) / 100
  let usedGross = 0, usedFee = 0
  let imported = 0
  for (let idx = 0; idx < supporters.length; idx++) {
    const s = supporters[idx]
    const isLast = idx === supporters.length - 1
    const gross = isLast ? Math.round((totalGross - usedGross) * 100) / 100 : perGross
    const fee = isLast ? Math.round((totalFees - usedFee) * 100) / 100 : perFee
    usedGross += gross
    usedFee += fee

    const { error } = await supabase.from('manual_payments').insert({
      source_id: sourceId,
      date: s.date,
      gross: gross,
      fee: fee,
      payer: s.name || 'Anonymous',
      notes: `BMC donation (${s.currency})`,
    })

    if (error) {
      console.error(`Failed to import ${s.name}:`, error.message)
    } else {
      imported++
    }
  }

  console.log(`\nImported ${imported}/${supporters.length} payments`)
  console.log('Done!')
  process.exit(0)
}

importBMC()
