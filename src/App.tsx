import { Routes, Route } from 'react-router-dom'
import { LoginPage } from './pages/LoginPage'
import { WorkQueuePage } from './pages/WorkQueuePage'
import { RequestDetailPage } from './pages/RequestDetailPage'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/queue" element={<WorkQueuePage />} />
      <Route path="/requests/:requestId" element={<RequestDetailPage />} />
    </Routes>
  )
}

export default App
