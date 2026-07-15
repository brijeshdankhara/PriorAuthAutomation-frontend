import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, getToken, isGuest, type DashboardData } from '../api'
import { Header } from '../components/Header'
import { LoadingIndicator } from '../components/LoadingIndicator'

function DemoExplainer() {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null
  return (
    <div className="demo-banner">
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <h3 style={{ margin: 0 }}>You're viewing a live read-only demo</h3>
        <div className="spacer" />
        <button className="ghost" style={{ padding: '0.1rem 0.4rem' }} onClick={() => setDismissed(true)}>
          ✕
        </button>
      </div>
      <p>
        <strong>Prior authorization</strong> is the process insurers require before covering
        certain drugs — proving a patient meets specific coverage rules. Today that's done by
        hand: a staff member reads a dense policy PDF, checks it against the patient's chart,
        and submits the request — slow and easy to get wrong.
      </p>
      <p>
        This app automates that end to end: it extracts the chart, looks up the exact coverage
        rule for this drug/plan/diagnosis, and has an AI agent judge each requirement against the
        evidence — always with a citation back to the specific sentence it relied on. Anything
        the AI is unsure about is automatically routed to a human. Nothing the AI produces is
        ever final until a person approves it — you can see that human-in-the-loop review step
        on any case below.
      </p>
      <p className="muted">
        All patient data shown here is synthetic. Everything else — the AI reasoning, citations,
        and coverage rules — is real.
      </p>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

function CountTable({ title, counts }: { title: string; counts: Record<string, number> }) {
  const entries = Object.entries(counts)
  return (
    <div className="card">
      <h2 style={{ fontSize: '0.95rem' }}>{title}</h2>
      {entries.length === 0 ? (
        <p className="muted" style={{ margin: 0 }}>
          No data yet.
        </p>
      ) : (
        <table>
          <tbody>
            {entries.map(([k, v]) => (
              <tr key={k}>
                <td>{k.replace(/_/g, ' ')}</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (!getToken()) {
      navigate('/')
      return
    }
    api.dashboard().then(setData).catch((e) => setError((e as Error).message))
  }, [navigate])

  if (error) {
    return (
      <>
        <Header />
        <div className="container">
          <div className="error">{error}</div>
        </div>
      </>
    )
  }
  if (!data) {
    return (
      <>
        <Header />
        <div className="container">
          <LoadingIndicator label="Loading dashboard…" />
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="container">
        <div className="row" style={{ marginBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}>Dashboard</h2>
          <div className="spacer" />
          <button className="ghost" onClick={() => navigate('/queue')}>
            ← Back to queue
          </button>
        </div>

        {isGuest() && <DemoExplainer />}

        <div className="card">
          <h2 style={{ fontSize: '0.95rem' }}>Practice metrics</h2>
          <div className="stat-grid">
            <Stat
              label="Median AI turnaround"
              value={data.avg_ai_turnaround_minutes != null ? `${data.avg_ai_turnaround_minutes} min` : '—'}
            />
            <Stat
              label="Median human review time"
              value={data.avg_human_review_minutes != null ? `${data.avg_human_review_minutes} min` : '—'}
            />
            <Stat label="Requests evaluated" value={data.ai_turnaround_sample_size} />
            <Stat label="Requests reviewed" value={data.human_review_sample_size} />
          </div>
        </div>

        <CountTable title="Volume by status" counts={data.by_status} />
        <CountTable title="Volume by outcome" counts={data.by_outcome} />
        <CountTable title="Volume by review mode" counts={data.by_review_mode} />
        <CountTable title="Volume by payer" counts={data.by_payer} />

        <div className="card">
          <h2 style={{ fontSize: '0.95rem' }}>Top gap / denial reasons</h2>
          {data.gap_denial_reasons.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>
              No gap or denial reasons recorded yet.
            </p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Criterion</th>
                  <th>Result</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {data.gap_denial_reasons.map((r, i) => (
                  <tr key={i}>
                    <td>{r.description}</td>
                    <td>
                      <span className={`badge ${r.status}`}>{r.status.replace(/_/g, ' ')}</span>
                    </td>
                    <td>{r.c}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {data.operator && (
          <>
            <h2 style={{ fontSize: '1rem', margin: '1.4rem 0 0.7rem' }}>
              Operator metrics <span className="muted">(cross-practice, anonymized)</span>
            </h2>

            <div className="card">
              <div className="stat-grid">
                <Stat label="Total PA requests (all practices)" value={data.operator.total_pa_requests} />
                <Stat
                  label="Human override rate"
                  value={
                    data.operator.human_override_rate != null
                      ? `${(data.operator.human_override_rate * 100).toFixed(1)}%`
                      : '—'
                  }
                />
                <Stat label="Reviewed requests" value={data.operator.reviewed_count} />
              </div>
              <p className="note">
                Override rate is the fraction of reviewed requests where a human rejected the
                AI's outcome — a proxy for model/criteria-library agreement (NFR-3).
              </p>
            </div>

            <div className="card">
              <h2 style={{ fontSize: '0.95rem' }}>Usage by model</h2>
              <table>
                <thead>
                  <tr>
                    <th>Model</th>
                    <th>Evaluations</th>
                    <th>Avg confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {data.operator.by_model.map((m) => (
                    <tr key={m.model_id}>
                      <td>{m.model_id}</td>
                      <td>{m.count}</td>
                      <td>{m.avg_confidence.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card">
              <h2 style={{ fontSize: '0.95rem' }}>Criteria most often low-confidence or indeterminate</h2>
              <p className="note" style={{ marginTop: 0 }}>
                Candidates for criteria-library review (FR-15) — rules the model can't
                confidently apply may need clearer machine-readable definitions.
              </p>
              {data.operator.low_confidence_criteria.length === 0 ? (
                <p className="muted" style={{ margin: 0 }}>
                  No low-confidence criteria yet.
                </p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Criterion</th>
                      <th>Count</th>
                      <th>Avg confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.operator.low_confidence_criteria.map((c, i) => (
                      <tr key={i}>
                        <td>{c.description}</td>
                        <td>{c.count}</td>
                        <td>{c.avg_confidence.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}
