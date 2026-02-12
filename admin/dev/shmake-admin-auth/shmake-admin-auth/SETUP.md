# Admin Auth — Setup Guide

## 1. Install the Supabase client

```bash
cd admin/
npm install @supabase/supabase-js
```

## 2. Copy the auth files into your admin app

```
admin/src/
├── lib/
│   └── supabase.js          ← Supabase client
├── context/
│   └── AuthContext.jsx       ← Session state + email allowlist
└── components/
    ├── AuthGuard.jsx         ← Wraps admin — shows login if needed
    ├── Login.jsx             ← Login screen
    └── UserMenu.jsx          ← Header widget (avatar + sign out)
```

## 3. Set up your `.env`

```bash
cp .env.example .env
```

Fill in:
- `VITE_SUPABASE_URL` — from Supabase dashboard → Settings → API
- `VITE_SUPABASE_ANON_KEY` — same place (the **anon/public** key)
- `VITE_ADMIN_EMAIL` — your email address

Also add these as **Environment Variables** in your Vercel project settings
for the admin deploy.

## 4. Create your Supabase user account

In your Supabase dashboard → Authentication → Users → **Add user**:
- Enter your email and a strong password
- Tick "Auto Confirm User" (skips email verification for this one-off setup)

## 5. Wire it into your admin app

In your admin's `main.jsx` (or wherever you bootstrap the app):

```jsx
import { AuthProvider } from './context/AuthContext'
import AuthGuard from './components/AuthGuard'
import AdminApp from './AdminApp' // your existing admin root

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <AuthGuard>
        <AdminApp />
      </AuthGuard>
    </AuthProvider>
  </StrictMode>
)
```

That's it. The `AuthGuard` checks for a valid session on every load.
If there's no session, it renders the `Login` component instead of
your admin UI. No routes needed, no bypassing possible.

## 6. Add the UserMenu to your admin header

Wherever your admin header/navbar lives:

```jsx
import UserMenu from './components/UserMenu'

function AdminHeader() {
  return (
    <header>
      <h1>SHMAKE Admin</h1>
      {/* ... other nav items ... */}
      <UserMenu />
    </header>
  )
}
```

## How the security works

**Three layers:**

1. **Supabase Auth** — email + password login, session managed via
   secure HTTP-only cookies/tokens by the Supabase client library.

2. **Email allowlist** — even if someone creates an account on your
   Supabase project, the `AuthContext` checks their email against
   `VITE_ADMIN_EMAIL` before granting access. Non-matching emails
   are immediately signed out.

3. **Client-side guard** — the `AuthGuard` component wraps your
   entire admin app. No authenticated session = no admin UI rendered.

**When you add Supabase tables for portfolio data**, also add Row Level
Security policies so the API endpoints are protected server-side too.
The auth token from the session is passed automatically by the Supabase
client on every query.

## Vercel environment variables

Add these three variables to your admin Vercel project:

| Variable               | Value                     |
|------------------------|---------------------------|
| `VITE_SUPABASE_URL`    | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your anon key           |
| `VITE_ADMIN_EMAIL`     | Your email address        |
