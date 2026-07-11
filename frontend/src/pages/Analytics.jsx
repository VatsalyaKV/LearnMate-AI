import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { analyticsAPI, aiAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { BarChart3, TrendingUp, Clock, Zap, Target, Flame, Brain, Loader2, RefreshCw, Star, CheckCircle, Sparkles } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-xs shadow-xl">
      <p className="text-gray-400 mb-1 font-medium">{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color }}>{p.name}: <span className="font-bold">{p.value}</span></p>)}
    </div>
  )
}

export default function Analytics() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30')

  useEffect(() => { loadData() }, [period])

  const loadData = async () => {
    setLoading(true)
    try {
      const [analyticsR, reportR] = await Promise.all([
        analyticsAPI.get({ period }),
        analyticsAPI.report(),
      ])
      setData(analyticsR.data.data)
      setReport(reportR.data.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-3">
        <Loader2 className="w-10 h-10 animate-spin text-primary-400 mx-auto" />
        <p className="text-gray-400 text-sm">Loading analytics...</p>
      </div>
    </div>
  )

  const overview = data?.overview || {}
  const generateMockRadar = () => (data?.skillData?.length > 0 ? data.skillData : [
    { skill: 'JavaScript', score: 72 }, { skill: 'React', score: 65 }, { skill: 'Node.js', score: 55 },
    { skill: 'CSS', score: 80 }, { skill: 'SQL', score: 45 }, { skill: 'Git', score: 88 },
  ])

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title">Learning Analytics</h1>
          <p className="section-sub">Deep insights into your learning journey</p>
        </div>
        <div className="flex gap-3">
          {['7', '30', '90'].map(d => (
            <button key={d} onClick={() => setPeriod(d)} className={`px-4 py-2 rounded-lg border text-sm transition-all ${period === d ? 'border-primary-500 bg-primary-500/20 text-primary-300' : 'border-gray-700 text-gray-400 hover:border-gray-600'}`}>{d}d</button>
          ))}
          <button onClick={loadData} className="btn-secondary text-sm"><RefreshCw className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Hours" value={`${(overview.totalHoursLearned || 0).toFixed(0)}h`} subtitle={`${(overview.periodHours || 0).toFixed(1)}h this period`} icon={Clock} color="primary" />
        <StatCard title="Productivity Score" value={`${overview.productivityScore || 0}%`} subtitle={report?.insights?.learningVelocity || 'Stable'} icon={Zap} color="secondary" />
        <StatCard title="Career Readiness" value={`${overview.careerReadinessScore || 0}%`} subtitle="Industry benchmark" icon={Target} color="success" />
        <StatCard title="Learning Streak" value={`${overview.streak?.current || 0} days`} subtitle={`Best: ${overview.streak?.longest || 0} days`} icon={Flame} color="warning" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Study Hours Chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white">Daily Study Hours</h3>
            <Badge color="primary">Last {period} days</Badge>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data?.dailyChart?.slice(-14) || []}>
              <defs>
                <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="hours" name="Hours" stroke="#3b82f6" fill="url(#aGrad)" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Skill Radar */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white">Skill Radar</h3>
            <Badge color="secondary">Assessment-based</Badge>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={generateMockRadar()}>
              <PolarGrid stroke="#1f2937" />
              <PolarAngleAxis dataKey="skill" tick={{ fill: '#6b7280', fontSize: 10 }} />
              <Radar name="Score" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Weekly Hours Bar */}
        <div className="lg:col-span-2 card">
          <h3 className="text-base font-semibold text-white mb-4">Weekly Study Hours</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data?.weeklyChart || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="week" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="hours" name="Hours" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Goal Stats */}
        <div className="card">
          <h3 className="text-base font-semibold text-white mb-4">Goal Progress</h3>
          <div className="space-y-4">
            {[
              { label: 'Active Goals', value: data?.goalStats?.active || 0, color: 'text-primary-400' },
              { label: 'Completed', value: data?.goalStats?.completed || 0, color: 'text-green-400' },
              { label: 'Completion Rate', value: `${data?.goalStats?.completionRate || 0}%`, color: 'text-yellow-400' },
              { label: 'Certificates', value: data?.certificates || 0, color: 'text-secondary-400' },
            ].map((s, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <span className="text-sm text-gray-400">{s.label}</span>
                <span className={`text-lg font-bold ${s.color}`}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Insights */}
      {report?.insights && (
        <div className="card border-primary-500/20 bg-primary-900/10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary-400" />
            <h3 className="text-base font-semibold text-white">AI Learning Insights</h3>
            <Badge color="primary">Powered by IBM Granite</Badge>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-300 leading-relaxed mb-4">{report.insights.weeklyInsight}</p>
              {report.insights.motivationalMessage && (
                <div className="flex items-start gap-2 p-3 bg-primary-500/10 rounded-lg">
                  <Star className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-300">{report.insights.motivationalMessage}</p>
                </div>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-gray-400 mb-2">Recommendations</p>
                {(report.insights.recommendations || []).map((r, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-gray-300 mb-2">
                    <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />{r}
                  </div>
                ))}
              </div>
              <div className="flex gap-4 text-xs">
                <div><p className="text-gray-500">Best Study Time</p><p className="text-white font-medium capitalize">{report.insights.bestStudyTime || 'Morning'}</p></div>
                <div><p className="text-gray-500">Velocity</p><p className="text-white font-medium capitalize">{report.insights.learningVelocity || 'Stable'}</p></div>
                <div><p className="text-gray-500">Productivity</p><p className="text-primary-400 font-bold">{report.insights.productivityScore || 0}%</p></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Roadmap Progress */}
      {(data?.roadmapProgress || []).length > 0 && (
        <div className="card">
          <h3 className="text-base font-semibold text-white mb-4">Roadmap Progress</h3>
          <div className="space-y-4">
            {data.roadmapProgress.map((rm, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-white font-medium truncate pr-4">{rm.title}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge color={rm.status === 'completed' ? 'success' : 'primary'} size="xs">{rm.status}</Badge>
                    <span className="text-primary-400 font-bold">{rm.progress}%</span>
                  </div>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div className="h-2 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-700" style={{ width: `${rm.progress}%` }} />
                </div>
                <p className="text-xs text-gray-500 mt-1">{rm.completedPhases}/{rm.phases} phases complete</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
