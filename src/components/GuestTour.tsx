import { useState } from 'react'

const SEEN_KEY = 'pa_guest_tour_seen'

const STEPS: { title: string; body: string }[] = [
  {
    title: 'Why this exists',
    body:
      "Prior authorization is the approval insurers require before they'll cover certain " +
      'drugs — proof a patient meets specific coverage rules. Today, clinic and pharmacy ' +
      'staff do this by hand: read a dense payer policy PDF, check it against the patient’s ' +
      'chart, and submit the request. It’s slow, and an easy rule to miss means a denied claim ' +
      'and a delayed prescription.',
  },
  {
    title: 'How this app helps',
    body:
      'This app automates that process end to end: it extracts the patient chart, looks up ' +
      'the exact coverage rule for that drug/plan/diagnosis, and has an AI agent judge each ' +
      "requirement against the evidence — always citing the specific sentence it relied on. " +
      "Anything the AI is unsure about is routed to a human automatically. Nothing the AI " +
      'produces is ever final until a staff member approves it.',
  },
  {
    title: 'What you’re about to see: time saved',
    body:
      'The numbers at the top of the dashboard are the productivity story — how many minutes ' +
      'the AI takes to review a case, versus how long the follow-up staff check takes. That ' +
      'gap is the time this app gives back to a practice.',
  },
  {
    title: 'Cases by status & outcome',
    body:
      '"Cases by status" shows where each request sits in the pipeline, from a new intake ' +
      'through AI review to a final staff decision. "Cases by outcome" shows what the AI ' +
      "concluded: the patient meets requirements, something's missing, or it likely isn't " +
      'covered. Click any case in the queue to see the full citation trail behind that call.',
  },
]

export function GuestTour() {
  const [open, setOpen] = useState(() => sessionStorage.getItem(SEEN_KEY) !== '1')
  const [step, setStep] = useState(0)

  function dismiss() {
    sessionStorage.setItem(SEEN_KEY, '1')
    setOpen(false)
  }

  if (!open) return null

  const isLast = step === STEPS.length - 1
  const current = STEPS[step]

  return (
    <div className="tour-overlay">
      <div className="tour-card">
        <div className="row" style={{ alignItems: 'flex-start' }}>
          <h3 style={{ margin: 0 }}>{current.title}</h3>
          <div className="spacer" />
          <button className="ghost" style={{ padding: '0.1rem 0.4rem' }} onClick={dismiss}>
            ✕
          </button>
        </div>
        <p>{current.body}</p>
        <div className="row" style={{ marginTop: '1rem' }}>
          <span className="muted" style={{ fontSize: '0.8rem' }}>
            {step + 1} of {STEPS.length}
          </span>
          <div className="spacer" />
          {step > 0 && (
            <button className="ghost" onClick={() => setStep((s) => s - 1)}>
              Back
            </button>
          )}
          <button onClick={() => (isLast ? dismiss() : setStep((s) => s + 1))}>
            {isLast ? 'Show me the dashboard' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
