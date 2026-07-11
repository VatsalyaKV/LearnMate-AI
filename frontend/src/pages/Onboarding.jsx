import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../services/api'
import { Zap, ChevronRight, ChevronLeft, Loader2, Check } from 'lucide-react'
import toast from 'react-hot-toast'

const steps = [
  { id: 1, title: 'Your Career Goal', desc: 'What do you want to achieve?' },
  { id: 2, title: 'Your Background', desc: 'Tell us about your experience' },
  { id: 3, title: 'Learning Style', desc: 'How do you learn best?' },
  { id: 4, title: 'Your Skills', desc: 'What do you already know?' },
]

const skillOptions = ['JavaScript', 'Python', 'React', 'Node.js', 'Java', 'CSS/HTML', 'SQL', 'Git', 'TypeScript', 'Java', 'C++', 'Data Analysis', 'Machine Learning', 'UI/UX Design', 'DevOps', 'AWS', 'Docker', 'MongoDB']
const interestOptions = ['Web Development', 'Mobile Apps', 'AI/ML', 'Data Science', 'DevOps', 'Cybersecurity', 'UI/UX Design', 'Backend Dev', 'Cloud Computing', 'Blockchain', 'Game Dev', 'Product Management']
const roles = ['Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Data Scientist', 'ML Engineer', 'DevOps Engineer', 'UI/UX Designer', 'Mobile Developer', 'Cybersecurity Analyst', 'Product Manager', 'Data Analyst', 'Cloud Architect']

export default function Onboarding() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState({
    careerGoal: user?.careerGoal || '',
    targetRole: '', currentRole: '', education: '', yearsOfExperience: 0,
    industry: '', currentSkills: [], interests: [],
    learningPreferences: { preferredStyle: 'mixed', studyHoursPerDay: 2, preferredTime: 'flexible', difficulty: 'adaptive' },
  })

  const toggle = (key, val) => {
    setData(prev => ({
      ...prev,
      [key]: prev[key].includes(val) ? prev[key].filter(x => x !== val) : [...prev[key], val]
    }))
  }

  const finish = async () => {
    setLoading(true)
    try {
      const res = await authAPI.onboarding(data)
      updateUser(res.data.data)
      toast.success('Profile setup complete! Generating your roadmap... 🚀')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Setup failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-gray-950 to-secondary-900/20" />
      <div className="relative w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4"><Zap className="w-6 h-6 text-primary-400" /><span className="font-bold text-xl text-white">LearnMate AI</span></div>
          <h1 className="text-3xl font-bold text-white mb-2">Let's personalize your experience</h1>
          <p className="text-gray-400">Step {step} of {steps.length}</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {steps.map(s => (
            <div key={s.id} className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${s.id <= step ? 'bg-primary-500' : 'bg-gray-800'}`} />
          ))}
        </div>

        <div className="card">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-xl font-bold text-white mb-1">{steps[step - 1].title}</h2>
              <p className="text-gray-400 text-sm mb-6">{steps[step - 1].desc}</p>

              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="label">Career Goal</label>
                    <input className="input" placeholder="e.g. Become a Full Stack Developer" value={data.careerGoal} onChange={e => setData({ ...data, careerGoal: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Target Role</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                      {roles.map(r => (
                        <button key={r} onClick={() => setData({ ...data, targetRole: r })} className={`text-xs px-3 py-2 rounded-lg border transition-all ${data.targetRole === r ? 'border-primary-500 bg-primary-500/20 text-primary-300' : 'border-gray-700 text-gray-400 hover:border-gray-600'}`}>{r}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="label">Current Role</label>
                    <input className="input" placeholder="e.g. Student, Junior Developer" value={data.currentRole} onChange={e => setData({ ...data, currentRole: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Education</label>
                    <select className="input" value={data.education} onChange={e => setData({ ...data, education: e.target.value })}>
                      <option value="">Select education level</option>
                      {['High School', "Bachelor's Degree", "Master's Degree", 'PhD', 'Bootcamp', 'Self-taught', 'Other'].map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Years of Experience</label>
                      <input type="number" min="0" max="30" className="input" value={data.yearsOfExperience} onChange={e => setData({ ...data, yearsOfExperience: parseInt(e.target.value) || 0 })} />
                    </div>
                    <div>
                      <label className="label">Industry</label>
                      <input className="input" placeholder="e.g. Technology" value={data.industry} onChange={e => setData({ ...data, industry: e.target.value })} />
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5">
                  <div>
                    <label className="label">Learning Style</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[{v:'visual',l:'Visual (Videos)'},{v:'reading',l:'Reading'},{v:'kinesthetic',l:'Hands-on'},{v:'mixed',l:'Mixed'}].map(s => (
                        <button key={s.v} onClick={() => setData({ ...data, learningPreferences: { ...data.learningPreferences, preferredStyle: s.v } })} className={`p-3 rounded-lg border text-sm transition-all ${data.learningPreferences.preferredStyle === s.v ? 'border-primary-500 bg-primary-500/20 text-primary-300' : 'border-gray-700 text-gray-400 hover:border-gray-600'}`}>{s.l}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="label">Daily Study Hours: <span className="text-primary-400">{data.learningPreferences.studyHoursPerDay}h</span></label>
                    <input type="range" min="0.5" max="8" step="0.5" className="w-full accent-primary-500" value={data.learningPreferences.studyHoursPerDay} onChange={e => setData({ ...data, learningPreferences: { ...data.learningPreferences, studyHoursPerDay: parseFloat(e.target.value) } })} />
                    <div className="flex justify-between text-xs text-gray-500 mt-1"><span>30 min</span><span>8 hours</span></div>
                  </div>
                  <div>
                    <label className="label">Preferred Study Time</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['morning','afternoon','evening','night','flexible'].map(t => (
                        <button key={t} onClick={() => setData({ ...data, learningPreferences: { ...data.learningPreferences, preferredTime: t } })} className={`p-2 rounded-lg border text-xs capitalize transition-all ${data.learningPreferences.preferredTime === t ? 'border-primary-500 bg-primary-500/20 text-primary-300' : 'border-gray-700 text-gray-400 hover:border-gray-600'}`}>{t}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="label">Interests</label>
                    <div className="flex flex-wrap gap-2">
                      {interestOptions.map(i => (
                        <button key={i} onClick={() => toggle('interests', i)} className={`text-xs px-3 py-1.5 rounded-full border transition-all ${data.interests.includes(i) ? 'border-secondary-500 bg-secondary-500/20 text-secondary-300' : 'border-gray-700 text-gray-400 hover:border-gray-600'}`}>{i}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div>
                  <label className="label">Select your current skills ({data.currentSkills.length} selected)</label>
                  <div className="flex flex-wrap gap-2">
                    {skillOptions.map(s => (
                      <button key={s} onClick={() => toggle('currentSkills', s)} className={`text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${data.currentSkills.includes(s) ? 'border-primary-500 bg-primary-500/20 text-primary-300' : 'border-gray-700 text-gray-400 hover:border-gray-600'}`}>
                        {data.currentSkills.includes(s) && <Check className="w-3 h-3" />}{s}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-3">Don't worry if you're a beginner — you can select none!</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between mt-8 pt-6 border-t border-gray-800">
            <button onClick={() => setStep(s => s - 1)} disabled={step === 1} className="btn-secondary disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            {step < steps.length ? (
              <button onClick={() => setStep(s => s + 1)} className="btn-primary">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={finish} disabled={loading} className="btn-primary">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Setting up...</> : <><Check className="w-4 h-4" /> Complete Setup</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
