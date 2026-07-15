import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, getToken, isGuest, type RequestDetail } from '../api'
import { Header } from '../components/Header'

const OUTCOMES = [
  { value: 'ready_to_submit', label: 'Ready to submit' },
  { value: 'gap_identified', label: 'Gap identified' },
  { value: 'likely_not_coverable', label: 'Likely not coverable' },
]

const EVALUATION_POLL_INTERVAL_MS = 3000
const EVALUATION_POLL_TIMEOUT_MS = 3 * 60 * 1000

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function RequestDetailPage() {
  const { requestId } = useParams()
  const [detail, setDetail] = useState<RequestDetail | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  // Which review action the reviewer is composing: null | 'edit' | 'override'
  const [mode, setMode] = useState<'edit' | 'override' | null>(null)
  const [note, setNote] = useState('')
  const [overrideOutcome, setOverrideOutcome] = useState('gap_identified')
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

  async function runEvaluation() {
    if (!requestId) return
    setBusy(true)
    setError('')
    setStatus('Running evaluation (Textract + AI review — about a minute)…')
    try {
      // The endpoint only triggers the pipeline and returns immediately --
      // it doesn't block behind the scenes anymore (a long-held request
      // doesn't survive being deployed behind a real edge/proxy), so we
      // poll for the result instead.
      await api.evaluate(requestId)
      const deadline = Date.now() + EVALUATION_POLL_TIMEOUT_MS
      let seenEvaluating = false
      while (Date.now() < deadline) {
        const d = await api.detail(requestId)
        if (d.status === 'evaluating') seenEvaluating = true
        if (seenEvaluating && d.status === 'pending_review') {
          setDetail(d)
          setStatus('')
          return
        }
        await sleep(EVALUATION_POLL_INTERVAL_MS)
      }
      setError('Evaluation is taking longer than expected — refresh in a bit to check on it.')
      setStatus('')
    } catch (e) {
      setError((e as Error).message)
      setStatus('')
    } finally {
      setBusy(false)
    }
  }

  async function submitReview(action: string) {
    if (!requestId) return
    setBusy(true)
    setError('')
    try {
      if (action === 'approve') {
        await api.review(requestId, 'approve', 'Reviewed AI determinations and citations; accepting.')
      } else if (action === 'edit') {
        await api.review(requestId, 'edit', note)
      } else {
        await api.review(requestId, 'override', note, overrideOutcome)
      }
      setMode(null)
      setNote('')
      load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (error && !detail) {
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
  const evaluated = detail.evaluations.length > 0
  const reviewable = detail.status === 'pending_review'

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
          {detail.review_mode === 'full_manual' && (
            <p className="note">
              A low-confidence or indeterminate result forced this case into full
              manual review — a human should evaluate it from scratch.
            </p>
          )}
        </div>

        {/* Stranded intake: has no AI determinations yet (e.g. an interrupted
            upload). Offer to run the evaluation rather than leaving it dead. */}
        {!evaluated && !decided && !isGuest() && (
          <div className="card">
            <p className="muted" style={{ marginTop: 0 }}>
              This request hasn’t been evaluated yet — no AI determinations exist
              to review. Run the evaluation to process the uploaded chart.
            </p>
            <button disabled={busy} onClick={runEvaluation}>
              {busy ? 'Working…' : 'Run evaluation'}
            </button>
            {status && <p className="spinner" style={{ marginTop: '0.8rem' }}>{status}</p>}
            {error && <div className="error" style={{ marginTop: '0.8rem' }}>{error}</div>}
          </div>
        )}
        {!evaluated && !decided && isGuest() && (
          <div className="card">
            <p className="muted" style={{ margin: 0 }}>
              This request hasn’t been evaluated yet. Sign in to run the evaluation.
            </p>
          </div>
        )}

        {evaluated && (
          <>
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
                <p className="muted" style={{ margin: 0 }}>
                  Human decision recorded: <strong>{detail.status}</strong>. Nothing the
                  AI produced is final until a person acts here.
                </p>
              ) : reviewable && isGuest() ? (
                <p className="muted" style={{ margin: 0 }}>
                  This case is awaiting human review. Sign in to approve, edit, or override it.
                </p>
              ) : reviewable && mode === null ? (
                <>
                  <p className="muted" style={{ marginTop: 0 }}>
                    Nothing above is final until you decide. The AI proposes; you dispose.
                  </p>
                  <div className="row">
                    <button disabled={busy} onClick={() => submitReview('approve')}>
                      Approve
                    </button>
                    <button className="secondary" disabled={busy} onClick={() => setMode('edit')}>
                      Edit
                    </button>
                    <button
                      className="secondary"
                      disabled={busy}
                      onClick={() => setMode('override')}
                    >
                      Override
                    </button>
                  </div>
                  <p className="note">
                    Approve = accept as-is · Edit = accept with a correction note ·
                    Override = set a different outcome with a reason.
                  </p>
                </>
              ) : reviewable && mode === 'edit' ? (
                <>
                  <p className="muted" style={{ marginTop: 0 }}>
                    <strong>Edit</strong> — accept the outcome but record a correction
                    note. The AI’s determination stands; your note is appended.
                  </p>
                  <label>Correction note (required)</label>
                  <textarea
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Citation on criterion 3 should reference the 2026-05-02 panel."
                    style={{ width: '100%' }}
                  />
                  <div className="row" style={{ marginTop: '0.7rem' }}>
                    <button disabled={busy || !note.trim()} onClick={() => submitReview('edit')}>
                      Save edit
                    </button>
                    <button className="ghost" disabled={busy} onClick={() => setMode(null)}>
                      Cancel
                    </button>
                  </div>
                </>
              ) : reviewable && mode === 'override' ? (
                <>
                  <p className="muted" style={{ marginTop: 0 }}>
                    <strong>Override</strong> — reject the AI’s outcome and set your own.
                    This changes the case determination.
                  </p>
                  <label>New outcome</label>
                  <select
                    value={overrideOutcome}
                    onChange={(e) => setOverrideOutcome(e.target.value)}
                  >
                    {OUTCOMES.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <label>Reason (required)</label>
                  <textarea
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Why the AI's outcome is wrong and yours is correct."
                    style={{ width: '100%' }}
                  />
                  <div className="row" style={{ marginTop: '0.7rem' }}>
                    <button
                      disabled={busy || !note.trim()}
                      onClick={() => submitReview('override')}
                    >
                      Override outcome
                    </button>
                    <button className="ghost" disabled={busy} onClick={() => setMode(null)}>
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <p className="muted" style={{ margin: 0 }}>
                  Status is “{detail.status}” — not open for review.
                </p>
              )}
              {error && <div className="error" style={{ marginTop: '0.8rem' }}>{error}</div>}
            </div>
          </>
        )}
      </div>
    </>
  )
}
