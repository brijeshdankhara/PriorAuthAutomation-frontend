import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, getToken, isGuest, type QueueItem } from '../api'
import { Header } from '../components/Header'
import { LoadingIndicator } from '../components/LoadingIndicator'

function outcomeBadge(outcome: string | null) {
  if (!outcome) return <span className="muted">—</span>
  return <span className={`badge ${outcome}`}>{outcome.replace(/_/g, ' ')}</span>
}

export function WorkQueuePage() {
  const [items, setItems] = useState<QueueItem[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (!getToken()) {
      navigate('/')
      return
    }
    api
      .queue()
      .then(setItems)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [navigate])

  return (
    <>
      <Header />
      <div className="container">
        <div className="row" style={{ marginBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}>Work Queue</h2>
          <div className="spacer" />
          <button className="ghost" onClick={() => navigate('/dashboard')}>
            Dashboard
          </button>
          {!isGuest() && <button onClick={() => navigate('/new')}>+ New PA request</button>}
        </div>

        {loading && <LoadingIndicator label="Loading queue…" />}
        {error && <div className="error">{error}</div>}

        {!loading && !error && (
          <div className="card">
            {items.length === 0 ? (
              <p className="muted">
                No requests yet. Click “New PA request” to start one.
              </p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Drug</th>
                    <th>Payer</th>
                    <th>Status</th>
                    <th>Outcome</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr
                      key={it.id}
                      className="clickable"
                      onClick={() => navigate(`/requests/${it.id}`)}
                    >
                      <td>{it.drug_name}</td>
                      <td>{it.payer}</td>
                      <td>{it.status.replace(/_/g, ' ')}</td>
                      <td>{outcomeBadge(it.outcome)}</td>
                      <td className="muted">{it.created_at.slice(0, 16)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </>
  )
}
