import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { signIn, error, setError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    await signIn(email, password)
    setSubmitting(false)
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-eyebrow">
          <span className="admin-login-eyebrow-line" />
          <span className="admin-login-eyebrow-text">Admin</span>
        </div>

        <h1 className="admin-login-headline">Sign in.</h1>
        <p className="admin-login-sub">Restricted.</p>

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="contact-field">
            <label className="contact-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null) }}
              required
              autoComplete="email"
              autoFocus
              className="form-input"
              placeholder="you@example.com"
            />
          </div>

          <div className="contact-field">
            <label className="contact-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null) }}
              required
              autoComplete="current-password"
              className="form-input"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="admin-login-error">
              <p>{error}</p>
            </div>
          )}

          <button type="submit" disabled={submitting} className="contact-submit admin-login-submit">
            {submitting ? (
              <span className="admin-login-spinner-row">
                <span className="admin-login-spinner" />
                Signing in…
              </span>
            ) : (
              'Sign in →'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
