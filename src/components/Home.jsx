import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TOOLS } from '../data/tools'
import { usePortfolio } from '../context/PortfolioContext'

const FLAGSHIP_SLIDES = [
  {
    key: 'mymeca',
    category: 'Healthcare',
    name: 'myMECA',
    logo: 'assets/logo-mymeca.png',
    tagline: 'Nurse pay calculator for NZ MECAs.',
    stat: 'Take-home, overtime & allowances — in one place.',
    brand: '#24acdd',
    brandRgba: [36, 172, 221],
    bgImage: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&q=80',
    art: 'assets/splash_mymeca_desktop.png',
    primaryHref: 'https://app.mymeca.nz',
    primaryLabel: 'Open app →',
    learnHref: '/portfolio',
    external: true,
  },
  {
    key: 'kiwislice',
    category: 'Personal Finance',
    name: 'KiwiSlice',
    logo: 'assets/kiwislice-logo.svg',
    tagline: 'Personal finance PWA for NZ users.',
    stat: 'Budgets, loans & PAYE — built for Aotearoa.',
    brand: '#5a9e3a',
    brandRgba: [90, 158, 58],
    bgImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&q=80',
    art: 'assets/splash_kiwislice_desktop.png',
    primaryHref: 'https://kiwislice.shmake.nz',
    primaryLabel: 'Open app →',
    learnHref: '/portfolio',
    external: true,
  },
  {
    key: 'teabreak',
    category: 'Business Ops',
    name: 'TeaBreak',
    logo: 'assets/logo-teabreak.png',
    tagline: 'Business operations app in development.',
    stat: "A simple solution for the pesky admin tasks small business owners don't have time to think about.",
    brand: '#64748b',
    brandRgba: [100, 116, 139],
    bgImage: 'https://images.unsplash.com/photo-1582489853490-cd3a53eb4530?w=1200&q=80',
    art: 'assets/splash_teabreak_desktop.png',
    primaryHref: '#',
    primaryLabel: 'Coming soon',
    learnHref: '/portfolio',
    soon: true,
  },
]

function FlagshipCarousel() {
  const [index, setIndex] = useState(0)
  const timerRef = useRef(null)
  const navigate = useNavigate()
  const { projects, openDetail } = usePortfolio()

  const handleLearnMore = (slide) => (e) => {
    const match = projects.find(p => p.title?.toLowerCase() === slide.name.toLowerCase())
    if (match) {
      e.preventDefault()
      openDetail(match)
    } else if (slide.learnHref?.startsWith('/')) {
      e.preventDefault()
      navigate(slide.learnHref)
    }
  }

  const scheduleNext = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setIndex(i => (i + 1) % FLAGSHIP_SLIDES.length)
    }, 6000)
  }, [])

  useEffect(() => {
    scheduleNext()
    return () => clearInterval(timerRef.current)
  }, [scheduleNext])

  const goTo = i => {
    setIndex(i)
    scheduleNext()
  }

  const slide = FLAGSHIP_SLIDES[index]
  const [r, g, b] = slide.brandRgba
  const cardStyle = {
    '--brand': slide.brand,
    '--brand-rgba-88': `rgba(${r}, ${g}, ${b}, 0.88)`,
    '--brand-rgba-78': `rgba(${r}, ${g}, ${b}, 0.78)`,
    '--bg-image': `url('${slide.bgImage}')`,
  }

  return (
    <section
      className="flagship-carousel"
      style={cardStyle}
      aria-roledescription="carousel"
      aria-label="Flagship apps"
    >
      <div className="flagship-divider">
        <span className="flagship-label">Flagship apps</span>
        <hr className="flagship-hr" />
      </div>
      <div className="flagship-card">
        <div className="flagship-content" key={slide.key}>
          <span className="flagship-cat">{slide.category}</span>
          <h3 className="flagship-name">
            <img src={slide.logo} alt={slide.name} className="flagship-logo" />
          </h3>
          <p className="flagship-tagline">{slide.tagline}</p>
          <p className="flagship-stat">{slide.stat}</p>
          <div className="flagship-actions">
            <div className="flagship-ctas">
              {slide.soon ? (
                <span className="flagship-cta-primary flagship-cta-disabled">
                  {slide.primaryLabel}
                </span>
              ) : (
                <a
                  className="flagship-cta-primary"
                  href={slide.primaryHref}
                  {...(slide.external ? { target: '_blank', rel: 'noopener' } : {})}
                >
                  {slide.primaryLabel}
                </a>
              )}
              <a className="flagship-cta-ghost" href={slide.learnHref} onClick={handleLearnMore(slide)}>
                Learn more
              </a>
            </div>
          </div>
        </div>
        <div className="flagship-art" aria-hidden="true">
          {slide.art ? (
            <img key={slide.key} src={slide.art} alt="" />
          ) : (
            <div className="flagship-art-placeholder" />
          )}
        </div>
        <div className="flagship-dots" role="tablist" aria-label="Select flagship app">
          {FLAGSHIP_SLIDES.map((s, i) => (
            <button
              key={s.key}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={s.name}
              className={`flagship-dot ${i === index ? 'active' : ''}`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function FreeToolsShelf() {
  return (
    <section className="free-tools-shelf" aria-label="Free tools">
      <div className="free-tools-divider">
        <span className="free-tools-label">Free tools</span>
        <hr className="free-tools-hr" />
      </div>
      <div className="free-tools-grid">
        {TOOLS.map(tool => {
          const isLink = tool.href && tool.href !== '#'
          const Icon = tool.Icon
          return (
            <a
              key={tool.key}
              href={tool.href}
              className={`tool-tile ${isLink ? '' : 'tool-tile-disabled'}`}
              style={{ '--tile-color': tool.dotColor }}
              {...(tool.external ? { target: '_blank', rel: 'noopener' } : {})}
            >
              <div
                className="tool-tile-bg"
                style={tool.bgImage ? { backgroundImage: `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.55)), url(${tool.bgImage})` } : undefined}
              />
              <div className="tool-tile-body">
                {Icon && (
                  <span className="tool-tile-icon" aria-hidden="true">
                    <Icon size={28} strokeWidth={1.5} />
                  </span>
                )}
                <span className="tool-tile-cat">{tool.category}</span>
                <h4 className="tool-tile-name">{tool.name}</h4>
                <p className="tool-tile-tagline">{tool.tagline}</p>
                <span className="tool-tile-arrow">{isLink ? '→' : 'soon'}</span>
              </div>
            </a>
          )
        })}
      </div>
    </section>
  )
}

export default function Home() {
  const scrollToAbout = useCallback(e => {
    e.preventDefault()
    const target = document.querySelector('#about')
    const sc = document.querySelector('.scroll-container')
    if (target && sc) sc.scrollTo({ top: target.offsetTop, behavior: 'smooth' })
  }, [])

  const scrollToContact = useCallback(e => {
    e.preventDefault()
    const target = document.querySelector('#contact')
    const sc = document.querySelector('.scroll-container')
    if (target && sc) sc.scrollTo({ top: target.offsetTop, behavior: 'smooth' })
  }, [])

  return (
    <section className="home-page scroll-section" id="home">
      <h1 className="sr-only">SHMAKE — Custom Software for Manufacturers by Sam Haughey</h1>

      {/* Mobile-only full intro panel (hidden on desktop) */}
      <div className="home-mobile-intro">
        <img
          src="assets/shmake-logo-light.png"
          alt="SHMAKE"
          className="home-mobile-intro-logo"
        />
        <h2 className="home-mobile-intro-headline">
          Custom software for manufacturers.<br />
          Built by one.
        </h2>
        <p className="home-mobile-intro-tagline">
          Spreadsheets and workarounds got you here. I build what comes next — custom software for manufacturers, priced for your size.
        </p>
        <div className="home-mobile-intro-ctas">
          <a href="#contact" onClick={scrollToContact} className="home-mobile-intro-cta">
            Tell me what's broken →
          </a>
          <a href="/portfolio" className="home-mobile-intro-cta-secondary">
            See what I've built →
          </a>
        </div>
      </div>

      {/* Desktop intro band — headline + role + CTA, all left-aligned */}
      <div className="home-intro-bar">
        <div className="home-intro-text">
          <h2 className="home-intro-headline">
            Custom software for manufacturers.<br />
            Built by one.
          </h2>
          <p className="home-intro-role">
            Spreadsheets, whiteboards, and one person who knows everything — your business has outgrown them. I build custom tools for manufacturers, at a price that makes sense for your size.
          </p>
          <div className="home-intro-cta-row">
            <a href="#contact" onClick={scrollToContact} className="home-intro-cta">
              Tell me what's broken →
            </a>
            <a href="/portfolio" className="home-intro-cta-secondary">
              See what I've built →
            </a>
          </div>
        </div>
      </div>

      {/* Flagship carousel + Free tools shelf — side-by-side on desktop */}
      <div className="home-main">
        <FlagshipCarousel />
        <FreeToolsShelf />
      </div>

      {/* Scroll cue sits in the bottom whitespace */}
      <button
        type="button"
        className="home-scroll-cue"
        onClick={scrollToAbout}
        aria-label="Scroll down"
      >
        <span className="home-scroll-cue-chev" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>
    </section>
  )
}
