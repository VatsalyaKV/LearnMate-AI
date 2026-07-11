import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { userAPI, roadmapAPI, aiAPI, notificationAPI } from '../services/api'
import StatCard from '../components/ui/StatCard'
import ProgressBar from '../components/ui/ProgressBar'
import { Flame, Zap, Clock, BookOpen, Target, Trophy, Bot, ArrowRight, Bell, Star, TrendingUp, Map, ChevronRight, Sparkles, Calendar, BarChart3 } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-xs">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>)}
    </div>
  )
  return null
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [roadmaps, setRoadmaps] = useState([])
  const [notifications, setNotifications] = useState([])
  const [motivation, setMotivation] = useState('')
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [statsR, roadmapsR, notifsR] = await Promise.all([
          userAPI.getStats(),
          roadmapAPI.getAll(),
          notificationAPI.getAll({ limit: 5 }),
        ])
        setStats(statsR.data.data)
        setRoadmaps(roadmapsR.data.data || [])
        setNotifications(notifsR.data.data || [])
        // generate mock chart data for demo
        const days = []
        for (let i = 6; i >= 0; i--) {
          const d = new Date(); d.setDate(d.getDate() - i)
          days.push({ date: d.toLocaleDateString('en', { weekday: 'short' }), hours: parseFloat((Math.random() * 3 + 0.5).toFixed(1)), xp: Math.floor(Math.random() * 200 + 50) })
        }
        setChartData(days)
        aiAPI.motivation().then(r => setMotivation(r.data.data.message)).catch(() => {})
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const logStudy = async () => {
    try {
      await userAPI.logActivity({ hoursStudied: 1, mood: 'good', topicsStudied: ['Self-directed learning'] })
      toast.success('🔥 1 hour logged! +50 XP earned')
    } catch { toast.error('Failed to log activity') }
  }

  if (loading) return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="h-8 bg-gray-800 rounded w-48" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-800 rounded-xl" />)}</div>
    </div>
  )

  const activeRoadmap = roadmaps.find(r => r.status === 'active')

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]}! 👋</h1>
          <p className="text-gray-400 text-sm mt-1">
            {user?.streak?.current > 0 ? `🔥 ${user.streak.current}-day streak — keep it up!` : 'Start your learning session today!'}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={logStudy} className="btn-secondary text-sm"><Clock className="w-4 h-4" /> Log Study</button>
          <button onClick={() => navigate('/ai-coach')} className="btn-primary text-sm"><Bot className="w-4 h-4" /> Ask AI Coach</button>
        </div>
      </motion.div>

      {/* AI Motivation */}
      {motivation && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-3 bg-gradient-to-r from-primary-900/40 to-secondary-900/40 border border-primary-500/30 rounded-xl p-4">
          <Sparkles className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-300 leading-relaxed">{motivation}</p>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="XP Points" value={(stats?.xpPoints || 0).toLocaleString()} subtitle={`Level ${stats?.level || 1}`} icon={Zap} color="primary" delay={0} />
        <StatCard title="Learning Streak" value={`${stats?.streak?.current || 0} days`} subtitle={`Best: ${stats?.streak?.longest || 0} days`} icon={Flame} color="warning" delay={0.1} />
        <StatCard title="Hours This Week" value={`${stats?.weeklyHours?.toFixed(1) || '0'}h`} subtitle={`${stats?.monthlyHours?.toFixed(1) || 0}h this month`} icon={Clock} color="success" delay={0.2} />
        <StatCard title="Courses Done" value={stats?.totalCoursesCompleted || 0} subtitle={`${stats?.certificates || 0} certificates`} icon={Trophy} color="secondary" delay={0.3} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-white">Study Activity</h3>
              <p className="text-xs text-gray-500">Last 7 days</p>
            </div>
            <button onClick={() => navigate('/analytics')} className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">View All <ChevronRight className="w-3 h-3" /></button>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gradH" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="hours" name="Hours" stroke="#3b82f6" fill="url(#gradH)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Active Roadmap */}
        <div className="card flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white">Active Roadmap</h3>
            <button onClick={() => navigate('/roadmap')} className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">View <ChevronRight className="w-3 h-3" /></button>
          </div>
          {activeRoadmap ? (
            <div className="flex-1 space-y-4">
              <div>
                <p className="text-sm font-medium text-white truncate">{activeRoadmap.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{activeRoadmap.phases?.length || 0} phases</p>
              </div>
              <ProgressBar value={activeRoadmap.overallProgress || 0} showLabel label="Overall Progress" />
              <div className="space-y-2">
                {(activeRoadmap.phases || []).slice(0, 4).map((phase, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${phase.status === 'completed' ? 'bg-green-400' : phase.status === 'in-progress' ? 'bg-primary-400' : 'bg-gray-600'}`} />
                    <span className="text-xs text-gray-400 truncate">{phase.title}</span>
                    {phase.status === 'completed' && <span className="ml-auto text-xs text-green-400">✓</span>}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
              <Map className="w-10 h-10 text-gray-600" />
              <p className="text-sm text-gray-400">No active roadmap yet</p>
              <button onClick={() => navigate('/roadmap')} className="btn-primary text-xs px-4 py-2"><Sparkles className="w-3.5 h-3.5" /> Generate AI Roadmap</button>
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="card">
          <h3 className="text-base font-semibold text-white mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { label: 'Chat with AI Coach', icon: Bot, path: '/ai-coach', color: 'text-primary-400' },
              { label: 'Take Skill Assessment', icon: Target, path: '/assessment', color: 'text-secondary-400' },
              { label: 'View Study Planner', icon: Calendar, path: '/study-planner', color: 'text-cyan-400' },
              { label: 'Check Analytics', icon: BarChart3, path: '/analytics', color: 'text-green-400' },
            ].map((a, i) => (
              <button key={i} onClick={() => navigate(a.path)} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-all group">
                <a.icon className={`w-4 h-4 ${a.color}`} />
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{a.label}</span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400 ml-auto transition-colors" />
              </button>
            ))}
          </div>
        </div>

        {/* Score Cards */}
        <div className="card">
          <h3 className="text-base font-semibold text-white mb-4">Your Scores</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1.5"><span className="text-gray-400">Career Readiness</span><span className="text-primary-400">{stats?.careerReadinessScore || 0}%</span></div>
              <ProgressBar value={stats?.careerReadinessScore || 0} color="primary" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1.5"><span className="text-gray-400">Productivity Score</span><span className="text-secondary-400">{stats?.productivityScore || 0}%</span></div>
              <ProgressBar value={stats?.productivityScore || 0} color="secondary" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1.5"><span className="text-gray-400">Profile Completeness</span><span className="text-green-400">{stats?.profileCompleteness || 0}%</span></div>
              <ProgressBar value={stats?.profileCompleteness || 0} color="success" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1.5"><span className="text-gray-400">Goals Completed</span><span className="text-yellow-400">{stats?.completedGoals || 0} goals</span></div>
              <div className="flex items-center gap-1 mt-1">{[...Array(5)].map((_, i) => <Star key={i} className={`w-4 h-4 ${i < Math.min(5, Math.floor((stats?.completedGoals || 0) / 2)) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />)}</div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white">Notifications</h3>
            <Bell className="w-4 h-4 text-gray-400" />
          </div>
          <div className="space-y-3">
            {notifications.length > 0 ? notifications.slice(0, 4).map((n, i) => (
              <div key={i} className={`flex gap-3 p-2.5 rounded-lg ${!n.isRead ? 'bg-primary-500/10 border border-primary-500/20' : 'bg-gray-800/50'}`}>
                <div className="w-2 h-2 rounded-full bg-primary-400 flex-shrink-0 mt-1.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{n.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{n.message}</p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-gray-500 text-center py-4">No notifications</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
