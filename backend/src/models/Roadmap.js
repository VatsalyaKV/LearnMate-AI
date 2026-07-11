const mongoose = require('mongoose');

const roadmapSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String },
    goal: { type: String, required: true },
    targetRole: { type: String },
    currentLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    estimatedDuration: { type: Number, default: 0 }, // weeks
    estimatedCompletionDate: { type: Date },
    startDate: { type: Date, default: Date.now },
    
    phases: [
      {
        phaseNumber: { type: Number },
        title: { type: String },
        description: { type: String },
        duration: { type: Number }, // weeks
        status: { type: String, enum: ['locked', 'in-progress', 'completed', 'pending'], default: 'pending' },
        startDate: { type: Date },
        completedDate: { type: Date },
        skills: [{ type: String }],
        courses: [
          {
            course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
            title: { type: String },
            platform: { type: String },
            url: { type: String },
            duration: { type: Number },
            status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
            completedDate: { type: Date },
            isPrimary: { type: Boolean, default: false },
            order: { type: Number },
          },
        ],
        projects: [
          {
            title: { type: String },
            description: { type: String },
            difficulty: { type: String },
            skills: [{ type: String }],
            estimatedHours: { type: Number },
            status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
            submissionUrl: { type: String },
          },
        ],
        milestones: [
          {
            title: { type: String },
            description: { type: String },
            isCompleted: { type: Boolean, default: false },
            completedAt: { type: Date },
          },
        ],
      },
    ],
    
    overallProgress: { type: Number, default: 0, min: 0, max: 100 },
    status: { type: String, enum: ['active', 'completed', 'paused', 'abandoned'], default: 'active' },
    isAIGenerated: { type: Boolean, default: true },
    aiReasoning: { type: String },
    lastAdaptedAt: { type: Date },
    adaptationHistory: [
      {
        adaptedAt: { type: Date },
        reason: { type: String },
        changes: { type: String },
      },
    ],
    tags: [{ type: String }],
  },
  { timestamps: true }
);

roadmapSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('Roadmap', roadmapSchema);
