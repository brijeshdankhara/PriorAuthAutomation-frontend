import { Link } from 'react-router-dom'

export function WorkQueuePage() {
  return (
    <section>
      <h1>Work Queue</h1>
      <p>Prior-authorization requests will be listed here.</p>
      {/* TODO (vertical slice): fetch PA requests from the API, show status/age/priority */}
      <Link to="/requests/example">View an example request</Link>
    </section>
  )
}
