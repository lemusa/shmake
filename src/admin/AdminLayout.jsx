import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import UserMenu from './UserMenu'
import Dashboard from './pages/Dashboard'

/**
 * Admin shell — sidebar nav + routed content area.
 *
 * Add new admin pages by:
 *  1. Creating a component in admin/pages/
 *  2. Adding a NavLink below
 *  3. Adding a Route in the Routes block
 */

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: '📊', end: true },
  { to: '/admin/projects', label: 'Projects', icon: '📁' },
  { to: '/admin/hero', label: 'Hero Cards', icon: '🃏' },
  { to: '/admin/about', label: 'About', icon: '👤' },
  { to: '/admin/settings', label: 'Settings', icon: '⚙️' },
]

function Placeholder({ title }) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <p className="text-zinc-500 text-lg mb-2">{title}</p>
        <p className="text-zinc-600 text-sm">Coming soon — wire up to portfolio data layer</p>
      </div>
    </div>
  )
}

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-zinc-900/50 border-r border-zinc-800 flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-zinc-800">
          <a href="/" className="text-lg font-bold tracking-wide text-zinc-100 no-underline hover:text-orange-400 transition-colors">
            SHMAKE <span className="text-zinc-500 font-normal text-sm">Admin</span>
          </a>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors no-underline ${
                  isActive
                    ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-transparent'
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer link */}
        <div className="px-5 py-4 border-t border-zinc-800">
          <a
            href="/"
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors no-underline flex items-center gap-2"
          >
            ← Back to site
          </a>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 shrink-0 border-b border-zinc-800 flex items-center justify-between px-6">
          <div />
          <UserMenu />
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="projects" element={<Placeholder title="Projects Manager" />} />
            <Route path="hero" element={<Placeholder title="Hero Card Editor" />} />
            <Route path="about" element={<Placeholder title="About Section Editor" />} />
            <Route path="settings" element={<Placeholder title="Settings" />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
