import { useAuth } from '../context/AuthContext'
import Login from './Login'

export default function AuthGuard({ children }) {
  const { user, loading } = useAuth()

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

  if (!user) return <Login />

  return children
}
