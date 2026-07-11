const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: [100, 'Name cannot exceed 100 characters'] },
    email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true, match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email'] },
    password: { type: String, required: [true, 'Password is required'], minlength: [8, 'Password must be at least 8 characters'], select: false },
    role: { type: String, enum: ['student', 'mentor', 'admin', 'institution'], default: 'student' },
    avatar: { type: String, default: '' },
    bio: { type: String, maxlength: [500, 'Bio cannot exceed 500 characters'], default: '' },
    phone: { type: String, default: '' },
    location: { type: String, default: '' },
    website: { type: String, default: '' },
    linkedIn: { type: String, default: '' },
    github: { type: String, default: '' },
    
    // Learning Profile
    learningPreferences: {
      preferredStyle: { type: String, enum: ['visual', 'auditory', 'reading', 'kinesthetic', 'mixed'], default: 'mixed' },
      studyHoursPerDay: { type: Number, default: 2, min: 0.5, max: 12 },
      preferredTime: { type: String, enum: ['morning', 'afternoon', 'evening', 'night', 'flexible'], default: 'flexible' },
      difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'adaptive'], default: 'adaptive' },
      language: { type: String, default: 'English' },
      contentTypes: [{ type: String, enum: ['video', 'article', 'interactive', 'podcast', 'book', 'project'] }],
    },

    // Career & Goals
    careerGoal: { type: String, default: '' },
    currentRole: { type: String, default: '' },
    targetRole: { type: String, default: '' },
    industry: { type: String, default: '' },
    yearsOfExperience: { type: Number, default: 0 },
    education: { type: String, default: '' },
    
    // Skills & Interests
    currentSkills: [{ type: String }],
    interests: [{ type: String }],
    
    // Subscription
    subscription: {
      plan: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
      startDate: { type: Date },
      endDate: { type: Date },
      isActive: { type: Boolean, default: true },
    },
    
    // Gamification
    xpPoints: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    streak: {
      current: { type: Number, default: 0 },
      longest: { type: Number, default: 0 },
      lastActivityDate: { type: Date },
    },
    badges: [{ type: String }],
    
    // Stats
    totalCoursesCompleted: { type: Number, default: 0 },
    totalHoursLearned: { type: Number, default: 0 },
    productivityScore: { type: Number, default: 0, min: 0, max: 100 },
    careerReadinessScore: { type: Number, default: 0, min: 0, max: 100 },
    
    // Settings
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      weeklyReport: { type: Boolean, default: true },
      studyReminders: { type: Boolean, default: true },
    },
    
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpire: { type: Date, select: false },
    lastLogin: { type: Date },
    onboardingCompleted: { type: Boolean, default: false },
    aiProfile: {
      interests: { type: String, default: '' },
      goals: { type: String, default: '' },
      strengths: { type: String, default: '' },
      weaknesses: { type: String, default: '' },
      lastAssessedAt: { type: Date },
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Virtual: full profile completeness
userSchema.virtual('profileCompleteness').get(function () {
  let score = 0;
  if (this.name) score += 10;
  if (this.email) score += 10;
  if (this.bio) score += 10;
  if (this.careerGoal) score += 15;
  if (this.targetRole) score += 15;
  if (this.currentSkills?.length > 0) score += 15;
  if (this.interests?.length > 0) score += 10;
  if (this.learningPreferences?.studyHoursPerDay) score += 15;
  return score;
});

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT
userSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Update streak
userSchema.methods.updateStreak = function () {
  const now = new Date();
  const lastActivity = this.streak.lastActivityDate;
  
  if (!lastActivity) {
    this.streak.current = 1;
    this.streak.lastActivityDate = now;
  } else {
    const daysDiff = Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24));
    if (daysDiff === 1) {
      this.streak.current += 1;
      if (this.streak.current > this.streak.longest) this.streak.longest = this.streak.current;
    } else if (daysDiff > 1) {
      this.streak.current = 1;
    }
    this.streak.lastActivityDate = now;
  }
};

module.exports = mongoose.model('User', userSchema);
