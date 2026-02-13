# SHMAKE Project State — February 2026

## Overview

Single Vite + React + Tailwind v4 app. Public portfolio at `/`, admin panel at `/admin` (lazy-loaded, Supabase auth). Hosted on Vercel, domain `shmake.nz`.

---

## Tech Stack

- **Framework:** Vite 7 + React 18
- **CSS:** Tailwind v4 (CSS-first config via `@tailwindcss/vite` plugin — no `tailwind.config.js`)
- **Auth:** Supabase (email/password + client-side email allowlist)
- **Admin UI libs:** Recharts, Lucide React, jsPDF + jsPDF-AutoTable
- **Hosting:** Vercel (auto-deploys from GitHub)
- **Data (current):** Static `public/projects.json` — no database yet

---

## File Structure

```
src/
├── App.jsx                  # React Router: / → PublicSite, /admin/* → lazy AdminApp
├── PublicSite.jsx           # Portfolio shell (scroll-snap sections, theme, overlay)
├── main.jsx                 # Entry point
├── index.css                # Tailwind v4 imports + custom props + admin CSS (.fs, .fm, slideIn)
│
├── admin/
│   ├── AdminApp.jsx         # Entry: AuthProvider → AuthGuard → AdminLayout
│   ├── AdminLayout.jsx      # THE BIG FILE — Sam's full admin UI (all pages in one file)
│   ├── AuthGuard.jsx        # Shows Login if no session, children if authed
│   ├── Login.jsx            # Dark SHMAKE-branded login screen
│   └── UserMenu.jsx         # (legacy, not currently used — user menu is inline in AdminLayout sidebar)
│
├── components/              # Portfolio components
│   ├── Header.jsx           # Fixed header with nav toggle
│   ├── NavSidebar.jsx       # Mobile nav drawer
│   ├── HeroCards.jsx        # Expanding hero cards (reads HERO_CARDS from data layer)
│   ├── About.jsx            # Bio section (reads ABOUT_CONTENT)
│   ├── Contact.jsx          # Contact form (reads CONTACT_CONFIG)
│   ├── Footer.jsx
│   ├── PortfolioOverlay.jsx # Full-screen portfolio with category filtering
│   ├── ProjectCard.jsx      # Individual project tile
│   ├── ProjectDetailModal.jsx # Project detail with gallery
│   ├── SkillsCard.jsx       # Skills breakdown (reads from project id=0)
│   ├── SocialLinks.jsx
│   └── ImageIcon.jsx
│
├── context/
│   ├── ThemeContext.jsx      # Dark/light mode toggle
│   ├── PortfolioContext.jsx  # Portfolio overlay open/close state
│   └── AuthContext.jsx       # Supabase session + email allowlist guard
│
├── data/
│   └── projects.js           # Data layer — loadProjects(), HERO_CARDS, ABOUT_CONTENT, CONTACT_CONFIG, SITE_META
│
└── lib/
    ├── supabase.js           # createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
    └── pdf.js                # generateInvoicePdf, generateQuotePdf, generateExpenseReportPdf
```

### Other files

```
index.html                   # Includes DM Sans/Mono font imports, GA tag, OG meta
public/projects.json          # 50 projects, categories, categoryDescriptions
vite.config.js                # @tailwindcss/vite plugin, react plugin
vercel.json                   # SPA rewrite: all routes → /index.html
.env.example                  # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_ADMIN_EMAIL
```

---

## Environment Variables

| Variable | Where | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | `.env` + Vercel | Must have `VITE_` prefix |
| `VITE_SUPABASE_ANON_KEY` | `.env` + Vercel | Must have `VITE_` prefix |
| `VITE_ADMIN_EMAIL` | `.env` + Vercel | Email allowlist for admin access |

Env vars are baked at build time (Vite). Redeploy required after changes.

---

## Auth Flow

1. User hits `/admin` → `AdminApp` loads (lazy chunk)
2. `AuthProvider` checks Supabase session via `onAuthStateChange`
3. `AuthGuard` renders `Login` if no session, `AdminLayout` if authed
4. `AuthContext` checks `user.email` against `VITE_ADMIN_EMAIL` — auto signs out non-allowlisted users

---

## Data Layer — Current State (`src/data/projects.js`)

All portfolio data is currently static. The data layer exports:

### `loadProjects()` → async
Fetches `public/projects.json`. Returns `{ projects, categories, categoryDescriptions }`.

### `HERO_CARDS` → array (4 items)
```js
{ key, title, logo, screenshot, description, linkText, linkHref, isInternal, initiallyExpanded?, bgStyle }
```

### `ABOUT_CONTENT` → object
```js
{ name, photo, tagline, taglineSub, bio: string[], skills: [{ title, items: string[] }] }
```

### `CONTACT_CONFIG` → object
```js
{ formAction, recaptchaSiteKey, heading, subheading, socials: [{ type, url, label }] }
```

### `SITE_META` → object
```js
{ title, gaId }
```

---

## projects.json Shape

```jsonc
{
  "categories": ["All", "Business", "Web/App Dev", "CAD", "Technology", "DIY"],
  "categoryDescriptions": {
    "Business": "...",
    "Web/App Dev": "...",
    // one per category (except "All")
  },
  "projects": [
    {
      "id": 0,                    // Special: skills card (rendered differently)
      "title": "Sam Haughey",
      "description": "...",
      "gradient": "gradient-amber",
      "year": "13+ Years",
      "image": "assets/profile.png",
      "longDescription": "...",
      "skills": [                 // Only on id=0
        { "title": "Operations & Manufacturing", "blurb": "...", "items": ["...", "..."] }
      ]
    },
    {
      "id": 44,                   // Normal project
      "title": "myMECA",
      "category": "Web/App Dev",  // string (some older entries may be array)
      "description": "...",       // Short description shown on card
      "gradient": "gradient-cyan",// CSS class for card gradient
      "year": "2025",            // Display year or "Ongoing"
      "started": 2023,           // Optional — numeric start year
      "image": "assets/projects/app/mymeca/mymeca.png",  // Hero image
      "longDescription": "...",  // Optional — expanded detail
      "gallery": ["...", "..."], // Optional — additional images
      "specs": ["...", "..."],   // Optional — tech specs list
    }
  ]
}
```

**50 projects** total. Images are in `public/assets/projects/{category}/`. Gradients are CSS classes defined in `index.css`.

---

## Admin Panel — What Exists

`AdminLayout.jsx` is one large file (~600 lines) containing ALL admin pages with mock data:

| Page | Nav ID | Status |
|---|---|---|
| Dashboard | `dashboard` | Full mock — stats, charts, active jobs, attention items |
| Jobs | `jobs` | Table with sort/filter/search, status tabs, slide-out form |
| Clients | `clients` | Table with sort/search, slide-out form |
| Contacts | `contacts` | Card grid with type filtering, slide-out form |
| Quotes | `quotes` | Table with PDF download (jsPDF), version tracking, notes |
| Invoices | `invoices` | Table with PDF download, mark paid, recurring sub-view |
| Expenses | `expenses` | Table with receipt tracking, vehicle log + home office sub-views |
| Subscriptions | `subscriptions` | myMECA stats, MRR trend chart, Stripe import wizard |
| Reports | `reports` | P&L, GST, tax year, job profitability tabs |
| **Portfolio** | `portfolio` | **Read-only table** from projects.json — search, image/gallery status |
| Settings | `settings` | Business details, invoicing, deductions, categories, data import |

All business pages use **hardcoded mock data** (JOBS, CL, QT, INV, EXP arrays at top of file). No database. Forms open via slide-out panel (`Sld` component) but don't persist.

### Sub-views (accessed via buttons, not nav)
- Vehicle Log — km tracking, IRD tier deductions
- Home Office — proportioned expenses
- Recurring Invoices — template management
- Stripe Import — 3-step CSV wizard
- Bank Import — CSV upload + transaction matching

---

## What Needs Building — Portfolio CMS

### Goal
Make portfolio content (projects, hero cards, about, contact, site meta) editable from the admin panel, stored in Supabase, served to the public site.

### Supabase tables needed

**`projects`** — mirrors projects.json structure
- id, title, category, description, long_description, gradient, year, started, image, gallery (jsonb), specs (jsonb), skills (jsonb — only for id=0), sort_order, created_at, updated_at

**`categories`** — portfolio categories
- id, name, description, sort_order

**`hero_cards`** — homepage hero section
- id, key, title, logo, screenshot, description, link_text, link_href, is_internal, initially_expanded, bg_style, sort_order

**`site_content`** — key/value for about, contact, meta
- id, key (unique), value (jsonb)
- Keys: `about`, `contact`, `site_meta`

### RLS (Row Level Security)
- All tables: public `SELECT` (anon key can read)
- All tables: `INSERT/UPDATE/DELETE` only for authenticated users matching admin email

### Admin pages to build
1. **Projects CRUD** — table → edit form, reorder, image upload (Supabase Storage)
2. **Hero Cards editor** — reorder, edit fields, preview
3. **About editor** — bio paragraphs, skills grid, photo
4. **Contact/Meta editor** — social links, form config, site title

### Data layer migration
Replace `loadProjects()` in `src/data/projects.js` with Supabase queries. Keep the same return shape so public site components don't change. Same for HERO_CARDS, ABOUT_CONTENT, CONTACT_CONFIG, SITE_META — swap static exports for async Supabase fetches.

### Image handling
Current images are in `public/assets/`. Options:
- **Supabase Storage** — upload from admin, serve via public URL
- **Keep local** — simpler but requires deploy for image changes
- **Hybrid** — Supabase Storage for new uploads, existing paths still work

---

## Build & Deploy

```bash
npm run dev          # Local dev server (port 5173)
npm run build        # Production build → dist/
```

Build output (current):
- `index-*.js` — ~256KB (public site + router)
- `AdminApp-*.js` — ~1MB (admin chunk, lazy-loaded)

Vercel auto-deploys on push to GitHub. SPA routing handled by `vercel.json` rewrite rule.

---

## Gradient Classes

Defined in `src/index.css` as CSS custom properties. Used on project cards:

```
gradient-amber, gradient-cyan, gradient-slate, gradient-pink,
gradient-emerald, gradient-violet, gradient-rose, gradient-blue,
gradient-orange, gradient-teal, gradient-indigo, gradient-lime,
gradient-fuchsia, gradient-sky, gradient-red, gradient-yellow,
gradient-green, gradient-purple, gradient-stone, gradient-zinc
```

---

## Key Decisions Already Made

- Single app (not separate repos for portfolio + admin)
- Tailwind v4 CSS-first (no config file, `@theme` block in CSS)
- Admin is one monolithic component file (Sam's design — don't refactor unless asked)
- Mock business data stays as-is — portfolio CMS is the priority
- Auth uses client-side email allowlist (simple, sufficient for single-user)
