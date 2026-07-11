import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { aiAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Bot, Send, Plus, Trash2, Loader2, User, Sparkles, BookOpen, Map, Target, Briefcase, Brain, ChevronDown } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { v4 as uuidv4 } from 'uuid'
import toast from 'react-hot-toast'

const contextOptions = [
  { value: 'general', label: '💬 General', desc: 'Open conversation' },
  { value: 'roadmap', label: '🗺️ Roadmap', desc: 'Learning path help' },
  { value: 'assessment', label: '📊 Assessment', desc: 'Skill evaluation' },
  { value: 'career', label: '💼 Career', desc: 'Career guidance' },
  { value: 'interview', label: '🎯 Interview Prep', desc: 'Interview practice' },
  { value: 'motivation', label: '⚡ Motivation', desc: 'Stay motivated' },
  { value: 'study-plan', label: '📅 Study Plan', desc: 'Plan your week' },
]

const promptSuggestions = [
  'Create a personalized learning roadmap for me',
  'What skills do I need to become a full stack developer?',
  'Assess my current knowledge level',
  'Generate a study plan for this week',
  'What projects should I build to improve my skills?',
  'Help me prepare for a technical interview',
  'What career paths match my current skills?',
  'How can I improve my productivity score?',
]

export default function AICoach() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState([])
  const [activeSession, setActiveSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [context, setContext] = useState('general')
  const [showContextMenu, setShowContextMenu] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => { loadSessions() }, [])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const loadSessions = async () => {
    try {
      const r = await aiAPI.getSessions()
      setSessions(r.data.data || [])
    } catch {}
  }

  const loadSession = async (sessionId) => {
    try {
      const r = await aiAPI.getSession(sessionId)
      setActiveSession(sessionId)
      setMessages(r.data.data.messages || [])
    } catch { toast.error('Failed to load session') }
  }

  const newSession = () => {
    const id = uuidv4()
    setActiveSession(id)
    setMessages([{
      role: 'assistant',
      content: `👋 Hi ${user?.name?.split(' ')[0]}! I'm your LearnMate AI Coach, powered by IBM watsonx.ai Granite.\n\nI'm here to **autonomously guide your learning journey**. I can:\n- 🗺️ Create personalized learning roadmaps\n- 📊 Assess your skills and identify gaps\n- 💼 Guide your career path\n- 📅 Build weekly study plans\n- 🎯 Help with interview prep\n\n**What would you like to work on today?**`,
      timestamp: new Date(),
      isWelcome: true,
    }])
    inputRef.current?.focus()
  }

  useEffect(() => { if (!activeSession) newSession() }, [])

  const sendMessage = useCallback(async (msgText) => {
    const text = (msgText || input).trim()
    if (!text || loading) return
    setInput('')

    const userMsg = { role: 'user', content: text, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    const typingMsg = { role: 'assistant', content: '', isTyping: true, timestamp: new Date() }
    setMessages(prev => [...prev, typingMsg])

    try {
      const r = await aiAPI.chat({ message: text, sessionId: activeSession, context })
      const aiMsg = r.data.data.message
      setMessages(prev => [...prev.filter(m => !m.isTyping), { ...aiMsg, timestamp: new Date() }])
      loadSessions()
    } catch (err) {
      setMessages(prev => prev.filter(m => !m.isTyping))
      toast.error(err.response?.data?.message || 'AI is temporarily unavailable')
    } finally { setLoading(false) }
  }, [input, loading, activeSession, context])

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const deleteSession = async (sid, e) => {
    e.stopPropagation()
    try {
      await aiAPI.getSessions() // use chat delete endpoint
      setSessions(prev => prev.filter(s => s.sessionId !== sid))
      if (activeSession === sid) newSession()
    } catch {}
  }

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-950">
      {/* Sessions Sidebar */}
      <div className="hidden lg:flex w-72 bg-gray-900 border-r border-gray-800 flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-800">
          <button onClick={newSession} className="btn-primary w-full justify-center text-sm">
            <Plus className="w-4 h-4" /> New Conversation
          </button>
        </div>
        <div className="p-3">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2 px-1">Context Mode</p>
          <div className="space-y-1">
            {contextOptions.slice(0, 4).map(c => (
              <button key={c.value} onClick={() => setContext(c.value)} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${context === c.value ? 'bg-primary-600/20 text-primary-300 border border-primary-500/30' : 'text-gray-400 hover:bg-gray-800'}`}>
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2 px-1">Recent Chats</p>
          <div className="space-y-1">
            {sessions.map(s => (
              <button key={s.sessionId} onClick={() => loadSession(s.sessionId)}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-all group ${activeSession === s.sessionId ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                <Bot className="w-3.5 h-3.5 flex-shrink-0 text-primary-400" />
                <span className="text-xs flex-1 truncate">{s.title || 'Conversation'}</span>
                <button onClick={(e) => deleteSession(s.sessionId, e)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all">
                  <Trash2 className="w-3 h-3" />
                </button>
              </button>
            ))}
          </div>
        </div>
        <div className="p-3 border-t border-gray-800">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Sparkles className="w-3.5 h-3.5 text-primary-400" />
            <span>Powered by IBM Granite</span>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">LearnMate AI Coach</p>
              <p className="text-xs text-green-400">● Online · IBM Granite</p>
            </div>
          </div>
          <div className="relative">
            <button onClick={() => setShowContextMenu(!showContextMenu)} className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-300 hover:border-gray-600 transition-all">
              {contextOptions.find(c => c.value === context)?.label || 'General'}
              <ChevronDown className="w-3 h-3" />
            </button>
            {showContextMenu && (
              <div className="absolute right-0 top-10 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-10 w-52 overflow-hidden">
                {contextOptions.map(c => (
                  <button key={c.value} onClick={() => { setContext(c.value); setShowContextMenu(false) }} className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-700 transition-all text-left ${context === c.value ? 'bg-gray-700' : ''}`}>
                    <div>
                      <p className="text-xs font-medium text-white">{c.label}</p>
                      <p className="text-xs text-gray-400">{c.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 1 && messages[0].isWelcome && (
            <div className="mt-4">
              <p className="text-xs text-gray-500 text-center mb-4">Try one of these prompts:</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {promptSuggestions.slice(0, 4).map((p, i) => (
                  <button key={i} onClick={() => sendMessage(p)} className="text-left p-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-primary-500/50 rounded-xl text-xs text-gray-300 hover:text-white transition-all leading-relaxed">{p}</button>
                ))}
              </div>
            </div>
          )}

          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${msg.role === 'user' ? 'bg-primary-600' : 'bg-gradient-to-br from-primary-500 to-secondary-500'}`}>
                  {msg.role === 'user' ? user?.name?.charAt(0) : <Bot className="w-4 h-4 text-white" />}
                </div>
                <div className={`max-w-xs md:max-w-2xl ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  {msg.isTyping ? (
                    <div className="chat-bubble-ai flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-400" />
                      <span className="text-sm text-gray-400">AI is thinking...</span>
                    </div>
                  ) : (
                    <div className={msg.role === 'user' ? 'chat-bubble-user text-sm' : 'chat-bubble-ai text-sm'}>
                      {msg.role === 'assistant' ? (
                        <ReactMarkdown className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-headings:my-2">{msg.content}</ReactMarkdown>
                      ) : msg.content}
                    </div>
                  )}
                  <p className="text-xs text-gray-600 px-1">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-gray-900 border-t border-gray-800">
          <div className="flex gap-3 items-end max-w-4xl mx-auto">
            <div className="flex-1 relative">
              <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} placeholder="Ask your AI coach anything... (Enter to send)"
                className="input resize-none min-h-[48px] max-h-32 pr-12 py-3" rows={1}
                style={{ height: 'auto', minHeight: '48px' }}
                onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(128, e.target.scrollHeight) + 'px' }}
                disabled={loading} />
            </div>
            <button onClick={() => sendMessage()} disabled={!input.trim() || loading} className="btn-primary h-12 w-12 justify-center p-0 flex-shrink-0 rounded-xl disabled:opacity-40">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-gray-600 text-center mt-2">AI responses are generated by IBM watsonx.ai Granite. Always verify important information.</p>
        </div>
      </div>
    </div>
  )
}
