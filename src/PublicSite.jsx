import { useState, useEffect } from 'react'
import Header from './components/Header'
import NavSidebar from './components/NavSidebar'
import HeroCards from './components/HeroCards'
import About from './components/About'
import Contact from './components/Contact'
import Footer from './components/Footer'
import PortfolioOverlay from './components/PortfolioOverlay'
import ProjectDetailModal from './components/ProjectDetailModal'
import SEO from './components/SEO'

export default function App() {
  const [navOpen, setNavOpen] = useState(false)

  useEffect(() => {
    if (window.location.hash) {
      const el = document.querySelector(window.location.hash)
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    }
  }, [])

  return (
    <>
      <SEO
        title="SHMAKE — Software & Product Development, Christchurch NZ"
        description="Custom software and product development by Sam Haughey. Building tools like myMECA, TeaBreak, and shmakeCut from Christchurch, New Zealand."
        path="/"
      />
      <Header navOpen={navOpen} setNavOpen={setNavOpen} />
      <NavSidebar open={navOpen} onClose={() => setNavOpen(false)} />

      <div className="scroll-container">
        <main>
          <HeroCards />
          <About />
          <Contact />
          <Footer />
        </main>
      </div>

      {/* Mobile bottom bar */}
      <nav className="mobile-bottom-bar">
        <a href="/portal" className="mbb-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <span>Portal</span>
        </a>
        <a href="/demo" className="mbb-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="5,3 19,12 5,21"/></svg>
          <span>Demo</span>
        </a>
        <a href="#contact" className="mbb-item" onClick={e => { e.preventDefault(); document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          <span>Contact</span>
        </a>
      </nav>

      <PortfolioOverlay />
      <ProjectDetailModal />
    </>
  )
}
