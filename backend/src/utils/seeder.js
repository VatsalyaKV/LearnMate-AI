require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/database');
const logger = require('./logger');

const User = require('../models/User');
const Course = require('../models/Course');
const Goal = require('../models/Goal');
const Notification = require('../models/Notification');

const seedData = async () => {
  await connectDB();

  // Clear existing
  await Promise.all([User.deleteMany(), Course.deleteMany(), Goal.deleteMany(), Notification.deleteMany()]);
  logger.info('Cleared existing data');

  // Admin user
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@learnmate.ai',
    password: 'Admin@123456',
    role: 'admin',
    onboardingCompleted: true,
    isEmailVerified: true,
    careerGoal: 'Platform Administration',
    targetRole: 'Platform Admin',
    xpPoints: 9999,
    level: 20,
  });

  // Demo student
  const student = await User.create({
    name: 'Alex Johnson',
    email: 'student@demo.com',
    password: 'Demo@123456',
    role: 'student',
    onboardingCompleted: true,
    isEmailVerified: true,
    bio: 'Aspiring Full Stack Developer passionate about building great web apps.',
    careerGoal: 'Become a Full Stack Developer',
    targetRole: 'Full Stack Developer',
    currentRole: 'Computer Science Student',
    education: "Bachelor's Degree",
    yearsOfExperience: 0,
    industry: 'Technology',
    currentSkills: ['HTML', 'CSS', 'JavaScript', 'Python', 'Git'],
    interests: ['Web Development', 'AI/ML', 'Backend Dev'],
    learningPreferences: { preferredStyle: 'mixed', studyHoursPerDay: 3, preferredTime: 'evening', difficulty: 'adaptive' },
    xpPoints: 1250,
    level: 3,
    streak: { current: 7, longest: 14, lastActivityDate: new Date() },
    totalHoursLearned: 45,
    totalCoursesCompleted: 3,
    productivityScore: 72,
    careerReadinessScore: 45,
    badges: ['first-lesson', 'streak-7', 'assessment'],
  });

  // Sample courses
  const courses = await Course.insertMany([
    { title: 'Complete Web Development Bootcamp', description: 'Master HTML, CSS, JavaScript, React, Node.js and more.', shortDescription: 'Full stack web dev from scratch', instructor: 'Dr. Angela Yu', platform: 'Udemy', url: 'https://udemy.com', category: 'Web Development', subcategory: 'Full Stack', tags: ['html','css','javascript','react','nodejs'], skills: ['HTML','CSS','JavaScript','React','Node.js'], level: 'beginner', duration: 65, rating: 4.8, totalRatings: 250000, enrollmentCount: 850000, isPremium: true, price: 15, certificate: true, isActive: true },
    { title: 'JavaScript Algorithms & Data Structures', description: 'Learn data structures and algorithms in JavaScript.', shortDescription: 'DSA in JS', instructor: 'freeCodeCamp', platform: 'freeCodeCamp', url: 'https://freecodecamp.org', category: 'Web Development', tags: ['javascript','algorithms','dsa'], skills: ['JavaScript','Problem Solving'], level: 'intermediate', duration: 40, rating: 4.7, enrollmentCount: 500000, isPremium: false, price: 0, certificate: true, isActive: true },
    { title: 'Machine Learning A-Z', description: 'Complete machine learning course with Python.', shortDescription: 'ML with Python', instructor: 'Kirill Eremenko', platform: 'Udemy', url: 'https://udemy.com', category: 'Data Science', tags: ['python','machine-learning','ai'], skills: ['Python','Machine Learning','Data Analysis'], level: 'intermediate', duration: 44, rating: 4.5, enrollmentCount: 300000, isPremium: true, price: 13, certificate: true, isActive: true },
    { title: 'React - The Complete Guide', description: 'Dive deep into React, including Hooks, Redux, React Router.', shortDescription: 'Complete React guide', instructor: 'Maximilian Schwarzmüller', platform: 'Udemy', url: 'https://udemy.com', category: 'Web Development', tags: ['react','javascript','frontend'], skills: ['React','JavaScript','Redux'], level: 'intermediate', duration: 50, rating: 4.8, enrollmentCount: 600000, isPremium: true, price: 15, certificate: true, isActive: true },
    { title: 'Python for Everybody', description: 'Learn Python programming with Dr. Chuck.', shortDescription: 'Python basics', instructor: 'Dr. Chuck Severance', platform: 'Coursera', url: 'https://coursera.org', category: 'Programming', tags: ['python','programming'], skills: ['Python'], level: 'beginner', duration: 20, rating: 4.8, enrollmentCount: 1200000, isPremium: false, price: 0, certificate: true, isActive: true },
    { title: 'CS50: Introduction to Computer Science', description: "Harvard's famous CS intro course.", shortDescription: "Harvard's CS intro", instructor: 'David Malan', platform: 'edX', url: 'https://cs50.harvard.edu', category: 'Computer Science', tags: ['cs','programming','algorithms'], skills: ['C','Python','JavaScript','SQL'], level: 'beginner', duration: 100, rating: 4.9, enrollmentCount: 2000000, isPremium: false, price: 0, certificate: true, isActive: true },
  ]);

  // Sample goals for student
  await Goal.insertMany([
    { user: student._id, title: 'Complete React Course', description: 'Finish the React complete guide on Udemy', type: 'course', priority: 'high', status: 'active', progress: 35, targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    { user: student._id, title: 'Build Portfolio Website', description: 'Create a professional portfolio showcasing 3 projects', type: 'project', priority: 'high', status: 'active', progress: 20 },
    { user: student._id, title: 'Learn Node.js Basics', description: 'Understand server-side JavaScript development', type: 'skill', priority: 'medium', status: 'active', progress: 10 },
    { user: student._id, title: 'Get First Developer Job', description: 'Land a junior developer role within 6 months', type: 'career', priority: 'critical', status: 'active', progress: 15 },
  ]);

  // Notifications
  await Notification.insertMany([
    { user: student._id, title: '🎉 Welcome to LearnMate AI!', message: 'Your account is set up. Start your learning journey with your AI coach!', type: 'system', priority: 'high' },
    { user: student._id, title: '🔥 7-Day Streak!', message: 'Amazing! You have maintained a 7-day learning streak. Keep it up!', type: 'achievement', priority: 'high' },
    { user: student._id, title: '🤖 AI Tip', message: 'Complete your first skill assessment to get a personalized learning roadmap tailored to your goals.', type: 'ai-insight', priority: 'normal' },
  ]);

  logger.info('✅ Seed data created successfully!');
  logger.info(`Admin: admin@learnmate.ai / Admin@123456`);
  logger.info(`Student: student@demo.com / Demo@123456`);
  logger.info(`${courses.length} courses seeded`);
  
  process.exit(0);
};

seedData().catch((err) => { logger.error(err); process.exit(1); });
