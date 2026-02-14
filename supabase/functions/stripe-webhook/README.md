# Stripe Webhook Function

Automatically syncs Stripe subscriptions, charges, and refunds to your Supabase database.

## Quick Start

```bash
# 1. Set secrets
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...

# 2. Deploy
supabase functions deploy stripe-webhook

# 3. Configure in Stripe Dashboard
# Add endpoint: https://your-project.supabase.co/functions/v1/stripe-webhook
# Select events: subscription.*, charge.*, invoice.payment_succeeded
```

## Supported Events

| Event | Action |
|-------|--------|
| `customer.subscription.created` | Creates new subscription in DB |
| `customer.subscription.updated` | Updates subscription (MRR, status, dates) |
| `customer.subscription.deleted` | Marks subscription as canceled |
| `invoice.payment_succeeded` | Updates subscription fees |
| `charge.succeeded` | Records transaction with fees |
| `charge.refunded` | Records refund transaction |

## Local Development

```bash
# 1. Copy env file
cp ../.env.example ../.env

# 2. Fill in test keys
# STRIPE_SECRET_KEY=sk_test_...
# STRIPE_WEBHOOK_SECRET=whsec_...

# 3. Start local functions
supabase functions serve stripe-webhook --env-file ../.env

# 4. Forward webhooks (in another terminal)
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook

# 5. Trigger test events
stripe trigger customer.subscription.created
```

## Monitoring

```bash
# View logs
supabase functions logs stripe-webhook --tail

# Check processed events
psql -c "SELECT * FROM stripe_webhook_events ORDER BY processed_at DESC LIMIT 10;"
```

## Data Flow

```
Stripe → Webhook → Edge Function → Supabase Tables:
                                      ├─ subscription_sources (upsert)
                                      ├─ stripe_transactions (insert)
                                      └─ stripe_webhook_events (track)
```

## Error Handling

- Signature verification prevents spoofed requests
- Idempotency check prevents duplicate processing
- Failed webhooks auto-retry for 3 days
- Service role bypasses RLS for inserts

## Security

- ✅ Webhook signature verified before processing
- ✅ Service role key only accessible server-side
- ✅ Secrets stored in Supabase (not in code)
- ✅ CORS headers allow Stripe requests only

See [STRIPE_WEBHOOKS.md](../../../STRIPE_WEBHOOKS.md) for full setup guide.
