import { usePortfolio } from '../context/PortfolioContext'

export default function NavSidebar({ open, onClose }) {
  const { openPortfolio } = usePortfolio()

  const handlePortfolioClick = (e) => {
    e.preventDefault()
    onClose()
    openPortfolio()
  }

  const handleNavClick = (e, href) => {
    onClose()
    if (href === '#portfolio') {
      e.preventDefault()
      openPortfolio()
      return
    }
    // Let smooth scroll handle anchor links
    if (href.startsWith('#')) {
      e.preventDefault()
      const target = document.querySelector(href)
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <>
      {/* Overlay backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-[98] transition-opacity ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <nav className={`nav-sidebar ${open ? 'active' : ''}`}>
        <a href="#portfolio" onClick={(e) => handleNavClick(e, '#portfolio')}>Portfolio</a>
        <a href="#about" onClick={(e) => handleNavClick(e, '#about')}>About</a>
        <a href="#contact" onClick={(e) => handleNavClick(e, '#contact')}>Contact</a>
      </nav>
    </>
  )
}
