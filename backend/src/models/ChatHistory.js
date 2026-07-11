const mongoose = require('mongoose');

const chatHistorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sessionId: { type: String, required: true },
    title: { type: String, default: 'New Conversation' },
    context: { type: String, enum: ['general', 'roadmap', 'assessment', 'career', 'interview', 'motivation', 'study-plan'], default: 'general' },
    messages: [
      {
        role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        tokensUsed: { type: Number, default: 0 },
        model: { type: String },
        metadata: { type: mongoose.Schema.Types.Mixed },
        isError: { type: Boolean, default: false },
      },
    ],
    isActive: { type: Boolean, default: true },
    agentState: {
      currentPhase: { type: String, default: 'greeting' },
      collectedInfo: { type: mongoose.Schema.Types.Mixed, default: {} },
      pendingActions: [{ type: String }],
      lastAction: { type: String },
    },
    totalMessages: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
  },
  { timestamps: true }
);

chatHistorySchema.index({ user: 1, createdAt: -1 });
chatHistorySchema.index({ sessionId: 1 });

module.exports = mongoose.model('ChatHistory', chatHistorySchema);
