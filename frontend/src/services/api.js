import axios from 'axios'

const API = axios.create({ baseURL: '/api', timeout: 30000 })

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// Auth
export const authAPI = {
  register: (d) => API.post('/auth/register', d),
  login: (d) => API.post('/auth/login', d),
  me: () => API.get('/auth/me'),
  logout: () => API.post('/auth/logout'),
  updatePassword: (d) => API.put('/auth/updatepassword', d),
  onboarding: (d) => API.put('/auth/onboarding', d),
}

// Users
export const userAPI = {
  getProfile: () => API.get('/users/profile'),
  updateProfile: (d) => API.put('/users/profile', d),
  getStats: () => API.get('/users/stats'),
  logActivity: (d) => API.post('/users/activity', d),
  getLeaderboard: () => API.get('/users/leaderboard'),
}

// AI
export const aiAPI = {
  chat: (d) => API.post('/ai/chat', d),
  getSessions: () => API.get('/ai/chat/sessions'),
  getSession: (id) => API.get(`/ai/chat/${id}`),
  generateAssessment: (d) => API.post('/ai/assessment', d),
  generateRoadmap: (d) => API.post('/ai/roadmap', d),
  generateStudyPlan: (d) => API.post('/ai/study-plan', d),
  analyzeResume: (d) => API.post('/ai/resume-analysis', d),
  interviewPrep: (d) => API.post('/ai/interview-prep', d),
  careerPrediction: () => API.get('/ai/career-prediction'),
  projectRecommendations: () => API.get('/ai/project-recommendations'),
  insights: () => API.get('/ai/insights'),
  motivation: () => API.get('/ai/motivation'),
}

// Roadmaps
export const roadmapAPI = {
  create: (d) => API.post('/roadmaps', d),
  getAll: () => API.get('/roadmaps'),
  getOne: (id) => API.get(`/roadmaps/${id}`),
  updateProgress: (id, d) => API.put(`/roadmaps/${id}/progress`, d),
  adapt: (id, d) => API.post(`/roadmaps/${id}/adapt`, d),
  delete: (id) => API.delete(`/roadmaps/${id}`),
}

// Assessments
export const assessmentAPI = {
  start: (d) => API.post('/assessments/start', d),
  submit: (id, d) => API.post(`/assessments/${id}/submit`, d),
  getAll: () => API.get('/assessments'),
  getOne: (id) => API.get(`/assessments/${id}`),
}

// Progress
export const progressAPI = {
  log: (d) => API.post('/progress', d),
  getAll: (params) => API.get('/progress', { params }),
  getAnalytics: () => API.get('/progress/analytics'),
  updateCourse: (id, d) => API.put(`/progress/course/${id}`, d),
}

// Goals
export const goalAPI = {
  create: (d) => API.post('/goals', d),
  getAll: (params) => API.get('/goals', { params }),
  getOne: (id) => API.get(`/goals/${id}`),
  update: (id, d) => API.put(`/goals/${id}`, d),
  delete: (id) => API.delete(`/goals/${id}`),
}

// Analytics
export const analyticsAPI = {
  get: (params) => API.get('/analytics', { params }),
  report: () => API.get('/analytics/performance-report'),
}

// Courses
export const courseAPI = {
  getAll: (params) => API.get('/courses', { params }),
  getOne: (id) => API.get(`/courses/${id}`),
  getCategories: () => API.get('/courses/categories'),
}

// Notifications
export const notificationAPI = {
  getAll: (params) => API.get('/notifications', { params }),
  markRead: (id) => API.put(`/notifications/${id}/read`),
  markAllRead: () => API.put('/notifications/read-all'),
  delete: (id) => API.delete(`/notifications/${id}`),
}

// Certificates
export const certificateAPI = {
  getAll: () => API.get('/certificates'),
  getOne: (id) => API.get(`/certificates/${id}`),
  issue: (d) => API.post('/certificates', d),
  verify: (certId) => API.get(`/certificates/verify/${certId}`),
}

// Admin
export const adminAPI = {
  getDashboard: () => API.get('/admin/dashboard'),
  getUsers: (params) => API.get('/admin/users', { params }),
  updateUser: (id, d) => API.put(`/admin/users/${id}`, d),
  broadcast: (d) => API.post('/admin/broadcast', d),
}

export default API
