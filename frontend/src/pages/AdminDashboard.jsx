import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { adminAPI, userAPI } from '../services/api'
import { Users, BookOpen, Map, BarChart3, Activity, Shield, Loader2, Search, ChevronDown, Send, Bell, CheckCircle, XCircle, RefreshCw, TrendingUp, Clock } from 'lucide-react'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import toast from 'react-hot-toast'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [tab, setTab] = useState('overview')
  const [broadcastModal, setBroadcastModal] = useState(false)
  const [broadcast, setBroadcast] = useState({ title: '', message: '', type: 'system', role: '' })
  const [sending, setSending] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => { loadData() }, [])
  useEffect(() => { if (tab === 'users') loadUsers() }, [tab, search, roleFilter, page])

  const loadData = async () => {
    setLoading(true)
    try {
      const r = await adminAPI.getDashboard()
      setStats(r.data.data)
    } catch (err) { toast.error('Failed to load dashboard') }
    finally { setLoading(false) }
  }

  const loadUsers = async () => {
    try {
      const r = await adminAPI.getUsers({ search, role: roleFilter, page, limit: 15 })
      setUsers(r.data.data || [])
      setTotal(r.data.total || 0)
    } catch {}
  }

  const toggleUserStatus = async (userId, isActive) => {
    try {
      await adminAPI.updateUser(userId, { isActive: !isActive })
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isActive: !u.isActive } : u))
      toast.success(`User ${isActive ? 'deactivated' : 'activated'}`)
    } catch { toast.error('Failed') }
  }

  const changeRole = async (userId, role) => {
    try {
      await adminAPI.updateUser(userId, { role })
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, role } : u))
      toast.success('Role updated')
    } catch { toast.error('Failed') }
  }

  const sendBroadcast = async () => {
    if (!broadcast.title || !broadcast.message) return toast.error('Fill all fields')
    setSending(true)
    try {
      const r = await adminAPI.broadcast(broadcast)
      toast.success(r.data.message)
      setBroadcastModal(false)
      setBroadcast({ title: '', message: '', type: 'system', role: '' })
    } catch { toast.error('Broadcast failed') }
    finally { setSending(false) }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary-400" /></div>

  const s = stats?.stats || {}

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title flex items-center gap-2"><Shield className="w-6 h-6 text-primary-400" />Admin Dashboard</h1>
          <p className="section-sub">Platform management and analytics</p>
        </div>
        <div className="flex gap-3">
          <button onClick={loadData} className="btn-secondary text-sm"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={() => setBroadcastModal(true)} className="btn-primary text-sm"><Bell className="w-4 h-4" />Broadcast</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={s.totalUsers || 0} subtitle={`${s.activeUsers || 0} active`} icon={Users} color="primary" />
        <StatCard title="Students" value={s.students || 0} subtitle="Enrolled learners" icon={Users} color="secondary" />
        <StatCard title="Roadmaps" value={s.totalRoadmaps || 0} subtitle="AI-generated paths" icon={Map} color="success" />
        <StatCard title="Assessments" value={s.completedAssessments || 0} subtitle="Completed" icon={BarChart3} color="warning" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Total Courses" value={s.totalCourses || 0} icon={BookOpen} color="cyan" />
        <StatCard title="Hours Learned" value={`${s.totalHoursLearned || 0}h`} icon={Clock} color="primary" />
        <StatCard title="Platform Health" value="99.9%" subtitle="Uptime" icon={Activity} color="success" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1">
        {['overview', 'users'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all ${tab === t ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-white'}`}>{t}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent Users */}
          <div className="card">
            <h3 className="text-base font-semibold text-white mb-4">Recent Registrations</h3>
            <div className="space-y-3">
              {(stats?.recentUsers || []).map((u, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                    {u.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{u.name}</p>
                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge color={u.role === 'admin' ? 'danger' : u.role === 'mentor' ? 'warning' : 'primary'} size="xs">{u.role}</Badge>
                    {u.isActive ? <CheckCircle className="w-3.5 h-3.5 text-green-400" /> : <XCircle className="w-3.5 h-3.5 text-red-400" />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Platform Stats */}
          <div className="card">
            <h3 className="text-base font-semibold text-white mb-4">Platform Metrics</h3>
            <div className="space-y-4">
              {[
                { label: 'Active Users', value: s.activeUsers, total: s.totalUsers, color: 'primary' },
                { label: 'Student Share', value: s.students, total: s.totalUsers, color: 'secondary' },
              ].map((m, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-400">{m.label}</span>
                    <span className="text-white">{m.value} / {m.total}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-800 rounded-full">
                    <div className={`h-2 rounded-full ${m.color === 'primary' ? 'bg-primary-500' : 'bg-secondary-500'} transition-all`}
                      style={{ width: `${m.total > 0 ? (m.value / m.total * 100) : 0}%` }} />
                  </div>
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4 pt-2">
                {[
                  { label: 'Avg Hours/User', value: s.totalHoursLearned > 0 && s.totalUsers > 0 ? (s.totalHoursLearned / s.totalUsers).toFixed(1) + 'h' : '0h' },
                  { label: 'Assessments/User', value: s.totalUsers > 0 ? (s.completedAssessments / s.totalUsers).toFixed(1) : '0' },
                ].map((m, i) => (
                  <div key={i} className="p-3 bg-gray-800 rounded-lg text-center">
                    <p className="text-lg font-bold text-white">{m.value}</p>
                    <p className="text-xs text-gray-400">{m.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="card">
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
              <input className="input pl-9" placeholder="Search users by name or email..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
            </div>
            <select className="input sm:w-40" value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1) }}>
              <option value="">All Roles</option>
              {['student', 'mentor', 'admin', 'institution'].map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gray-800">
                  {['User', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="text-left pb-3 pr-4 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {users.map((u, i) => (
                  <tr key={i} className="hover:bg-gray-800/50 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-white truncate max-w-[140px]">{u.name}</p>
                          <p className="text-xs text-gray-400 truncate max-w-[140px]">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <select value={u.role} onChange={e => changeRole(u._id, e.target.value)} className="bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded-lg px-2 py-1">
                        {['student', 'mentor', 'admin', 'institution'].map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge color={u.isActive ? 'success' : 'danger'} size="xs">{u.isActive ? 'Active' : 'Inactive'}</Badge>
                    </td>
                    <td className="py-3 pr-4 text-xs text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="py-3">
                      <button onClick={() => toggleUserStatus(u._id, u.isActive)} className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${u.isActive ? 'border-red-500/50 text-red-400 hover:bg-red-500/10' : 'border-green-500/50 text-green-400 hover:bg-green-500/10'}`}>
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && <tr><td colSpan={5} className="text-center py-10 text-gray-500">No users found</td></tr>}
              </tbody>
            </table>
          </div>

          {total > 15 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-800">
              <p className="text-xs text-gray-400">{total} total users</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40">Prev</button>
                <span className="flex items-center text-xs text-gray-400 px-2">Page {page}</span>
                <button onClick={() => setPage(p => p + 1)} disabled={users.length < 15} className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Broadcast Modal */}
      <Modal isOpen={broadcastModal} onClose={() => setBroadcastModal(false)} title="Send Broadcast Notification">
        <div className="space-y-4">
          <div><label className="label">Title</label><input className="input" placeholder="Notification title" value={broadcast.title} onChange={e => setBroadcast({ ...broadcast, title: e.target.value })} /></div>
          <div><label className="label">Message</label><textarea className="input resize-none" rows={3} placeholder="Notification message..." value={broadcast.message} onChange={e => setBroadcast({ ...broadcast, message: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Type</label>
              <select className="input" value={broadcast.type} onChange={e => setBroadcast({ ...broadcast, type: e.target.value })}>
                {['system','ai-insight','motivation','update','achievement'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div><label className="label">Target Role <span className="text-gray-500 font-normal">(optional)</span></label>
              <select className="input" value={broadcast.role} onChange={e => setBroadcast({ ...broadcast, role: e.target.value })}>
                <option value="">All Users</option>
                {['student','mentor','admin'].map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setBroadcastModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button onClick={sendBroadcast} disabled={sending} className="btn-primary flex-1 justify-center">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send Broadcast
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
