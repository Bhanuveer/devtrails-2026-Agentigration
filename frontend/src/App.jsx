import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Policy from './pages/Policy'
import Claims from './pages/Claims'
import Admin from './pages/Admin'
import ChatWidget from './components/ChatWidget'

export default function App() {
  const workerId = localStorage.getItem('worker_id')

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Onboarding />} />
        <Route path="/dashboard" element={workerId ? <Dashboard /> : <Navigate to="/" />} />
        <Route path="/policy" element={workerId ? <Policy /> : <Navigate to="/" />} />
        <Route path="/claims" element={workerId ? <Claims /> : <Navigate to="/" />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
      <ChatWidget />
    </BrowserRouter>
  )
}