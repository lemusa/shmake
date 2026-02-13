import { useState, useEffect } from 'react'
import { loadProjects } from '../../data/projects'

export default function Dashboard() {
  const [data, setData] = useState(null)

  useEffect(() => {
    loadProjects().then(setData)
  }, [])

  if (!data) {
    return <p className="text-zinc-500">Loading portfolio data...</p>
  }

  const projectCount = data.projects.filter(p => p.id !== 0).length
  const categoryCount = data.categories.filter(c => c !== 'All').length
  const withImages = data.projects.filter(p => p.id !== 0 && p.image).length
  const withGallery = data.projects.filter(p => p.gallery?.length > 0).length

  const stats = [
    { label: 'Projects', value: projectCount, icon: '📁', color: 'orange' },
    { label: 'Categories', value: categoryCount, icon: '🏷️', color: 'blue' },
    { label: 'With Images', value: withImages, icon: '🖼️', color: 'emerald' },
    { label: 'With Gallery', value: withGallery, icon: '📸', color: 'purple' },
  ]

  const colorMap = {
    orange: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
  }

  // Group projects by category for the breakdown
  const byCategory = {}
  data.projects.filter(p => p.id !== 0).forEach(p => {
    const cats = Array.isArray(p.category) ? p.category : [p.category]
    cats.forEach(c => {
      byCategory[c] = (byCategory[c] || 0) + 1
    })
  })

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
      <p className="text-zinc-500 text-sm mb-8">Portfolio overview — data loaded from projects.json</p>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <div
            key={s.label}
            className={`rounded-xl border p-5 ${colorMap[s.color]}`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{s.icon}</span>
            </div>
            <p className="text-3xl font-bold mb-1">{s.value}</p>
            <p className="text-xs opacity-70 uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Category breakdown */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 mb-8">
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">
          Projects by Category
        </h2>
        <div className="space-y-3">
          {Object.entries(byCategory)
            .sort((a, b) => b[1] - a[1])
            .map(([cat, count]) => (
              <div key={cat} className="flex items-center gap-3">
                <span className="text-sm text-zinc-400 w-28 shrink-0">{cat}</span>
                <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500/60 rounded-full transition-all"
                    style={{ width: `${(count / projectCount) * 100}%` }}
                  />
                </div>
                <span className="text-sm text-zinc-500 w-8 text-right">{count}</span>
              </div>
            ))}
        </div>
      </div>

      {/* Quick links */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">
          Integration Status
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-zinc-400">Portfolio data loading from <code className="text-zinc-300 bg-zinc-800 px-1.5 py-0.5 rounded text-xs">projects.json</code></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-zinc-400">Supabase auth active</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-zinc-600" />
            <span className="text-zinc-500">Project CRUD — not yet connected</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-zinc-600" />
            <span className="text-zinc-500">Hero card editor — not yet connected</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-zinc-600" />
            <span className="text-zinc-500">About section editor — not yet connected</span>
          </div>
        </div>
      </div>
    </div>
  )
}
