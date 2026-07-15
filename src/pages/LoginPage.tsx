import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, setToken } from '../api'
import { srpLogin } from '../cognitoAuth'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [guestBusy, setGuestBusy] = useState(false)
  const navigate = useNavigate()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const token = await srpLogin(email, password)
      setToken(token)
      navigate('/queue')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function continueAsGuest() {
    setGuestBusy(true)
    setError('')
    try {
      const { access_token } = await api.guestToken()
      setToken(access_token, true)
      navigate('/dashboard')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setGuestBusy(false)
    }
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-mark">PA</div>
          <div>
            <div className="login-title">Prior Authorization Automation</div>
            <div className="login-subtitle">AI-assisted PA review, with a human always in the loop</div>
          </div>
        </div>

        <form onSubmit={submit}>
          <label>Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@practice.com"
            autoComplete="username"
          />
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <div className="login-actions">
            <button type="submit" disabled={busy || guestBusy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </div>
          {error && <div className="error" style={{ marginTop: '0.8rem' }}>{error}</div>}
        </form>

        <div className="login-divider">
          <span>or</span>
        </div>

        <button className="secondary" style={{ width: '100%' }} disabled={busy || guestBusy} onClick={continueAsGuest}>
          {guestBusy ? 'Loading demo…' : 'Continue as guest — view a live read-only demo'}
        </button>
        {guestBusy && (
          <p className="note" style={{ textAlign: 'center', marginTop: '0.6rem' }}>
            Waking up the demo environment — this can take up to a minute if it's been idle.
          </p>
        )}
        <p className="note" style={{ textAlign: 'center' }}>
          No account needed. You'll see real AI-evaluated cases; creating or changing anything
          requires a real sign-in.
        </p>
      </div>
    </div>
  )
}
