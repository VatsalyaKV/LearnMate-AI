const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String },
    type: { type: String, enum: ['career', 'skill', 'course', 'project', 'certification', 'custom'], default: 'skill' },
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    targetDate: { type: Date },
    completedDate: { type: Date },
    status: { type: String, enum: ['active', 'completed', 'paused', 'failed', 'cancelled'], default: 'active' },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    milestones: [
      {
        title: { type: String },
        isCompleted: { type: Boolean, default: false },
        completedAt: { type: Date },
        dueDate: { type: Date },
      },
    ],
    relatedRoadmap: { type: mongoose.Schema.Types.ObjectId, ref: 'Roadmap' },
    relatedCourse: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    aiSuggested: { type: Boolean, default: false },
    reminderFrequency: { type: String, enum: ['daily', 'weekly', 'none'], default: 'weekly' },
    notes: [{ note: String, addedAt: { type: Date, default: Date.now } }],
    tags: [{ type: String }],
  },
  { timestamps: true }
);

goalSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('Goal', goalSchema);
