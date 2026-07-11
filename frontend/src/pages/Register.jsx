import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { Zap, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const perks = ['Personalized AI learning roadmap', 'IBM watsonx.ai Granite coaching', 'Smart skill assessments', 'Progress analytics & certificates']

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', careerGoal: '' })
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters')
    setLoading(true)
    try {
      const user = await register(form)
      toast.success(`Welcome to LearnMate AI, ${user.name}! 🚀`)
      navigate('/onboarding')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-gray-950 to-secondary-900/20" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-5xl grid md:grid-cols-2 gap-0 overflow-hidden rounded-2xl border border-gray-800">
        {/* Left */}
        <div className="hidden md:flex flex-col justify-between bg-gradient-to-br from-primary-900 to-secondary-900 p-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center"><Zap className="w-5 h-5 text-white" /></div>
            <span className="font-bold text-white text-lg">LearnMate AI</span>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white mb-4">Start Your Learning Journey Today</h2>
            <p className="text-primary-200 mb-8 leading-relaxed">Join thousands of learners using AI to accelerate their career growth.</p>
            <div className="space-y-3">
              {perks.map((p, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-primary-100">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />{p}
                </div>
              ))}
            </div>
          </div>
          <p className="text-primary-300 text-sm">Free forever · No credit card required</p>
        </div>
        {/* Right */}
        <div className="bg-gray-900 p-8 md:p-10">
          <div className="md:hidden text-center mb-6">
            <div className="inline-flex items-center gap-2"><Zap className="w-6 h-6 text-primary-400" /><span className="font-bold text-xl text-white">LearnMate AI</span></div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Create your account</h1>
          <p className="text-gray-400 text-sm mb-6">Get your personalized AI learning roadmap in minutes</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input className="input" placeholder="John Doe" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={show ? 'text' : 'password'} className="input pr-10" placeholder="Min 8 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">Career Goal <span className="text-gray-500 font-normal">(optional)</span></label>
              <input className="input" placeholder="e.g. Become a Full Stack Developer" value={form.careerGoal} onChange={e => setForm({ ...form, careerGoal: e.target.value })} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-base">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : 'Create Free Account'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-400 mt-6">Already have an account? <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">Sign in</Link></p>
        </div>
      </motion.div>
    </div>
  )
}
