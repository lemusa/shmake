import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

/**
 * Drop this into your admin header.
 * Shows the logged-in user's email and a sign-out option.
 */
export default function UserMenu() {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (!user) return null

  const initial = (user.email || '?')[0].toUpperCase()

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(prev => !prev)}
        className="w-9 h-9 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 font-bold text-sm flex items-center justify-center cursor-pointer hover:bg-orange-500/25 transition-colors"
        title={user.email}
      >
        {initial}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-zinc-800">
            <p className="text-xs text-zinc-500 m-0">Signed in as</p>
            <p className="text-sm text-zinc-200 m-0 truncate">{user.email}</p>
          </div>
          <button
            onClick={() => { setOpen(false); signOut() }}
            className="w-full text-left px-4 py-3 text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 transition-colors cursor-pointer bg-transparent border-0"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
