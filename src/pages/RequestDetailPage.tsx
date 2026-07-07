import { useParams } from 'react-router-dom'

export function RequestDetailPage() {
  const { requestId } = useParams()

  return (
    <section>
      <h1>Request {requestId}</h1>
      <p>Per-criterion evaluation results, citations, and the review/approve/edit/override actions will appear here.</p>
      {/* TODO (vertical slice): fetch criterion_evaluations + citations, wire review actions */}
    </section>
  )
}
