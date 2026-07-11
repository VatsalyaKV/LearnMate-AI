const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    roadmap: { type: mongoose.Schema.Types.ObjectId, ref: 'Roadmap' },
    title: { type: String, required: true },
    description: { type: String },
    issuer: { type: String, default: 'LearnMate AI' },
    issuedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    certificateId: { type: String, unique: true },
    verificationUrl: { type: String },
    imageUrl: { type: String },
    skills: [{ type: String }],
    grade: { type: String },
    score: { type: Number },
    type: { type: String, enum: ['course', 'skill', 'pathway', 'achievement', 'participation'], default: 'course' },
    isPublic: { type: Boolean, default: true },
    linkedInShared: { type: Boolean, default: false },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

certificateSchema.index({ user: 1 });
certificateSchema.index({ certificateId: 1 });

module.exports = mongoose.model('Certificate', certificateSchema);
