/**
 * Portfolio data layer
 *
 * ┌──────────────────────────────────────────────────────────┐
 * │  TODO: ADMIN INTEGRATION                                 │
 * │                                                          │
 * │  When the admin system is ready, replace loadProjects()  │
 * │  with an API call to the admin backend:                  │
 * │                                                          │
 * │    GET /api/portfolio/projects                           │
 * │    GET /api/portfolio/categories                         │
 * │    GET /api/portfolio/hero-cards                         │
 * │                                                          │
 * │  The admin should provide CRUD for:                      │
 * │    - Projects (title, description, category, images,     │
 * │      gallery, specs, links, gradient, year, featured)    │
 * │    - Categories + category descriptions                  │
 * │    - Hero card config (which projects to feature,        │
 * │      background images, overlay colors)                  │
 * │    - Skills card content (skills array on project id=0)  │
 * │    - About section content (bio, tagline, photo, skills) │
 * │    - Contact form destination                            │
 * │    - Social links                                        │
 * │                                                          │
 * │  The data shape returned should match the current        │
 * │  projects.json structure so components don't need to     │
 * │  change. Just swap the fetch URL.                        │
 * └──────────────────────────────────────────────────────────┘
 */

// Fallback data when fetch fails (e.g. local dev without projects.json)
const FALLBACK_DATA = {
  categories: ['All', 'Web/App Dev', 'Graphic Design', 'CAD', 'Business', 'DIY', 'Technology'],
  categoryDescriptions: {},
  projects: [
    { id: 1, title: 'myMECA', category: 'Web/App Dev', description: 'Healthcare payroll calculator app used by 250+ nurses daily.', gradient: 'gradient-cyan', year: '2023' },
    { id: 2, title: 'TeaBreak', category: 'Web/App Dev', description: 'Business operations app in development.', gradient: 'gradient-slate', year: '2024' },
    { id: 3, title: 'SHMAKE Website', category: 'Web/App Dev', description: 'This portfolio site.', gradient: 'gradient-amber', year: '2024' },
  ],
}

/**
 * Load portfolio data.
 * Currently fetches from static JSON file.
 * Replace with admin API endpoint when ready.
 */
export async function loadProjects() {
  try {
    // TODO: Replace with admin API endpoint
    // const response = await fetch('/api/portfolio/projects')
    const response = await fetch('/projects.json')
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    return {
      projects: data.projects || [],
      categories: data.categories || ['All'],
      categoryDescriptions: data.categoryDescriptions || {},
    }
  } catch (error) {
    console.warn('Could not load projects.json, using fallback data:', error.message)
    return FALLBACK_DATA
  }
}

/**
 * Hero card configuration.
 *
 * TODO: Move to admin - these should be configurable via the
 * admin panel so Sam can change hero cards without deploying.
 */
export const HERO_CARDS = [
  {
    key: 'shmake',
    title: 'Sam Haughey',
    logo: 'assets/shmake-logo-dark.png',
    screenshot: 'assets/profile.png',
    description: '<strong>Operations Manager</strong> with 13+ years in manufacturing. I build systems that work — ERP, quality, compliance, costing — and apps that solve real problems.',
    linkText: 'View Portfolio →',
    linkHref: '#portfolio',
    isInternal: true,
    initiallyExpanded: true,
    bgStyle: "linear-gradient(rgba(253, 135, 1, 0.85), rgba(253, 135, 1, 0.75)), url('https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800&q=80')",
  },
  {
    key: 'mymeca',
    title: 'myMECA',
    logo: 'assets/logo-mymeca.png',
    screenshot: 'assets/splash-mymeca.png',
    description: 'Got curious about healthcare payroll. Built an app. 250+ nurses use it daily to calculate their pay under the NZNO-HNZ collective agreement.',
    linkText: 'Visit myMECA →',
    linkHref: 'https://mymeca.nz',
    isInternal: false,
    bgStyle: "linear-gradient(rgba(36, 172, 221, 0.85), rgba(36, 172, 221, 0.75)), url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80')",
  },
  {
    key: 'teabreak',
    title: 'TeaBreak',
    logo: 'assets/logo-teabreak.png',
    screenshot: 'assets/splash-teabreak.png',
    description: 'Business operations app in development. A simple solution for the pesky admin tasks that small business owners don\'t have time to think about.',
    linkText: 'Coming Soon',
    linkHref: '#',
    isInternal: true,
    bgStyle: "linear-gradient(rgba(300, 300, 300, 0.85), rgba(100, 100, 100, 0.75)), url('https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80')",
  },
  {
    key: 'kiwislice',
    title: 'KiwiSlice',
    logo: 'assets/kiwislice-logo.svg',
    screenshot: 'assets/splash-kiwislice.png',
    description: 'Personal budget app for Kiwis. Track income, expenses, assets and liabilities in one place. Run planning scenarios to see where you\'re headed.',
    linkText: 'Try the App →',
    linkHref: 'https://kiwislice-app.vercel.app',
    isInternal: false,
    bgStyle: "linear-gradient(rgba(165, 196, 77, 0.9), rgba(141, 182, 0, 0.85)), url('https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80')",
  },
]

/**
 * About section content.
 * TODO: Move to admin - editable bio, skills, tagline, photo.
 */
export const ABOUT_CONTENT = {
  name: 'Sam Haughey',
  photo: 'assets/profile.png',
  tagline: 'I get curious, build things, then move on to the next problem.',
  taglineSub: 'Expert at becoming almost an expert',
  bio: [
    "Based in Christchurch with my wife and three daughters, I've spent the last 18 years working everywhere from the factory floor to construction sites, then into production scheduling and now operations management — looking after the day-to-day of a manufacturing company that ships product around the world. Along the way I've dabbled in freelance graphic, web, and CAD design.",
    "I get obsessed with problems, binge-learn whatever I need to fix them, then wander off to the next curiosity. The upside is the knowledge sticks. I'm as comfortable with code as I am with power tools, Illustrator as I am with Excel, SketchUp as I am with generating SOP's.",
    "For the last 13 years I've been the person who solves the operational headaches at Ecoglo International while building side projects that keep my brain busy. I get energised by new, odd, or tricky problems — the ones where the solution isn't obvious yet. If that's what you're working on, let's chat.",
  ],
  skills: [
    { title: 'Digital', items: ['Web development', 'React & Supabase', 'Adobe Creative Suite', 'Home automation'] },
    { title: 'Physical', items: ['SketchUp & CAD', '3D printing & CNC', 'Welding & fabrication', 'Construction & DIY'] },
    { title: 'Business', items: ['Operations management', 'Process optimisation', 'Costing & forecasting', 'Quality systems'] },
    { title: 'Creative', items: ['Video editing', 'Branding & layout', 'Product mock-ups', 'Workshop builds'] },
  ],
}

/**
 * Contact / social config.
 * TODO: Move to admin.
 */
export const CONTACT_CONFIG = {
  formAction: 'https://formspree.io/f/xldvwqal',
  recaptchaSiteKey: '6Ld4SBUsAAAAAA7SFAgUI5fFQ_IDMD16EcAkDOKe',
  heading: 'Building something interesting?',
  subheading: 'Always keen to hear about novel problems and interesting challenges.',
  socials: [
    { type: 'linkedin', url: 'https://www.linkedin.com/in/samhaughey/', label: 'LinkedIn' },
    { type: 'whatsapp', url: 'https://wa.me/64274766268', label: 'WhatsApp' },
  ],
}

/**
 * Site metadata.
 * TODO: Move to admin.
 */
export const SITE_META = {
  title: 'SHMAKE - Build Things',
  gaId: 'G-SQ07S188GB',
}
