import { lazy, Suspense } from 'react'
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
