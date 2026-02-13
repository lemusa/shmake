import { useAuth } from '../context/AuthContext'
import Login from './Login'

/**
 * Wrap your admin app content with this component.
 * If the user isn't authenticated, they see the login screen.
 * If they are, they see the children (your admin UI).
 *
 * Usage:
 *   <AuthGuard>
 *     <AdminDashboard />
 *   </AuthGuard>
 */
export default function AuthGuard({ children }) {
  const { user, loading } = useAuth()

  // Still checking session — show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-zinc-500 text-sm tracking-wide">Loading...</span>
        </div>
      </div>
    )
  }

  // Not logged in — show login
  if (!user) {
    return <Login />
  }

  // Authenticated — show admin
  return children
}
