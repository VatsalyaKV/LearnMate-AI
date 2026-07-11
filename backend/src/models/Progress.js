const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    roadmap: { type: mongoose.Schema.Types.ObjectId, ref: 'Roadmap' },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    
    type: { type: String, enum: ['course', 'lesson', 'project', 'milestone', 'assessment', 'daily'], default: 'daily' },
    
    // Daily tracking
    date: { type: Date, default: Date.now },
    hoursStudied: { type: Number, default: 0, min: 0 },
    lessonsCompleted: { type: Number, default: 0 },
    topicsStudied: [{ type: String }],
    notes: { type: String },
    mood: { type: String, enum: ['great', 'good', 'okay', 'tired', 'struggling'], default: 'good' },
    
    // Course progress
    courseProgress: { type: Number, default: 0, min: 0, max: 100 },
    completedLessons: [{ type: String }],
    currentLesson: { type: String },
    
    // Performance
    quizScores: [{ quiz: String, score: Number, date: Date }],
    assignmentScores: [{ assignment: String, score: Number, date: Date }],
    
    // XP earned this session
    xpEarned: { type: Number, default: 0 },
    
    status: { type: String, enum: ['in-progress', 'completed', 'paused'], default: 'in-progress' },
  },
  { timestamps: true }
);

progressSchema.index({ user: 1, date: -1 });
progressSchema.index({ user: 1, course: 1 });
progressSchema.index({ user: 1, type: 1 });

module.exports = mongoose.model('Progress', progressSchema);
