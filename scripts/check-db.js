import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const { data, error } = await supabase
  .from('subscription_sources')
  .select('id, app_name, subscribers, mrr, metadata')
  .order('id')

if (error) {
  console.error('Error:', error)
} else {
  console.log('Total rows:', data.length)
  data.forEach((row, i) => {
    console.log(`\nRow ${i + 1} (id: ${row.id}):`)
    console.log('  App:', row.app_name)
    console.log('  Subscribers:', row.subscribers)
    console.log('  MRR:', row.mrr)
    console.log('  Trend length:', row.metadata?.trend?.length || 0)
    console.log('  Trend:', row.metadata?.trend)
    console.log('  Month labels:', row.metadata?.monthLabels)
  })
}
