import { useState, useEffect } from 'react'
import {
  Calculator,
  Activity,
  CalendarDays,
  BarChart3,
  Link2,
  Wrench,
  MonitorSmartphone,
} from 'lucide-react'
import { loadSiteContent, ABOUT_CONTENT as FALLBACK } from '../data/projects'

const SERVICE_ICONS = {
  Calculator,
  Activity,
  CalendarDays,
  BarChart3,
  Link2,
  Wrench,
}

export default function About() {
  const [about, setAbout] = useState(FALLBACK)
  useEffect(() => {
    loadSiteContent().then(sc => {
      setAbout({ ...FALLBACK, ...(sc.about || {}) })
    })
  }, [])

  const { youIf = [], services = [] } = about

  return (
    <section id="about" className="scroll-section about-split">
      {/* Top — problem recognition + device mockup */}
      <div className="about-split-top">
        <div className="about-split-inner youif-layout">
          <div className="youif-col">
            <div className="split-eyebrow">
              <span className="split-eyebrow-line" />
              <span className="split-eyebrow-text">This is you if…</span>
            </div>
            <ul className="problems-list">
              {youIf.slice(0, 6).map((text, i) => (
                <li key={i} className="problem-item">
                  <span className="problem-number" aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="problem-text">{text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="">
                <img src="assets/demo-splash.png" alt="" />
          </div>
        </div>
      </div>

      {/* Bottom — concrete things (dark full-bleed panel) */}
      <div className="about-split-bottom">
        <div className="about-split-inner">
          <div className="split-eyebrow split-eyebrow-dark">
            <span className="split-eyebrow-line" />
            <span className="split-eyebrow-text">What I'll build for you</span>
          </div>
          <h2 className="concrete-headline">
            Concrete things.{' '}
            <span className="concrete-headline-accent">Shipped and used.</span>
          </h2>
          <div className="services-grid-dark">
            {services.slice(0, 6).map(s => {
              const Icon = SERVICE_ICONS[s.icon] || Wrench
              return (
                <div key={s.title} className="service-card-dark">
                  <div className="service-card-dark-icon" aria-hidden="true">
                    <Icon size={22} strokeWidth={1.75} />
                  </div>
                  <h4 className="service-card-dark-title">{s.title}</h4>
                  <p className="service-card-dark-body">{s.outcome}</p>
                </div>
              )
            })}
          </div>
          <div className="platform-note">
            <div className="platform-note-icon" aria-hidden="true">
              <MonitorSmartphone size={22} strokeWidth={1.75} />
            </div>
            <div className="platform-note-body">
              <span className="platform-note-title">Built as Progressive Web Apps.</span>
              <span className="platform-note-text">
                Runs on phone, tablet, laptop, shop-floor terminal — anything with a browser. No hardware upgrades, no app-store approvals, no per-seat licences. Just a link.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
