import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Bot, Map, BarChart3, Trophy, ArrowRight, Star, CheckCircle, Users, BookOpen, Target, Brain, Sparkles, ChevronRight } from 'lucide-react'

const features = [
  { icon: Bot, title: 'Agentic AI Coach', desc: 'IBM Granite-powered AI that autonomously guides your learning journey with personalized recommendations.' },
  { icon: Map, title: 'Smart Roadmaps', desc: 'AI-generated personalized learning pathways tailored to your career goals and skill level.' },
  { icon: Brain, title: 'Skill Assessment', desc: 'Intelligent assessments that accurately measure your skills and identify knowledge gaps.' },
  { icon: BarChart3, title: 'Learning Analytics', desc: 'Deep insights into your learning patterns, productivity scores and progress tracking.' },
  { icon: Target, title: 'Goal Tracking', desc: 'Set, track and achieve your learning goals with AI-powered milestone management.' },
  { icon: Trophy, title: 'Achievements', desc: 'Earn certificates, badges and XP points as you progress through your learning journey.' },
]

const stats = [
  { value: '50K+', label: 'Active Learners' },
  { value: '95%', label: 'Goal Achievement Rate' },
  { value: '200+', label: 'Learning Pathways' },
  { value: '4.9★', label: 'Average Rating' },
]

const testimonials = [
  { name: 'Sarah Chen', role: 'Frontend Developer', text: 'LearnMate AI created a perfect roadmap for me. I landed my dream job in 6 months!', avatar: 'S' },
  { name: 'Marcus Johnson', role: 'Data Scientist', text: 'The AI coach understands exactly what I need. It feels like having a personal mentor 24/7.', avatar: 'M' },
  { name: 'Priya Patel', role: 'Full Stack Engineer', text: 'The personalized study plans saved me hours every week. Incredible product!', avatar: 'P' },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">LearnMate AI</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Reviews</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5">Login</Link>
            <Link to="/register" className="btn-primary text-sm py-1.5 px-4">Get Started <ArrowRight className="w-3.5 h-3.5" /></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-gray-950 to-secondary-900/20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-500/5 rounded-full blur-3xl" />
        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/30 rounded-full px-4 py-1.5 text-primary-300 text-sm mb-8">
            <Sparkles className="w-4 h-4" /> Powered by IBM watsonx.ai Granite Models
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
            Your AI-Powered<br /><span className="bg-gradient-to-r from-primary-400 via-secondary-400 to-accent-500 bg-clip-text text-transparent">Learning Coach</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            LearnMate AI autonomously creates, monitors, and adapts your personalized learning pathway using genuine Agentic AI — not just a chatbot.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn-primary text-base px-8 py-3.5 rounded-xl justify-center">
              Start Learning Free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/login" className="btn-secondary text-base px-8 py-3.5 rounded-xl justify-center border border-gray-700">
              Watch Demo <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-400" /> Free to start</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-400" /> No credit card</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-400" /> Cancel anytime</span>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-gray-800 bg-gray-900/50">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="text-center">
              <p className="text-3xl font-extrabold gradient-text">{s.value}</p>
              <p className="text-sm text-gray-400 mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything You Need to <span className="gradient-text">Excel</span></h2>
            <p className="text-gray-400 max-w-xl mx-auto">Comprehensive AI-powered tools that adapt to your unique learning style and career goals.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="card-hover group">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-secondary-500/20 border border-primary-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <f.icon className="w-6 h-6 text-primary-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-4 bg-gray-900/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How <span className="gradient-text">LearnMate AI</span> Works</h2>
          </div>
          <div className="space-y-8">
            {[
              { step: '01', title: 'Tell Us Your Goals', desc: 'Share your career aspirations, current skills, and learning preferences with our AI coach.' },
              { step: '02', title: 'Get Assessed', desc: 'Take an intelligent skill assessment powered by IBM Granite to identify your exact level and gaps.' },
              { step: '03', title: 'Receive Your Roadmap', desc: 'Get a fully personalized learning roadmap with courses, projects, and milestones.' },
              { step: '04', title: 'Learn & Grow', desc: 'Follow your plan with daily AI guidance. The system adapts as you progress.' },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                className="flex gap-6 items-start">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">{item.step}</div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-gray-400">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Loved by <span className="gradient-text">Learners</span></h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="card">
                <div className="flex gap-1 mb-4">{[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />)}</div>
                <p className="text-gray-300 text-sm mb-5 leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-sm">{t.avatar}</div>
                  <div><p className="text-sm font-semibold text-white">{t.name}</p><p className="text-xs text-gray-500">{t.role}</p></div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="card bg-gradient-to-br from-primary-900/50 to-secondary-900/50 border-primary-500/30">
            <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Career?</h2>
            <p className="text-gray-400 mb-8">Join 50,000+ learners using AI to achieve their goals faster.</p>
            <Link to="/register" className="btn-primary text-base px-10 py-4 rounded-xl justify-center inline-flex">
              Start Your Journey Free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 px-4 text-center text-sm text-gray-500">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-primary-400" />
          <span className="font-semibold text-gray-400">LearnMate AI</span>
        </div>
        <p>© 2024 LearnMate AI · Powered by IBM watsonx.ai Granite Models · Built for the future of learning</p>
      </footer>
    </div>
  )
}
