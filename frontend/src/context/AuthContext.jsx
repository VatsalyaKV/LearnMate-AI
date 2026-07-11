import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const stored = localStorage.getItem('user')
    if (token && stored) {
      try { setUser(JSON.parse(stored)) } catch {}
      authAPI.me().then(r => { setUser(r.data.data); localStorage.setItem('user', JSON.stringify(r.data.data)) }).catch(() => { localStorage.clear() }).finally(() => setLoading(false))
    } else { setLoading(false) }
  }, [])

  const login = useCallback(async (email, password) => {
    const r = await authAPI.login({ email, password })
    const { token, user: u } = r.data
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(u))
    setUser(u)
    return u
  }, [])

  const register = useCallback(async (data) => {
    const r = await authAPI.register(data)
    const { token, user: u } = r.data
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(u))
    setUser(u)
    return u
  }, [])

  const logout = useCallback(() => {
    authAPI.logout().catch(() => {})
    localStorage.clear()
    setUser(null)
    window.location.href = '/login'
  }, [])

  const updateUser = useCallback((updates) => {
    setUser(prev => {
      const updated = { ...prev, ...updates }
      localStorage.setItem('user', JSON.stringify(updated))
      return updated
    })
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export default AuthContext
