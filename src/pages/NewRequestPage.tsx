import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, getToken, uploadToS3, type Reference } from '../api'
import { Header } from '../components/Header'

export function NewRequestPage() {
  const [ref, setRef] = useState<Reference | null>(null)
  const [drugId, setDrugId] = useState('')
  const [planId, setPlanId] = useState('')
  const [diagnosisId, setDiagnosisId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!getToken()) {
      navigate('/')
      return
    }
    api
      .reference()
      .then((r) => {
        setRef(r)
        // Preselect Repatha + the demo plan + the hypercholesterolemia dx, since
        // that's the criteria set the demo has published.
        const repatha = r.drugs.find((d) => d.name.startsWith('Repatha'))
        if (repatha) setDrugId(repatha.id)
        if (r.payer_plans[0]) setPlanId(r.payer_plans[0].id)
        const e78 = r.diagnoses.find((d) => d.code === 'E78.00')
        if (e78) setDiagnosisId(e78.id)
      })
      .catch((e) => setError((e as Error).message))
  }, [navigate])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) {
      setError('Choose a chart PDF to upload.')
      return
    }
    setBusy(true)
    setError('')
    try {
      setStatus('Creating request…')
      const { id } = await api.createRequest(drugId, planId, diagnosisId)

      setStatus('Requesting upload URL…')
      const { upload_url } = await api.registerDocument(
        id,
        file.name,
        file.type || 'application/pdf',
      )

      setStatus('Uploading chart to secure storage…')
      await uploadToS3(upload_url, file)

      setStatus('Running evaluation (Textract + AI review — about a minute)…')
      await api.evaluate(id)

      navigate(`/requests/${id}`)
    } catch (err) {
      setError((err as Error).message)
      setStatus('')
    } finally {
      setBusy(false)
    }
  }

  const drug = ref?.drugs.find((d) => d.id === drugId)

  return (
    <>
      <Header />
      <div className="container" style={{ maxWidth: 620 }}>
        <div className="row" style={{ marginBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}>New PA request</h2>
          <div className="spacer" />
          <button className="ghost" onClick={() => navigate('/queue')}>
            ← Back to queue
          </button>
        </div>

        <div className="card">
          {!ref ? (
            <p className="spinner">Loading…</p>
          ) : (
            <form onSubmit={submit}>
              <label>Drug</label>
              <select value={drugId} onChange={(e) => setDrugId(e.target.value)}>
                {ref.drugs.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>

              <label>Payer plan</label>
              <select value={planId} onChange={(e) => setPlanId(e.target.value)}>
                {ref.payer_plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.payer_name} / {p.plan_name}
                  </option>
                ))}
              </select>

              <label>Diagnosis</label>
              <select
                value={diagnosisId}
                onChange={(e) => setDiagnosisId(e.target.value)}
              >
                {ref.diagnoses.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code} — {d.label}
                  </option>
                ))}
              </select>

              <label>Patient chart (PDF)</label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              {drug && !drug.name.startsWith('Repatha') && (
                <p className="note">
                  Only Repatha has a published criteria set in this demo — other
                  drugs will report “no active criteria”.
                </p>
              )}
              <p className="note">
                Sample charts are in <code>~/Downloads/priorauth-sample-charts/</code>.
              </p>

              <div style={{ marginTop: '1rem' }}>
                <button type="submit" disabled={busy}>
                  {busy ? 'Working…' : 'Upload & evaluate'}
                </button>
              </div>
              {status && <p className="spinner" style={{ marginTop: '0.8rem' }}>{status}</p>}
              {error && <div className="error" style={{ marginTop: '0.8rem' }}>{error}</div>}
            </form>
          )}
        </div>
      </div>
    </>
  )
}
