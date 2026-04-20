import { supabase } from '../lib/supabase'

/* === FALLBACK DATA (used when Supabase is unreachable) === */

const FALLBACK_PROJECTS = {
  categories: ['All', 'Web/App Dev', 'Graphic Design', 'CAD', 'Business', 'DIY', 'Technology', 'Knowledge'],
  categoryDescriptions: {},
  projects: [
    { id: 1, title: 'myMECA', category: 'Web/App Dev', description: 'Healthcare payroll calculator app used by 250+ nurses daily.', gradient: 'gradient-cyan', year: '2023' },
    { id: 2, title: 'TeaBreak', category: 'Web/App Dev', description: 'Business operations app in development.', gradient: 'gradient-slate', year: '2024' },
    { id: 3, title: 'SHMAKE Website', category: 'Web/App Dev', description: 'This portfolio site.', gradient: 'gradient-amber', year: '2024' },
  ],
}

const FALLBACK_HERO_CARDS = [
  { key: 'shmake', title: 'Sam Haughey', logo: 'assets/shmake-logo-dark.png', screenshot: 'assets/profile.png', description: '<strong>Operations Manager</strong> with 13+ years in manufacturing. I build systems that work — ERP, quality, compliance, costing — and apps that solve real problems.', linkText: 'View Portfolio →', linkHref: '#portfolio', isInternal: true, initiallyExpanded: true, bgStyle: "linear-gradient(rgba(253, 135, 1, 0.85), rgba(253, 135, 1, 0.75)), url('https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800&q=80')" },
  { key: 'mymeca', title: 'myMECA', logo: 'assets/logo-mymeca.png', screenshot: 'assets/splash-mymeca.png', description: 'Got curious about healthcare payroll. Built an app. 250+ nurses use it daily to calculate their pay under the NZNO-HNZ collective agreement.', linkText: 'Visit myMECA →', linkHref: 'https://mymeca.nz', isInternal: false, bgStyle: "linear-gradient(rgba(36, 172, 221, 0.85), rgba(36, 172, 221, 0.75)), url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80')" },
  { key: 'teabreak', title: 'TeaBreak', logo: 'assets/logo-teabreak.png', screenshot: 'assets/splash-teabreak.png', description: 'Business operations app in development. A simple solution for the pesky admin tasks that small business owners don\'t have time to think about.', linkText: 'Coming Soon', linkHref: '#', isInternal: true, bgStyle: "linear-gradient(rgba(300, 300, 300, 0.85), rgba(100, 100, 100, 0.75)), url('https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80')" },
  { key: 'kiwislice', title: 'KiwiSlice', logo: 'assets/kiwislice-logo.svg', screenshot: 'assets/splash-kiwislice.png', description: 'Personal budget app for Kiwis. Track income, expenses, assets and liabilities in one place. Run planning scenarios to see where you\'re headed.', linkText: 'Open app →', linkHref: 'https://kiwislice.shmake.nz', isInternal: false, bgStyle: "linear-gradient(rgba(165, 196, 77, 0.9), rgba(141, 182, 0, 0.85)), url('https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80')" },
]

const FALLBACK_ABOUT = {
  name: 'Sam Haughey',
  photo: 'assets/profile.png',
  tagline: 'I get curious, build things, then move on to the next problem.',
  taglineSub: 'Expert at becoming almost an expert',
  bio: [
    "I run operations at a manufacturing company in Christchurch — scheduling, costing, compliance, all of it. I've been doing some version of that for 20 years across factories, trades, and construction.",
    "I get obsessed with problems, binge-learn whatever I need to fix them, then wander off to the next curiosity. The upside is the knowledge sticks. Somewhere along the way I started building software to fix the problems I couldn't find good tools for. That side project habit turned into something bigger.",
    "Now I build custom systems for manufacturers — the kind of businesses where the real work happens on a shop floor, not in a boardroom. I'm not an agency. You talk to me. I build around how your operation actually runs, not how a software vendor thinks it should. If your problem is already solved well by something off the shelf, I'll tell you that too.",
  ],
  youIf: [
    "Your quoting lives in a 47-tab spreadsheet one person understands",
    "You've trialled three platforms and nothing fits how you work",
    "Your tools were built for a business half your size, three years ago",
    "Production scheduling lives on a whiteboard — or in someone's head",
    "Admin is eating time that should go into making things",
    "You know what's broken. You just don't have time to fix it.",
  ],
  services: [
    { icon: 'Calculator', title: 'Quoting & costing tools', outcome: "Your team quotes from memory and hopes for the best. I'll build something they actually open." },
    { icon: 'Activity', title: 'Production tracking', outcome: 'Stop walking the floor to find out where a job is. Put it on a screen.' },
    { icon: 'CalendarDays', title: 'Scheduling systems', outcome: "If it lives on a whiteboard or in one person's head, it's a single point of failure." },
    { icon: 'BarChart3', title: 'Dashboards & reporting', outcome: "The numbers exist. They just shouldn't require three people and a Monday morning to surface them." },
    { icon: 'Link2', title: 'Integrations', outcome: "Your tools don't talk to each other. That's fixable." },
    { icon: 'Wrench', title: 'One-off fixes', outcome: "That workaround you've lived with for three years? Probably an afternoon of work." },
  ],
  comparison: [
    { heading: 'Not an agency', headline: 'You talk to me.', body: 'No account manager, no "let me check with the devs." I build it, I know it, I fix it.' },
    { heading: 'Not a freelancer', headline: 'Shop floor first.', body: "Most freelancers have never been on a shop floor. I've spent 20 years on them. I get what you're actually trying to do." },
    { heading: 'Not an ERP vendor', headline: 'Fit your operation.', body: "They sell you a system, then bill to make it fit. I build around how you actually work. If off-the-shelf would work, I'll say so." },
  ],
  wontDo: [
    'Pretend I understand your business after a 30-minute demo',
    'Sell you a "platform" and bill you forever to make it work',
    'Disappear after go-live',
    'Tell you AI is the answer when the answer is a better spreadsheet',
  ],
  ctaHeading: 'Sounds like you?',
  ctaBody: "Tell me what's broken. If I can help, I will. If I can't, I'll say so — and point you at someone who can.",
  ctaLabel: "Let's talk →",
  skills: [
    { title: 'What I build', items: ['Quoting & costing tools', 'Production tracking', 'Scheduling systems', 'Internal dashboards'] },
    { title: 'How I build it', items: ['React & Supabase', 'Web apps & PWAs', 'Database design', 'API integrations'] },
    { title: 'What I know', items: ['Operations management', 'Process optimisation', 'Quality & compliance', 'Costing & forecasting'] },
    { title: 'Other skills', items: ['CAD & 3D printing', 'Graphic design', 'Fabrication & trades', 'Product development'] },
  ],
}

const FALLBACK_CONTACT = {
  formAction: 'https://formspree.io/f/xldvwqal',
  recaptchaSiteKey: '6Ld4SBUsAAAAAA7SFAgUI5fFQ_IDMD16EcAkDOKe',
  eyebrow: 'Get in touch',
  heading: 'Tell me what\'s broken.',
  subheading: 'If I can help, I\'ll say so. If I can\'t, I\'ll tell you that too — and point you somewhere better.',
  socials: [
    { type: 'linkedin', url: 'https://www.linkedin.com/in/samhaughey/', label: 'LinkedIn' },
    { type: 'whatsapp', url: 'https://wa.me/64274766268', label: 'WhatsApp' },
  ],
}

const FALLBACK_META = { title: 'SHMAKE — Custom Software for Manufacturers', gaId: 'G-SQ07S188GB' }

/* === LOADERS (Supabase → fallback) === */

export async function loadProjects() {
  try {
    const [{ data: projects, error: pErr }, { data: cats, error: cErr }] = await Promise.all([
      supabase.from('portfolio_projects').select('*').order('id'),
      supabase.from('portfolio_categories').select('*').order('sort_order'),
    ])
    if (pErr) throw pErr
    if (cErr) throw cErr
    const categories = ['All', ...(cats || []).map(c => c.name)]
    const categoryDescriptions = {}
    ;(cats || []).forEach(c => { if (c.description) categoryDescriptions[c.name] = c.description })
    return {
      projects: (projects || []).map(p => ({
        id: p.id, title: p.title, category: p.category,
        description: p.description, longDescription: p.long_description,
        gradient: p.gradient, year: p.year, started: p.started,
        image: p.image, gallery: p.gallery || [], specs: p.specs || [],
        featured: p.featured || false,
      })),
      categories,
      categoryDescriptions,
    }
  } catch (error) {
    console.warn('Supabase portfolio load failed, trying projects.json:', error.message)
    try {
      const response = await fetch('/projects.json')
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      return { projects: data.projects || [], categories: data.categories || ['All'], categoryDescriptions: data.categoryDescriptions || {} }
    } catch {
      return FALLBACK_PROJECTS
    }
  }
}

export async function loadHeroCards() {
  try {
    const { data, error } = await supabase.from('hero_cards').select('*').order('sort_order')
    if (error) throw error
    return (data || []).map(c => ({
      key: c.key, title: c.title, logo: c.logo, screenshot: c.screenshot,
      description: c.description, linkText: c.link_text, linkHref: c.link_href,
      isInternal: c.is_internal, initiallyExpanded: c.initially_expanded,
      bgStyle: c.bg_style,
    }))
  } catch (error) {
    console.warn('Supabase hero cards load failed, using fallback:', error.message)
    return FALLBACK_HERO_CARDS
  }
}

export async function loadSiteContent() {
  try {
    const { data, error } = await supabase.from('site_content').select('*').eq('id', 1).single()
    if (error) throw error
    return {
      about: data.about || FALLBACK_ABOUT,
      contact: data.contact || FALLBACK_CONTACT,
      meta: data.meta || FALLBACK_META,
    }
  } catch (error) {
    console.warn('Supabase site_content load failed, using fallback:', error.message)
    return { about: FALLBACK_ABOUT, contact: FALLBACK_CONTACT, meta: FALLBACK_META }
  }
}

/* Re-export fallbacks for static imports that haven't migrated yet */
export const HERO_CARDS = FALLBACK_HERO_CARDS
export const ABOUT_CONTENT = FALLBACK_ABOUT
export const CONTACT_CONFIG = FALLBACK_CONTACT
export const SITE_META = FALLBACK_META
