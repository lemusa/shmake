# SHMAKE.nz — SEO Implementation Plan

## Context

- **Site**: shmake.nz — portfolio/business site for SHMAKE (Sam's software & product development company)
- **Stack**: Vite + React + Tailwind v4, hosted on Vercel
- **Structure**: Public site at `/`, admin at `/admin` (lazy-loaded, Supabase auth)
- **Data layer**: `src/data/projects.js`
- **Goal**: Google listing should show site description + sitelinks to Portfolio, Contact, Client Portal, Client Demo

---

## Phase 1 — Per-Route Meta Tags

### 1.1 Install react-helmet-async

```bash
npm install react-helmet-async
```

### 1.2 Wrap App in HelmetProvider

In your root (e.g. `main.jsx` or `App.jsx`), wrap the app:

```jsx
import { HelmetProvider } from 'react-helmet-async';

<HelmetProvider>
  <App />
</HelmetProvider>
```

### 1.3 Add Helmet to Each Public Route

Create a reusable SEO component at `src/components/SEO.jsx`:

```jsx
import { Helmet } from 'react-helmet-async';

export default function SEO({ title, description, path }) {
  const siteUrl = 'https://shmake.nz';
  const fullUrl = `${siteUrl}${path}`;
  const siteName = 'SHMAKE';

  return (
    <Helmet>
      {/* Basic */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content={siteName} />
      {/* Add og:image if you have a social share image */}
      {/* <meta property="og:image" content={`${siteUrl}/og-image.jpg`} /> */}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
}
```

### 1.4 Use SEO Component on Each Page

Apply to each route component. Here are the recommended titles and descriptions — **adjust the descriptions to match your actual content/tone**:

| Route | Title | Description (max 155 chars) |
|-------|-------|-----------------------------|
| `/` | SHMAKE — Software & Product Development, Christchurch NZ | Custom software and product development by Sam Highet. Building tools like myMECA, TeaBreak, and shmakeCut from Christchurch, New Zealand. |
| `/portfolio` | Portfolio — SHMAKE | Explore SHMAKE's portfolio of software products including myMECA, TeaBreak, and shmakeCut. Real tools solving real problems. |
| `/contact` | Contact — SHMAKE | Get in touch with SHMAKE for custom software development, product builds, or project enquiries. Based in Christchurch, NZ. |
| `/client-portal` | Client Portal — SHMAKE | Secure client portal for SHMAKE project access, updates, and collaboration. |
| `/client-demo` | Client Demo — SHMAKE | Try a live demo of SHMAKE's software products and see what we can build for your business. |

Example usage in a page component:

```jsx
import SEO from '../components/SEO';

export default function Portfolio() {
  return (
    <>
      <SEO
        title="Portfolio — SHMAKE"
        description="Explore SHMAKE's portfolio of software products including myMECA, TeaBreak, and shmakeCut. Real tools solving real problems."
        path="/portfolio"
      />
      {/* rest of page */}
    </>
  );
}
```

---

## Phase 2 — Structured Data (JSON-LD)

### 2.1 Add Organization Schema to Homepage

Add this inside the `<Helmet>` on the homepage (or in the SEO component when `path === '/'`):

```jsx
<script type="application/ld+json">
  {JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "SHMAKE",
    "url": "https://shmake.nz",
    "logo": "https://shmake.nz/logo.png",
    "description": "Custom software and product development based in Christchurch, New Zealand.",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Christchurch",
      "addressCountry": "NZ"
    },
    "sameAs": []
  })}
</script>
```

### 2.2 Add SiteNavigationElement Schema

This helps Google understand your site structure for sitelinks. Add to the homepage or layout:

```jsx
<script type="application/ld+json">
  {JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "name": "SHMAKE",
        "url": "https://shmake.nz"
      },
      {
        "@type": "SiteNavigationElement",
        "name": "Portfolio",
        "url": "https://shmake.nz/portfolio"
      },
      {
        "@type": "SiteNavigationElement",
        "name": "Contact",
        "url": "https://shmake.nz/contact"
      },
      {
        "@type": "SiteNavigationElement",
        "name": "Client Portal",
        "url": "https://shmake.nz/client-portal"
      },
      {
        "@type": "SiteNavigationElement",
        "name": "Client Demo",
        "url": "https://shmake.nz/client-demo"
      }
    ]
  })}
</script>
```

---

## Phase 3 — Crawlability

### 3.1 Create `public/robots.txt`

```
User-agent: *
Allow: /
Disallow: /admin

Sitemap: https://shmake.nz/sitemap.xml
```

### 3.2 Create `public/sitemap.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://shmake.nz/</loc>
    <priority>1.0</priority>
    <changefreq>monthly</changefreq>
  </url>
  <url>
    <loc>https://shmake.nz/portfolio</loc>
    <priority>0.8</priority>
    <changefreq>monthly</changefreq>
  </url>
  <url>
    <loc>https://shmake.nz/contact</loc>
    <priority>0.7</priority>
    <changefreq>yearly</changefreq>
  </url>
  <url>
    <loc>https://shmake.nz/client-portal</loc>
    <priority>0.5</priority>
    <changefreq>yearly</changefreq>
  </url>
  <url>
    <loc>https://shmake.nz/client-demo</loc>
    <priority>0.5</priority>
    <changefreq>yearly</changefreq>
  </url>
</urlset>
```

### 3.3 Update `index.html` Defaults

Make sure your `public/index.html` (or `index.html` at root) has sensible fallback meta tags for when Helmet hasn't hydrated yet. This is what crawlers see on first load before JS runs:

```html
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SHMAKE — Software & Product Development, Christchurch NZ</title>
  <meta name="description" content="Custom software and product development by Sam Highet. Building tools like myMECA, TeaBreak, and shmakeCut from Christchurch, New Zealand." />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://shmake.nz" />
  <meta property="og:title" content="SHMAKE — Software & Product Development, Christchurch NZ" />
  <meta property="og:description" content="Custom software and product development by Sam Highet. Building tools like myMECA, TeaBreak, and shmakeCut from Christchurch, New Zealand." />
  <link rel="canonical" href="https://shmake.nz" />
</head>
```

---

## Phase 4 — Prerendering (Critical for SPA SEO)

Since this is a client-rendered SPA, Google's crawler may not execute JS reliably. Prerendering generates static HTML at build time for each route.

### 4.1 Install vite-plugin-prerender

```bash
npm install -D vite-plugin-prerender
```

### 4.2 Configure in `vite.config.js`

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile'; // if you use this
import prerender from 'vite-plugin-prerender';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    prerender({
      routes: ['/', '/portfolio', '/contact', '/client-portal', '/client-demo'],
      // Don't prerender /admin routes
    }),
  ],
});
```

> **Note**: Check the latest docs for `vite-plugin-prerender` as the API may vary. An alternative is `vite-plugin-ssr` or manually using `puppeteer` in a postbuild script. The key outcome is that `dist/index.html`, `dist/portfolio/index.html`, etc. each contain fully rendered HTML.

### 4.3 Verify After Build

```bash
npm run build
# Check that dist/portfolio/index.html contains actual page content, not just <div id="root"></div>
cat dist/portfolio/index.html | head -50
```

---

## Phase 5 — Google Search Console

### 5.1 Setup (Manual Step — Sam does this)

1. Go to https://search.google.com/search-console
2. Add property: `https://shmake.nz`
3. Verify via DNS TXT record (Vercel makes this easy) or HTML file upload
4. Submit sitemap: `https://shmake.nz/sitemap.xml`
5. Request indexing of homepage

### 5.2 After Deployment

- Use "URL Inspection" tool to check each key page is indexable
- Check "Coverage" report for any errors
- Monitor "Sitelinks" appearance over time (this is automatic — Google decides based on site structure, traffic, and internal linking)

---

## Phase 6 — Quick Wins & Polish

### 6.1 Favicon & Apple Touch Icon

Make sure `public/` has:
- `favicon.ico` or `favicon.svg`
- `apple-touch-icon.png` (180x180)

Add to `index.html`:
```html
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```

### 6.2 Image Alt Tags

Ensure all `<img>` tags in portfolio items have descriptive `alt` attributes. Pull from `projects.js` data if possible.

### 6.3 Internal Linking

Make sure your navigation consistently links to all key pages. Every page should be reachable from every other page via the nav. This reinforces the site structure for Google.

### 6.4 Performance Check

```bash
npx lighthouse https://shmake.nz --only-categories=performance,seo
```

Aim for 90+ on both scores.

---

## Implementation Order (Checklist)

- [x] Install `react-helmet-async`
- [x] Create `src/components/SEO.jsx`
- [x] Add `<SEO>` component to every public route (/, /portfolio, /portal, /demo)
- [x] Update `index.html` with fallback meta tags
- [x] Add JSON-LD Organization schema to homepage
- [x] Add JSON-LD SiteNavigationElement schema
- [x] Create `public/robots.txt`
- [x] Create `public/sitemap.xml` (corrected routes: /portfolio, /portal, /demo)
- [ ] Install and configure prerendering (`vite-plugin-prerender` or alternative)
- [ ] Verify prerendered output contains real HTML
- [x] Add favicon and apple-touch-icon (already existed)
- [x] Check all images have alt tags
- [ ] Deploy to Vercel
- [ ] Set up Google Search Console and submit sitemap
- [ ] Run Lighthouse audit and fix any issues

---

## Notes

- **Sitelinks are not guaranteed** — Google auto-generates them based on site structure, authority, and traffic. The structured data and clear hierarchy maximise your chances.
- **Don't prerender `/admin` routes** — keep those client-only and blocked in robots.txt.
- **og:image** — Consider creating a branded social share image (1200x630px) for when links are shared on social media. Add it to the SEO component.
- If `vite-plugin-prerender` causes issues with your Vercel deployment, an alternative is to use Vercel's `@vercel/og` for social images and rely on Googlebot's JS rendering (which does work, just slower to index). The prerendering is the ideal approach though.
