import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import AICoach from './pages/AICoach'
import Assessment from './pages/Assessment'
import Roadmap from './pages/Roadmap'
import StudyPlanner from './pages/StudyPlanner'
import Analytics from './pages/Analytics'
import Achievements from './pages/Achievements'
import Profile from './pages/Profile'
import AdminDashboard from './pages/AdminDashboard'
import Spinner from './components/ui/Spinner'

const PrivateRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-950"><Spinner size="lg" /></div>
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />
  if (!user.onboardingCompleted && window.location.pathname !== '/onboarding') return <Navigate to="/onboarding" replace />
  return children
}

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-950"><Spinner size="lg" /></div>
  if (user) return <Navigate to={user.onboardingCompleted ? '/dashboard' : '/onboarding'} replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/onboarding" element={<PrivateRoute><Onboarding /></PrivateRoute>} />
      <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/ai-coach" element={<AICoach />} />
        <Route path="/assessment" element={<Assessment />} />
        <Route path="/roadmap" element={<Roadmap />} />
        <Route path="/roadmap/:id" element={<Roadmap />} />
        <Route path="/study-planner" element={<StudyPlanner />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/achievements" element={<Achievements />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<PrivateRoute adminOnly><AdminDashboard /></PrivateRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
