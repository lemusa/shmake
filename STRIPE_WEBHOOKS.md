# Stripe Webhooks Setup Guide

This guide will help you set up automatic Stripe subscription syncing via webhooks.

## Overview

Once configured, your app will automatically:
- ✅ Create/update subscriptions when customers subscribe in Stripe
- ✅ Cancel subscriptions when customers cancel
- ✅ Record all charges and refunds in real-time
- ✅ Calculate fees and GST automatically
- ✅ No more manual CSV imports

## Prerequisites

- Supabase CLI installed (`npm install -g supabase`)
- Stripe account with API access
- Stripe CLI for local testing (optional)

---

## Step 1: Run Database Migration

Apply the migration to add webhook tracking fields:

```bash
# If using Supabase hosted (recommended)
supabase db push

# Or manually run the SQL in Supabase Dashboard → SQL Editor
# Copy contents of: supabase/migrations/003_stripe_webhooks.sql
```

This adds:
- `stripe_subscription_id`, `status`, `gross_jan`, etc. to `subscription_sources`
- `stripe_customer_id`, `status` to `stripe_transactions`
- New `stripe_webhook_events` table for idempotency

---

## Step 2: Deploy Edge Function

### Option A: Deploy to Supabase (Production)

1. **Link your Supabase project:**
   ```bash
   supabase link --project-ref your-project-ref
   ```

2. **Set secrets:**
   ```bash
   # Get these from https://dashboard.stripe.com/apikeys
   supabase secrets set STRIPE_SECRET_KEY=sk_live_...

   # Get this from Stripe Dashboard → Developers → Webhooks (after Step 3)
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
   ```

3. **Deploy the function:**
   ```bash
   supabase functions deploy stripe-webhook
   ```

4. **Note the function URL:**
   ```
   https://your-project-ref.supabase.co/functions/v1/stripe-webhook
   ```

### Option B: Local Testing (Development)

1. **Create `.env` file in `supabase/functions/`:**
   ```bash
   cp supabase/functions/.env.example supabase/functions/.env
   ```

2. **Fill in your test keys:**
   ```env
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   SUPABASE_URL=http://localhost:54321
   SUPABASE_SERVICE_ROLE_KEY=your-service-key
   ```

3. **Start local Supabase:**
   ```bash
   supabase start
   ```

4. **Serve the function:**
   ```bash
   supabase functions serve stripe-webhook --env-file supabase/functions/.env
   ```

5. **In another terminal, forward Stripe events:**
   ```bash
   stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook
   ```

---

## Step 3: Configure Stripe Webhooks

1. **Go to Stripe Dashboard:**
   https://dashboard.stripe.com/webhooks

2. **Click "Add endpoint"**

3. **Enter your webhook URL:**
   ```
   Production: https://your-project-ref.supabase.co/functions/v1/stripe-webhook
   Test: Use the URL from `stripe listen` (for local dev)
   ```

4. **Select events to send:**
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `charge.succeeded`
   - ✅ `charge.refunded`

5. **Click "Add endpoint"**

6. **Copy the Signing Secret:**
   - Click on the new webhook endpoint
   - Click "Reveal" under "Signing secret"
   - Copy the `whsec_...` value
   - Update your Supabase secret:
     ```bash
     supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
     ```

---

## Step 4: Add Metadata to Stripe Products (Optional)

To automatically populate the app name, add metadata to your Stripe products:

1. Go to **Products** in Stripe Dashboard
2. Click on a product (e.g., "myMECA Pro")
3. Scroll to **Metadata**
4. Add key: `app_name`, value: `myMECA`
5. Save

Alternatively, the webhook will use the Product name if no metadata is set.

---

## Step 5: Test the Integration

### Test with Stripe CLI (Local)

1. **Trigger a test event:**
   ```bash
   stripe trigger customer.subscription.created
   ```

2. **Check your local logs:**
   - You should see webhook processing in the function logs
   - Check Supabase Studio → Database → `subscription_sources` for new entries

### Test in Production

1. **Create a test subscription in Stripe:**
   - Use a test card: `4242 4242 4242 4242`
   - Create a customer and subscription

2. **Check the webhook status:**
   - Stripe Dashboard → Webhooks → Click your endpoint
   - View "Recent events" to see if webhooks succeeded

3. **Verify in your app:**
   - Go to Admin → Subscriptions
   - You should see the new subscription automatically

---

## Step 6: Monitor Webhooks

### View Webhook Logs in Supabase

```bash
supabase functions logs stripe-webhook
```

### View in Stripe Dashboard

1. Go to **Developers → Webhooks**
2. Click on your endpoint
3. View **Recent events** to see success/failure status

### Debug Failed Webhooks

If a webhook fails:
1. Check the error in Stripe Dashboard → Webhooks → Event details
2. View function logs: `supabase functions logs stripe-webhook`
3. Stripe automatically retries failed webhooks for 3 days

### Query Processed Events (for debugging)

```sql
SELECT * FROM stripe_webhook_events
ORDER BY processed_at DESC
LIMIT 100;
```

---

## Webhook Event Flow

```
Stripe Event
    ↓
Edge Function receives webhook
    ↓
Verify signature (prevents spoofing)
    ↓
Check if event already processed (idempotency)
    ↓
Process event:
    - subscription.created/updated → upsert subscription_sources
    - subscription.deleted → mark as canceled
    - charge.succeeded → insert stripe_transactions
    - charge.refunded → insert refund transaction
    ↓
Mark event as processed
    ↓
Return 200 OK to Stripe
```

---

## Troubleshooting

### Webhook returns 400 "Invalid signature"

- **Cause:** `STRIPE_WEBHOOK_SECRET` doesn't match the signing secret from Stripe Dashboard
- **Fix:** Copy the signing secret from Stripe and update:
  ```bash
  supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
  ```

### Webhook returns 500 "Processing failed"

- **Cause:** Database error (missing columns, RLS blocking insert, etc.)
- **Fix:** Check function logs and ensure migration 003 was applied:
  ```bash
  supabase functions logs stripe-webhook --tail
  ```

### Subscription not appearing in app

- **Cause:** RLS policies blocking service role, or missing fields
- **Fix:**
  1. Check that the migration created the new columns
  2. Verify the subscription was inserted:
     ```sql
     SELECT * FROM subscription_sources WHERE stripe_subscription_id IS NOT NULL;
     ```

### "Event already processed" in logs (not an error)

- **Cause:** Stripe sent duplicate webhook (normal behavior)
- **Fix:** This is working as intended (idempotency protection)

---

## Security Notes

- ✅ Webhook signature verification prevents spoofed requests
- ✅ Idempotency prevents duplicate processing
- ✅ Service role key is only used server-side (Edge Function)
- ✅ RLS policies still protect data access from frontend
- ⚠️ Never commit your `.env` file to git
- ⚠️ Use `sk_live_` keys only in production, `sk_test_` for development

---

## Next Steps

1. **Test subscriptions end-to-end:**
   - Create a subscription in Stripe test mode
   - Verify it appears in Admin → Subscriptions
   - Cancel it in Stripe and verify status updates

2. **Remove manual import flow (optional):**
   - Once webhooks are working, you can remove the "Import Stripe" button
   - Or keep it as a backup for historical data import

3. **Monitor webhook health:**
   - Set up alerts in Stripe for failed webhooks
   - Check `stripe_webhook_events` table periodically

4. **Go live:**
   - Switch to live Stripe keys (`sk_live_...`)
   - Update webhook endpoint URL if needed
   - Test with a real (small) subscription first

---

## FAQ

**Q: Will this sync historical subscriptions?**
A: No, webhooks only sync new events. For historical data, use the manual CSV import or create a one-time sync script.

**Q: What happens if the webhook is down?**
A: Stripe retries failed webhooks automatically for up to 3 days.

**Q: Can I test locally without deploying?**
A: Yes! Use Stripe CLI to forward webhooks to localhost (see Step 2, Option B).

**Q: How much does this cost?**
A: Webhooks are free. Supabase Edge Functions have a generous free tier (500K invocations/month).

**Q: Do I need to handle every Stripe event?**
A: No, the function only processes the 6 events listed in Step 3. All others are ignored safely.

---

## Support

If you encounter issues:
1. Check function logs: `supabase functions logs stripe-webhook`
2. Check Stripe webhook event details in Dashboard
3. Verify secrets are set correctly: `supabase secrets list`
4. Test locally with `stripe listen` to debug
