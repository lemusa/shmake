# Stripe Historical Data Import

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Create .env file (in project root)
cp scripts/.env.example .env

# 3. Add your credentials to .env
# STRIPE_SECRET_KEY=sk_live_...
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# 4. Run the sync
npm run sync-stripe
```

## What It Does

The sync script imports:

✅ **All subscriptions** (active, past_due, canceled, etc.)
- Subscription ID, customer, app name, MRR
- Status, current period dates
- GST calculation (15% for NZD)
- Net/gross amounts

✅ **Charge history** (last 90 days by default)
- Transaction ID, amount, fees
- Customer reference
- Description and status
- Automatically skips duplicates

## Output Example

```
╔══════════════════════════════════════╗
║  Stripe → Supabase Historical Sync   ║
╚══════════════════════════════════════╝

🔄 Starting Stripe subscription sync...

📥 Fetching subscriptions from Stripe...
✅ Found 3 subscriptions

Processing: sub_1abc123
  ✅ Synced: MyMeca ($99/mo) - active
Processing: sub_2def456
  ✅ Synced: SaaS Pro ($199/mo) - active
Processing: sub_3ghi789
  ✅ Synced: Starter Plan ($49/mo) - canceled

📊 Sync complete:
  ✅ Success: 3
  ❌ Errors: 0

💰 Starting charge history sync...

✅ Found 15 charges

  ✅ Synced: $99 - MyMeca monthly
  ✅ Synced: $199 - SaaS Pro monthly
  ⏭️  Skipped (exists): ch_abc123

📊 Charge sync complete:
  ✅ Success: 13
  ❌ Errors: 0

✨ All done!
```

## Important Notes

- ⚠️ **Run once** — This is a one-time import. Webhooks handle new data automatically.
- 🔒 **Service role required** — Uses SUPABASE_SERVICE_ROLE_KEY to bypass RLS
- 🔄 **Idempotent** — Safe to re-run (upserts subscriptions, skips existing charges)
- 📅 **Charge limit** — Default imports last 90 days (edit script to change)

## Troubleshooting

**"No such module @supabase/supabase-js"**
→ Run `npm install` first

**"Invalid API key"**
→ Check your STRIPE_SECRET_KEY in .env (starts with sk_live_ or sk_test_)

**"Failed to upsert subscription"**
→ Make sure migration 003_stripe_webhooks.sql has been run in Supabase

**Need to sync older charges?**
→ Edit line 147 in sync-stripe-subscriptions.js:
```js
created: {
  gte: Math.floor(Date.now() / 1000) - (180 * 24 * 60 * 60), // 180 days
},
```

## After Sync

1. Check Admin → Subscriptions — should see all imported subs
2. Check Admin → Transactions — should see charge history
3. Verify MRR totals match Stripe dashboard
4. Future subscriptions/charges will auto-sync via webhook ✨
