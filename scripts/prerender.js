/**
 * Prerender script — renders SPA routes to static HTML at build time.
 * Automatically discovers blog post slugs from the rendered /blog page.
 * Generates sitemap.xml from all discovered routes.
 *
 * Gracefully skips if Puppeteer can't launch (e.g. on Vercel CI).
 * Run locally with: npm run prerender
 */

import { createServer } from 'http'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DIST = join(__dirname, '..', 'dist')
const PORT = 4173

// Static routes to always prerender
const STATIC_ROUTES = ['/', '/portfolio', '/blog', '/tools']

/** Minimal static file server for the dist folder */
function serve() {
  const mimeTypes = {
    '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
    '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
  }

  const server = createServer((req, res) => {
    let filePath = join(DIST, req.url === '/' ? 'index.html' : req.url)
    if (!filePath.includes('.')) filePath = join(DIST, 'index.html')

    try {
      const ext = '.' + filePath.split('.').pop()
      const content = readFileSync(filePath)
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' })
      res.end(content)
    } catch {
      const content = readFileSync(join(DIST, 'index.html'))
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end(content)
    }
  })

  return new Promise(resolve => server.listen(PORT, () => resolve(server)))
}

/** Render a single route and save the HTML */
async function renderRoute(browser, route) {
  const page = await browser.newPage()

  console.log(`  Rendering ${route}...`)
  await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: 'networkidle0', timeout: 15000 })
  await page.waitForFunction(
    () => document.querySelector('#root')?.innerHTML?.length > 100,
    { timeout: 10000 },
  )

  const html = await page.content()
  await page.close()

  const outPath = route === '/'
    ? join(DIST, 'index.html')
    : join(DIST, route, 'index.html')

  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, html)
  console.log(`  ✓ ${outPath.replace(DIST, 'dist')}`)
}

/** Visit /blog and extract all blog post links + their dates */
async function discoverBlogSlugs(browser) {
  const page = await browser.newPage()
  await page.goto(`http://localhost:${PORT}/blog`, { waitUntil: 'networkidle0', timeout: 15000 })
  await page.waitForFunction(
    () => document.querySelector('#root')?.innerHTML?.length > 100,
    { timeout: 10000 },
  )

  const posts = await page.evaluate(() =>
    [...document.querySelectorAll('a[href^="/blog/"]')]
      .map(a => ({
        href: a.getAttribute('href'),
        date: a.querySelector('.blog-card-date')?.textContent || '',
      }))
      .filter((v, i, arr) => arr.findIndex(x => x.href === v.href) === i),
  )

  await page.close()
  return posts
}

/** Generate sitemap.xml from all discovered routes */
function generateSitemap(blogPosts) {
  const today = new Date().toISOString().split('T')[0]

  const entries = [
    { loc: '/', lastmod: today, priority: '1.0', freq: 'monthly' },
    { loc: '/portfolio', lastmod: today, priority: '0.8', freq: 'monthly' },
    { loc: '/blog', lastmod: today, priority: '0.9', freq: 'weekly' },
    { loc: '/tools', lastmod: today, priority: '0.8', freq: 'monthly' },
  ]

  for (const { href, date } of blogPosts) {
    let lastmod = today
    try {
      const parsed = new Date(date + ' UTC')
      if (!isNaN(parsed.getTime())) lastmod = parsed.toISOString().split('T')[0]
    } catch { /* use today */ }
    entries.push({ loc: href, lastmod, priority: '0.7', freq: 'yearly' })
  }

  entries.push(
    { loc: '/portal', lastmod: today, priority: '0.5', freq: 'yearly' },
    { loc: '/demo', lastmod: today, priority: '0.5', freq: 'yearly' },
  )

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(e => `  <url>
    <loc>https://shmake.nz${e.loc}</loc>
    <lastmod>${e.lastmod}</lastmod>
    <priority>${e.priority}</priority>
    <changefreq>${e.freq}</changefreq>
  </url>`).join('\n')}
</urlset>
`
  writeFileSync(join(DIST, 'sitemap.xml'), xml)
  console.log(`  ✓ sitemap.xml (${entries.length} URLs)`)
}

async function prerender() {
  // Try to import puppeteer — skip gracefully if unavailable or can't launch
  let launch
  try {
    const puppeteer = await import('puppeteer')
    launch = puppeteer.launch || puppeteer.default?.launch
  } catch {
    console.log('\n⚠️  Puppeteer not available — skipping prerender (CI environment)\n')
    return
  }

  let browser
  try {
    browser = await launch({ headless: true })
  } catch (err) {
    console.log(`\n⚠️  Puppeteer can't launch browser — skipping prerender (CI environment)`)
    console.log(`   ${err.message.split('\n')[0]}\n`)
    return
  }

  console.log('\n🔍 Prerendering routes for SEO...\n')

  const server = await serve()

  // 1. Render static routes (including /blog listing)
  for (const route of STATIC_ROUTES) {
    await renderRoute(browser, route)
  }

  // 2. Auto-discover blog post slugs from the rendered /blog page
  const blogPosts = await discoverBlogSlugs(browser)
  console.log(`\n  Discovered ${blogPosts.length} blog posts\n`)

  // 3. Render each blog post
  for (const { href } of blogPosts) {
    await renderRoute(browser, href)
  }

  // 4. Generate sitemap from all discovered routes
  console.log('')
  generateSitemap(blogPosts)

  await browser.close()
  server.close()

  const total = STATIC_ROUTES.length + blogPosts.length
  console.log(`\n✅ Prerendered ${total} routes, sitemap generated\n`)
}

prerender().catch(err => {
  console.error('Prerender failed:', err)
  process.exit(1)
})
