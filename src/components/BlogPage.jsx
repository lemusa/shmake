import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { loadBlogPosts } from '../data/blog'
import SEO from './SEO'

const CATEGORIES = ['All', 'Project', 'Thinking']

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-NZ', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

export default function BlogPage() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.body.style.overflow = 'auto'
    loadBlogPosts().then(data => { setPosts(data); setLoading(false) })
    return () => { document.body.style.overflow = '' }
  }, [])

  const filtered = filter === 'All' ? posts : posts.filter(p => p.category === filter)

  if (loading) {
    return (
      <div className="pf-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 36, height: 36, border: '2px solid #E8751A', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#777', fontSize: 14 }}>Loading posts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pf-page">
      <SEO
        title="Blog — SHMAKE"
        description="Thoughts on building software, operations management, and making things. By Sam Haughey from Christchurch, NZ."
        path="/blog"
      />

      {/* Top Bar — same pattern as portfolio */}
      <nav className="pf-top-bar">
        <div className="pf-top-left">
          <a href="/" className="pf-logo" onClick={e => { e.preventDefault(); navigate('/') }}>
            <img src="/assets/shmake-logo-light.png" alt="SHMAKE" className="pf-logo-img" />
          </a>
          <span className="pf-bc-sep">›</span>
          <span className="pf-bc-page">Blog</span>
        </div>
        <button className="pf-close-btn" onClick={() => navigate('/')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </nav>

      {/* Hero */}
      <section className="pf-hero">
        <div className="pf-hero-inner" style={{ display: 'block' }}>
          <div className="pf-hero-eyebrow">Writing things down</div>
          <h1 className="pf-hero-h1">Blog</h1>
          <p className="pf-hero-sub">
            Project write-ups, lessons learned, and thoughts on building things.
          </p>
        </div>
      </section>

      {/* Filter */}
      <div className="pf-filter-bar">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`pf-filter-chip ${filter === cat ? 'active' : ''}`}
            onClick={() => setFilter(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Posts */}
      <div className="blog-body">
        {filtered.map(post => (
          <Link to={`/blog/${post.slug}`} key={post.id} className="blog-card">
            {post.image && (
              <div className="blog-card-img">
                <img src={post.image} alt={post.title} />
              </div>
            )}
            <div className="blog-card-content">
              <div className="blog-card-meta">
                <span className="blog-card-cat">{post.category}</span>
                <span className="blog-card-date">{formatDate(post.published_at)}</span>
                <span className="blog-card-read">{post.reading_time} min read</span>
              </div>
              <h2 className="blog-card-title">{post.title}</h2>
              <p className="blog-card-excerpt">{post.excerpt}</p>
              <div className="blog-card-tags">
                {post.tags.map(tag => (
                  <span key={tag} className="blog-card-tag">{tag}</span>
                ))}
              </div>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#777' }}>
            <p style={{ fontSize: 15 }}>No posts in this category yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
