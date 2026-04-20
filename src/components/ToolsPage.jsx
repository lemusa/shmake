import { TOOLS } from '../data/tools'
import SEO from './SEO'

export default function ToolsPage() {
  return (
    <>
      <SEO
        title="Free Tools — SHMAKE"
        description="Free calculators, planners and utilities built to scratch an itch. PAYE calculator, loan calculator, cut-list optimiser and more. No sign-up, no fuss."
        path="/tools"
      />
      <div className="tools-page">
        <header className="tools-page-header">
          <a href="/" className="tools-page-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            <span>shmake.co.nz</span>
          </a>
          <img src="/assets/shmake-logo-light.png" alt="SHMAKE" className="tools-page-logo logo-light" />
          <img src="/assets/shmake-logo-dark.png" alt="SHMAKE" className="tools-page-logo logo-dark" />
        </header>

        <main className="tools-page-main">
          <div className="tools-page-intro">
            <h1 className="tools-page-title">Free tools</h1>
            <p className="tools-page-sub">
              Small utilities I've built to scratch my own itches. Same approach I take to bigger problems — if the tool doesn't exist, I build it. No sign-up, no fuss.
            </p>
          </div>

          <div className="tools-page-grid">
            {TOOLS.map(tool => {
              const isLink = tool.href && tool.href !== '#'
              return (
                <article key={tool.key} className="tools-page-card">
                  <div>
                    <h2 className="tools-page-card-name">{tool.name}</h2>
                    <p className="tools-page-card-tagline">{tool.tagline}</p>
                  </div>
                  {isLink ? (
                    <a
                      href={tool.href}
                      className="tools-page-card-cta"
                      {...(tool.external ? { target: '_blank', rel: 'noopener' } : {})}
                    >
                      Try it →
                    </a>
                  ) : (
                    <span className="tools-page-card-cta tools-page-card-cta-disabled">
                      Coming soon
                    </span>
                  )}
                </article>
              )
            })}
          </div>
        </main>
      </div>
    </>
  )
}
