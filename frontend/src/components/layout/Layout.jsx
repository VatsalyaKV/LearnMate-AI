import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutDashboard, Bot, ClipboardCheck, Map, Calendar, BarChart3, Trophy, User, Settings, LogOut, Bell, Menu, X, Zap, ChevronRight, Shield } from 'lucide-react'
import { notificationAPI } from '../../services/api'
import { useEffect } from 'react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/ai-coach', icon: Bot, label: 'AI Coach' },
  { to: '/assessment', icon: ClipboardCheck, label: 'Assessment' },
  { to: '/roadmap', icon: Map, label: 'Roadmap' },
  { to: '/study-planner', icon: Calendar, label: 'Study Planner' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/achievements', icon: Trophy, label: 'Achievements' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    notificationAPI.getAll({ unread: true, limit: 1 }).then(r => setUnread(r.data.unreadCount || 0)).catch(() => {})
    const t = setInterval(() => {
      notificationAPI.getAll({ unread: true, limit: 1 }).then(r => setUnread(r.data.unreadCount || 0)).catch(() => {})
    }, 60000)
    return () => clearInterval(t)
  }, [])

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-4 py-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm">LearnMate AI</p>
            <p className="text-xs text-gray-500">Agentic Learning</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-sm font-bold text-white">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.xpPoints || 0} XP · Lvl {user?.level || 1}</p>
          </div>
        </div>
        <div className="mt-3 bg-gray-800 rounded-full h-1.5">
          <div className="bg-gradient-to-r from-primary-500 to-secondary-500 h-1.5 rounded-full" style={{ width: `${((user?.xpPoints || 0) % 500) / 5}%` }} />
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span>{label}</span>
            {to === '/ai-coach' && <span className="ml-auto bg-primary-500 text-white text-xs px-1.5 py-0.5 rounded-full">AI</span>}
          </NavLink>
        ))}
        {user?.role === 'admin' && (
          <NavLink to="/admin" onClick={() => setSidebarOpen(false)} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Shield className="w-4 h-4" /><span>Admin</span>
          </NavLink>
        )}
      </nav>

      <div className="px-3 py-4 border-t border-gray-800 space-y-1">
        <button onClick={() => { navigate('/profile'); setSidebarOpen(false) }} className="sidebar-link w-full">
          <Settings className="w-4 h-4" /><span>Settings</span>
        </button>
        <button onClick={logout} className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-900/20">
          <LogOut className="w-4 h-4" /><span>Logout</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-gray-900 border-r border-gray-800 flex-col flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setSidebarOpen(false)} />
            <motion.aside initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} transition={{ type: 'spring', damping: 25 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-gray-900 border-r border-gray-800 z-50 overflow-y-auto">
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-800 text-gray-400">
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden lg:flex items-center gap-2 text-sm text-gray-500">
            <Zap className="w-4 h-4 text-primary-400" />
            <span>Powered by IBM watsonx.ai Granite</span>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <button onClick={() => navigate('/ai-coach')} className="hidden sm:flex items-center gap-2 bg-primary-600/20 border border-primary-500/30 text-primary-400 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-primary-600/30 transition-all">
              <Bot className="w-3.5 h-3.5" /> Ask AI Coach
            </button>
            <button onClick={() => navigate('/profile')} className="relative p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-all">
              <Bell className="w-5 h-5" />
              {unread > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">{unread > 9 ? '9+' : unread}</span>}
            </button>
            <button onClick={() => navigate('/profile')} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-sm font-bold text-white hover:scale-105 transition-transform">
              {user?.name?.charAt(0).toUpperCase()}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <motion.div key={window.location.pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="h-full">
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}
