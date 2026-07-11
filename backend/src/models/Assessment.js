const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['initial', 'skill-check', 'progress', 'final', 'custom'], default: 'initial' },
    title: { type: String, required: true },
    description: { type: String },
    
    questions: [
      {
        question: { type: String, required: true },
        type: { type: String, enum: ['multiple-choice', 'true-false', 'short-answer', 'coding', 'rating'], default: 'multiple-choice' },
        options: [{ type: String }],
        correctAnswer: { type: String, select: false },
        userAnswer: { type: String },
        isCorrect: { type: Boolean },
        skillArea: { type: String },
        difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
        points: { type: Number, default: 1 },
        earnedPoints: { type: Number, default: 0 },
        explanation: { type: String },
      },
    ],
    
    skillResults: [
      {
        skill: { type: String },
        score: { type: Number, min: 0, max: 100 },
        level: { type: String, enum: ['novice', 'beginner', 'intermediate', 'advanced', 'expert'] },
        recommendation: { type: String },
      },
    ],
    
    overallScore: { type: Number, default: 0 },
    totalPoints: { type: Number, default: 0 },
    earnedPoints: { type: Number, default: 0 },
    timeTaken: { type: Number }, // minutes
    completedAt: { type: Date },
    status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
    
    aiAnalysis: { type: String },
    strengthAreas: [{ type: String }],
    weakAreas: [{ type: String }],
    recommendations: [{ type: String }],
  },
  { timestamps: true }
);

assessmentSchema.index({ user: 1, type: 1, createdAt: -1 });

module.exports = mongoose.model('Assessment', assessmentSchema);
