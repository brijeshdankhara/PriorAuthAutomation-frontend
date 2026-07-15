import { useEffect, useState } from 'react'

const SLOW_HINT_DELAY_MS = 2500

export function LoadingIndicator({ label = 'Loading…' }: { label?: string }) {
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), SLOW_HINT_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="spinner">
      <span className="spinner-ring" />
      <span>{label}</span>
      {slow && (
        <p className="note" style={{ marginTop: '0.4rem' }}>
          Still working — the demo database pauses when idle and can take up to a minute to wake
          back up on the first request.
        </p>
      )}
    </div>
  )
}
