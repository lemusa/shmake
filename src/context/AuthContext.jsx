import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Email allowlist. Only this address can access admin.
 * Even if someone creates a Supabase account, they'll be bounced.
 *
 * When you need multiple users, move this to a Supabase 'admins' table
 * and query it on login.
 */
const ALLOWED_EMAILS = [
  import.meta.env.VITE_ADMIN_EMAIL,
].filter(Boolean)

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const isAllowed = (u) => {
    if (ALLOWED_EMAILS.length === 0) return true
    return ALLOWED_EMAILS.includes(u?.email?.toLowerCase())
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (s && isAllowed(s.user)) {
        setSession(s)
        setUser(s.user)
      } else if (s) {
        supabase.auth.signOut()
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        if (s && isAllowed(s.user)) {
          setSession(s)
          setUser(s.user)
          setError(null)
        } else {
          setSession(null)
          setUser(null)
          if (s) {
            supabase.auth.signOut()
            setError('Access denied. This account is not authorised.')
          }
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    setError(null)

    if (ALLOWED_EMAILS.length > 0 && !ALLOWED_EMAILS.includes(email.toLowerCase())) {
      setError('Access denied. This account is not authorised.')
      return { error: { message: 'Access denied' } }
    }

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      return { error: authError }
    }

    return { data }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, error, signIn, signOut, setError }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
