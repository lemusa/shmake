import { lazy, Suspense, useRef } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { PortfolioProvider } from './context/PortfolioContext'
import PublicSite from './PublicSite'

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

const btnStyle = { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '6px 12px', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.3)', cursor: 'pointer' }
const headerStyle = { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: '1px solid #2a2a2a' }
const labelStyle = { background: 'linear-gradient(135deg, #d97706, #ea580c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }

function EmbedPage({ title, src, homeLabel }) {
  const iframeRef = useRef(null)
  return (
    <div style={{ height: '100vh', background: '#0a0a0a', position: 'relative' }}>
      <header style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <a href="/" style={btnStyle}>← shmake</a>
          <a href="/" style={{ height: 28, display: 'flex', alignItems: 'center' }}>
            <img src="/assets/shmake-logo-light.png" alt="SHMAKE" style={{ height: '100%', width: 'auto' }} />
          </a>
        </div>
        <span style={labelStyle}>{title}</span>
        <button onClick={() => { if (iframeRef.current) iframeRef.current.src = src }} style={btnStyle}>{homeLabel || 'Home'}</button>
      </header>
      <iframe ref={iframeRef} src={src} style={{ position: 'absolute', top: 52, left: 0, right: 0, bottom: 0, border: 'none', width: '100%', height: 'calc(100vh - 52px)' }} title={title} />
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

        {/* Client portal — embedded iframe */}
        <Route path="/portal" element={<EmbedPage title="Client Portal" src="https://portal.shmake.nz" homeLabel="Portal Home" />} />

        {/* Client demo — embedded iframe */}
        <Route path="/demo" element={<EmbedPage title="Client Portal Demo" src="https://demo.shmake.nz" homeLabel="Demo Home" />} />

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
