import { useNavigate } from 'react-router-dom'
import { clearToken } from '../api'

export function Header() {
  const navigate = useNavigate()
  return (
    <div className="app-header">
      <h1>
        Prior Authorization Automation{' '}
        <span className="muted">· Sunrise Health Partners</span>
      </h1>
      <button
        className="ghost"
        onClick={() => {
          clearToken()
          navigate('/')
        }}
      >
        Sign out
      </button>
    </div>
  )
}
