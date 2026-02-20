import { useState, useEffect } from 'react'
import { loadSiteContent, ABOUT_CONTENT as FALLBACK } from '../data/projects'

export default function About() {
  const [about, setAbout] = useState(FALLBACK)
  useEffect(() => { loadSiteContent().then(sc => setAbout(sc.about)) }, [])
  const { name, photo, tagline, taglineSub, bio, skills } = about

  return (
    <section
      className="min-h-screen px-6 md:px-8 py-16 flex flex-col justify-center scroll-section"
      style={{ background: 'var(--bg)' }}
      id="about"
    >
      <div className="max-w-[1100px] mx-auto w-full">
        <h1 className="text-3xl md:text-5xl font-bold mb-8 tracking-tight text-center">
          {name}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-10 items-start">
          {/* Main content */}
          <div className="flex flex-col gap-8">
            <div className="about-story">
              {bio.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
              <a
                href="/portfolio"
                className="inline-block font-semibold text-accent hover:underline transition-all"
              >
                View my portfolio →
              </a>
            </div>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col md:sticky md:top-20 gap-4 md:flex-col max-md:flex-row max-md:order-first">
            <div className="aspect-square rounded-2xl overflow-hidden border border-[var(--border)] max-md:w-[120px] max-md:h-[120px] max-md:shrink-0" style={{ background: 'var(--card-bg)' }}>
              <img src={photo} alt={name} className="w-full h-full object-cover" />
            </div>
            <div className="about-tagline-card max-md:flex-1 max-md:flex max-md:flex-col max-md:justify-center">
              <p className="text-[1.05rem] font-semibold leading-snug mb-2 relative" style={{ color: 'var(--text)' }}>
                {tagline}
              </p>
              <p className="text-sm italic m-0" style={{ color: 'var(--text-secondary)' }}>
                {taglineSub}
              </p>
            </div>
          </div>
        </div>

        {/* Skills grid */}
        <div className="mt-10 pt-8 border-t border-[var(--border)] max-w-[1100px] mx-auto">
          <h3 className="text-center text-lg font-semibold mb-5" style={{ color: 'var(--text)' }}>
            Things I've gotten curious about
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {skills.map(cat => (
              <div key={cat.title} className="text-left">
                <h4 className="text-sm font-semibold mb-2 text-accent">{cat.title}</h4>
                <ul className="list-none">
                  {cat.items.map(item => (
                    <li key={item} className="skill-cat-item">{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
