import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadProjects } from '../data/projects'
import { usePortfolio } from '../context/PortfolioContext'
import ProjectDetailModal from './ProjectDetailModal'
import SEO from './SEO'

/* ── Category → color mapping ── */
const CAT_COLORS = {
  'Web/App Dev': { color: '#24acdd', dim: 'rgba(36,172,221,0.15)', cls: 'webdev' },
  'Graphic Design': { color: '#d46b7a', dim: 'rgba(212,107,122,0.15)', cls: 'gfx' },
  'CAD': { color: '#9b7ed8', dim: 'rgba(155,126,216,0.15)', cls: 'cad' },
  'Business': { color: '#E8751A', dim: 'rgba(232,117,26,0.15)', cls: 'business' },
  'DIY': { color: '#c4956a', dim: 'rgba(196,149,106,0.15)', cls: 'diy' },
  'Technology': { color: '#8db600', dim: 'rgba(141,182,0,0.15)', cls: 'tech' },
}

function catColor(category) {
  const cat = Array.isArray(category) ? category[0] : category
  return CAT_COLORS[cat] || { color: '#999', dim: 'rgba(153,153,153,0.15)', cls: 'default' }
}

/* ── Patterns for card thumbnails ── */
const PATTERNS = ['pat-grid', 'pat-diag', 'pat-dots', 'pat-cross']
function patternFor(id) { return PATTERNS[id % PATTERNS.length] }

/* ── Group projects by started year ── */
function groupByYear(projects, sortDir) {
  const groups = {}
  for (const p of projects) {
    const yr = p.started || parseInt(p.year) || 0
    if (!groups[yr]) groups[yr] = []
    groups[yr].push(p)
  }
  const sorted = Object.entries(groups).sort((a, b) =>
    sortDir === 'newest' ? b[0] - a[0] : a[0] - b[0]
  )
  // Merge years that are close together into ranges
  const merged = []
  for (const [year, items] of sorted) {
    merged.push({ year: Number(year), projects: items })
  }
  return merged
}

function yearLabel(year) {
  const now = new Date().getFullYear()
  if (year >= now - 1) return `${year} — Present`
  return String(year)
}

export default function PortfolioPage() {
  const navigate = useNavigate()
  const { openDetail } = usePortfolio()
  const [projects, setProjects] = useState([])
  const [categories, setCategories] = useState(['All'])
  const [filter, setFilter] = useState('All')
  const [sortDir, setSortDir] = useState('newest')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.body.style.overflow = 'auto'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    loadProjects().then(data => {
      // Exclude SkillsCard (id=0)
      setProjects(data.projects.filter(p => p.id !== 0))
      setCategories(data.categories)
      setLoading(false)
    })
  }, [])

  // Category counts (from all projects, not filtered)
  const catCounts = useMemo(() => {
    const counts = { All: projects.length }
    for (const p of projects) {
      const cats = Array.isArray(p.category) ? p.category : [p.category]
      for (const c of cats) {
        counts[c] = (counts[c] || 0) + 1
      }
    }
    return counts
  }, [projects])

  // Filtered projects
  const filtered = useMemo(() => {
    if (filter === 'All') return projects
    return projects.filter(p => {
      const cats = Array.isArray(p.category) ? p.category : [p.category]
      return cats.includes(filter)
    })
  }, [projects, filter])

  // Grouped by year
  const yearGroups = useMemo(() => groupByYear(filtered, sortDir), [filtered, sortDir])

  // Featured project = first project from the newest year group (only when showing All)
  const featuredProject = useMemo(() => {
    if (filter !== 'All' || yearGroups.length === 0) return null
    return yearGroups[0].projects[0] || null
  }, [yearGroups, filter])

  // Year groups for the body — exclude the featured project so it's not shown twice
  const bodyGroups = useMemo(() => {
    if (!featuredProject) return yearGroups
    return yearGroups.map((g, gi) => {
      if (gi !== 0) return g
      const remaining = g.projects.filter(p => p.id !== featuredProject.id)
      if (remaining.length === 0) return null
      return { ...g, projects: remaining }
    }).filter(Boolean)
  }, [yearGroups, featuredProject])

  if (loading) {
    return (
      <div className="pf-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 36, height: 36, border: '2px solid #E8751A', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#777', fontSize: 14 }}>Loading portfolio...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pf-page">
      <SEO
        title="Portfolio — SHMAKE"
        description="Explore SHMAKE's portfolio of software, design, CAD, and DIY projects. Real tools solving real problems, built from Christchurch, NZ."
        path="/portfolio"
      />
      {/* ── Top Bar ── */}
      <nav className="pf-top-bar">
        <div className="pf-top-left">
          <a href="/" className="pf-logo" onClick={e => { e.preventDefault(); navigate('/') }}>
            <img src="/assets/shmake-logo-light.png" alt="SHMAKE" className="pf-logo-img" />
          </a>
          <span className="pf-bc-sep">›</span>
          <span className="pf-bc-page">Portfolio</span>
        </div>
        <button className="pf-close-btn" onClick={() => navigate('/')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </nav>

      {/* ── Hero ── */}
      <section className="pf-hero">
        <div className="pf-hero-inner">
          <div className="pf-hero-text">
            <div className="pf-hero-eyebrow">Building things — since 2006</div>
            <h1 className="pf-hero-h1">I get curious<span className="pf-accent">,</span><br />build things<span className="pf-accent">,</span><br />move on<span className="pf-accent">.</span></h1>
            <p className="pf-hero-sub">Operations manager, maker, developer, designer. Equally comfortable with power tools and code editors — 18 years of solving problems across every discipline I can get my hands on.</p>
          </div>
          {featuredProject && (() => {
            const cc = catColor(featuredProject.category)
            const categoryLabel = Array.isArray(featuredProject.category) ? featuredProject.category.join(' / ') : featuredProject.category
            return (
              <div className="pf-hero-featured" onClick={() => openDetail(featuredProject)}>
                <div className={`pf-card-img ci-${cc.cls} ${patternFor(featuredProject.id)}`}>
                  {featuredProject.image && <img src={featuredProject.image} alt={featuredProject.title} className="pf-card-thumb" />}
                  <span className={`pf-card-cat-tag ct-${cc.cls}`}>{categoryLabel}</span>
                </div>
                <div className="pf-card-body">
                  <div className="pf-feat-badge" style={{ color: cc.color }}>Featured project</div>
                  <div className="pf-card-title">{featuredProject.title}</div>
                  <div className="pf-card-desc">{featuredProject.description}</div>
                  <div className="pf-card-foot">
                    <div className="pf-card-tags">
                      {(featuredProject.specs || []).slice(0, 4).map((tag, i) => (
                        <span key={i} className="pf-card-tag">{tag}</span>
                      ))}
                    </div>
                    <div className="pf-card-arrow">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" /></svg>
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      </section>

      {/* ── Filter Bar ── */}
      <div className="pf-filter-bar">
        <button
          className={`pf-filter-chip ${filter === 'All' ? 'active' : ''}`}
          onClick={() => setFilter('All')}
        >
          All <span className="pf-fc-count">{catCounts.All || 0}</span>
        </button>
        <div className="pf-filter-sep" />
        {categories.filter(c => c !== 'All').map(cat => {
          const cc = CAT_COLORS[cat]
          return (
            <button
              key={cat}
              className={`pf-filter-chip ${filter === cat ? 'active' : ''}`}
              onClick={() => setFilter(cat)}
            >
              <span className="pf-fc-dot" style={{ background: cc?.color || '#999' }} />
              {cat} <span className="pf-fc-count">{catCounts[cat] || 0}</span>
            </button>
          )
        })}
        <button className="pf-sort-btn" onClick={() => setSortDir(d => d === 'newest' ? 'oldest' : 'newest')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ transform: sortDir === 'oldest' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
            <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" />
          </svg>
          <span className="pf-sort-label">{sortDir === 'newest' ? 'Newest' : 'Oldest'}</span>
        </button>
      </div>

      {/* ── Portfolio Body ── */}
      <div className="pf-body">
        {bodyGroups.map((group, gi) => (
          <div key={group.year} className="pf-year-group" style={{ animationDelay: `${gi * 0.06}s` }}>
            <div className="pf-year-marker">
              <span className="pf-year-num">{yearLabel(group.year)}</span>
              <div className="pf-year-line" />
            </div>
            <div className="pf-card-grid">
              {group.projects.map((project) => {
                const cc = catColor(project.category)
                const categoryLabel = Array.isArray(project.category) ? project.category.join(' / ') : project.category
                return (
                  <div
                    key={project.id}
                    className="pf-card"
                    onClick={() => openDetail(project)}
                  >
                    <div className={`pf-card-img ci-${cc.cls} ${patternFor(project.id)}`}>
                      {project.image && <img src={project.image} alt={project.title} className="pf-card-thumb" />}
                      <span className={`pf-card-cat-tag ct-${cc.cls}`}>{categoryLabel}</span>
                      {project.year && <span className="pf-card-year-tag">{project.year}</span>}
                    </div>
                    <div className="pf-card-body">
                      <div className="pf-card-title">{project.title}</div>
                      <div className="pf-card-desc">{project.description}</div>
                      <div className="pf-card-foot">
                        <div className="pf-card-tags">
                          {(project.specs || []).slice(0, 4).map((tag, i) => (
                            <span key={i} className="pf-card-tag">{tag}</span>
                          ))}
                        </div>
                        <div className="pf-card-arrow">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" /></svg>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#777' }}>
            <p style={{ fontSize: 15 }}>No projects in this category yet.</p>
          </div>
        )}
      </div>

      <ProjectDetailModal />
    </div>
  )
}
