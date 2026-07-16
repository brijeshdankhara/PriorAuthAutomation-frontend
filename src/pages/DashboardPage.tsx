import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, getToken, isGuest, type DashboardData } from '../api'
import { Header } from '../components/Header'
import { LoadingIndicator } from '../components/LoadingIndicator'
import { GuestTour } from '../components/GuestTour'
import { label, OUTCOME_LABELS, REVIEW_MODE_LABELS, STATUS_LABELS, CRITERION_STATUS_LABELS } from '../labels'

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

function CountTable({
  title,
  counts,
  labelMap,
}: {
  title: string
  counts: Record<string, number>
  labelMap?: Record<string, string>
}) {
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
                <td>{labelMap ? label(labelMap, k) : k}</td>
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

        {isGuest() && <GuestTour />}

        <div className="card">
          <h2 style={{ fontSize: '0.95rem' }}>Time saved</h2>
          <p className="note" style={{ marginTop: 0 }}>
            How fast the AI reviews a case, versus how long the follow-up staff check takes.
          </p>
          <div className="stat-grid">
            <Stat
              label="AI review time"
              value={data.avg_ai_turnaround_minutes != null ? `${data.avg_ai_turnaround_minutes} min` : '—'}
            />
            <Stat
              label="Staff review time"
              value={data.avg_human_review_minutes != null ? `${data.avg_human_review_minutes} min` : '—'}
            />
            <Stat label="Cases AI has reviewed" value={data.ai_turnaround_sample_size} />
            <Stat label="Cases staff has signed off on" value={data.human_review_sample_size} />
          </div>
        </div>

        <CountTable title="Cases by status" counts={data.by_status} labelMap={STATUS_LABELS} />
        <CountTable title="Cases by outcome" counts={data.by_outcome} labelMap={OUTCOME_LABELS} />
        <CountTable title="Cases by review type" counts={data.by_review_mode} labelMap={REVIEW_MODE_LABELS} />
        <CountTable title="Cases by payer" counts={data.by_payer} />

        <div className="card">
          <h2 style={{ fontSize: '0.95rem' }}>Most common reasons a case isn’t ready</h2>
          {data.gap_denial_reasons.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>
              No gap or denial reasons recorded yet.
            </p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Requirement</th>
                  <th>Result</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {data.gap_denial_reasons.map((r, i) => (
                  <tr key={i}>
                    <td>{r.description}</td>
                    <td>
                      <span className={`badge ${r.status}`}>{label(CRITERION_STATUS_LABELS, r.status)}</span>
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
