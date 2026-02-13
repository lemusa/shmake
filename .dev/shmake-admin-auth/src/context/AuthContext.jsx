import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Allowed admin emails.
 * Only these addresses can access the admin panel — even if someone
 * manages to create a Supabase account, they'll be bounced at the gate.
 *
 * TODO: When you add more users, move this to a Supabase 'admins' table
 * and query it on login instead of hard-coding here.
 */
const ALLOWED_EMAILS = [
  import.meta.env.VITE_ADMIN_EMAIL, // set in .env
].filter(Boolean)

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (s && isAllowed(s.user)) {
        setSession(s)
        setUser(s.user)
      } else if (s) {
        // Logged in but not allowed — sign them out
        supabase.auth.signOut()
      }
      setLoading(false)
    })

    // Listen for auth changes
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
            // Someone authenticated but isn't in the allowlist
            supabase.auth.signOut()
            setError('Access denied. This account is not authorised for admin access.')
          }
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const isAllowed = (user) => {
    if (ALLOWED_EMAILS.length === 0) return true // no restriction if env not set
    return ALLOWED_EMAILS.includes(user?.email?.toLowerCase())
  }

  const signIn = async (email, password) => {
    setError(null)

    // Pre-check the allowlist before even hitting Supabase
    if (ALLOWED_EMAILS.length > 0 && !ALLOWED_EMAILS.includes(email.toLowerCase())) {
      setError('Access denied. This account is not authorised for admin access.')
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
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
