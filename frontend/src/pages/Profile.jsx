import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { userAPI, authAPI, aiAPI } from '../services/api'
import { User, Lock, Bell, Brain, Briefcase, Code, Save, Loader2, Eye, EyeOff, Upload, Github, Linkedin, Globe, MapPin, Phone, Zap, Shield, ChevronRight, Sparkles } from 'lucide-react'
import ProgressBar from '../components/ui/ProgressBar'
import Badge from '../components/ui/Badge'
import toast from 'react-hot-toast'

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'career', label: 'Career & Skills', icon: Briefcase },
  { id: 'learning', label: 'Learning Prefs', icon: Brain },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'ai-tools', label: 'AI Tools', icon: Sparkles },
]

const skillOptions = ['JavaScript','Python','React','Node.js','Java','CSS/HTML','SQL','Git','TypeScript','C++','Data Analysis','Machine Learning','UI/UX Design','DevOps','AWS','Docker','MongoDB','PostgreSQL','GraphQL','REST APIs','Vue.js','Angular','Swift','Kotlin','Flutter']
const interestOptions = ['Web Development','Mobile Apps','AI/ML','Data Science','DevOps','Cybersecurity','UI/UX Design','Backend Dev','Cloud Computing','Blockchain','Game Dev','Product Management']

export default function Profile() {
  const { user, updateUser } = useAuth()
  const [tab, setTab] = useState('profile')
  const [saving, setSaving] = useState(false)
  const [resumeText, setResumeText] = useState('')
  const [resumeAnalysis, setResumeAnalysis] = useState(null)
  const [interviewRole, setInterviewRole] = useState('')
  const [interviewPrep, setInterviewPrep] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })

  const [profile, setProfile] = useState({
    name: user?.name || '', bio: user?.bio || '', phone: user?.phone || '',
    location: user?.location || '', website: user?.website || '',
    linkedIn: user?.linkedIn || '', github: user?.github || '',
  })
  const [career, setCareer] = useState({
    careerGoal: user?.careerGoal || '', targetRole: user?.targetRole || '',
    currentRole: user?.currentRole || '', industry: user?.industry || '',
    yearsOfExperience: user?.yearsOfExperience || 0, education: user?.education || '',
    currentSkills: user?.currentSkills || [], interests: user?.interests || [],
  })
  const [learning, setLearning] = useState({
    preferredStyle: user?.learningPreferences?.preferredStyle || 'mixed',
    studyHoursPerDay: user?.learningPreferences?.studyHoursPerDay || 2,
    preferredTime: user?.learningPreferences?.preferredTime || 'flexible',
    difficulty: user?.learningPreferences?.difficulty || 'adaptive',
  })
  const [notifs, setNotifs] = useState({
    email: user?.notifications?.email ?? true,
    push: user?.notifications?.push ?? true,
    weeklyReport: user?.notifications?.weeklyReport ?? true,
    studyReminders: user?.notifications?.studyReminders ?? true,
  })

  const toggleSkill = (s) => setCareer(p => ({ ...p, currentSkills: p.currentSkills.includes(s) ? p.currentSkills.filter(x => x !== s) : [...p.currentSkills, s] }))
  const toggleInterest = (i) => setCareer(p => ({ ...p, interests: p.interests.includes(i) ? p.interests.filter(x => x !== i) : [...p.interests, i] }))

  const save = async (data, msg) => {
    setSaving(true)
    try {
      const r = await userAPI.updateProfile(data)
      updateUser(r.data.data)
      toast.success(msg || 'Saved!')
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed') }
    finally { setSaving(false) }
  }

  const changePassword = async () => {
    if (pwForm.newPassword !== pwForm.confirmPassword) return toast.error('Passwords do not match')
    if (pwForm.newPassword.length < 8) return toast.error('Password must be at least 8 characters')
    setSaving(true)
    try {
      await authAPI.updatePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
      toast.success('Password updated!')
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const analyzeResume = async () => {
    if (!resumeText.trim()) return toast.error('Please paste your resume text')
    setAiLoading(true)
    try {
      const r = await aiAPI.analyzeResume({ resumeText })
      setResumeAnalysis(r.data.data)
      toast.success('Resume analyzed!')
    } catch { toast.error('Analysis failed') }
    finally { setAiLoading(false) }
  }

  const getInterviewPrep = async () => {
    if (!interviewRole.trim()) return toast.error('Enter a role name')
    setAiLoading(true)
    try {
      const r = await aiAPI.interviewPrep({ role: interviewRole, skills: user?.currentSkills, experienceLevel: 'junior' })
      setInterviewPrep(r.data.data)
    } catch { toast.error('Failed') }
    finally { setAiLoading(false) }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="section-title">Profile & Settings</h1>
        <p className="section-sub">Manage your account, preferences, and AI-powered tools</p>
      </div>

      {/* Profile Header */}
      <div className="card flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-3xl font-black text-white shadow-lg shadow-primary-500/30">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-gray-900" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white">{user?.name}</h2>
          <p className="text-gray-400 text-sm">{user?.email}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge color="primary">{user?.role}</Badge>
            <Badge color="secondary">Level {user?.level || 1}</Badge>
            <Badge color="success">{user?.xpPoints || 0} XP</Badge>
            <Badge color={user?.subscription?.plan === 'pro' ? 'warning' : 'gray'}>{user?.subscription?.plan || 'free'}</Badge>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-xs text-gray-500 mb-1">Profile Completeness</p>
          <p className="text-2xl font-bold text-primary-400">{user?.profileCompleteness || 0}%</p>
          <div className="w-32 mt-1"><ProgressBar value={user?.profileCompleteness || 0} /></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${tab === t.id ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {tab === 'profile' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card space-y-4">
          <h3 className="text-base font-semibold text-white">Personal Information</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div><label className="label">Full Name</label><input className="input" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} /></div>
            <div><label className="label">Phone</label><div className="relative"><Phone className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" /><input className="input pl-9" placeholder="+1 234 567 8900" value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} /></div></div>
            <div><label className="label">Location</label><div className="relative"><MapPin className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" /><input className="input pl-9" placeholder="City, Country" value={profile.location} onChange={e => setProfile({ ...profile, location: e.target.value })} /></div></div>
            <div><label className="label">Website</label><div className="relative"><Globe className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" /><input className="input pl-9" placeholder="https://yoursite.com" value={profile.website} onChange={e => setProfile({ ...profile, website: e.target.value })} /></div></div>
            <div><label className="label">LinkedIn</label><div className="relative"><Linkedin className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" /><input className="input pl-9" placeholder="linkedin.com/in/username" value={profile.linkedIn} onChange={e => setProfile({ ...profile, linkedIn: e.target.value })} /></div></div>
            <div><label className="label">GitHub</label><div className="relative"><Github className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" /><input className="input pl-9" placeholder="github.com/username" value={profile.github} onChange={e => setProfile({ ...profile, github: e.target.value })} /></div></div>
          </div>
          <div><label className="label">Bio</label><textarea className="input resize-none" rows={3} placeholder="Tell us about yourself..." value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })} /></div>
          <button onClick={() => save(profile, 'Profile saved!')} disabled={saving} className="btn-primary">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Profile
          </button>
        </motion.div>
      )}

      {/* Career Tab */}
      {tab === 'career' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <div className="card space-y-4">
            <h3 className="text-base font-semibold text-white">Career Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div><label className="label">Career Goal</label><input className="input" placeholder="e.g. Become a Full Stack Developer" value={career.careerGoal} onChange={e => setCareer({ ...career, careerGoal: e.target.value })} /></div>
              <div><label className="label">Target Role</label><input className="input" placeholder="e.g. Senior Software Engineer" value={career.targetRole} onChange={e => setCareer({ ...career, targetRole: e.target.value })} /></div>
              <div><label className="label">Current Role</label><input className="input" placeholder="e.g. Junior Developer" value={career.currentRole} onChange={e => setCareer({ ...career, currentRole: e.target.value })} /></div>
              <div><label className="label">Industry</label><input className="input" placeholder="e.g. Technology" value={career.industry} onChange={e => setCareer({ ...career, industry: e.target.value })} /></div>
              <div><label className="label">Years of Experience</label><input type="number" min="0" max="50" className="input" value={career.yearsOfExperience} onChange={e => setCareer({ ...career, yearsOfExperience: +e.target.value })} /></div>
              <div><label className="label">Education</label>
                <select className="input" value={career.education} onChange={e => setCareer({ ...career, education: e.target.value })}>
                  <option value="">Select...</option>
                  {["High School","Bachelor's","Master's","PhD","Bootcamp","Self-taught","Other"].map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
            </div>
            <button onClick={() => save(career, 'Career info saved!')} disabled={saving} className="btn-primary">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Career Info
            </button>
          </div>
          <div className="card">
            <h3 className="text-base font-semibold text-white mb-3">Current Skills ({career.currentSkills.length})</h3>
            <div className="flex flex-wrap gap-2">
              {skillOptions.map(s => (
                <button key={s} onClick={() => toggleSkill(s)} className={`text-xs px-3 py-1.5 rounded-full border transition-all ${career.currentSkills.includes(s) ? 'border-primary-500 bg-primary-500/20 text-primary-300' : 'border-gray-700 text-gray-400 hover:border-gray-600'}`}>{s}</button>
              ))}
            </div>
            <div className="mt-3">
              <h3 className="text-base font-semibold text-white mb-3">Interests ({career.interests.length})</h3>
              <div className="flex flex-wrap gap-2">
                {interestOptions.map(i => (
                  <button key={i} onClick={() => toggleInterest(i)} className={`text-xs px-3 py-1.5 rounded-full border transition-all ${career.interests.includes(i) ? 'border-secondary-500 bg-secondary-500/20 text-secondary-300' : 'border-gray-700 text-gray-400 hover:border-gray-600'}`}>{i}</button>
                ))}
              </div>
            </div>
            <button onClick={() => save({ currentSkills: career.currentSkills, interests: career.interests }, 'Skills saved!')} disabled={saving} className="btn-primary mt-4">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Skills
            </button>
          </div>
        </motion.div>
      )}

      {/* Learning Prefs Tab */}
      {tab === 'learning' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card space-y-5">
          <h3 className="text-base font-semibold text-white">Learning Preferences</h3>
          <div>
            <label className="label">Learning Style</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[{v:'visual',l:'👁️ Visual'},{v:'reading',l:'📖 Reading'},{v:'kinesthetic',l:'🤝 Hands-on'},{v:'mixed',l:'🔀 Mixed'}].map(s => (
                <button key={s.v} onClick={() => setLearning({ ...learning, preferredStyle: s.v })} className={`p-3 rounded-xl border text-sm text-center transition-all ${learning.preferredStyle === s.v ? 'border-primary-500 bg-primary-500/20 text-primary-300' : 'border-gray-700 text-gray-400 hover:border-gray-600'}`}>{s.l}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Daily Study Hours: <span className="text-primary-400 font-semibold">{learning.studyHoursPerDay}h</span></label>
            <input type="range" min="0.5" max="8" step="0.5" className="w-full accent-primary-500" value={learning.studyHoursPerDay} onChange={e => setLearning({ ...learning, studyHoursPerDay: +e.target.value })} />
            <div className="flex justify-between text-xs text-gray-500 mt-1"><span>30 min</span><span>8 hours</span></div>
          </div>
          <div>
            <label className="label">Preferred Study Time</label>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
              {['morning','afternoon','evening','night','flexible'].map(t => (
                <button key={t} onClick={() => setLearning({ ...learning, preferredTime: t })} className={`p-2.5 rounded-lg border text-xs capitalize transition-all ${learning.preferredTime === t ? 'border-primary-500 bg-primary-500/20 text-primary-300' : 'border-gray-700 text-gray-400 hover:border-gray-600'}`}>{t}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Difficulty Level</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[{v:'beginner',l:'🌱 Beginner'},{v:'intermediate',l:'📈 Intermediate'},{v:'advanced',l:'🚀 Advanced'},{v:'adaptive',l:'🤖 AI Adaptive'}].map(d => (
                <button key={d.v} onClick={() => setLearning({ ...learning, difficulty: d.v })} className={`p-3 rounded-xl border text-sm text-center transition-all ${learning.difficulty === d.v ? 'border-primary-500 bg-primary-500/20 text-primary-300' : 'border-gray-700 text-gray-400 hover:border-gray-600'}`}>{d.l}</button>
              ))}
            </div>
          </div>
          <button onClick={() => save({ learningPreferences: learning }, 'Learning preferences saved!')} disabled={saving} className="btn-primary">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Preferences
          </button>
        </motion.div>
      )}

      {/* Security Tab */}
      {tab === 'security' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card space-y-4">
          <h3 className="text-base font-semibold text-white flex items-center gap-2"><Shield className="w-5 h-5 text-primary-400" />Change Password</h3>
          {[{label:'Current Password',key:'currentPassword'},{label:'New Password',key:'newPassword'},{label:'Confirm New Password',key:'confirmPassword'}].map(f => (
            <div key={f.key}>
              <label className="label">{f.label}</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} className="input pr-10" placeholder="••••••••" value={pwForm[f.key]} onChange={e => setPwForm({ ...pwForm, [f.key]: e.target.value })} />
                {f.key === 'confirmPassword' && <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-3.5 text-gray-400">{showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>}
              </div>
            </div>
          ))}
          <button onClick={changePassword} disabled={saving} className="btn-primary">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />} Update Password
          </button>
        </motion.div>
      )}

      {/* Notifications Tab */}
      {tab === 'notifications' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card space-y-4">
          <h3 className="text-base font-semibold text-white">Notification Preferences</h3>
          {[{key:'email',label:'Email Notifications',desc:'Receive updates via email'},{key:'push',label:'Push Notifications',desc:'Browser push notifications'},{key:'weeklyReport',label:'Weekly Progress Report',desc:'AI-generated weekly summary'},{key:'studyReminders',label:'Study Reminders',desc:'Daily reminders to stay on track'}].map(n => (
            <div key={n.key} className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
              <div><p className="text-sm font-medium text-white">{n.label}</p><p className="text-xs text-gray-400">{n.desc}</p></div>
              <button onClick={() => setNotifs(p => ({ ...p, [n.key]: !p[n.key] }))} className={`w-12 h-6 rounded-full transition-all ${notifs[n.key] ? 'bg-primary-500' : 'bg-gray-600'}`}>
                <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform mx-0.5 ${notifs[n.key] ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          ))}
          <button onClick={() => save({ notifications: notifs }, 'Notifications saved!')} disabled={saving} className="btn-primary">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Notifications
          </button>
        </motion.div>
      )}

      {/* AI Tools Tab */}
      {tab === 'ai-tools' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          {/* Resume Analysis */}
          <div className="card">
            <h3 className="text-base font-semibold text-white mb-1 flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary-400" />AI Resume Gap Analyzer</h3>
            <p className="text-xs text-gray-400 mb-4">Paste your resume and get AI-powered skill gap analysis for your target role</p>
            <div className="space-y-3">
              <textarea className="input resize-none text-xs" rows={6} placeholder="Paste your resume text here..." value={resumeText} onChange={e => setResumeText(e.target.value)} />
              <button onClick={analyzeResume} disabled={aiLoading || !resumeText.trim()} className="btn-primary disabled:opacity-50">
                {aiLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Analyzing...</> : <><Zap className="w-4 h-4" />Analyze Resume</>}
              </button>
            </div>
            {resumeAnalysis && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-primary-500/10 border border-primary-500/30 rounded-xl">
                    <p className="text-3xl font-bold text-primary-400">{resumeAnalysis.overallScore}%</p>
                    <p className="text-xs text-gray-400 mt-1">Overall Score</p>
                  </div>
                  <div className="text-center p-4 bg-secondary-500/10 border border-secondary-500/30 rounded-xl">
                    <p className="text-3xl font-bold text-secondary-400">{resumeAnalysis.careerReadinessScore}%</p>
                    <p className="text-xs text-gray-400 mt-1">Career Readiness</p>
                  </div>
                </div>
                {resumeAnalysis.recommendations?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-white mb-2">Recommendations</p>
                    <div className="space-y-2">
                      {resumeAnalysis.recommendations.slice(0, 4).map((rec, i) => (
                        <div key={i} className={`p-3 rounded-lg border text-xs ${rec.priority === 'high' ? 'border-red-500/30 bg-red-500/10' : 'border-gray-700 bg-gray-800/50'}`}>
                          <p className="font-medium text-white">{rec.category}</p>
                          <p className="text-gray-400 mt-0.5">{rec.action}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {resumeAnalysis.summary && <p className="text-xs text-gray-300 leading-relaxed p-3 bg-gray-800 rounded-lg">{resumeAnalysis.summary}</p>}
              </div>
            )}
          </div>

          {/* Interview Prep */}
          <div className="card">
            <h3 className="text-base font-semibold text-white mb-1 flex items-center gap-2"><Briefcase className="w-4 h-4 text-secondary-400" />AI Interview Preparation</h3>
            <p className="text-xs text-gray-400 mb-4">Get AI-generated interview questions and answers for any role</p>
            <div className="flex gap-3">
              <input className="input flex-1" placeholder="e.g. Frontend Developer, Data Scientist..." value={interviewRole} onChange={e => setInterviewRole(e.target.value)} />
              <button onClick={getInterviewPrep} disabled={aiLoading || !interviewRole.trim()} className="btn-primary disabled:opacity-50 flex-shrink-0">
                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Zap className="w-4 h-4" />Generate</>}
              </button>
            </div>
            {interviewPrep && (
              <div className="mt-4 space-y-3">
                {interviewPrep.tipOfTheDay && (
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-xs text-yellow-300">💡 {interviewPrep.tipOfTheDay}</div>
                )}
                {(interviewPrep.commonQuestions || []).slice(0, 5).map((q, i) => (
                  <div key={i} className="p-4 bg-gray-800 rounded-xl border border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs bg-primary-500/20 text-primary-300 px-2 py-0.5 rounded">{q.category}</span>
                      <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded capitalize">{q.difficulty}</span>
                    </div>
                    <p className="text-sm font-medium text-white mb-2">{q.question}</p>
                    {q.sampleAnswer && <p className="text-xs text-gray-400 leading-relaxed">{q.sampleAnswer}</p>}
                  </div>
                ))}
                {interviewPrep.salaryRange && <p className="text-xs text-gray-400">💰 Salary Range: <span className="text-green-400 font-medium">{interviewPrep.salaryRange}</span></p>}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}
