import { useNavigate } from 'react-router-dom'
import { clearToken, isGuest } from '../api'

export function Header() {
  const navigate = useNavigate()
  const guest = isGuest()
  return (
    <div className="app-header">
      <h1>
        Prior Authorization Automation{' '}
        <span className="muted">
          · {guest ? 'Read-only guest preview' : 'Sunrise Health Partners'}
        </span>
      </h1>
      <button
        className="ghost"
        onClick={() => {
          clearToken()
          navigate('/')
        }}
      >
        {guest ? 'Sign in' : 'Sign out'}
      </button>
    </div>
  )
}
