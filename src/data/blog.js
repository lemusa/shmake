import { supabase } from '../lib/supabase'

/* === FALLBACK BLOG POSTS === */

export const FALLBACK_POSTS = [
  {
    id: 1,
    slug: 'building-mymeca',
    title: 'Building myMECA — A Payroll Calculator for 250+ Nurses',
    excerpt: 'How a spreadsheet for one nurse turned into an app used daily across New Zealand hospitals.',
    content: `
      <p>It started the way most of my projects do — someone had a problem, and I got curious.</p>
      <p>My wife is a nurse working under the NZNO-HNZ MECA (Multi-Employer Collective Agreement). The pay structure is complex — base rates, penal rates, overtime, night differentials, weekend loadings — and the existing tools for calculating it were either wrong or confusing.</p>
      <p>So I built a spreadsheet. Then the spreadsheet got shared. Then people started asking for features the spreadsheet couldn't handle. So I built an app.</p>
      <h2>The Problem</h2>
      <p>Nurses needed to verify their pay was correct, but the MECA pay structure has dozens of variables. Existing calculators didn't account for all the edge cases — things like split shifts crossing midnight, or overtime that kicks in after 8 hours but resets on a new calendar day.</p>
      <h2>The Solution</h2>
      <p>myMECA is a web app that lets nurses input their shifts and see exactly what they should be paid, broken down by every rate and loading. It handles all the edge cases because I built it by reading the actual collective agreement line by line.</p>
      <h2>What I Learned</h2>
      <p>Building for real users changes everything. When 250 people depend on your calculations being correct to the cent, you learn to test obsessively. I also learned that the best product marketing is solving a genuine problem — the app grew entirely through word of mouth.</p>
    `,
    category: 'Project',
    tags: ['React', 'Web App', 'Healthcare'],
    published_at: '2023-09-15',
    image: '/assets/splash-mymeca.png',
    reading_time: 4,
  },
  {
    id: 2,
    slug: 'why-i-build-things',
    title: 'Why I Build Things',
    excerpt: 'On curiosity-driven making, and why the best projects start with "I wonder if..."',
    content: `
      <p>I've never been able to stick to one discipline. Over the past 20 years I've worked on factory floors, construction sites, in offices doing production scheduling, and now in operations management. Along the way I've taught myself graphic design, web development, CAD, welding, 3D printing, and whatever else seemed useful at the time.</p>
      <p>People sometimes ask how I end up building such different things — a healthcare payroll app, a CNC router, a business operations platform, a budget tracker. The honest answer is: I get curious about problems.</p>
      <h2>The Pattern</h2>
      <p>It usually goes like this: I notice something that doesn't work well, or someone mentions a problem they're stuck on. I think "that shouldn't be that hard to fix." Then I spend the next few weeks (or months) obsessively learning whatever I need to build a solution.</p>
      <p>The knowledge sticks because it's always connected to a real problem. I didn't learn React because I wanted to be a developer — I learned it because I needed to build myMECA and a spreadsheet wasn't cutting it anymore.</p>
      <h2>The Upside of Being a Generalist</h2>
      <p>When you've worked across enough domains, you start seeing patterns that specialists miss. The same lean manufacturing principles that reduce waste on a factory floor can streamline a software deployment pipeline. The same design thinking that makes a good logo makes a good user interface.</p>
      <p>I'm not the best at any one thing, but I'm dangerous enough at a lot of things to be genuinely useful when the problem doesn't fit neatly into one box.</p>
    `,
    category: 'Thinking',
    tags: ['Making', 'Career', 'Philosophy'],
    published_at: '2023-06-20',
    reading_time: 3,
  },
  {
    id: 3,
    slug: 'operations-to-code',
    title: 'From Operations Management to Writing Code',
    excerpt: 'How 13 years of managing manufacturing operations shaped the way I build software.',
    content: `
      <p>For the last 13 years I've been the person who keeps things running at Ecoglo International — a Christchurch company that manufactures photoluminescent safety products shipped around the world. It's the kind of job where you touch everything: production planning, quality systems, compliance, costing, logistics, and the occasional "the machine is broken and we ship tomorrow" crisis.</p>
      <h2>What Operations Teaches You</h2>
      <p>Operations management is fundamentally about systems thinking. You learn to see how every part of a business connects — how a change in raw material supplier affects production scheduling, which affects delivery dates, which affects cash flow. You get very good at identifying bottlenecks and working backwards from constraints.</p>
      <p>These same skills transfer directly to software. When I'm building an app, I think about data flow the way I think about production flow. Where are the bottlenecks? What happens when this breaks? What does the user actually need versus what they asked for?</p>
      <h2>Building Internal Tools</h2>
      <p>The transition from operations to code was gradual. It started with Excel automations — macros that saved hours of manual data entry. Then I discovered that web apps could do everything Excel couldn't. Now I build tools that solve the operational problems I used to solve with spreadsheets and whiteboards.</p>
      <p>The advantage of being the person who both understands the business problem and can build the solution is enormous. There's no lost-in-translation gap between what the operations team needs and what the developer builds — because it's the same person.</p>
    `,
    category: 'Thinking',
    tags: ['Operations', 'Career', 'Software'],
    published_at: '2024-02-10',
    reading_time: 4,
  },
]

/* === LOADER === */

export async function loadBlogPosts() {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('published', true)
      .order('published_at', { ascending: false })
    if (error) throw error
    return (data || []).map(p => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      content: p.content,
      category: p.category,
      tags: p.tags || [],
      published_at: p.published_at,
      image: p.image,
      reading_time: p.reading_time,
    }))
  } catch (error) {
    console.warn('Supabase blog load failed, using fallback:', error.message)
    return FALLBACK_POSTS
  }
}

export async function loadBlogPost(slug) {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .single()
    if (error) throw error
    return {
      id: data.id,
      slug: data.slug,
      title: data.title,
      excerpt: data.excerpt,
      content: data.content,
      category: data.category,
      tags: data.tags || [],
      published_at: data.published_at,
      image: data.image,
      reading_time: data.reading_time,
    }
  } catch (error) {
    console.warn('Supabase blog post load failed, using fallback:', error.message)
    return FALLBACK_POSTS.find(p => p.slug === slug) || null
  }
}
