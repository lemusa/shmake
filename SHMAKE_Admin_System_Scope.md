# SHMAKE Admin System — Project Scope

**Project:** shmake.nz Admin Portal  
**Owner:** Sam (Sole Trader)  
**Stack:** React + Supabase (Auth, Database, Storage)  
**Date:** February 2026  

---

## 1. Overview

A lightweight, self-hosted admin system for managing SHMAKE as a sole trader operation. The system covers the full lifecycle from enquiry through to invoicing and basic financial reporting. It's not trying to be Xero — it's a practical tool that keeps everything in one place, makes quoting and invoicing painless, and produces the numbers needed at tax time.

The system supports a mix of work types: custom fabrication/maker projects, design work, consulting/services, and anything else that comes through the door.

---

## 2. Core Modules

### 2.1 Jobs / Projects

The central hub. Everything ties back to a job.

- **Job creation** with flexible fields: title, description, client, job type (fabrication, design, consulting, other), status, priority
- **Job statuses:** Enquiry → Quoted → Approved → In Progress → Complete → Invoiced → Closed (configurable pipeline)
- **Job notes / activity log:** timestamped notes, status changes, and file attachments per job
- **Tags / categories** for filtering and reporting
- **Link to quotes, invoices, tasks, and expenses** — a job is the parent record that ties everything together

### 2.2 Tasks

Lightweight task tracking per job (not full project management).

- Tasks belong to a job (or can be standalone)
- Fields: title, description, status (To Do / In Progress / Done), due date, estimated hours, actual hours
- Simple checklist/subtask support within a task
- Dashboard view: "What's on my plate today/this week"
- Optional: time logging against tasks for tracking actual effort vs estimates

### 2.3 Clients / Contacts

Simple CRM — just enough to not lose track of people.

- Client record: name, email, phone, address, company (optional), notes
- Link clients to jobs, quotes, and invoices
- Contact history via linked job activity logs
- Quick-add from job creation flow (don't force a separate step)

### 2.4 Contacts Directory

A general-purpose address book for suppliers, contractors, and useful contacts that aren't clients.

- **Contact types:** Supplier, Contractor, Trade, Professional (accountant, lawyer), Other
- Fields: name, company, email, phone, address, type, tags, notes
- Quick search and filter by type or tag
- Link suppliers to expenses (e.g., "bought from Metalcraft")
- Separate from Clients — clients are people who pay you, contacts are everyone else
- Can promote a contact to a client if they become one

### 2.4 Quoting

Generate quotes that look professional and convert to invoices.

- **Quote builder** with line items: description, quantity, unit price, GST toggle per line
- Support for different line item types: labour (hourly/fixed), materials, flat fee
- Optional discount (percentage or fixed amount)
- Quote totals: subtotal, GST (15%), total
- **Quote statuses:** Draft → Sent → Accepted → Declined → Expired
- Auto-expire after configurable days (default 30)
- **PDF generation** for sending to clients (clean, branded template)
- **Convert quote to invoice** with one click (carries over all line items)
- Quote versioning — ability to revise a quote and keep history
- Optional: cover note / terms & conditions text block

### 2.5 Invoicing

Get paid. Keep records.

- **Invoice generation** from a quote or from scratch
- Line items matching quote structure: description, qty, unit price, GST
- Invoice numbering: auto-incrementing (e.g., SHMAKE-0001) with configurable prefix
- **Invoice statuses:** Draft → Sent → Viewed → Paid → Overdue → Written Off
- Payment terms: configurable (default 20th of the month following)
- **Payment tracking:** mark partial or full payment, payment date, payment method (bank transfer, cash, other)
- **PDF generation** with SHMAKE branding, GST number, bank account details
- Overdue invoice alerts / dashboard indicator
- **Recurring invoices:** set up repeating invoices for ongoing engagements (e.g., Ecoglo consultancy at $300/month)
  - Configure frequency: weekly, fortnightly, monthly, quarterly, annually
  - Set start date and optional end date / number of occurrences
  - Auto-generate draft invoices on schedule (or prompt to review and send)
  - Each generated invoice is a standalone record linked back to the recurring template
  - Pause / resume / cancel a recurring series
  - Recurring invoice dashboard showing all active series and next generation dates
- Optional: send invoice via email directly from the system

### 2.6 Subscription & App Income (Stripe)

A dedicated view for tracking revenue from subscription-based apps (e.g., myMECA) where income flows through Stripe rather than manual invoicing.

- **Income sources:** register each app/product as an income source (e.g., myMECA, future SaaS products)
- **Transaction logging:** record individual Stripe transactions or periodic summaries with gross amount, Stripe fees (platform, processing, currency conversion), and net amount received — all stored as fields on the transaction record
- **Fee reporting without expense clutter:** Stripe fees are NOT logged as individual expenses; instead, reporting rolls them up as a virtual "Payment Processing Fees" line on the P&L, sourced directly from the transactions table
- **Stripe data import:** manual CSV import from Stripe dashboard (payouts/balance transactions) as the baseline; optional future Stripe API integration via Edge Functions for automated sync
- **Payout reconciliation:** match Stripe payouts to bank deposits to confirm funds received
- **Subscriber metrics (lightweight):** active subscribers, MRR (monthly recurring revenue), churn count — enough to see trends without building a full analytics platform
- **GST on subscriptions:** flag whether GST applies per product (NZ customers vs overseas) and roll into GST reporting
- **Reporting:** monthly/quarterly/annual breakdown of gross revenue, fees, and net income per app — feeds into the main P&L and tax reports

### 2.7 Expenses & Costs

Track what goes out so you know what you actually made.

- **Expense logging:** date, description, amount, GST content, category, linked job (optional)
- **Expense categories:** Materials, Tools/Equipment, Software/Subscriptions, Vehicle/Travel, Home Office, Marketing, Payment Processing, Other (configurable)
- Receipt upload (image/PDF stored in Supabase Storage)
- Bulk entry support for catching up on receipts
- **Job costing:** expenses linked to a job roll up to show true profit per job

#### Tax-Deductible Apportioned Expenses

Some expenses are shared between business and personal use. The system tracks the full cost and applies a business-use percentage to calculate the deductible portion.

**Home Office**
- Record total household costs eligible for home office deduction: rent/mortgage interest, power, internet, insurance, rates, repairs/maintenance
- Set a **business-use percentage** based on floor area (e.g., office is 12m² of 120m² = 10%) — configurable in Settings
- Option to use IRD's square metre rate method as an alternative ($50.75/m² for 2025, updated annually in Settings)
- Log costs monthly, quarterly, or annually — system calculates the deductible portion automatically
- Annual summary showing total household costs, business percentage, and deductible amount for IR3

**Vehicle**
- Choose tracking method in Settings: **actual costs with business-use percentage** or **IRD mileage rate** (rates vary by vehicle type — see below; configurable in Settings)
- **Percentage method:** log total vehicle costs (fuel, insurance, registration, maintenance, depreciation) and set business-use percentage; system calculates deductible portion
- **Mileage method:** log individual trips with date, description, kilometres, and purpose; system totals km and calculates deduction at IRD rates with automatic tier split
  - Rates by vehicle type (2024-2025): Petrol $1.17/$0.37, Diesel $1.26/$0.35, Hybrid $0.86/$0.21, Electric $1.08/$0.19 (Tier 1 first 14,000km total / Tier 2 thereafter) — configurable in Settings as IRD updates annually
  - Register vehicle type (petrol, diesel, hybrid, electric) per vehicle
- Trip categories: client visit, supplier run, site visit, other (configurable)
- Annual summary for either method, ready for IR3

**Other Apportioned Expenses**
- Any expense can have a business-use percentage override (e.g., phone plan at 60% business use)
- Store full amount paid and business percentage — reports show both
- Apportioned amounts flow through to P&L and tax reports as the deductible portion only

**Deduction Settings (in Settings page)**
- Home office: floor area, total home area, calculated percentage (or manual override)
- Home office square metre rate (updated annually)
- Vehicle: tracking method selection, business-use percentage, IRD km rates (Tier 1 and Tier 2)
- Default business-use percentages for common categories (phone, internet, etc.)

### 2.8 Reconciliation

Day-to-day, invoices and expenses are marked as paid/logged manually — this is the primary workflow. Periodically, bank statement import provides a sanity check.

- **Invoice payment tracking:** mark invoices as paid (full or partial) with date and method — this is the main way income is confirmed
- **Expense payment tracking:** expenses are assumed paid when logged; optional "paid" flag for accrual-style tracking if needed
- **Bank CSV import:** import bank statement CSVs (ASB, Westpac, etc.) for periodic reconciliation
- **Matching view:** side-by-side comparison of bank transactions vs recorded income/expenses, highlighting unmatched items (things you forgot to log or unexpected transactions)
- **Auto-suggest matches:** match bank transactions to invoices/expenses by amount and date proximity — confirm or dismiss with one click
- **Unmatched transaction handling:** quickly create an expense or income record from an unmatched bank transaction
- **Reconciliation is optional, not enforced:** the system works fine without ever importing a bank statement — it's a periodic accuracy tool, not a gatekeeper
- **Stripe payout matching:** match Stripe payout amounts to bank deposits to confirm funds landed

### 2.9 Financial Reporting & Tax

The payoff — making tax time easy.

- **Dashboard summary:** revenue this month/quarter/year (invoiced + subscription), expenses, profit, outstanding invoices, overdue invoices
- **Profit & Loss report:** income vs expenses by period (monthly, quarterly, annual), filterable by category/job type, with invoice income and subscription income broken out separately
- **Revenue breakdown:** invoice income vs subscription/app income — see the split between hands-on work and passive/recurring revenue
- **Subscription income report:** gross vs fees vs net per app, per period, with MRR trend
- **GST report:** GST collected (from invoices + NZ subscriptions) vs GST paid (from expenses) for GST return periods (1, 2, or 6-monthly)
- **Income by client:** who's paying you the most
- **Job profitability:** revenue vs costs per job
- **Tax summary:** annual income, deductible expenses (including proportional home office, vehicle, and mixed-use deductions), Stripe fees, and net profit ready to hand to an accountant or plug into IR3
- **Deductions breakdown:** home office costs (total vs claimed portion), vehicle costs (actual method or km method), other proportional expenses — all in one view for tax time
- **Export to CSV** for all reports (accountant-friendly)
- Financial year: 1 April – 31 March (NZ tax year)

### 2.10 Tax Deductions & Apportionment

Track proportional business use of personal assets for tax deduction purposes.

- **Home office deduction:** configure home office as a percentage of total home (by floor area or rooms), then apportion household expenses (rent/mortgage interest, rates, insurance, power, internet) at that percentage
  - Set the business-use percentage once in settings, adjust per tax year if it changes
  - Log actual household costs periodically (monthly or quarterly) — system calculates the deductible portion automatically
  - Alternatively, support the IRD square metre rate method — configure rate and office size for a simpler flat calculation
  - Outputs: annual home office deduction total for IR3
- **Vehicle expenses:** track business use of a personal vehicle
  - Two methods supported: **actual costs** (fuel, rego, insurance, repairs, depreciation) apportioned by business-use percentage, OR **IRD mileage rate** (log trips and the system calculates at the current per-km rate)
  - **Trip log:** date, origin, destination, km, purpose, linked job (optional) — for mileage rate method
  - Business-use percentage for actual cost method (set per vehicle per tax year)
  - Outputs: annual vehicle deduction total for IR3
- **Other apportioned expenses:** phone, tools/equipment used for both personal and business — configure a business-use percentage per item/category
- **Depreciation tracking (lightweight):** register assets (tools, equipment, computer, vehicle) with purchase price, date, and IRD depreciation rate (straight-line or diminishing value) — system calculates annual depreciation deduction
- **Tax deduction summary:** all deductions in one view — home office, vehicle, depreciation, apportioned items — ready to hand to an accountant or enter into IR3
- **Per-tax-year snapshots:** lock in percentages and totals per financial year so historical records don't shift when you update current settings

---

## 3. System-Wide Features

### 3.1 Authentication & Access

- Supabase Auth — single user (Sam), email/password login
- Future-proof: role-based access if the business grows (admin, viewer)

### 3.2 Notes System (Internal & External)

Every major record (jobs, quotes, invoices, expenses, clients, contacts) supports two types of notes:

- **Internal notes:** private notes visible only within the admin system — for Sam's eyes only. Timestamped, supports multiple entries per record. Use for reminders, context, decision rationale, follow-up actions.
- **External notes:** content that appears on customer-facing PDF exports (quotes and invoices). Used for terms, special instructions, thank-you messages, scope clarifications.
- Internal notes are visually distinct from external notes (e.g., yellow background for internal, white for external)
- Notes are searchable via global search
- Quick-add notes inline without opening a full edit form

### 3.3 Dashboard

- Landing page after login showing key metrics at a glance
- Active jobs count and pipeline summary
- Tasks due today/this week
- Unpaid / overdue invoices
- Revenue vs expenses (current month + YTD)
- Quick actions: new job, new expense, new invoice

### 3.3 Search & Filtering

- Global search across jobs, clients, invoices, expenses
- Filter lists by status, date range, client, job type, tags
- Sort by date, amount, status, client

### 3.4 Settings

- Business details: trading name, GST number, IRD number, bank account, contact info, logo
- Default payment terms
- Invoice number prefix and starting number
- Expense categories (add/edit/remove)
- **Proportional deduction defaults:** home office percentage, vehicle business-use percentage, IRD km rate
- Job types and status pipeline configuration
- Quote/invoice template settings (terms & conditions, footer text)

### 3.5 File Storage

- Supabase Storage for receipts, attachments, and generated PDFs
- Organised by job or by type (receipts, quotes, invoices)

---

## 4. Data Model (High-Level)

```
clients
  ├── jobs
  │     ├── tasks
  │     ├── job_notes
  │     ├── quotes
  │     │     └── quote_line_items
  │     ├── invoices
  │     │     ├── invoice_line_items
  │     │     └── payments
  │     └── expenses
  │
invoices (can also be standalone / not linked to a job)
  └── recurring_invoice_templates
        └── generated invoices (linked via template_id)

income_sources (registered apps/products e.g. myMECA)
  └── stripe_transactions
        ├── gross_amount
        ├── fees (platform + processing + currency)
        └── net_amount

bank_transactions (imported from CSV for reconciliation)
  └── matched to invoices, expenses, or stripe payouts

tax_years
  ├── home_office_config (percentage, method, rate per year)
  │     └── household_costs (periodic logs of actual costs)
  ├── vehicles
  │     ├── vehicle_trips (for mileage method)
  │     └── vehicle_costs (for actual cost method)
  ├── assets (for depreciation tracking)
  └── apportioned_items (phone, tools, etc. with biz-use %)

expenses (can also be standalone / not linked to a job)
settings (single row — business config)
```

Key relationships:
- A **client** has many **jobs**
- A **job** has many **tasks**, **quotes**, **invoices**, **expenses**, and **notes**
- A **quote** converts to an **invoice** (linked via `source_quote_id`)
- An **invoice** can optionally link to a **recurring_invoice_template** that generated it
- **Recurring invoice templates** generate individual invoices on a schedule
- **Income sources** represent apps/products earning via Stripe
- **Stripe transactions** belong to an income source and track gross, fees, and net
- **Expenses** can optionally link to a job for profitability tracking
- **Payments** track partial/full settlement against invoices
- **Bank transactions** are imported records that can be matched to invoices, expenses, or Stripe payouts for reconciliation

---

## 5. UI / UX Notes

- **Desktop-first** (this is an admin tool, not customer-facing), but responsive enough for tablet use
- **Layout:** fixed left sidebar for navigation, content/list pages in the main area on the right
- **Right slideout panel** for all data entry — creating/editing jobs, clients, invoices, expenses, tasks etc. open in a slide-over panel from the right edge rather than modals or full-page forms. This keeps the list/context visible underneath.
- Sidebar navigation: Dashboard, Jobs, Clients, Contacts, Quotes, Invoices, Subscriptions/Apps, Expenses, Reports, Settings
- Clean, minimal design — no unnecessary chrome
- Inline editing where practical (status changes, quick notes)
- Toast notifications for actions (saved, sent, error)
- Dark mode support (optional, but nice to have)

---

## 6. Suggested Build Phases

### Phase 1 — Foundation
- Auth, database schema, settings
- Client CRUD
- Job CRUD with status pipeline
- Basic dashboard shell

### Phase 2 — Quoting & Invoicing
- Quote builder with line items and GST calculation
- PDF generation (quotes)
- Invoice creation (from scratch + from quote)
- Invoice PDF generation with branding
- Payment tracking
- Recurring invoice templates and auto-generation

### Phase 3 — Tasks, Expenses & Subscription Income
- Task management per job
- Expense logging with receipt upload
- Job costing (expenses linked to jobs)
- Income sources setup (register apps/products)
- Stripe CSV import and transaction tracking (gross/fees/net)
- Subscription income reporting

### Phase 4 — Reporting & Reconciliation
- Dashboard metrics and charts
- P&L, GST, and tax summary reports (with Stripe fees as virtual expense line)
- Bank CSV import and matching view
- Stripe payout reconciliation
- CSV export
- Global search
- UX refinements, keyboard shortcuts, quality of life

### Phase 5 — Nice-to-Haves
- Email sending (invoices/quotes) via Supabase Edge Functions + Resend/Postmark
- Stripe API integration for automated transaction sync (replace CSV import)
- Quote/invoice templates (multiple designs)
- Time tracking integration
- Client portal: share quote/invoice links publicly

---

## 7. Out of Scope (For Now)

- Multi-user / team features beyond basic future-proofing
- Inventory / stock management
- Payroll (sole trader — no employees)
- Full double-entry accounting / chart of accounts
- Xero/MYOB integration
- Automated bank reconciliation (CSV import with manual matching is the ceiling — no live bank feeds or auto-categorisation)
- Mobile app (responsive web is sufficient)

---

## 8. Success Criteria

The system is "done enough" when Sam can:

1. Log a new enquiry and track it through to completion
2. Generate a professional quote PDF and send it to a client
3. Convert an accepted quote to an invoice with one click
4. Set up a recurring invoice and have it auto-generate each period
5. Track payments and see what's outstanding at a glance
6. Import Stripe data and see gross vs net revenue per app at a glance
7. Log expenses and receipts without it being a chore
8. Pull a GST summary and annual P&L (combining invoice + subscription income) at tax time without touching a spreadsheet
9. See the split between active income (jobs) and passive income (subscriptions)
10. See job profitability to know which work is actually worth doing

---

*This is a living document. Update as the build progresses and priorities shift.*
