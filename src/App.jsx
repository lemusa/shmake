import { lazy, Suspense, useRef } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { PortfolioProvider } from './context/PortfolioContext'
import PublicSite from './PublicSite'
import PortfolioPage from './components/PortfolioPage'
import SEO from './components/SEO'

// Admin is lazy-loaded — public visitors never download this code
const AdminApp = lazy(() => import('./admin/AdminApp'))

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-zinc-500 text-sm tracking-wide">Loading...</span>
      </div>
    </div>
  )
}

function EmbedPage({ title, src, badge, seoTitle, seoDescription, seoPath }) {
  const iframeRef = useRef(null)
  return (
    <div style={{ height: '100vh', background: '#0a0a0a', display: 'flex', flexDirection: 'column' }}>
      {seoPath && <SEO title={seoTitle || title} description={seoDescription} path={seoPath} />}
      <header className="embed-header">
        <div className="embed-header-left">
          <a href="/" className="embed-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            <span className="embed-back-text">shmake.co.nz</span>
          </a>
        </div>
        <div className="embed-header-center">
          <img src="/assets/shmake-logo-light.png" alt="SHMAKE" className="embed-logo-img" />
          <span className="embed-badge">{badge || title}</span>
        </div>
        <div className="embed-header-right">
          <button onClick={() => { if (iframeRef.current) iframeRef.current.src = src }} className="embed-home-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <span className="embed-home-text">{badge || title} Home</span>
          </button>
        </div>
      </header>
      <iframe ref={iframeRef} src={src} style={{ flex: 1, border: 'none', width: '100%' }} title={title} />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public portfolio — all existing behaviour intact */}
        <Route
          path="/"
          element={
            <ThemeProvider>
              <PortfolioProvider>
                <PublicSite />
              </PortfolioProvider>
            </ThemeProvider>
          }
        />

        {/* Portfolio — full page */}
        <Route
          path="/portfolio"
          element={
            <PortfolioProvider>
              <PortfolioPage />
            </PortfolioProvider>
          }
        />

        {/* Client portal — embedded iframe */}
        <Route path="/portal" element={<EmbedPage title="Client Portal" src="https://portal.shmake.nz" badge="Portal" seoTitle="Client Portal — SHMAKE" seoDescription="Secure client portal for SHMAKE project access, updates, and collaboration." seoPath="/portal" />} />

        {/* Client demo — embedded iframe */}
        <Route path="/demo" element={<EmbedPage title="Client Portal Demo" src="https://demo.shmake.nz" badge="Demo" seoTitle="Client Demo — SHMAKE" seoDescription="Try a live demo of SHMAKE's client portal and see what we can build for your business." seoPath="/demo" />} />

        {/* Admin — lazy-loaded, auth-guarded */}
        <Route
          path="/admin/*"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <AdminApp />
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
