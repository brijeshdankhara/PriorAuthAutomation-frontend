import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, getToken, type RequestDetail } from '../api'
import { Header } from '../components/Header'

export function RequestDetailPage() {
  const { requestId } = useParams()
  const [detail, setDetail] = useState<RequestDetail | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()

  const load = useCallback(() => {
    if (!requestId) return
    api
      .detail(requestId)
      .then(setDetail)
      .catch((e) => setError((e as Error).message))
  }, [requestId])

  useEffect(() => {
    if (!getToken()) {
      navigate('/')
      return
    }
    load()
  }, [navigate, load])

  async function review(action: string) {
    if (!requestId) return
    setBusy(true)
    setError('')
    try {
      const note =
        action === 'approve'
          ? 'Reviewed AI determinations and citations against the chart. Approving.'
          : `Human ${action} of the AI determination.`
      await api.review(requestId, action, note)
      load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="container">
          <div className="error">{error}</div>
          <button className="ghost" onClick={() => navigate('/queue')}>
            ← Back to queue
          </button>
        </div>
      </>
    )
  }
  if (!detail) {
    return (
      <>
        <Header />
        <div className="container">
          <p className="spinner">Loading…</p>
        </div>
      </>
    )
  }

  const decided = ['approved', 'edited', 'overridden'].includes(detail.status)

  return (
    <>
      <Header />
      <div className="container">
        <div className="row" style={{ marginBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}>{detail.drug_name}</h2>
          <div className="spacer" />
          <button className="ghost" onClick={() => navigate('/queue')}>
            ← Back to queue
          </button>
        </div>

        <div className="card">
          <div className="row">
            <div>
              <div className="muted" style={{ fontSize: '0.8rem' }}>
                {detail.payer} · {detail.diagnosis_code}
              </div>
              <div style={{ marginTop: '0.4rem' }}>
                <span className={`badge ${detail.outcome ?? ''}`}>
                  {detail.outcome ? detail.outcome.replace(/_/g, ' ') : 'not evaluated'}
                </span>{' '}
                <span className="muted" style={{ fontSize: '0.82rem' }}>
                  review mode: {detail.review_mode ?? '—'} · status: {detail.status}
                </span>
              </div>
            </div>
          </div>
          {detail.review_mode === 'full_manual' && (
            <p className="note">
              A low-confidence or indeterminate result forced this case into full
              manual review — a human should evaluate it from scratch.
            </p>
          )}
        </div>

        <h2 style={{ fontSize: '1rem', margin: '1.4rem 0 0.7rem' }}>
          AI criterion determinations
        </h2>
        {detail.evaluations.map((ev) => (
          <div className="criterion" key={ev.id}>
            <div className="cr-head">
              <div className="cr-title">{ev.criterion}</div>
              <span className={`badge ${ev.status}`}>{ev.status.replace(/_/g, ' ')}</span>
            </div>
            {ev.explanation && <div className="expl">{ev.explanation}</div>}
            {ev.citation?.quote && (
              <div className="cite">
                “{ev.citation.quote}”
                {ev.citation.page ? (
                  <span className="muted"> — page {ev.citation.page}</span>
                ) : null}
              </div>
            )}
            <div className="conf" style={{ marginTop: '0.5rem' }}>
              confidence {ev.confidence.toFixed(2)} (threshold{' '}
              {ev.confidence_threshold.toFixed(2)}) · {ev.model_id}
            </div>
          </div>
        ))}

        <div className="card" style={{ marginTop: '1rem' }}>
          {decided ? (
            <p className="muted">
              Human decision recorded: <strong>{detail.status}</strong>. Nothing the
              AI produced is final until a person acts here.
            </p>
          ) : (
            <>
              <p className="muted" style={{ marginTop: 0 }}>
                Nothing above is final until you decide. The AI proposes; you dispose.
              </p>
              <div className="row">
                <button disabled={busy} onClick={() => review('approve')}>
                  Approve
                </button>
                <button className="secondary" disabled={busy} onClick={() => review('edit')}>
                  Edit
                </button>
                <button className="secondary" disabled={busy} onClick={() => review('override')}>
                  Override
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
