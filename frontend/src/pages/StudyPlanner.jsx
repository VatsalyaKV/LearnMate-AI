import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { aiAPI, progressAPI, userAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Calendar, Clock, CheckCircle, Circle, Loader2, Sparkles, RefreshCw, ChevronDown, Target, Zap, BookOpen, Play, FileText, Code, HelpCircle, Star } from 'lucide-react'
import Badge from '../components/ui/Badge'
import toast from 'react-hot-toast'

const typeIcon = { video: Play, reading: FileText, practice: Code, project: Code, quiz: HelpCircle, assignment: BookOpen }
const typeColor = { video: 'primary', reading: 'cyan', practice: 'secondary', project: 'warning', quiz: 'success' }
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const priorityColor = { high: 'danger', medium: 'warning', low: 'success' }

export default function StudyPlanner() {
  const { user } = useAuth()
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeDay, setActiveDay] = useState(0)
  const [completedTasks, setCompletedTasks] = useState({})
  const [weekNumber, setWeekNumber] = useState(1)
  const [logModal, setLogModal] = useState(false)
  const [logForm, setLogForm] = useState({ hoursStudied: 1, mood: 'good', notes: '' })

  useEffect(() => { generatePlan() }, [])

  const generatePlan = async () => {
    setLoading(true)
    try {
      const r = await aiAPI.generateStudyPlan({ weekNumber })
      setPlan(r.data.data)
      setCompletedTasks({})
      setActiveDay(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1)
    } catch (err) {
      toast.error('Failed to generate study plan')
    } finally { setLoading(false) }
  }

  const toggleTask = (dayIdx, taskIdx) => {
    const key = `${dayIdx}-${taskIdx}`
    setCompletedTasks(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const logStudy = async () => {
    try {
      await userAPI.logActivity({ ...logForm, lessonsCompleted: Object.values(completedTasks).filter(Boolean).length })
      toast.success(`✅ ${logForm.hoursStudied}h logged! Keep it up!`)
      setLogModal(false)
    } catch { toast.error('Failed to log') }
  }

  const getCompletionForDay = (dayIdx) => {
    const day = plan?.days?.[dayIdx]
    if (!day?.tasks?.length) return 0
    const done = day.tasks.filter((_, ti) => completedTasks[`${dayIdx}-${ti}`]).length
    return Math.round((done / day.tasks.length) * 100)
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
        <Calendar className="w-8 h-8 text-white animate-pulse" />
      </div>
      <p className="text-lg font-semibold text-white">Generating Your Study Plan...</p>
      <p className="text-gray-400 text-sm">AI is analyzing your goals and creating a personalized schedule</p>
    </div>
  )

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title">Study Planner</h1>
          <p className="section-sub">AI-generated weekly schedule tailored to your goals</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setLogModal(true)} className="btn-secondary text-sm"><CheckCircle className="w-4 h-4" /> Log Study</button>
          <button onClick={generatePlan} disabled={loading} className="btn-primary text-sm"><RefreshCw className="w-4 h-4" /> Regenerate</button>
        </div>
      </div>

      {plan && (
        <>
          {/* Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Week', value: `Week ${plan.weekNumber}`, icon: Calendar, color: 'from-primary-500/20 border-primary-500/30 text-primary-400' },
              { label: 'Total Hours', value: `${plan.totalHours}h`, icon: Clock, color: 'from-secondary-500/20 border-secondary-500/30 text-secondary-400' },
              { label: 'Daily Goal', value: `${user?.learningPreferences?.studyHoursPerDay || 2}h/day`, icon: Target, color: 'from-cyan-500/20 border-cyan-500/30 text-cyan-400' },
              { label: 'Completed', value: `${Object.values(completedTasks).filter(Boolean).length} tasks`, icon: CheckCircle, color: 'from-green-500/20 border-green-500/30 text-green-400' },
            ].map((s, i) => (
              <div key={i} className={`bg-gradient-to-br ${s.color} border rounded-xl p-4`}>
                <div className="flex items-center gap-2 mb-2"><s.icon className={`w-4 h-4 ${s.color.split(' ').pop()}`} /><p className="text-xs text-gray-400">{s.label}</p></div>
                <p className="text-xl font-bold text-white">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Motivational Tip */}
          {plan.motivationalTip && (
            <div className="flex items-start gap-3 bg-gradient-to-r from-secondary-900/40 to-primary-900/40 border border-secondary-500/30 rounded-xl p-4">
              <Star className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-300">{plan.motivationalTip}</p>
            </div>
          )}

          {/* Weekly Calendar */}
          <div className="card">
            <h3 className="text-base font-semibold text-white mb-4">Weekly Overview</h3>
            <div className="grid grid-cols-7 gap-2">
              {(plan.days || []).map((day, di) => {
                const completion = getCompletionForDay(di)
                const isToday = new Date().getDay() === (di === 6 ? 0 : di + 1)
                return (
                  <button key={di} onClick={() => setActiveDay(di)}
                    className={`flex flex-col items-center p-2 rounded-xl transition-all border ${activeDay === di ? 'border-primary-500 bg-primary-500/20' : isToday ? 'border-yellow-500/50 bg-yellow-500/10' : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'}`}>
                    <p className="text-xs text-gray-400 mb-1">{day.day?.slice(0, 3)}</p>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${completion === 100 ? 'bg-green-500 text-white' : activeDay === di ? 'bg-primary-500 text-white' : 'bg-gray-700 text-gray-300'}`}>
                      {completion === 100 ? '✓' : day.tasks?.length || 0}
                    </div>
                    <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${completion}%` }} />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Day Detail */}
          {plan.days?.[activeDay] && (
            <motion.div key={activeDay} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">{plan.days[activeDay].day}</h3>
                  <p className="text-xs text-gray-500">{plan.days[activeDay].focusArea} · {plan.days[activeDay].totalMinutes} minutes</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary-400">{getCompletionForDay(activeDay)}%</p>
                  <p className="text-xs text-gray-500">completed</p>
                </div>
              </div>

              <div className="space-y-3">
                {(plan.days[activeDay].tasks || []).map((task, ti) => {
                  const key = `${activeDay}-${ti}`
                  const done = completedTasks[key]
                  const Icon = typeIcon[task.type] || BookOpen
                  return (
                    <motion.div key={ti} layout className={`flex gap-4 p-4 rounded-xl border transition-all ${done ? 'border-green-500/30 bg-green-500/5' : 'border-gray-700 bg-gray-800/30 hover:border-gray-600'}`}>
                      <button onClick={() => toggleTask(activeDay, ti)} className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all mt-0.5 ${done ? 'bg-green-500 border-green-500' : 'border-gray-500 hover:border-primary-400'}`}>
                        {done && <CheckCircle className="w-4 h-4 text-white" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className={`text-sm font-medium ${done ? 'text-gray-400 line-through' : 'text-white'}`}>{task.title}</p>
                          <Badge color={priorityColor[task.priority] || 'gray'} size="xs">{task.priority}</Badge>
                        </div>
                        <p className="text-xs text-gray-400 mb-2">{task.description}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{task.time}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{task.duration} min</span>
                          <Badge color={typeColor[task.type] || 'gray'} size="xs"><Icon className="w-2.5 h-2.5" />{task.type}</Badge>
                          {task.resource && <span className="text-gray-600">· {task.resource}</span>}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
                {(!plan.days[activeDay].tasks || plan.days[activeDay].tasks.length === 0) && (
                  <p className="text-center text-gray-500 py-8">Rest day 🎉 Great job on your progress!</p>
                )}
              </div>
            </motion.div>
          )}

          {/* Weekly Milestones */}
          {plan.weeklyMilestones?.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold text-white mb-3">Weekly Milestones</h3>
              <div className="space-y-2">
                {plan.weeklyMilestones.map((m, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                    <Target className="w-4 h-4 text-primary-400 flex-shrink-0" />{m}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Log Modal */}
      {logModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">Log Study Session</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Hours Studied: <span className="text-primary-400">{logForm.hoursStudied}h</span></label>
                <input type="range" min="0.5" max="8" step="0.5" className="w-full accent-primary-500" value={logForm.hoursStudied} onChange={e => setLogForm({ ...logForm, hoursStudied: parseFloat(e.target.value) })} />
              </div>
              <div>
                <label className="label">How do you feel?</label>
                <div className="grid grid-cols-5 gap-2">
                  {[['great','😄'],['good','🙂'],['okay','😐'],['tired','😴'],['struggling','😓']].map(([v, e]) => (
                    <button key={v} onClick={() => setLogForm({ ...logForm, mood: v })} className={`p-2 rounded-lg border text-center text-xs transition-all ${logForm.mood === v ? 'border-primary-500 bg-primary-500/20' : 'border-gray-700 hover:border-gray-600'}`}>
                      <div className="text-lg">{e}</div><div className="text-gray-400 capitalize">{v}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Notes <span className="text-gray-500 font-normal">(optional)</span></label>
                <textarea className="input resize-none" rows={2} placeholder="What did you learn today?" value={logForm.notes} onChange={e => setLogForm({ ...logForm, notes: e.target.value })} />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setLogModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button onClick={logStudy} className="btn-primary flex-1 justify-center"><Zap className="w-4 h-4" /> Log Session</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
