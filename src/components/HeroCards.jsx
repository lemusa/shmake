import { useState, useEffect, useCallback } from 'react'
import { loadHeroCards, HERO_CARDS as FALLBACK } from '../data/projects'

export default function HeroCards() {
  const [expanded, setExpanded] = useState(true)
  const [cards, setCards] = useState(FALLBACK)

  useEffect(() => { loadHeroCards().then(setCards) }, [])

  const handleMouseEnter = useCallback(() => {
    setExpanded(false)
  }, [])

  const handleLinkClick = (e, card) => {
    if (card.isInternal && card.linkHref === '#portfolio') {
      e.preventDefault()
      window.location.href = '/portfolio'
    }
  }

  return (
    <section className="hero-cards scroll-section" id="projects">
      <div className="card-container">
        {cards.map((card, i) => (
          <div
            key={card.key}
            className={`hero-card ${i === 0 && expanded ? 'initially-expanded' : ''}`}
            onMouseEnter={handleMouseEnter}
          >
            <div
              className="card-bg"
              style={{ backgroundImage: card.bgStyle }}
            />
            <div className="card-body">
              <h2 className="card-title">{card.title}</h2>
              <div className="card-logo">
                <img src={card.logo} alt={`${card.title} logo`} />
              </div>
              <div className="card-details">
                <div className="card-screenshot">
                  <img src={card.screenshot} alt={card.title} />
                </div>
                <p dangerouslySetInnerHTML={{ __html: card.description }} />
                <a
                  href={card.linkHref}
                  className="card-link"
                  onClick={(e) => handleLinkClick(e, card)}
                  {...(!card.isInternal ? { target: '_blank', rel: 'noopener' } : {})}
                >
                  {card.linkText}
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
