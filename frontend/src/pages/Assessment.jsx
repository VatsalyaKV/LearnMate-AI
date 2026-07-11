import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { assessmentAPI, aiAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { ClipboardCheck, ChevronRight, ChevronLeft, CheckCircle, XCircle, Loader2, Trophy, Target, Zap, Brain, AlertCircle, BarChart2, RefreshCw } from 'lucide-react'
import ProgressBar from '../components/ui/ProgressBar'
import Badge from '../components/ui/Badge'
import toast from 'react-hot-toast'

const domains = ['Web Development', 'Data Science', 'Machine Learning', 'DevOps', 'Mobile Development', 'UI/UX Design', 'Cybersecurity', 'Cloud Computing', 'Blockchain', 'Game Development']
const levels = [{ v: 'beginner', l: 'Beginner', d: 'New to this field' }, { v: 'intermediate', l: 'Intermediate', d: '1-3 years exp' }, { v: 'advanced', l: 'Advanced', d: '3+ years exp' }]

export default function Assessment() {
  const { user } = useAuth()
  const [phase, setPhase] = useState('setup') // setup | loading | quiz | result
  const [domain, setDomain] = useState('')
  const [level, setLevel] = useState('beginner')
  const [assessmentId, setAssessmentId] = useState(null)
  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [results, setResults] = useState(null)
  const [pastAssessments, setPastAssessments] = useState([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    assessmentAPI.getAll().then(r => setPastAssessments(r.data.data || [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (phase !== 'quiz' || !timeLeft) return
    const t = setInterval(() => setTimeLeft(p => { if (p <= 1) { clearInterval(t); handleSubmit(); return 0 } return p - 1 }), 1000)
    return () => clearInterval(t)
  }, [phase, timeLeft])

  const startAssessment = async () => {
    if (!domain) return toast.error('Please select a domain')
    setPhase('loading')
    try {
      const r = await assessmentAPI.start({ domain, level, type: 'initial' })
      setAssessmentId(r.data.data.assessmentId)
      setQuestions(r.data.data.questions)
      setTimeLeft(r.data.data.questions.length * 120)
      setAnswers({})
      setCurrent(0)
      setPhase('quiz')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate assessment')
      setPhase('setup')
    }
  }

  const answer = (qIdx, ans) => setAnswers(prev => ({ ...prev, [qIdx]: { answer: ans } }))

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const r = await assessmentAPI.submit(assessmentId, { answers: Object.values(answers), timeTaken: Math.floor((questions.length * 120 - timeLeft) / 60) })
      setResults(r.data.data)
      setPhase('result')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed')
    } finally { setSubmitting(false) }
  }

  const q = questions[current]
  const progress = questions.length > 0 ? ((current) / questions.length) * 100 : 0
  const mins = Math.floor(timeLeft / 60), secs = timeLeft % 60

  if (phase === 'loading') return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
        <Brain className="w-8 h-8 text-white animate-pulse" />
      </div>
      <p className="text-lg font-semibold text-white">Generating Your Assessment...</p>
      <p className="text-gray-400 text-sm">IBM Granite AI is creating personalized questions for you</p>
      <div className="w-48 h-1.5 bg-gray-800 rounded-full overflow-hidden mt-2">
        <div className="h-full bg-primary-500 rounded-full animate-pulse w-3/4" />
      </div>
    </div>
  )

  if (phase === 'result' && results) return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card text-center bg-gradient-to-br from-primary-900/50 to-secondary-900/50 border-primary-500/30">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl font-bold text-white">{results.overallScore}%</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Assessment Complete!</h2>
        <p className="text-gray-400 mb-2">{domain} · {results.earnedPoints}/{results.totalPoints} points</p>
        <Badge color={results.overallScore >= 80 ? 'success' : results.overallScore >= 60 ? 'warning' : 'danger'} size="md">
          {results.overallScore >= 80 ? '🏆 Excellent' : results.overallScore >= 60 ? '👍 Good' : '📚 Needs Practice'}
        </Badge>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Target className="w-4 h-4 text-primary-400" /> Skill Results</h3>
          <div className="space-y-3">
            {(results.skillResults || []).map((s, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1"><span className="text-gray-300">{s.skill}</span><span className="text-primary-400">{s.score}%</span></div>
                <ProgressBar value={s.score} color={s.score >= 70 ? 'success' : s.score >= 50 ? 'warning' : 'danger'} />
                <p className="text-xs text-gray-500 mt-1">{s.recommendation}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Strengths</h3>
            <div className="flex flex-wrap gap-2">{(results.strengthAreas || []).map((s, i) => <Badge key={i} color="success">{s}</Badge>)}</div>
          </div>
          <div className="card">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><AlertCircle className="w-4 h-4 text-yellow-400" /> Areas to Improve</h3>
            <div className="flex flex-wrap gap-2">{(results.weakAreas || []).map((w, i) => <Badge key={i} color="warning">{w}</Badge>)}</div>
          </div>
          <div className="card">
            <h3 className="font-semibold text-white mb-3">AI Recommendations</h3>
            <ul className="space-y-2">{(results.recommendations || []).map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-300"><ChevronRight className="w-4 h-4 text-primary-400 flex-shrink-0 mt-0.5" />{r}</li>
            ))}</ul>
          </div>
        </div>
      </div>

      {results.aiAnalysis && (
        <div className="card border-primary-500/30 bg-primary-900/20">
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><Brain className="w-4 h-4 text-primary-400" /> AI Analysis</h3>
          <p className="text-sm text-gray-300 leading-relaxed">{results.aiAnalysis}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={() => setPhase('setup')} className="btn-secondary flex-1 justify-center"><RefreshCw className="w-4 h-4" /> New Assessment</button>
      </div>
    </div>
  )

  if (phase === 'quiz' && q) return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-gray-400">Question {current + 1} of {questions.length}</p>
          <p className="text-xs text-gray-600 mt-0.5">{domain} · {q.skillArea}</p>
        </div>
        <div className={`text-sm font-mono font-bold px-3 py-1.5 rounded-lg border ${timeLeft < 60 ? 'border-red-500/50 text-red-400 bg-red-500/10' : 'border-gray-700 text-gray-300 bg-gray-800'}`}>
          {mins}:{secs.toString().padStart(2, '0')}
        </div>
      </div>

      <ProgressBar value={progress} className="mb-6" />

      <AnimatePresence mode="wait">
        <motion.div key={current} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
          <div className="card mb-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary-500/20 border border-primary-500/30 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-primary-400">Q{current + 1}</span>
              </div>
              <p className="text-base text-white leading-relaxed">{q.question}</p>
            </div>
          </div>

          <div className="space-y-3">
            {(q.options || []).map((opt, i) => (
              <button key={i} onClick={() => answer(current, opt.charAt(0))}
                className={`w-full text-left p-4 rounded-xl border transition-all ${answers[current]?.answer === opt.charAt(0) ? 'border-primary-500 bg-primary-500/20 text-white' : 'border-gray-700 bg-gray-800/50 text-gray-300 hover:border-gray-600 hover:bg-gray-800'}`}>
                <span className="text-sm leading-relaxed">{opt}</span>
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-between mt-6">
        <button onClick={() => setCurrent(p => p - 1)} disabled={current === 0} className="btn-secondary disabled:opacity-40">
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>
        {current < questions.length - 1 ? (
          <button onClick={() => setCurrent(p => p + 1)} disabled={!answers[current]} className="btn-primary disabled:opacity-40">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={submitting || Object.keys(answers).length < questions.length * 0.6} className="btn-primary disabled:opacity-40">
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><Trophy className="w-4 h-4" /> Submit</>}
          </button>
        )}
      </div>
      <p className="text-xs text-center text-gray-600 mt-3">{Object.keys(answers).length} of {questions.length} answered</p>
    </div>
  )

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="section-title">Skill Assessment</h1>
        <p className="section-sub">AI-powered assessments to evaluate your skills and guide your learning path</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <h2 className="text-lg font-semibold text-white mb-6">Start New Assessment</h2>
          <div className="space-y-6">
            <div>
              <label className="label">Select Domain</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {domains.map(d => (
                  <button key={d} onClick={() => setDomain(d)} className={`p-3 rounded-lg border text-sm text-left transition-all ${domain === d ? 'border-primary-500 bg-primary-500/20 text-primary-300' : 'border-gray-700 text-gray-400 hover:border-gray-600'}`}>{d}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Your Level</label>
              <div className="grid grid-cols-3 gap-3 mt-1">
                {levels.map(l => (
                  <button key={l.v} onClick={() => setLevel(l.v)} className={`p-3 rounded-lg border text-center transition-all ${level === l.v ? 'border-primary-500 bg-primary-500/20' : 'border-gray-700 hover:border-gray-600'}`}>
                    <p className={`text-sm font-medium ${level === l.v ? 'text-primary-300' : 'text-white'}`}>{l.l}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{l.d}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-gray-800 rounded-xl">
              <Brain className="w-8 h-8 text-primary-400" />
              <div>
                <p className="text-sm font-medium text-white">AI-Generated Questions</p>
                <p className="text-xs text-gray-400">10 personalized questions · ~20 minutes · Instant analysis</p>
              </div>
            </div>
            <button onClick={startAssessment} disabled={!domain} className="btn-primary w-full justify-center py-3 text-base disabled:opacity-50">
              <Zap className="w-4 h-4" /> Start Assessment
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card">
            <h3 className="text-sm font-semibold text-white mb-3">Past Assessments</h3>
            {pastAssessments.length > 0 ? pastAssessments.slice(0, 5).map((a, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5 border-b border-gray-800 last:border-0">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${a.overallScore >= 70 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{a.overallScore}%</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{a.title}</p>
                  <p className="text-xs text-gray-500">{new Date(a.completedAt || a.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            )) : <p className="text-sm text-gray-500 py-4 text-center">No assessments yet</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
