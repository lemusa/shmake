import { useState, useEffect, useCallback } from 'react'
import { ArrowRight } from 'lucide-react'
import { loadSiteContent, ABOUT_CONTENT as FALLBACK } from '../data/projects'

export default function WhyMe() {
  const [about, setAbout] = useState(FALLBACK)
  useEffect(() => {
    loadSiteContent().then(sc => {
      setAbout({ ...FALLBACK, ...(sc.about || {}) })
    })
  }, [])

  const {
    name,
    photo,
    tagline,
    taglineSub,
    bio = [],
    comparison = [],
    ctaHeading,
    ctaBody,
    ctaLabel,
  } = about

  const scrollToContact = useCallback(e => {
    e.preventDefault()
    const target = document.querySelector('#contact')
    const sc = document.querySelector('.scroll-container')
    if (target && sc) sc.scrollTo({ top: target.offsetTop, behavior: 'smooth' })
  }, [])

  // Lead paragraph is bio[1] in the original structure — show first, then the rest.
  const leadPara = bio[1]
  const restParas = bio.filter((_, i) => i !== 1)

  return (
    <section id="whyme" className="scroll-section whyme-page">
      {/* Top: bio + comparison (theme bg) */}
      <div className="whyme-top">
        <div className="whyme-inner">
          <div className="whyme-bio-grid">
            <div className="whyme-bio-content">
              <div className="split-eyebrow">
                <span className="split-eyebrow-line" />
                <span className="split-eyebrow-text">About me</span>
              </div>
              <h2 className="whyme-bio-name">{name}</h2>
              {leadPara && <p className="whyme-bio-lead">{leadPara}</p>}
              {restParas.map((p, i) => (
                <p key={i} className="whyme-bio-para">{p}</p>
              ))}
            </div>
            <div className="whyme-bio-sidebar">
              {photo && (
                <div className="whyme-bio-photo">
                  <img src={photo} alt={name} />
                </div>
              )}
              {tagline && (
                <div className="whyme-bio-tagline">
                  <p className="whyme-bio-tagline-main">{tagline}</p>
                  {taglineSub && (
                    <p className="whyme-bio-tagline-sub">{taglineSub}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {comparison.length > 0 && (
            <div className="whyme-compare-sub">
              <div className="split-eyebrow">
                <span className="split-eyebrow-line" />
                <span className="split-eyebrow-text">Why me</span>
              </div>
              <div className="compare-grid">
                {comparison.slice(0, 3).map(c => (
                  <div key={c.heading} className="compare-card">
                    <span className="compare-card-accent" aria-hidden="true" />
                    <span className="compare-card-eyebrow">{c.heading}</span>
                    <h3 className="compare-card-headline">
                      {c.headline || c.heading}
                    </h3>
                    <p className="compare-card-body">{c.body}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom: orange CTA */}
      {ctaHeading && (
        <div className="whyme-cta">
          <div className="whyme-cta-inner">
            <h2 className="whyme-cta-heading">{ctaHeading}</h2>
            {ctaBody && <p className="whyme-cta-body">{ctaBody}</p>}
            <a
              href="#contact"
              onClick={scrollToContact}
              className="whyme-cta-btn"
            >
              {ctaLabel || "Let's talk"}
              <ArrowRight size={18} strokeWidth={2.5} />
            </a>
          </div>
        </div>
      )}
    </section>
  )
}
