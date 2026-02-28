import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { loadBlogPost, loadBlogPosts } from '../data/blog'
import DOMPurify from 'dompurify'
import SEO from './SEO'

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-NZ', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

export default function BlogPostPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [allPosts, setAllPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.body.style.overflow = 'auto'
    window.scrollTo(0, 0)
    Promise.all([loadBlogPost(slug), loadBlogPosts()]).then(([p, all]) => {
      setPost(p)
      setAllPosts(all)
      setLoading(false)
    })
    return () => { document.body.style.overflow = '' }
  }, [slug])

  if (loading) {
    return (
      <div className="pf-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 36, height: 36, border: '2px solid #E8751A', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#777', fontSize: 14 }}>Loading...</p>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="pf-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#f0ede8', fontSize: 20, marginBottom: 16 }}>Post not found</p>
          <Link to="/blog" style={{ color: '#E8751A' }}>Back to blog</Link>
        </div>
      </div>
    )
  }

  // Find previous and next posts
  const currentIndex = allPosts.findIndex(p => p.slug === slug)
  const prevPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null
  const nextPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null

  return (
    <div className="pf-page">
      <SEO
        title={`${post.title} — SHMAKE`}
        description={post.excerpt}
        path={`/blog/${post.slug}`}
      />

      {/* BlogPosting structured data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.excerpt,
        datePublished: post.published_at,
        author: { '@type': 'Person', name: 'Sam Haughey', url: 'https://shmake.nz' },
        publisher: { '@type': 'Organization', name: 'SHMAKE', url: 'https://shmake.nz' },
        mainEntityOfPage: `https://shmake.nz/blog/${post.slug}`,
        ...(post.image ? { image: `https://shmake.nz${post.image}` } : {}),
      }) }} />

      {/* Top Bar */}
      <nav className="pf-top-bar">
        <div className="pf-top-left">
          <a href="/" className="pf-logo" onClick={e => { e.preventDefault(); navigate('/') }}>
            <img src="/assets/shmake-logo-light.png" alt="SHMAKE" className="pf-logo-img" />
          </a>
          <span className="pf-bc-sep">›</span>
          <Link to="/blog" className="pf-bc-page" style={{ textDecoration: 'none', color: 'inherit' }}>Blog</Link>
        </div>
        <button className="pf-close-btn" onClick={() => navigate('/blog')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </nav>

      {/* Article */}
      <article className="blog-article">
        <header className="blog-article-header">
          <div className="blog-card-meta" style={{ justifyContent: 'center' }}>
            <span className="blog-card-cat">{post.category}</span>
            <span className="blog-card-date">{formatDate(post.published_at)}</span>
            <span className="blog-card-read">{post.reading_time} min read</span>
          </div>
          <h1 className="blog-article-title">{post.title}</h1>
          {post.tags.length > 0 && (
            <div className="blog-card-tags" style={{ justifyContent: 'center' }}>
              {post.tags.map(tag => (
                <span key={tag} className="blog-card-tag">{tag}</span>
              ))}
            </div>
          )}
        </header>

        {post.image && (
          <div className="blog-article-hero">
            <img src={post.image} alt={post.title} />
          </div>
        )}

        <div
          className="blog-article-content"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
        />

        {/* Prev / Next Navigation */}
        {(prevPost || nextPost) && (
          <nav className="blog-nav">
            {prevPost ? (
              <Link to={`/blog/${prevPost.slug}`} className="blog-nav-link blog-nav-prev">
                <span className="blog-nav-label">Previous</span>
                <span className="blog-nav-title">{prevPost.title}</span>
              </Link>
            ) : <div />}
            {nextPost ? (
              <Link to={`/blog/${nextPost.slug}`} className="blog-nav-link blog-nav-next">
                <span className="blog-nav-label">Next</span>
                <span className="blog-nav-title">{nextPost.title}</span>
              </Link>
            ) : <div />}
          </nav>
        )}
      </article>
    </div>
  )
}
