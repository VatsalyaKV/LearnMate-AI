import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { certificateAPI, goalAPI, userAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Trophy, Medal, Award, Star, Target, CheckCircle, Calendar, Zap, Flame, BookOpen, Code, Loader2, ExternalLink, Plus, Edit, Trash2 } from 'lucide-react'
import Badge from '../components/ui/Badge'
import ProgressBar from '../components/ui/ProgressBar'
import Modal from '../components/ui/Modal'
import toast from 'react-hot-toast'

const BADGES = [
  { id: 'first-lesson', icon: BookOpen, label: 'First Step', desc: 'Complete your first lesson', color: 'text-blue-400', bg: 'bg-blue-500/20 border-blue-500/30', earned: true },
  { id: 'streak-7', icon: Flame, label: '7-Day Streak', desc: 'Learn 7 days in a row', color: 'text-orange-400', bg: 'bg-orange-500/20 border-orange-500/30', earned: true },
  { id: 'assessment', icon: Target, label: 'Assessed', desc: 'Complete first assessment', color: 'text-purple-400', bg: 'bg-purple-500/20 border-purple-500/30', earned: true },
  { id: 'course-complete', icon: CheckCircle, label: 'Graduate', desc: 'Complete first course', color: 'text-green-400', bg: 'bg-green-500/20 border-green-500/30', earned: false },
  { id: 'streak-30', icon: Flame, label: '30-Day Streak', desc: 'Learn 30 days in a row', color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/30', earned: false },
  { id: 'xp-1000', icon: Zap, label: 'XP Master', desc: 'Earn 1000 XP', color: 'text-yellow-400', bg: 'bg-yellow-500/20 border-yellow-500/30', earned: false },
  { id: 'roadmap', icon: Star, label: 'Pathfinder', desc: 'Create first roadmap', color: 'text-cyan-400', bg: 'bg-cyan-500/20 border-cyan-500/30', earned: false },
  { id: 'project', icon: Code, label: 'Builder', desc: 'Complete first project', color: 'text-indigo-400', bg: 'bg-indigo-500/20 border-indigo-500/30', earned: false },
]

export default function Achievements() {
  const { user } = useAuth()
  const [certs, setCerts] = useState([])
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [editGoal, setEditGoal] = useState(null)
  const [goalForm, setGoalForm] = useState({ title: '', description: '', type: 'skill', priority: 'medium', targetDate: '' })

  useEffect(() => {
    Promise.all([
      certificateAPI.getAll().then(r => setCerts(r.data.data || [])),
      goalAPI.getAll().then(r => setGoals(r.data.data || [])),
    ]).finally(() => setLoading(false))
  }, [])

  const saveGoal = async () => {
    try {
      if (editGoal) {
        const r = await goalAPI.update(editGoal._id, goalForm)
        setGoals(prev => prev.map(g => g._id === editGoal._id ? r.data.data : g))
        toast.success('Goal updated!')
      } else {
        const r = await goalAPI.create(goalForm)
        setGoals(prev => [r.data.data, ...prev])
        toast.success('🎯 New goal created!')
      }
      setShowGoalModal(false); setEditGoal(null); setGoalForm({ title: '', description: '', type: 'skill', priority: 'medium', targetDate: '' })
    } catch { toast.error('Failed to save goal') }
  }

  const deleteGoal = async (id) => {
    try {
      await goalAPI.delete(id)
      setGoals(prev => prev.filter(g => g._id !== id))
      toast.success('Goal deleted')
    } catch { toast.error('Failed to delete') }
  }

  const toggleGoalStatus = async (goal) => {
    const newStatus = goal.status === 'completed' ? 'active' : 'completed'
    try {
      const r = await goalAPI.update(goal._id, { status: newStatus })
      setGoals(prev => prev.map(g => g._id === goal._id ? r.data.data : g))
      if (newStatus === 'completed') toast.success('🏆 Goal achieved! Great work!')
    } catch { toast.error('Update failed') }
  }

  const xpLevel = Math.floor((user?.xpPoints || 0) / 500) + 1
  const xpProgress = ((user?.xpPoints || 0) % 500) / 5

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary-400" /></div>

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="section-title">Achievements & Goals</h1>
        <p className="section-sub">Track your milestones, earn badges, and celebrate your progress</p>
      </div>

      {/* XP & Level */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card bg-gradient-to-br from-primary-900/50 to-secondary-900/50 border-primary-500/30">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-lg shadow-primary-500/30">
                <span className="text-2xl font-black text-white">{xpLevel}</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-yellow-500 rounded-full flex items-center justify-center">
                <Star className="w-4 h-4 text-white fill-white" />
              </div>
            </div>
            <div>
              <p className="text-xl font-bold text-white">Level {xpLevel}</p>
              <p className="text-gray-400 text-sm">{(user?.xpPoints || 0).toLocaleString()} Total XP</p>
              <div className="flex items-center gap-2 mt-1">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-sm text-orange-400">{user?.streak?.current || 0}-day streak</span>
              </div>
            </div>
          </div>
          <div className="flex-1 md:max-w-xs">
            <div className="flex justify-between text-xs text-gray-400 mb-2">
              <span>Progress to Level {xpLevel + 1}</span>
              <span>{Math.round(xpProgress)}%</span>
            </div>
            <ProgressBar value={xpProgress} color="primary" size="lg" />
            <p className="text-xs text-gray-500 mt-1.5">{500 - ((user?.xpPoints || 0) % 500)} XP to next level</p>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[{ v: user?.totalCoursesCompleted || 0, l: 'Courses', c: 'text-green-400' }, { v: certs.length, l: 'Certificates', c: 'text-yellow-400' }, { v: goals.filter(g => g.status === 'completed').length, l: 'Goals', c: 'text-primary-400' }].map((s, i) => (
              <div key={i}><p className={`text-2xl font-bold ${s.c}`}>{s.v}</p><p className="text-xs text-gray-500">{s.l}</p></div>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Badges */}
        <div className="card">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2"><Medal className="w-5 h-5 text-yellow-400" /> Badges</h3>
          <div className="grid grid-cols-4 gap-3">
            {BADGES.map((badge, i) => {
              const userHas = badge.earned || (user?.badges || []).includes(badge.id)
              return (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${userHas ? `${badge.bg} border-opacity-100` : 'border-gray-800 bg-gray-800/30 opacity-40 grayscale'}`}
                  title={badge.desc}>
                  <badge.icon className={`w-6 h-6 ${userHas ? badge.color : 'text-gray-600'}`} />
                  <p className="text-xs text-center text-gray-300 leading-tight">{badge.label}</p>
                  {userHas && <div className="w-2 h-2 rounded-full bg-green-400" />}
                </motion.div>
              )
            })}
          </div>
          <p className="text-xs text-gray-500 mt-3 text-center">{BADGES.filter(b => b.earned).length} / {BADGES.length} badges earned</p>
        </div>

        {/* Certificates */}
        <div className="card">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2"><Award className="w-5 h-5 text-primary-400" /> Certificates</h3>
          {certs.length > 0 ? (
            <div className="space-y-3">
              {certs.map((cert, i) => (
                <div key={i} className="flex items-center gap-4 p-3 bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-500/30 rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                    <Award className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{cert.title}</p>
                    <p className="text-xs text-gray-400">{cert.issuer} · {new Date(cert.issuedAt).toLocaleDateString()}</p>
                    <p className="text-xs text-yellow-400 font-mono">{cert.certificateId}</p>
                  </div>
                  {cert.verificationUrl && (
                    <a href={cert.verificationUrl} target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:text-primary-300">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Award className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No certificates yet</p>
              <p className="text-gray-600 text-xs mt-1">Complete courses to earn certificates</p>
            </div>
          )}
        </div>
      </div>

      {/* Goals */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white flex items-center gap-2"><Target className="w-5 h-5 text-primary-400" /> Learning Goals</h3>
          <button onClick={() => { setEditGoal(null); setGoalForm({ title: '', description: '', type: 'skill', priority: 'medium', targetDate: '' }); setShowGoalModal(true) }} className="btn-primary text-xs py-1.5 px-3">
            <Plus className="w-3.5 h-3.5" /> New Goal
          </button>
        </div>
        {goals.length > 0 ? (
          <div className="space-y-3">
            {goals.map((goal, i) => (
              <motion.div key={goal._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${goal.status === 'completed' ? 'border-green-500/30 bg-green-500/5' : 'border-gray-700 bg-gray-800/30'}`}>
                <button onClick={() => toggleGoalStatus(goal)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${goal.status === 'completed' ? 'bg-green-500 border-green-500' : 'border-gray-500 hover:border-primary-400'}`}>
                  {goal.status === 'completed' && <CheckCircle className="w-4 h-4 text-white" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className={`text-sm font-medium ${goal.status === 'completed' ? 'text-gray-400 line-through' : 'text-white'}`}>{goal.title}</p>
                    <Badge color={{ career:'cyan', skill:'primary', course:'secondary', project:'warning', certification:'success' }[goal.type] || 'gray'} size="xs">{goal.type}</Badge>
                    <Badge color={{ high:'danger', medium:'warning', low:'success' }[goal.priority] || 'gray'} size="xs">{goal.priority}</Badge>
                  </div>
                  {goal.description && <p className="text-xs text-gray-400 truncate">{goal.description}</p>}
                  {goal.targetDate && <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Calendar className="w-3 h-3" />Due {new Date(goal.targetDate).toLocaleDateString()}</p>}
                  {goal.milestones?.length > 0 && <ProgressBar value={goal.progress || 0} size="sm" className="mt-2" />}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => { setEditGoal(goal); setGoalForm({ title: goal.title, description: goal.description, type: goal.type, priority: goal.priority, targetDate: goal.targetDate?.split('T')[0] || '' }); setShowGoalModal(true) }} className="p-1.5 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-all"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => deleteGoal(goal._id)} className="p-1.5 hover:bg-red-900/30 rounded-lg text-gray-400 hover:text-red-400 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <Target className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm mb-3">No goals set yet</p>
            <button onClick={() => setShowGoalModal(true)} className="btn-primary text-sm"><Plus className="w-4 h-4" /> Set Your First Goal</button>
          </div>
        )}
      </div>

      {/* Goal Modal */}
      <Modal isOpen={showGoalModal} onClose={() => { setShowGoalModal(false); setEditGoal(null) }} title={editGoal ? 'Edit Goal' : 'New Learning Goal'}>
        <div className="space-y-4">
          <div><label className="label">Goal Title</label><input className="input" placeholder="e.g. Master React fundamentals" value={goalForm.title} onChange={e => setGoalForm({ ...goalForm, title: e.target.value })} /></div>
          <div><label className="label">Description <span className="text-gray-500 font-normal">(optional)</span></label><textarea className="input resize-none" rows={2} value={goalForm.description} onChange={e => setGoalForm({ ...goalForm, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Type</label>
              <select className="input" value={goalForm.type} onChange={e => setGoalForm({ ...goalForm, type: e.target.value })}>
                {['career', 'skill', 'course', 'project', 'certification', 'custom'].map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input" value={goalForm.priority} onChange={e => setGoalForm({ ...goalForm, priority: e.target.value })}>
                {['low', 'medium', 'high', 'critical'].map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
              </select>
            </div>
          </div>
          <div><label className="label">Target Date <span className="text-gray-500 font-normal">(optional)</span></label><input type="date" className="input" value={goalForm.targetDate} onChange={e => setGoalForm({ ...goalForm, targetDate: e.target.value })} /></div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => { setShowGoalModal(false); setEditGoal(null) }} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button onClick={saveGoal} disabled={!goalForm.title} className="btn-primary flex-1 justify-center disabled:opacity-50"><Target className="w-4 h-4" /> {editGoal ? 'Update Goal' : 'Create Goal'}</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
