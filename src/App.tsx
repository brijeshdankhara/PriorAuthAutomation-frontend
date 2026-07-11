import { Routes, Route } from 'react-router-dom'
import { LoginPage } from './pages/LoginPage'
import { WorkQueuePage } from './pages/WorkQueuePage'
import { NewRequestPage } from './pages/NewRequestPage'
import { RequestDetailPage } from './pages/RequestDetailPage'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/queue" element={<WorkQueuePage />} />
      <Route path="/new" element={<NewRequestPage />} />
      <Route path="/requests/:requestId" element={<RequestDetailPage />} />
    </Routes>
  )
}

export default App
