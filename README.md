# 🚀 LearnMate AI — Agentic AI for Personalized Course Pathways

> **Production-ready full-stack web application powered by IBM watsonx.ai Granite Models**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org) [![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org) [![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green)](https://mongodb.com) [![IBM watsonx.ai](https://img.shields.io/badge/IBM-watsonx.ai-blue)](https://ibm.com/watsonx)

---

## 🌟 Overview

LearnMate AI is a complete **Agentic AI Learning Platform** that autonomously creates, monitors, and adapts personalized learning pathways for every student. Unlike simple chatbots, it uses genuine agentic AI behavior to understand goals, assess skills, generate roadmaps, and continuously guide learners.

### Key Features
- 🤖 **Agentic AI Coach** — IBM Granite-powered autonomous learning coach
- 🗺️ **Smart Roadmaps** — AI-generated personalized learning pathways
- 📊 **Skill Assessment** — Intelligent assessments with gap analysis
- 📅 **Study Planner** — AI-generated daily & weekly schedules
- 📈 **Learning Analytics** — Deep progress insights & productivity scores
- 🏆 **Achievements** — XP, badges, certificates & goal tracking
- 💼 **Career Tools** — Resume analyzer, interview prep, career predictor
- 🛡️ **Admin Dashboard** — Full platform management

---

## 🏗️ Architecture

```
LearnMate AI/
├── backend/           # Node.js + Express.js REST API
│   └── src/
│       ├── config/    # Database config
│       ├── controllers/  # Business logic
│       ├── middleware/   # Auth, error handling
│       ├── models/    # MongoDB schemas
│       ├── routes/    # API routes
│       ├── services/  # IBM watsonx.ai service
│       └── utils/     # Logger, seeder
├── frontend/          # React + Vite + Tailwind CSS
│   └── src/
│       ├── components/ # Reusable UI components
│       ├── context/    # Auth context
│       ├── pages/      # All page components
│       └── services/   # API service layer
├── docker-compose.yml
└── README.md
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 7.0+ (local or Atlas)
- IBM Cloud account with watsonx.ai access

### 1. Clone & Install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment

```bash
# Copy environment template
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your credentials:

```env
# Required
MONGODB_URI=mongodb://localhost:27017/learnmate_ai
JWT_SECRET=your_super_secret_jwt_key_min_32_chars

# IBM watsonx.ai (required for AI features)
WATSONX_API_KEY=your_ibm_watsonx_api_key
WATSONX_PROJECT_ID=your_ibm_watsonx_project_id
WATSONX_URL=https://us-south.ml.cloud.ibm.com
WATSONX_MODEL_ID=ibm/granite-13b-chat-v2
```

### 3. Seed Database

```bash
cd backend
npm run seed
```

This creates:
- Admin: `admin@learnmate.ai` / `Admin@123456`
- Student: `student@demo.com` / `Demo@123456`
- 6 sample courses

### 4. Start Development

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

**App runs at:** http://localhost:5173  
**API runs at:** http://localhost:5000  
**Health check:** http://localhost:5000/health

---

## 🐳 Docker Deployment

```bash
# Copy and configure env
cp backend/.env.example .env
# Edit .env with your values

# Build and run all services
docker-compose up -d --build

# Run database seeder
docker exec learnmate_backend node src/utils/seeder.js

# View logs
docker-compose logs -f
```

---

## 🤖 IBM watsonx.ai Setup

1. Log in to [IBM Cloud](https://cloud.ibm.com)
2. Create a **watsonx.ai** instance
3. Go to **Projects** → Create project
4. Get your **API Key** from IAM → API Keys
5. Copy your **Project ID** from project settings
6. Set the environment variables in `.env`

### Available Models
| Variable | Default | Description |
|---|---|---|
| `WATSONX_MODEL_ID` | `ibm/granite-13b-chat-v2` | Main chat model |
| `WATSONX_INSTRUCT_MODEL` | `ibm/granite-13b-instruct-v2` | Instruction following |

> **Development Mode:** If watsonx.ai is not configured, the app runs in demo mode with fallback responses.

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/onboarding` | Complete onboarding |
| PUT | `/api/auth/updatepassword` | Change password |

### AI Endpoints
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/ai/chat` | Chat with AI coach |
| POST | `/api/ai/assessment` | Generate skill assessment |
| POST | `/api/ai/roadmap` | Generate learning roadmap |
| POST | `/api/ai/study-plan` | Generate study plan |
| POST | `/api/ai/resume-analysis` | Analyze resume |
| POST | `/api/ai/interview-prep` | Interview preparation |
| GET | `/api/ai/career-prediction` | Career path prediction |
| GET | `/api/ai/project-recommendations` | Project suggestions |
| GET | `/api/ai/insights` | Learning insights |
| GET | `/api/ai/motivation` | Motivational message |

### Core Endpoints
| Method | Endpoint | Description |
|---|---|---|
| GET/PUT | `/api/users/profile` | User profile |
| GET | `/api/users/stats` | User statistics |
| GET/POST | `/api/roadmaps` | Roadmaps |
| GET/POST | `/api/assessments` | Assessments |
| GET | `/api/analytics` | Analytics data |
| GET/POST | `/api/goals` | Goals management |
| GET | `/api/notifications` | Notifications |
| GET | `/api/certificates` | Certificates |
| GET | `/api/courses` | Course catalog |

---

## 🧩 Tech Stack

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js 4.18
- **Database:** MongoDB 7 + Mongoose 8
- **Auth:** JWT + bcryptjs
- **AI:** IBM watsonx.ai Granite Models
- **Logging:** Winston + Daily Rotate File
- **Security:** Helmet, CORS, Rate Limiting, MongoSanitize

### Frontend
- **Framework:** React 18 + Vite 5
- **Styling:** Tailwind CSS 3
- **Routing:** React Router 6
- **Animation:** Framer Motion 10
- **Charts:** Recharts 2
- **Icons:** Lucide React
- **Markdown:** React Markdown

---

## 🔐 Security Features
- JWT authentication with refresh tokens
- bcrypt password hashing (12 rounds)
- Rate limiting on all endpoints
- MongoDB injection sanitization
- XSS protection
- HTTP security headers (Helmet)
- CORS configuration
- Input validation (express-validator)
- Role-based access control

---

## 📊 Database Models

| Model | Description |
|---|---|
| `User` | Students, mentors, admins with full profile |
| `Course` | Learning resources and curricula |
| `Roadmap` | AI-generated personalized learning paths |
| `Progress` | Daily learning activity tracking |
| `Assessment` | Skill evaluations and results |
| `Goal` | Learning goals with milestones |
| `Certificate` | Completion certificates |
| `Notification` | System and AI notifications |
| `ChatHistory` | AI conversation sessions |

---

## 🚀 IBM Cloud Deployment

```bash
# Install IBM Cloud CLI
curl -fsSL https://clis.cloud.ibm.com/install/linux | sh

# Login
ibmcloud login

# Deploy to IBM Code Engine
ibmcloud ce application create \
  --name learnmate-backend \
  --image us.icr.io/learnmate/backend:latest \
  --env-from-secret learnmate-secrets

# Or deploy with Docker on IBM Cloud Container Registry
ibmcloud cr build --file backend/Dockerfile .
```

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open Pull Request

---

## 📄 License

MIT License — see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **IBM watsonx.ai** — Granite AI Models powering intelligent features
- **MongoDB** — Flexible document database
- **React & Vite** — Modern frontend tooling
- **Tailwind CSS** — Utility-first CSS framework
- **Framer Motion** — Beautiful animations

---

<p align="center">
  Built with ❤️ using IBM watsonx.ai Granite Models<br>
  <strong>LearnMate AI — Making personalized education accessible to everyone</strong>
</p>
