const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['achievement', 'reminder', 'update', 'ai-insight', 'goal', 'streak', 'course', 'system', 'motivation'], default: 'system' },
    priority: { type: String, enum: ['low', 'normal', 'high'], default: 'normal' },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    actionUrl: { type: String },
    actionLabel: { type: String },
    icon: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
