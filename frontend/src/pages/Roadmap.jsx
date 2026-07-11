import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { roadmapAPI, aiAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Map, Plus, Sparkles, ChevronDown, ChevronRight, CheckCircle, Clock, Loader2, BookOpen, Code, Trophy, ArrowRight, Play, Target, Zap, RefreshCw, Lock } from 'lucide-react'
import ProgressBar from '../components/ui/ProgressBar'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import toast from 'react-hot-toast'

const statusColor = { pending: 'gray', 'in-progress': 'primary', completed: 'success', locked: 'gray' }
const statusIcon = { pending: Clock, 'in-progress': Play, completed: CheckCircle, locked: Lock }

export default function Roadmap() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [roadmaps, setRoadmaps] = useState([])
  const [active, setActive] = useState(null)
  const [expandedPhase, setExpandedPhase] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [showGenModal, setShowGenModal] = useState(false)

  useEffect(() => {
    loadRoadmaps()
  }, [])

  const loadRoadmaps = async () => {
    setLoading(true)
    try {
      const r = await roadmapAPI.getAll()
      const list = r.data.data || []
      setRoadmaps(list)
      if (list.length > 0) { setActive(list[0]); setExpandedPhase(0) }
    } catch {}
    finally { setLoading(false) }
  }

  const generateRoadmap = async () => {
    setGenerating(true)
    setShowGenModal(false)
    try {
      const r = await roadmapAPI.create({})
      toast.success('🗺️ Personalized roadmap generated!')
      loadRoadmaps()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Generation failed')
    } finally { setGenerating(false) }
  }

  const updateCourseStatus = async (phaseIdx, courseIdx, status) => {
    if (!active) return
    try {
      const r = await roadmapAPI.updateProgress(active._id, { phaseIndex: phaseIdx, courseIndex: courseIdx, status })
      setActive(r.data.data)
      setRoadmaps(prev => prev.map(rm => rm._id === r.data.data._id ? r.data.data : rm))
      if (status === 'completed') toast.success('✅ Course marked complete! +100 XP')
    } catch { toast.error('Update failed') }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary-400" /></div>

  if (roadmaps.length === 0) return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="card text-center py-16">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500/20 to-secondary-500/20 border border-primary-500/30 flex items-center justify-center mx-auto mb-6">
          <Map className="w-10 h-10 text-primary-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">No Roadmap Yet</h2>
        <p className="text-gray-400 mb-6 max-w-md mx-auto">Let IBM Granite AI analyze your profile and generate a fully personalized learning roadmap tailored to your goals.</p>
        <button onClick={() => setShowGenModal(true)} disabled={generating} className="btn-primary justify-center px-8 py-3 text-base">
          {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Generate My Roadmap</>}
        </button>
        {!user?.targetRole && <p className="text-xs text-yellow-400 mt-4 flex items-center justify-center gap-1"><Target className="w-3.5 h-3.5" /> Set your target role in Profile for better results</p>}
      </div>
    </div>
  )

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title">Learning Roadmap</h1>
          <p className="section-sub">Your AI-generated personalized learning pathway</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowGenModal(true)} disabled={generating} className="btn-secondary text-sm">
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} New Roadmap
          </button>
        </div>
      </div>

      {/* Roadmap selector if multiple */}
      {roadmaps.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {roadmaps.map(rm => (
            <button key={rm._id} onClick={() => setActive(rm)} className={`flex-shrink-0 px-4 py-2 rounded-lg border text-sm transition-all ${active?._id === rm._id ? 'border-primary-500 bg-primary-500/20 text-primary-300' : 'border-gray-700 text-gray-400 hover:border-gray-600'}`}>
              {rm.title}
            </button>
          ))}
        </div>
      )}

      {active && (
        <>
          {/* Overview */}
          <div className="card bg-gradient-to-br from-primary-900/30 to-secondary-900/30 border-primary-500/30">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-xl font-bold text-white">{active.title}</h2>
                  <Badge color={active.status === 'completed' ? 'success' : 'primary'}>{active.status}</Badge>
                </div>
                <p className="text-gray-400 text-sm mb-4">{active.description}</p>
                <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {active.estimatedDuration} weeks</span>
                  <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" /> {active.phases?.length} phases</span>
                  <span className="flex items-center gap-1.5"><Target className="w-4 h-4" /> {active.goal}</span>
                </div>
              </div>
              <div className="text-center min-w-[100px]">
                <div className="relative w-20 h-20 mx-auto mb-2">
                  <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1f2937" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#3b82f6" strokeWidth="3" strokeDasharray={`${active.overallProgress || 0} 100`} strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-white">{active.overallProgress || 0}%</span>
                </div>
                <p className="text-xs text-gray-400">Overall Progress</p>
              </div>
            </div>
            {active.aiReasoning && (
              <div className="mt-4 pt-4 border-t border-primary-500/20">
                <p className="text-xs text-gray-400 flex items-start gap-2"><Sparkles className="w-3.5 h-3.5 text-primary-400 flex-shrink-0 mt-0.5" />{active.aiReasoning}</p>
              </div>
            )}
          </div>

          {/* Phases */}
          <div className="space-y-4">
            {(active.phases || []).map((phase, pi) => {
              const StatusIcon = statusIcon[phase.status] || Clock
              const isExpanded = expandedPhase === pi
              const phaseProgress = phase.courses?.length > 0 ? (phase.courses.filter(c => c.status === 'completed').length / phase.courses.length) * 100 : 0

              return (
                <motion.div key={pi} layout className={`card ${phase.status === 'locked' ? 'opacity-60' : ''}`}>
                  <button onClick={() => setExpandedPhase(isExpanded ? null : pi)} className="w-full flex items-center gap-4 text-left">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${phase.status === 'completed' ? 'bg-green-500/20 border border-green-500/30' : phase.status === 'in-progress' ? 'bg-primary-500/20 border border-primary-500/30' : 'bg-gray-800 border border-gray-700'}`}>
                      <StatusIcon className={`w-5 h-5 ${phase.status === 'completed' ? 'text-green-400' : phase.status === 'in-progress' ? 'text-primary-400' : 'text-gray-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-500">Phase {phase.phaseNumber || pi + 1}</span>
                        <Badge color={statusColor[phase.status] || 'gray'} size="xs">{phase.status}</Badge>
                      </div>
                      <p className="text-sm font-semibold text-white">{phase.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{phase.duration} weeks · {phase.courses?.length || 0} courses · {phase.skills?.length || 0} skills</p>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="hidden sm:block w-32">
                        <ProgressBar value={phaseProgress} />
                        <p className="text-xs text-gray-500 mt-1 text-right">{Math.round(phaseProgress)}%</p>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="pt-4 mt-4 border-t border-gray-800 space-y-4">
                          {phase.description && <p className="text-sm text-gray-400">{phase.description}</p>}

                          {/* Skills */}
                          {phase.skills?.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-gray-400 mb-2">Skills You'll Learn</p>
                              <div className="flex flex-wrap gap-2">{phase.skills.map((s, si) => <Badge key={si} color="secondary">{s}</Badge>)}</div>
                            </div>
                          )}

                          {/* Courses */}
                          {phase.courses?.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-gray-400 mb-2">Courses</p>
                              <div className="space-y-2">
                                {phase.courses.map((course, ci) => (
                                  <div key={ci} className={`flex items-center gap-3 p-3 rounded-lg border ${course.status === 'completed' ? 'border-green-500/30 bg-green-500/5' : 'border-gray-700 bg-gray-800/50'}`}>
                                    <button onClick={() => updateCourseStatus(pi, ci, course.status === 'completed' ? 'pending' : 'completed')}
                                      className={`w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center transition-all ${course.status === 'completed' ? 'bg-green-500 border-green-500' : 'border-gray-500 hover:border-primary-400'}`}>
                                      {course.status === 'completed' && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                                    </button>
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-sm font-medium ${course.status === 'completed' ? 'text-green-300 line-through decoration-green-500/50' : 'text-white'}`}>{course.title}</p>
                                      <p className="text-xs text-gray-500">{course.platform} · {course.duration}h</p>
                                    </div>
                                    {course.url && (
                                      <a href={course.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1 flex-shrink-0">
                                        Open <ArrowRight className="w-3 h-3" />
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Projects */}
                          {phase.projects?.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-gray-400 mb-2">Projects to Build</p>
                              <div className="space-y-2">
                                {phase.projects.map((proj, pji) => (
                                  <div key={pji} className="p-3 rounded-lg border border-gray-700 bg-gray-800/30">
                                    <div className="flex items-start justify-between gap-2">
                                      <div>
                                        <p className="text-sm font-medium text-white flex items-center gap-2">
                                          <Code className="w-3.5 h-3.5 text-secondary-400" />{proj.title}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">{proj.description}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                          <Badge color="secondary" size="xs">{proj.difficulty}</Badge>
                                          <span className="text-xs text-gray-500">~{proj.estimatedHours}h</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Milestones */}
                          {phase.milestones?.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-gray-400 mb-2">Milestones</p>
                              <div className="space-y-1.5">
                                {phase.milestones.map((m, mi) => (
                                  <div key={mi} className={`flex items-center gap-2 text-xs ${m.isCompleted ? 'text-green-400' : 'text-gray-400'}`}>
                                    <CheckCircle className={`w-3.5 h-3.5 ${m.isCompleted ? 'text-green-400' : 'text-gray-600'}`} />
                                    {m.title}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        </>
      )}

      {/* Generate Modal */}
      <Modal isOpen={showGenModal} onClose={() => setShowGenModal(false)} title="Generate AI Roadmap">
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Generate Personalized Roadmap</h3>
          <p className="text-gray-400 text-sm mb-6">IBM Granite AI will analyze your profile, skills, and career goals to create a fully personalized learning pathway.</p>
          {!user?.targetRole && <p className="text-yellow-400 text-xs mb-4">💡 Tip: Set your target role in Profile for better results</p>}
          <div className="flex gap-3">
            <button onClick={() => setShowGenModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button onClick={generateRoadmap} className="btn-primary flex-1 justify-center"><Zap className="w-4 h-4" /> Generate</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
