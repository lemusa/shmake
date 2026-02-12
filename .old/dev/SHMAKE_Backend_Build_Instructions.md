# SHMAKE Admin — Backend Build Instructions

## Overview

Build the complete Supabase backend for the SHMAKE admin system, then wire in Stripe webhook integration for multi-app subscription income tracking. This is a greenfield backend — nothing exists yet. The React frontend (`src/App.jsx`) currently runs on mock data.

**Stack:** Supabase (Postgres, Auth, Edge Functions, Storage), React + Vite frontend
**Auth model:** Single user (sole trader), email/password via Supabase Auth
**Hosting:** Supabase project + Vercel for frontend
**Financial year:** 1 April – 31 March (NZ tax year)

---

## Part 1: Supabase Project Setup

### 1.1 Prerequisites

```bash
npm install -g supabase
supabase init
supabase link --project-ref <PROJECT_REF>
```

Create a `.env.local` in the project root:

```env
VITE_SUPABASE_URL=https://<PROJECT_REF>.supabase.co
VITE_SUPABASE_ANON_KEY=<ANON_KEY>
```

### 1.2 Install Supabase Client

```bash
npm install @supabase/supabase-js
```

Create `src/lib/supabase.js`:

```js
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

---

## Part 2: Database Schema

All migrations go in `supabase/migrations/`. Create one migration file per logical group. Use `supabase db push` or `supabase migration up` to apply.

### Important Conventions

- All tables have `id` as UUID primary key with `gen_random_uuid()` default
- All tables have `created_at` and `updated_at` timestamps
- `updated_at` auto-updates via trigger (defined once, applied to all tables)
- Money fields are `numeric(12,2)` — never float
- Enums for status fields — defined as Postgres types
- Soft delete where appropriate (`archived_at timestamp`)
- All foreign keys use `ON DELETE SET NULL` unless the child is meaningless without the parent (then `CASCADE`)

### Migration 001: Core Setup & Enums

```sql
-- supabase/migrations/001_core_setup.sql

-- Updated-at trigger function (reused on every table)
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Enums
create type job_status as enum (
  'enquiry', 'quoted', 'approved', 'in_progress',
  'complete', 'invoiced', 'closed'
);

create type job_priority as enum ('low', 'medium', 'high');
create type job_type as enum ('fabrication', 'design', 'consulting', 'other');
create type quote_status as enum ('draft', 'sent', 'accepted', 'declined', 'expired');

create type invoice_status as enum (
  'draft', 'sent', 'viewed', 'paid', 'overdue', 'written_off'
);

create type line_item_type as enum ('labour', 'materials', 'flat_fee');

create type expense_category as enum (
  'materials', 'tools', 'software', 'vehicle', 'home_office',
  'marketing', 'processing', 'professional', 'other'
);

create type contact_type as enum (
  'supplier', 'contractor', 'trade', 'professional', 'other'
);

create type task_status as enum ('todo', 'in_progress', 'done');
create type payment_method as enum ('bank_transfer', 'cash', 'stripe', 'other');

create type recurring_frequency as enum (
  'weekly', 'fortnightly', 'monthly', 'quarterly', 'annually'
);

create type recurring_template_status as enum ('active', 'paused', 'cancelled');
create type vehicle_type as enum ('petrol', 'diesel', 'hybrid', 'electric');
create type vehicle_method as enum ('mileage', 'actual');
create type subscription_platform as enum ('stripe', 'paddle', 'other');
create type gst_treatment as enum ('nz_only', 'all', 'none');
create type bank_tx_match_status as enum ('matched', 'unmatched', 'ignored');
create type note_type as enum ('internal', 'external');
```

### Migration 002: Settings

```sql
-- supabase/migrations/002_settings.sql

create table settings (
  id uuid primary key default gen_random_uuid(),

  -- Business details
  trading_name text not null default 'SHMAKE',
  legal_name text default 'Sam — Sole Trader',
  address text,
  phone text,
  email text,
  website text,
  gst_number text,
  ird_number text,
  bank_name text,
  bank_account text,
  logo_url text,

  -- Invoice settings
  invoice_prefix text not null default 'SHMAKE-',
  invoice_next_number integer not null default 1,
  default_payment_terms_days integer default 20,
  default_gst_rate numeric(5,2) not null default 15.00,
  default_invoice_note text,
  terms_and_conditions text,

  -- Quote settings
  quote_prefix text not null default 'Q-',
  quote_next_number integer not null default 1,
  default_quote_validity_days integer default 30,

  -- Home office deductions
  home_office_area_m2 numeric(8,2),
  home_total_area_m2 numeric(8,2),
  home_business_percent numeric(5,2),
  home_ird_sqm_rate numeric(8,2) default 50.75,
  home_office_method text default 'percentage',

  -- Vehicle deductions
  vehicle_method vehicle_method default 'mileage',
  vehicle_type vehicle_type default 'petrol',
  vehicle_business_percent numeric(5,2) default 25.00,
  vehicle_tier1_rate numeric(5,2) default 1.17,
  vehicle_tier2_rate numeric(5,2) default 0.37,

  -- Other deduction defaults
  phone_business_percent numeric(5,2) default 50.00,
  internet_business_percent numeric(5,2) default 10.00,

  -- GST return frequency
  gst_return_frequency text default '2monthly',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger settings_updated_at before update on settings
  for each row execute function update_updated_at();

-- Insert default settings row
insert into settings (trading_name) values ('SHMAKE');
```

### Migration 003: Clients & Contacts

```sql
-- supabase/migrations/003_clients_contacts.sql

create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  address text,
  company text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger clients_updated_at before update on clients
  for each row execute function update_updated_at();

create index idx_clients_name on clients (name);
create index idx_clients_archived on clients (archived_at) where archived_at is null;


create table contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text,
  email text,
  phone text,
  address text,
  contact_type contact_type not null default 'other',
  tags text[] default '{}',
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger contacts_updated_at before update on contacts
  for each row execute function update_updated_at();

create index idx_contacts_type on contacts (contact_type);
create index idx_contacts_name on contacts (name);
```

### Migration 004: Jobs & Tasks

```sql
-- supabase/migrations/004_jobs_tasks.sql

create table jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  client_id uuid references clients(id) on delete set null,
  job_type job_type not null default 'other',
  status job_status not null default 'enquiry',
  priority job_priority not null default 'medium',
  estimated_value numeric(12,2),
  due_date date,
  tags text[] default '{}',
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger jobs_updated_at before update on jobs
  for each row execute function update_updated_at();

create index idx_jobs_status on jobs (status);
create index idx_jobs_client on jobs (client_id);
create index idx_jobs_due on jobs (due_date);


create table tasks (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(id) on delete cascade,
  title text not null,
  description text,
  status task_status not null default 'todo',
  due_date date,
  estimated_hours numeric(6,2),
  actual_hours numeric(6,2),
  sort_order integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger tasks_updated_at before update on tasks
  for each row execute function update_updated_at();

create index idx_tasks_job on tasks (job_id);
create index idx_tasks_status on tasks (status);
create index idx_tasks_due on tasks (due_date);
```

### Migration 005: Notes (polymorphic)

```sql
-- supabase/migrations/005_notes.sql

create table notes (
  id uuid primary key default gen_random_uuid(),

  -- Polymorphic: exactly one of these should be set
  job_id uuid references jobs(id) on delete cascade,
  client_id uuid references clients(id) on delete cascade,
  contact_id uuid references contacts(id) on delete cascade,
  quote_id uuid,      -- FK added after quotes table exists
  invoice_id uuid,    -- FK added after invoices table exists
  expense_id uuid,    -- FK added after expenses table exists

  note_type note_type not null default 'internal',
  content text not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger notes_updated_at before update on notes
  for each row execute function update_updated_at();

create index idx_notes_job on notes (job_id) where job_id is not null;
create index idx_notes_client on notes (client_id) where client_id is not null;
create index idx_notes_contact on notes (contact_id) where contact_id is not null;
create index idx_notes_type on notes (note_type);
```

### Migration 006: Quotes

```sql
-- supabase/migrations/006_quotes.sql

create table quotes (
  id uuid primary key default gen_random_uuid(),
  quote_number text not null unique,
  version integer not null default 1,
  previous_version_id uuid references quotes(id) on delete set null,

  client_id uuid references clients(id) on delete set null,
  job_id uuid references jobs(id) on delete set null,

  status quote_status not null default 'draft',
  date date not null default current_date,
  expiry_date date,

  subtotal numeric(12,2) not null default 0,
  gst_rate numeric(5,2) not null default 15.00,
  gst_amount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  discount_amount numeric(12,2) default 0,
  discount_percent numeric(5,2),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger quotes_updated_at before update on quotes
  for each row execute function update_updated_at();

create index idx_quotes_status on quotes (status);
create index idx_quotes_client on quotes (client_id);
create index idx_quotes_job on quotes (job_id);
create index idx_quotes_number on quotes (quote_number);


create table quote_line_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quotes(id) on delete cascade,
  description text not null,
  item_type line_item_type not null default 'labour',
  quantity numeric(10,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  sort_order integer default 0,
  created_at timestamptz not null default now()
);

create index idx_quote_lines_quote on quote_line_items (quote_id);

-- Add FK on notes table
alter table notes add constraint fk_notes_quote
  foreign key (quote_id) references quotes(id) on delete cascade;
create index idx_notes_quote on notes (quote_id) where quote_id is not null;
```

### Migration 007: Invoices & Payments

```sql
-- supabase/migrations/007_invoices.sql

create table invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,

  client_id uuid references clients(id) on delete set null,
  job_id uuid references jobs(id) on delete set null,
  source_quote_id uuid references quotes(id) on delete set null,
  recurring_template_id uuid,  -- FK added after template table

  status invoice_status not null default 'draft',
  date date not null default current_date,
  due_date date,

  subtotal numeric(12,2) not null default 0,
  gst_rate numeric(5,2) not null default 15.00,
  gst_amount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  amount_paid numeric(12,2) not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger invoices_updated_at before update on invoices
  for each row execute function update_updated_at();

create index idx_invoices_status on invoices (status);
create index idx_invoices_client on invoices (client_id);
create index idx_invoices_job on invoices (job_id);
create index idx_invoices_number on invoices (invoice_number);
create index idx_invoices_due on invoices (due_date);
create index idx_invoices_overdue on invoices (status, due_date)
  where status in ('sent', 'viewed');


create table invoice_line_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  description text not null,
  item_type line_item_type not null default 'labour',
  quantity numeric(10,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  sort_order integer default 0,
  created_at timestamptz not null default now()
);

create index idx_invoice_lines_invoice on invoice_line_items (invoice_id);


create table payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  amount numeric(12,2) not null,
  payment_date date not null default current_date,
  payment_method payment_method not null default 'bank_transfer',
  reference text,
  created_at timestamptz not null default now()
);

create index idx_payments_invoice on payments (invoice_id);


-- Recurring invoice templates
create table recurring_templates (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete set null,
  job_id uuid references jobs(id) on delete set null,
  description text not null,
  frequency recurring_frequency not null default 'monthly',

  -- Line items stored as JSONB on the template
  line_items jsonb not null default '[]',

  subtotal numeric(12,2) not null default 0,
  gst_rate numeric(5,2) not null default 15.00,
  gst_amount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,

  status recurring_template_status not null default 'active',
  start_date date not null default current_date,
  end_date date,
  max_occurrences integer,
  next_generation_date date,
  invoices_generated integer not null default 0,
  default_external_note text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger recurring_templates_updated_at before update on recurring_templates
  for each row execute function update_updated_at();

-- Add FK on invoices
alter table invoices add constraint fk_invoices_recurring
  foreign key (recurring_template_id) references recurring_templates(id) on delete set null;

-- Add FK on notes
alter table notes add constraint fk_notes_invoice
  foreign key (invoice_id) references invoices(id) on delete cascade;
create index idx_notes_invoice on notes (invoice_id) where invoice_id is not null;
```

### Migration 008: Expenses

```sql
-- supabase/migrations/008_expenses.sql

create table expenses (
  id uuid primary key default gen_random_uuid(),
  date date not null default current_date,
  description text not null,

  -- Amounts
  amount numeric(12,2) not null,
  gst_amount numeric(12,2) default 0,
  full_amount numeric(12,2),
  business_percent numeric(5,2),

  category expense_category not null default 'other',

  -- Links
  job_id uuid references jobs(id) on delete set null,
  supplier_id uuid references contacts(id) on delete set null,

  -- Receipt
  receipt_url text,
  has_receipt boolean not null default false,

  -- Flags
  is_apportioned boolean not null default false,
  is_auto boolean not null default false,

  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger expenses_updated_at before update on expenses
  for each row execute function update_updated_at();

create index idx_expenses_date on expenses (date);
create index idx_expenses_category on expenses (category);
create index idx_expenses_job on expenses (job_id);

-- Add FK on notes
alter table notes add constraint fk_notes_expense
  foreign key (expense_id) references expenses(id) on delete cascade;
create index idx_notes_expense on notes (expense_id) where expense_id is not null;
```

### Migration 009: Vehicle & Home Office

```sql
-- supabase/migrations/009_vehicle_home_office.sql

create table vehicle_trips (
  id uuid primary key default gen_random_uuid(),
  date date not null default current_date,
  origin text not null,
  destination text not null,
  kilometres numeric(8,1) not null,
  purpose text,
  category text default 'other',
  job_id uuid references jobs(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger vehicle_trips_updated_at before update on vehicle_trips
  for each row execute function update_updated_at();

create index idx_vehicle_trips_date on vehicle_trips (date);


create table home_office_costs (
  id uuid primary key default gen_random_uuid(),
  period text not null,
  cost_type text not null,
  full_amount numeric(12,2) not null,
  business_percent numeric(5,2) not null,
  deductible_amount numeric(12,2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger home_office_costs_updated_at before update on home_office_costs
  for each row execute function update_updated_at();

create index idx_home_office_period on home_office_costs (period);
```

### Migration 010: Income Sources & Stripe

```sql
-- supabase/migrations/010_income_sources_stripe.sql

-- One row per app/product (myMECA, TeaBreak, etc.)
create table income_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  platform subscription_platform not null default 'stripe',

  -- Stripe identifiers
  stripe_account_id text,
  stripe_product_ids text[] default '{}',
  stripe_webhook_secret text,

  -- Pricing info (display only)
  display_price numeric(12,2),
  display_currency text default 'NZD',
  pricing_model text default 'monthly',

  -- GST
  gst_treatment gst_treatment not null default 'nz_only',

  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger income_sources_updated_at before update on income_sources
  for each row execute function update_updated_at();


-- Raw financial data from Stripe
create table stripe_transactions (
  id uuid primary key default gen_random_uuid(),
  income_source_id uuid not null references income_sources(id) on delete cascade,

  -- Stripe identifiers (for dedup and linking)
  stripe_id text unique,
  stripe_customer_id text,
  stripe_invoice_id text,
  stripe_subscription_id text,
  stripe_payout_id text,

  -- Transaction details
  type text not null,       -- 'charge', 'refund', 'payout', 'adjustment'
  description text,
  currency text not null default 'nzd',

  -- Money fields
  gross_amount numeric(12,2) not null default 0,
  stripe_fee numeric(12,2) not null default 0,
  net_amount numeric(12,2) not null default 0,

  -- GST
  gst_applicable boolean not null default false,
  gst_amount numeric(12,2) default 0,

  -- Customer geo
  customer_country text,

  -- Payout reconciliation
  payout_reconciled boolean not null default false,
  bank_transaction_id uuid,

  -- Dates
  transaction_date timestamptz not null,
  period_start date,
  period_end date,

  -- Import tracking
  import_source text not null default 'webhook',
  raw_data jsonb,

  created_at timestamptz not null default now()
);

create index idx_stripe_tx_source on stripe_transactions (income_source_id);
create index idx_stripe_tx_type on stripe_transactions (type);
create index idx_stripe_tx_date on stripe_transactions (transaction_date);
create index idx_stripe_tx_stripe_id on stripe_transactions (stripe_id);
create index idx_stripe_tx_payout on stripe_transactions (stripe_payout_id);
create index idx_stripe_tx_customer on stripe_transactions (stripe_customer_id);
create index idx_stripe_tx_sub on stripe_transactions (stripe_subscription_id);


-- Denormalised view of subs per source
create table stripe_subscriptions (
  id uuid primary key default gen_random_uuid(),
  income_source_id uuid not null references income_sources(id) on delete cascade,

  stripe_subscription_id text not null unique,
  stripe_customer_id text not null,
  stripe_product_id text,
  stripe_price_id text,

  status text not null,

  -- Pricing
  amount numeric(12,2) not null,
  currency text not null default 'nzd',
  interval text not null default 'month',
  interval_count integer not null default 1,

  -- Customer info
  customer_email text,
  customer_country text,

  -- Dates
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at timestamptz,
  canceled_at timestamptz,
  started_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger stripe_subs_updated_at before update on stripe_subscriptions
  for each row execute function update_updated_at();

create index idx_stripe_subs_source on stripe_subscriptions (income_source_id);
create index idx_stripe_subs_status on stripe_subscriptions (status);
create index idx_stripe_subs_stripe_id on stripe_subscriptions (stripe_subscription_id);


-- MRR snapshots for trend charts
create table mrr_snapshots (
  id uuid primary key default gen_random_uuid(),
  income_source_id uuid not null references income_sources(id) on delete cascade,
  snapshot_date date not null,
  active_subscriptions integer not null default 0,
  mrr numeric(12,2) not null default 0,
  gross_revenue numeric(12,2) not null default 0,
  total_fees numeric(12,2) not null default 0,
  net_revenue numeric(12,2) not null default 0,
  churn_count integer not null default 0,
  new_count integer not null default 0,
  created_at timestamptz not null default now()
);

create unique index idx_mrr_snapshots_unique on mrr_snapshots (income_source_id, snapshot_date);
create index idx_mrr_snapshots_date on mrr_snapshots (snapshot_date);
```

### Migration 011: Bank Reconciliation

```sql
-- supabase/migrations/011_bank_reconciliation.sql

create table bank_transactions (
  id uuid primary key default gen_random_uuid(),
  bank_name text,
  import_date timestamptz not null default now(),
  transaction_date date not null,
  description text,
  amount numeric(12,2) not null,
  reference text,
  match_status bank_tx_match_status not null default 'unmatched',
  matched_invoice_id uuid references invoices(id) on delete set null,
  matched_expense_id uuid references expenses(id) on delete set null,
  matched_stripe_payout_id text,
  created_at timestamptz not null default now()
);

create index idx_bank_tx_date on bank_transactions (transaction_date);
create index idx_bank_tx_status on bank_transactions (match_status);
create index idx_bank_tx_amount on bank_transactions (amount);

-- Add FK from stripe_transactions to bank_transactions
alter table stripe_transactions add constraint fk_stripe_tx_bank
  foreign key (bank_transaction_id) references bank_transactions(id) on delete set null;
```

### Migration 012: Tax Years & Assets

```sql
-- supabase/migrations/012_tax_years.sql

create table tax_years (
  id uuid primary key default gen_random_uuid(),
  year_label text not null unique,
  start_date date not null,
  end_date date not null,
  home_office_percent numeric(5,2),
  vehicle_method vehicle_method,
  vehicle_business_percent numeric(5,2),
  vehicle_tier1_rate numeric(5,2),
  vehicle_tier2_rate numeric(5,2),
  is_finalised boolean not null default false,
  finalised_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger tax_years_updated_at before update on tax_years
  for each row execute function update_updated_at();


create table assets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  purchase_date date not null,
  purchase_price numeric(12,2) not null,
  depreciation_rate numeric(5,2) not null,
  depreciation_method text default 'diminishing',
  current_book_value numeric(12,2) not null,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger assets_updated_at before update on assets
  for each row execute function update_updated_at();
```

### Migration 013: Row Level Security

```sql
-- supabase/migrations/013_rls.sql

-- Enable RLS on all tables
alter table settings enable row level security;
alter table clients enable row level security;
alter table contacts enable row level security;
alter table jobs enable row level security;
alter table tasks enable row level security;
alter table notes enable row level security;
alter table quotes enable row level security;
alter table quote_line_items enable row level security;
alter table invoices enable row level security;
alter table invoice_line_items enable row level security;
alter table payments enable row level security;
alter table recurring_templates enable row level security;
alter table expenses enable row level security;
alter table vehicle_trips enable row level security;
alter table home_office_costs enable row level security;
alter table income_sources enable row level security;
alter table stripe_transactions enable row level security;
alter table stripe_subscriptions enable row level security;
alter table mrr_snapshots enable row level security;
alter table bank_transactions enable row level security;
alter table tax_years enable row level security;
alter table assets enable row level security;

-- Single-user: authenticated users get full access
-- Replace with org-based policies when multi-user is needed

create policy "Authenticated full access" on settings for all using (auth.role() = 'authenticated');
create policy "Authenticated full access" on clients for all using (auth.role() = 'authenticated');
create policy "Authenticated full access" on contacts for all using (auth.role() = 'authenticated');
create policy "Authenticated full access" on jobs for all using (auth.role() = 'authenticated');
create policy "Authenticated full access" on tasks for all using (auth.role() = 'authenticated');
create policy "Authenticated full access" on notes for all using (auth.role() = 'authenticated');
create policy "Authenticated full access" on quotes for all using (auth.role() = 'authenticated');
create policy "Authenticated full access" on quote_line_items for all using (auth.role() = 'authenticated');
create policy "Authenticated full access" on invoices for all using (auth.role() = 'authenticated');
create policy "Authenticated full access" on invoice_line_items for all using (auth.role() = 'authenticated');
create policy "Authenticated full access" on payments for all using (auth.role() = 'authenticated');
create policy "Authenticated full access" on recurring_templates for all using (auth.role() = 'authenticated');
create policy "Authenticated full access" on expenses for all using (auth.role() = 'authenticated');
create policy "Authenticated full access" on vehicle_trips for all using (auth.role() = 'authenticated');
create policy "Authenticated full access" on home_office_costs for all using (auth.role() = 'authenticated');
create policy "Authenticated full access" on income_sources for all using (auth.role() = 'authenticated');
create policy "Authenticated full access" on stripe_transactions for all using (auth.role() = 'authenticated');
create policy "Authenticated full access" on stripe_subscriptions for all using (auth.role() = 'authenticated');
create policy "Authenticated full access" on mrr_snapshots for all using (auth.role() = 'authenticated');
create policy "Authenticated full access" on bank_transactions for all using (auth.role() = 'authenticated');
create policy "Authenticated full access" on tax_years for all using (auth.role() = 'authenticated');
create policy "Authenticated full access" on assets for all using (auth.role() = 'authenticated');

-- Stripe webhook Edge Function uses service_role key, bypasses RLS
```

### Migration 014: Database Functions

```sql
-- supabase/migrations/014_functions.sql

-- Auto-generate next invoice number
create or replace function generate_invoice_number()
returns text as $$
declare
  prefix text;
  next_num integer;
  result text;
begin
  select invoice_prefix, invoice_next_number into prefix, next_num from settings limit 1;
  result := prefix || lpad(next_num::text, 4, '0');
  update settings set invoice_next_number = next_num + 1;
  return result;
end;
$$ language plpgsql;

-- Auto-generate next quote number
create or replace function generate_quote_number()
returns text as $$
declare
  prefix text;
  next_num integer;
  result text;
begin
  select quote_prefix, quote_next_number into prefix, next_num from settings limit 1;
  result := prefix || lpad(next_num::text, 4, '0');
  update settings set quote_next_number = next_num + 1;
  return result;
end;
$$ language plpgsql;

-- Calculate MRR for an income source
create or replace function calculate_mrr(source_id uuid)
returns numeric as $$
declare
  total_mrr numeric;
begin
  select coalesce(sum(
    case
      when interval = 'year' then amount / 12
      when interval = 'week' then amount * 52 / 12
      else amount / interval_count
    end
  ), 0) into total_mrr
  from stripe_subscriptions
  where income_source_id = source_id
    and status in ('active', 'trialing');
  return round(total_mrr, 2);
end;
$$ language plpgsql;

-- Recalculate invoice totals from line items
create or replace function recalculate_invoice_totals(inv_id uuid)
returns void as $$
declare
  sub numeric;
  rate numeric;
begin
  select coalesce(sum(total), 0) into sub from invoice_line_items where invoice_id = inv_id;
  select gst_rate into rate from invoices where id = inv_id;
  update invoices set
    subtotal = sub,
    gst_amount = round(sub * rate / 100, 2),
    total = sub + round(sub * rate / 100, 2)
  where id = inv_id;
end;
$$ language plpgsql;

-- Recalculate quote totals from line items
create or replace function recalculate_quote_totals(qt_id uuid)
returns void as $$
declare
  sub numeric;
  rate numeric;
  disc numeric;
begin
  select coalesce(sum(total), 0) into sub from quote_line_items where quote_id = qt_id;
  select gst_rate, coalesce(discount_amount, 0) into rate, disc from quotes where id = qt_id;
  sub := sub - disc;
  update quotes set
    subtotal = sub,
    gst_amount = round(sub * rate / 100, 2),
    total = sub + round(sub * rate / 100, 2)
  where id = qt_id;
end;
$$ language plpgsql;

-- Mark overdue invoices (called by cron)
create or replace function mark_overdue_invoices()
returns void as $$
begin
  update invoices
  set status = 'overdue'
  where status in ('sent', 'viewed')
    and due_date < current_date;
end;
$$ language plpgsql;

-- Convert quote to invoice
create or replace function convert_quote_to_invoice(qt_id uuid)
returns uuid as $$
declare
  inv_id uuid;
  inv_number text;
  qt record;
begin
  select * into qt from quotes where id = qt_id;
  inv_number := generate_invoice_number();

  insert into invoices (invoice_number, client_id, job_id, source_quote_id,
    subtotal, gst_rate, gst_amount, total)
  values (inv_number, qt.client_id, qt.job_id, qt_id,
    qt.subtotal, qt.gst_rate, qt.gst_amount, qt.total)
  returning id into inv_id;

  -- Copy line items
  insert into invoice_line_items (invoice_id, description, item_type, quantity, unit_price, total, sort_order)
  select inv_id, description, item_type, quantity, unit_price, total, sort_order
  from quote_line_items where quote_id = qt_id;

  -- Copy external notes
  insert into notes (invoice_id, note_type, content)
  select inv_id, note_type, content
  from notes where quote_id = qt_id and note_type = 'external';

  -- Update job status
  update jobs set status = 'invoiced' where id = qt.job_id and status != 'closed';

  return inv_id;
end;
$$ language plpgsql;

-- Vehicle deduction calculation
create or replace function calculate_vehicle_deduction(from_date date, to_date date)
returns table(total_km numeric, tier1_km numeric, tier2_km numeric, tier1_amount numeric, tier2_amount numeric, total_deduction numeric) as $$
declare
  tkm numeric;
  t1_rate numeric;
  t2_rate numeric;
  t1_km numeric;
  t2_km numeric;
begin
  select coalesce(sum(kilometres), 0) into tkm
  from vehicle_trips where date between from_date and to_date;

  select vehicle_tier1_rate, vehicle_tier2_rate into t1_rate, t2_rate from settings limit 1;

  t1_km := least(tkm, 14000);
  t2_km := greatest(tkm - 14000, 0);

  return query select
    tkm as total_km,
    t1_km as tier1_km,
    t2_km as tier2_km,
    round(t1_km * t1_rate, 2) as tier1_amount,
    round(t2_km * t2_rate, 2) as tier2_amount,
    round(t1_km * t1_rate + t2_km * t2_rate, 2) as total_deduction;
end;
$$ language plpgsql;
```

### Migration 015: Views for Reporting

```sql
-- supabase/migrations/015_views.sql

-- Job profitability view
create or replace view job_profitability as
select
  j.id, j.title, j.client_id, c.name as client_name, j.status,
  coalesce(inv_totals.revenue, 0) as revenue,
  coalesce(exp_totals.costs, 0) as costs,
  coalesce(inv_totals.revenue, 0) - coalesce(exp_totals.costs, 0) as profit,
  case when coalesce(inv_totals.revenue, 0) > 0
    then round((coalesce(inv_totals.revenue, 0) - coalesce(exp_totals.costs, 0)) / inv_totals.revenue * 100, 1)
    else 0
  end as margin_percent
from jobs j
left join clients c on c.id = j.client_id
left join lateral (
  select sum(total) as revenue from invoices where job_id = j.id and status = 'paid'
) inv_totals on true
left join lateral (
  select sum(amount) as costs from expenses where job_id = j.id
) exp_totals on true
where j.archived_at is null;

-- Monthly P&L view
create or replace view monthly_pnl as
with months as (
  select generate_series(
    date_trunc('month', current_date - interval '11 months'),
    date_trunc('month', current_date),
    '1 month'
  )::date as month
),
invoice_income as (
  select date_trunc('month', date)::date as month, sum(total) as amount
  from invoices where status = 'paid' group by 1
),
sub_income as (
  select date_trunc('month', transaction_date)::date as month, sum(net_amount) as amount
  from stripe_transactions where type = 'charge' group by 1
),
expense_totals as (
  select date_trunc('month', date)::date as month, sum(amount) as amount
  from expenses group by 1
)
select
  m.month,
  to_char(m.month, 'Mon YYYY') as label,
  coalesce(ii.amount, 0) as invoice_income,
  coalesce(si.amount, 0) as subscription_income,
  coalesce(ii.amount, 0) + coalesce(si.amount, 0) as total_income,
  coalesce(et.amount, 0) as total_expenses,
  coalesce(ii.amount, 0) + coalesce(si.amount, 0) - coalesce(et.amount, 0) as net_profit
from months m
left join invoice_income ii on ii.month = m.month
left join sub_income si on si.month = m.month
left join expense_totals et on et.month = m.month
order by m.month;

-- GST summary view
create or replace view gst_summary as
select
  (select coalesce(sum(gst_amount), 0) from invoices where status = 'paid') as gst_collected_invoices,
  (select coalesce(sum(gst_amount), 0) from stripe_transactions where type = 'charge' and gst_applicable = true) as gst_collected_subs,
  (select coalesce(sum(gst_amount), 0) from expenses) as gst_paid,
  (select coalesce(sum(gst_amount), 0) from invoices where status = 'paid')
    + (select coalesce(sum(gst_amount), 0) from stripe_transactions where type = 'charge' and gst_applicable = true)
    - (select coalesce(sum(gst_amount), 0) from expenses) as gst_to_pay;

-- Subscription dashboard view
create or replace view subscription_dashboard as
select
  s.id as income_source_id, s.name, s.platform, s.gst_treatment,
  count(ss.id) filter (where ss.status in ('active', 'trialing')) as active_subscribers,
  calculate_mrr(s.id) as mrr,
  coalesce(sum(st.gross_amount) filter (where st.type = 'charge'
    and st.transaction_date >= date_trunc('month', current_date)), 0) as gross_this_month,
  coalesce(sum(st.stripe_fee) filter (where st.type = 'charge'
    and st.transaction_date >= date_trunc('month', current_date)), 0) as fees_this_month,
  coalesce(sum(st.net_amount) filter (where st.type = 'charge'
    and st.transaction_date >= date_trunc('month', current_date)), 0) as net_this_month
from income_sources s
left join stripe_subscriptions ss on ss.income_source_id = s.id
left join stripe_transactions st on st.income_source_id = s.id
where s.is_active = true
group by s.id, s.name, s.platform, s.gst_treatment;
```

### Migration 016: Supabase Storage Buckets

```sql
-- supabase/migrations/016_storage.sql

insert into storage.buckets (id, name, public) values ('receipts', 'receipts', false);
insert into storage.buckets (id, name, public) values ('attachments', 'attachments', false);
insert into storage.buckets (id, name, public) values ('logos', 'logos', true);

create policy "Authenticated upload receipts" on storage.objects
  for insert with check (bucket_id = 'receipts' and auth.role() = 'authenticated');
create policy "Authenticated read receipts" on storage.objects
  for select using (bucket_id = 'receipts' and auth.role() = 'authenticated');
create policy "Authenticated upload attachments" on storage.objects
  for insert with check (bucket_id = 'attachments' and auth.role() = 'authenticated');
create policy "Authenticated read attachments" on storage.objects
  for select using (bucket_id = 'attachments' and auth.role() = 'authenticated');
create policy "Public read logos" on storage.objects
  for select using (bucket_id = 'logos');
create policy "Authenticated upload logos" on storage.objects
  for insert with check (bucket_id = 'logos' and auth.role() = 'authenticated');
```

---

## Part 3: Stripe Webhook Integration

### Architecture

```
Stripe Event
  -> HTTPS POST to Edge Function
  -> Edge Function validates signature
  -> Routes by event type
  -> Upserts into stripe_transactions / stripe_subscriptions
  -> MRR snapshot updated
  -> Frontend reads from Supabase (realtime or polling)
```

### 3.1 Edge Function: `stripe-webhook`

```bash
supabase functions new stripe-webhook
```

File: `supabase/functions/stripe-webhook/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-12-18.acacia",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// Map a Stripe product ID to an income_source_id
async function resolveIncomeSource(productId: string | null): Promise<string | null> {
  if (!productId) return null;
  const { data } = await supabase
    .from("income_sources")
    .select("id")
    .contains("stripe_product_ids", [productId])
    .limit(1)
    .single();
  return data?.id || null;
}

// Resolve income source from subscription
async function resolveFromSubscription(subscriptionId: string): Promise<{
  incomeSourceId: string | null;
  productId: string | null;
  priceId: string | null;
}> {
  try {
    const sub = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["items.data.price.product"],
    });
    const item = sub.items.data[0];
    const price = item?.price;
    const productId = typeof price?.product === "string"
      ? price.product
      : price?.product?.id || null;
    const incomeSourceId = await resolveIncomeSource(productId);
    return { incomeSourceId, productId, priceId: price?.id || null };
  } catch {
    return { incomeSourceId: null, productId: null, priceId: null };
  }
}

serve(async (req: Request) => {
  const signature = req.headers.get("Stripe-Signature");
  const body = await req.text();
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(body, signature!, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
  }

  console.log(`Processing event: ${event.type} (${event.id})`);

  try {
    switch (event.type) {

      // --- CHARGE EVENTS ---
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        if (!invoice.subscription) break;

        const { incomeSourceId } = await resolveFromSubscription(invoice.subscription as string);
        if (!incomeSourceId) {
          console.warn("No income source for subscription:", invoice.subscription);
          break;
        }

        const charge = invoice.charge
          ? await stripe.charges.retrieve(invoice.charge as string)
          : null;

        const fee = charge?.balance_transaction
          ? await stripe.balanceTransactions.retrieve(charge.balance_transaction as string)
          : null;

        const feeAmount = fee ? fee.fee / 100 : 0;
        const grossAmount = invoice.amount_paid / 100;
        const customerCountry = invoice.customer_address?.country || null;
        const isNZ = customerCountry === "NZ";

        const { data: source } = await supabase
          .from("income_sources")
          .select("gst_treatment")
          .eq("id", incomeSourceId)
          .single();

        const gstApplicable = source?.gst_treatment === "all" ||
          (source?.gst_treatment === "nz_only" && isNZ);

        // GST is 3/23 of GST-inclusive amount for NZ 15% GST
        const gstAmount = gstApplicable ? Math.round(grossAmount * 3 / 23 * 100) / 100 : 0;

        await supabase.from("stripe_transactions").upsert(
          {
            stripe_id: invoice.id,
            income_source_id: incomeSourceId,
            stripe_customer_id: invoice.customer as string,
            stripe_invoice_id: invoice.id,
            stripe_subscription_id: invoice.subscription as string,
            type: "charge",
            description: invoice.lines?.data?.[0]?.description || "Subscription payment",
            currency: invoice.currency,
            gross_amount: grossAmount,
            stripe_fee: feeAmount,
            net_amount: grossAmount - feeAmount,
            gst_applicable: gstApplicable,
            gst_amount: gstAmount,
            customer_country: customerCountry,
            transaction_date: new Date(invoice.created * 1000).toISOString(),
            period_start: invoice.lines?.data?.[0]?.period?.start
              ? new Date(invoice.lines.data[0].period.start * 1000).toISOString().split("T")[0]
              : null,
            period_end: invoice.lines?.data?.[0]?.period?.end
              ? new Date(invoice.lines.data[0].period.end * 1000).toISOString().split("T")[0]
              : null,
            import_source: "webhook",
            raw_data: event.data.object,
          },
          { onConflict: "stripe_id" }
        );
        break;
      }

      // --- SUBSCRIPTION LIFECYCLE ---
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const item = sub.items.data[0];
        const price = item?.price;
        const productId = typeof price?.product === "string"
          ? price.product
          : (price?.product as any)?.id || null;
        const incomeSourceId = await resolveIncomeSource(productId);

        if (!incomeSourceId) {
          console.warn("No income source for product:", productId);
          break;
        }

        let customerEmail: string | null = null;
        let customerCountry: string | null = null;
        try {
          const customer = await stripe.customers.retrieve(sub.customer as string);
          if (customer && !customer.deleted) {
            customerEmail = customer.email;
            customerCountry = customer.address?.country || null;
          }
        } catch { /* ignore */ }

        await supabase.from("stripe_subscriptions").upsert(
          {
            income_source_id: incomeSourceId,
            stripe_subscription_id: sub.id,
            stripe_customer_id: sub.customer as string,
            stripe_product_id: productId,
            stripe_price_id: price?.id,
            status: sub.status,
            amount: (price?.unit_amount || 0) / 100,
            currency: price?.currency || "nzd",
            interval: price?.recurring?.interval || "month",
            interval_count: price?.recurring?.interval_count || 1,
            customer_email: customerEmail,
            customer_country: customerCountry,
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            cancel_at: sub.cancel_at ? new Date(sub.cancel_at * 1000).toISOString() : null,
            canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
            started_at: new Date(sub.start_date * 1000).toISOString(),
          },
          { onConflict: "stripe_subscription_id" }
        );
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await supabase
          .from("stripe_subscriptions")
          .update({ status: "canceled", canceled_at: new Date().toISOString() })
          .eq("stripe_subscription_id", sub.id);
        break;
      }

      // --- REFUNDS ---
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const refund = charge.refunds?.data?.[0];
        if (!refund) break;

        const { data: originalTx } = await supabase
          .from("stripe_transactions")
          .select("income_source_id")
          .eq("stripe_customer_id", charge.customer as string)
          .eq("type", "charge")
          .limit(1)
          .single();

        if (!originalTx) break;

        await supabase.from("stripe_transactions").upsert(
          {
            stripe_id: refund.id,
            income_source_id: originalTx.income_source_id,
            stripe_customer_id: charge.customer as string,
            type: "refund",
            description: `Refund: ${refund.reason || "requested"}`,
            currency: charge.currency,
            gross_amount: -(refund.amount / 100),
            stripe_fee: 0,
            net_amount: -(refund.amount / 100),
            gst_applicable: false,
            transaction_date: new Date(refund.created * 1000).toISOString(),
            import_source: "webhook",
            raw_data: event.data.object,
          },
          { onConflict: "stripe_id" }
        );
        break;
      }

      // --- PAYOUTS ---
      case "payout.paid": {
        const payout = event.data.object as Stripe.Payout;

        const { data: source } = await supabase
          .from("income_sources")
          .select("id")
          .eq("platform", "stripe")
          .eq("is_active", true)
          .limit(1)
          .single();

        if (!source) break;

        await supabase.from("stripe_transactions").upsert(
          {
            stripe_id: payout.id,
            income_source_id: source.id,
            type: "payout",
            description: "Payout to bank",
            currency: payout.currency,
            gross_amount: 0,
            stripe_fee: 0,
            net_amount: payout.amount / 100,
            transaction_date: new Date(payout.arrival_date * 1000).toISOString(),
            import_source: "webhook",
            raw_data: event.data.object,
          },
          { onConflict: "stripe_id" }
        );
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err) {
    console.error(`Error processing ${event.type}:`, err);
    return new Response(JSON.stringify({ received: true, error: String(err) }), { status: 200 });
  }
});
```

### 3.2 Stripe Secrets

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_xxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### 3.3 Deploy and Register

```bash
supabase functions deploy stripe-webhook --no-verify-jwt
```

Register in Stripe Dashboard -> Developers -> Webhooks:

```
URL: https://<PROJECT_REF>.supabase.co/functions/v1/stripe-webhook
```

Events to subscribe to:
- `invoice.paid`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `charge.refunded`
- `payout.paid`

### 3.4 Edge Function: Historical Sync (`stripe-sync`)

For initial backfill and periodic reconciliation.

```bash
supabase functions new stripe-sync
```

File: `supabase/functions/stripe-sync/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-12-18.acacia",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req: Request) => {
  // Auth check
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: { user } } = await createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!
  ).auth.getUser(authHeader.replace("Bearer ", ""));

  if (!user) return new Response("Unauthorized", { status: 401 });

  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "full_sync";
  const daysBack = parseInt(url.searchParams.get("days") || "90");
  const since = Math.floor(Date.now() / 1000) - daysBack * 86400;

  let results = { subscriptions: 0, charges: 0, errors: [] as string[] };

  try {
    // --- SYNC SUBSCRIPTIONS ---
    if (action === "full_sync" || action === "subscriptions") {
      let hasMore = true;
      let startingAfter: string | undefined;

      while (hasMore) {
        const subs = await stripe.subscriptions.list({
          limit: 100,
          expand: ["data.items.data.price.product"],
          ...(startingAfter ? { starting_after: startingAfter } : {}),
        });

        for (const sub of subs.data) {
          const item = sub.items.data[0];
          const price = item?.price;
          const productId = typeof price?.product === "string"
            ? price.product
            : (price?.product as any)?.id || null;

          if (!productId) continue;
          const { data: source } = await supabase
            .from("income_sources")
            .select("id")
            .contains("stripe_product_ids", [productId])
            .limit(1)
            .single();
          if (!source) continue;

          let email: string | null = null;
          let country: string | null = null;
          try {
            const cust = await stripe.customers.retrieve(sub.customer as string);
            if (cust && !cust.deleted) {
              email = cust.email;
              country = cust.address?.country || null;
            }
          } catch { /* skip */ }

          await supabase.from("stripe_subscriptions").upsert(
            {
              income_source_id: source.id,
              stripe_subscription_id: sub.id,
              stripe_customer_id: sub.customer as string,
              stripe_product_id: productId,
              stripe_price_id: price?.id,
              status: sub.status,
              amount: (price?.unit_amount || 0) / 100,
              currency: price?.currency || "nzd",
              interval: price?.recurring?.interval || "month",
              interval_count: price?.recurring?.interval_count || 1,
              customer_email: email,
              customer_country: country,
              current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
              current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
              cancel_at: sub.cancel_at ? new Date(sub.cancel_at * 1000).toISOString() : null,
              canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
              started_at: new Date(sub.start_date * 1000).toISOString(),
            },
            { onConflict: "stripe_subscription_id" }
          );
          results.subscriptions++;
        }

        hasMore = subs.has_more;
        if (subs.data.length > 0) startingAfter = subs.data[subs.data.length - 1].id;
      }
    }

    // --- SYNC CHARGES ---
    if (action === "full_sync" || action === "charges") {
      let hasMore = true;
      let startingAfter: string | undefined;

      while (hasMore) {
        const txs = await stripe.balanceTransactions.list({
          limit: 100,
          created: { gte: since },
          type: "charge",
          ...(startingAfter ? { starting_after: startingAfter } : {}),
        });

        for (const bt of txs.data) {
          const chargeId = bt.source as string;
          if (!chargeId?.startsWith("ch_")) continue;

          try {
            const charge = await stripe.charges.retrieve(chargeId, {
              expand: ["invoice.subscription"],
            });

            const invoice = charge.invoice as Stripe.Invoice | null;
            const subId = invoice?.subscription;
            const subIdStr = typeof subId === "string" ? subId : (subId as any)?.id;
            if (!subIdStr) continue;

            const { data: subRecord } = await supabase
              .from("stripe_subscriptions")
              .select("income_source_id")
              .eq("stripe_subscription_id", subIdStr)
              .limit(1)
              .single();

            if (!subRecord) continue;

            const { data: source } = await supabase
              .from("income_sources")
              .select("gst_treatment")
              .eq("id", subRecord.income_source_id)
              .single();

            const customerCountry = charge.billing_details?.address?.country || null;
            const isNZ = customerCountry === "NZ";
            const gstApplicable = source?.gst_treatment === "all" ||
              (source?.gst_treatment === "nz_only" && isNZ);
            const grossAmount = bt.amount / 100;
            const gstAmount = gstApplicable ? Math.round(grossAmount * 3 / 23 * 100) / 100 : 0;

            await supabase.from("stripe_transactions").upsert(
              {
                stripe_id: invoice?.id || chargeId,
                income_source_id: subRecord.income_source_id,
                stripe_customer_id: charge.customer as string,
                stripe_invoice_id: invoice?.id,
                stripe_subscription_id: subIdStr,
                type: "charge",
                description: charge.description || "Subscription payment",
                currency: bt.currency,
                gross_amount: grossAmount,
                stripe_fee: bt.fee / 100,
                net_amount: bt.net / 100,
                gst_applicable: gstApplicable,
                gst_amount: gstAmount,
                customer_country: customerCountry,
                transaction_date: new Date(bt.created * 1000).toISOString(),
                import_source: "api_sync",
                raw_data: { balance_transaction_id: bt.id, charge_id: chargeId },
              },
              { onConflict: "stripe_id" }
            );
            results.charges++;
          } catch (err) {
            results.errors.push(`Charge ${chargeId}: ${err}`);
          }
        }

        hasMore = txs.has_more;
        if (txs.data.length > 0) startingAfter = txs.data[txs.data.length - 1].id;
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
```

Deploy:

```bash
supabase functions deploy stripe-sync
```

### 3.5 Edge Function: MRR Snapshot (`mrr-snapshot`)

```bash
supabase functions new mrr-snapshot
```

File: `supabase/functions/mrr-snapshot/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async () => {
  const today = new Date().toISOString().split("T")[0];
  const monthStart = today.substring(0, 7) + "-01";

  const { data: sources } = await supabase
    .from("income_sources")
    .select("id")
    .eq("is_active", true);

  if (!sources) return new Response("No sources", { status: 200 });

  for (const source of sources) {
    const { count: activeSubs } = await supabase
      .from("stripe_subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("income_source_id", source.id)
      .in("status", ["active", "trialing"]);

    const { data: mrrResult } = await supabase
      .rpc("calculate_mrr", { source_id: source.id });

    const { data: revData } = await supabase
      .from("stripe_transactions")
      .select("gross_amount, stripe_fee, net_amount")
      .eq("income_source_id", source.id)
      .eq("type", "charge")
      .gte("transaction_date", monthStart);

    const gross = revData?.reduce((s, r) => s + Number(r.gross_amount), 0) || 0;
    const fees = revData?.reduce((s, r) => s + Number(r.stripe_fee), 0) || 0;
    const net = revData?.reduce((s, r) => s + Number(r.net_amount), 0) || 0;

    const { count: churn } = await supabase
      .from("stripe_subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("income_source_id", source.id)
      .eq("status", "canceled")
      .gte("canceled_at", monthStart);

    const { count: newSubs } = await supabase
      .from("stripe_subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("income_source_id", source.id)
      .in("status", ["active", "trialing"])
      .gte("started_at", monthStart);

    await supabase.from("mrr_snapshots").upsert(
      {
        income_source_id: source.id,
        snapshot_date: today,
        active_subscriptions: activeSubs || 0,
        mrr: mrrResult || 0,
        gross_revenue: gross,
        total_fees: fees,
        net_revenue: net,
        churn_count: churn || 0,
        new_count: newSubs || 0,
      },
      { onConflict: "income_source_id,snapshot_date" }
    );
  }

  return new Response(JSON.stringify({ success: true, date: today }), { status: 200 });
});
```

### 3.6 Cron Jobs

Enable `pg_cron` and `pg_net` extensions in Supabase Dashboard, then:

```sql
-- Mark overdue invoices daily at 6am NZT (18:00 UTC)
select cron.schedule('mark-overdue-invoices', '0 18 * * *',
  $$select mark_overdue_invoices()$$
);

-- MRR snapshot daily at 7am NZT (19:00 UTC)
-- Alternative: trigger from stripe-webhook after invoice.paid
select cron.schedule('mrr-daily-snapshot', '0 19 * * *',
  $$select net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/mrr-snapshot',
    headers := '{"Authorization": "Bearer <SERVICE_ROLE_KEY>"}'::jsonb
  )$$
);
```

---

## Part 4: Frontend Data Layer

### 4.1 Auth Provider

Create `src/lib/auth.jsx`:

```jsx
import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "./supabase";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = (email, password) =>
    supabase.auth.signInWithPassword({ email, password });
  const signOut = () => supabase.auth.signOut();

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

Wrap in `src/main.jsx`:

```jsx
import { AuthProvider } from "./lib/auth";
root.render(<AuthProvider><App /></AuthProvider>);
```

### 4.2 Data Hooks

Create `src/lib/hooks.js`. Pattern for every entity:

```js
import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

export function useJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("jobs")
      .select(`*, client:clients(id, name), notes(id, note_type, content, created_at)`)
      .is("archived_at", null)
      .order("created_at", { ascending: false });
    if (!error) setJobs(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (job) => {
    const { data, error } = await supabase.from("jobs").insert(job).select().single();
    if (!error) { await fetch(); return data; }
    throw error;
  };

  const update = async (id, changes) => {
    const { error } = await supabase.from("jobs").update(changes).eq("id", id);
    if (!error) await fetch();
    else throw error;
  };

  return { jobs, loading, fetch, create, update };
}
```

Build equivalent hooks for: `useClients`, `useContacts`, `useQuotes`, `useInvoices`, `useExpenses`, `useVehicleTrips`, `useHomeOfficeCosts`, `useRecurringTemplates`, `useSettings`, `useIncomeSources`, `useStripeTransactions`, `useSubscriptions`, `useMrrSnapshots`, `useBankTransactions`, `useNotes`.

For the subscription dashboard:

```js
export function useSubscriptionDashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data: sources } = await supabase
      .from("subscription_dashboard")
      .select("*");
    setData(sources || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const fetchTrend = useCallback(async (sourceId, months = 7) => {
    const since = new Date();
    since.setMonth(since.getMonth() - months);
    const { data } = await supabase
      .from("mrr_snapshots")
      .select("snapshot_date, mrr, active_subscriptions, gross_revenue, total_fees, net_revenue")
      .eq("income_source_id", sourceId)
      .gte("snapshot_date", since.toISOString().split("T")[0])
      .order("snapshot_date", { ascending: true });
    return data || [];
  }, []);

  return { data, loading, fetch, fetchTrend };
}
```

### 4.3 Realtime (optional, for live sub counts)

```js
useEffect(() => {
  const channel = supabase
    .channel("stripe-changes")
    .on("postgres_changes",
      { event: "*", schema: "public", table: "stripe_subscriptions" },
      () => fetch()
    )
    .on("postgres_changes",
      { event: "INSERT", schema: "public", table: "stripe_transactions" },
      () => fetch()
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}, [fetch]);
```

### 4.4 Sync Trigger from Frontend

Wire the "Import Stripe" button to trigger a sync:

```js
const triggerSync = async (sourceId, days = 90) => {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-sync?action=full_sync&source_id=${sourceId}&days=${days}`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
    }
  );
  return res.json();
};
```

---

## Part 5: Income Source Setup

### Register your apps:

```sql
insert into income_sources (name, platform, stripe_product_ids, display_price, display_currency, pricing_model, gst_treatment)
values
  ('myMECA', 'stripe', ARRAY['prod_xxxMYMECA'], 4.00, 'NZD', 'monthly', 'nz_only'),
  ('TeaBreak', 'stripe', ARRAY['prod_xxxTEABREAK'], null, 'NZD', 'monthly', 'nz_only');
```

Replace `prod_xxx` with actual Stripe product IDs. Each source can have multiple product IDs (e.g. monthly + annual plans for the same app). Adding a new app = insert a row. No code changes needed.

---

## Part 6: Wiring Checklist

### Build order:
1. Run all migrations (`supabase db push`)
2. Create first user in Supabase Auth dashboard
3. Build auth provider + login screen
4. Build data hooks (`src/lib/hooks.js`)
5. Replace mock data in App.jsx with hooks (one page at a time)
6. Deploy Edge Functions
7. Register Stripe webhook
8. Insert income sources with Stripe product IDs
9. Run initial historical sync
10. Verify webhook events flowing in

---

## Part 7: File Structure After Build

```
supabase/
  migrations/
    001_core_setup.sql
    002_settings.sql
    003_clients_contacts.sql
    004_jobs_tasks.sql
    005_notes.sql
    006_quotes.sql
    007_invoices.sql
    008_expenses.sql
    009_vehicle_home_office.sql
    010_income_sources_stripe.sql
    011_bank_reconciliation.sql
    012_tax_years.sql
    013_rls.sql
    014_functions.sql
    015_views.sql
    016_storage.sql
  functions/
    stripe-webhook/index.ts
    stripe-sync/index.ts
    mrr-snapshot/index.ts
src/
  lib/
    supabase.js
    auth.jsx
    hooks.js
    pdf.js                (from PDF export instructions)
  App.jsx
.env.local
```

---

## Testing Checklist

- [ ] All migrations apply cleanly (`supabase db push`)
- [ ] Can create user and sign in
- [ ] Settings row exists with defaults
- [ ] CRUD works for clients, contacts, jobs, tasks
- [ ] Quote -> Invoice conversion works (DB function)
- [ ] Invoice number auto-increments
- [ ] Notes attach correctly to parent entities
- [ ] Income sources created with correct Stripe product IDs
- [ ] Stripe webhook receives events (check Stripe Dashboard -> Webhooks -> Logs)
- [ ] `invoice.paid` creates a `stripe_transactions` row
- [ ] `customer.subscription.created` creates a `stripe_subscriptions` row
- [ ] Subscription cancellation updates status to 'canceled'
- [ ] Refund creates a negative `stripe_transactions` row
- [ ] Historical sync backfills existing subscriptions and charges
- [ ] MRR calculation matches manual count
- [ ] MRR snapshot captures daily numbers
- [ ] Subscription dashboard view returns correct aggregates
- [ ] Frontend hooks fetch and display live data
- [ ] Realtime updates when new webhook events arrive
- [ ] GST correctly applied to NZ customers only (when gst_treatment = 'nz_only')
- [ ] Overdue invoice cron marks sent invoices as overdue
- [ ] Storage buckets accept receipt uploads
- [ ] Vehicle deduction function calculates tier split correctly
- [ ] Bank import can match transactions to invoices/expenses
- [ ] Multiple income sources show independently on Subscriptions page
- [ ] Adding a new app only requires an income_sources insert, no code changes
