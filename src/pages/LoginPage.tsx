import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, setToken } from '../api'

export function LoginPage() {
  const [email, setEmail] = useState('demo-staff@priorauth.example.com')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const { access_token } = await api.devLogin(email, password)
      setToken(access_token)
      navigate('/queue')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container" style={{ maxWidth: 420 }}>
      <div className="card">
        <h2>Prior Authorization Automation</h2>
        <p className="muted">Sign in to the demo practice.</p>
        <form onSubmit={submit}>
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="from scripts/beta_env.sh"
          />
          <div style={{ marginTop: '1rem' }}>
            <button type="submit" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </div>
          {error && (
            <div className="error" style={{ marginTop: '0.8rem' }}>
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
