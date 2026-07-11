const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    shortDescription: { type: String, maxlength: 200 },
    instructor: { type: String, default: 'LearnMate AI' },
    platform: { type: String, enum: ['Coursera', 'Udemy', 'edX', 'YouTube', 'Khan Academy', 'Pluralsight', 'LinkedIn Learning', 'freeCodeCamp', 'MIT OpenCourseWare', 'LearnMate', 'Other'], default: 'LearnMate' },
    url: { type: String, default: '' },
    thumbnail: { type: String, default: '' },
    category: { type: String, required: true },
    subcategory: { type: String, default: '' },
    tags: [{ type: String }],
    skills: [{ type: String }],
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    language: { type: String, default: 'English' },
    duration: { type: Number, default: 0 }, // in hours
    modules: [
      {
        title: { type: String },
        description: { type: String },
        duration: { type: Number },
        lessons: [
          {
            title: { type: String },
            type: { type: String, enum: ['video', 'article', 'quiz', 'project', 'assignment'] },
            duration: { type: Number },
            url: { type: String },
            isCompleted: { type: Boolean, default: false },
          },
        ],
      },
    ],
    prerequisites: [{ type: String }],
    outcomes: [{ type: String }],
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalRatings: { type: Number, default: 0 },
    enrollmentCount: { type: Number, default: 0 },
    isPremium: { type: Boolean, default: false },
    price: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    certificate: { type: Boolean, default: false },
    aiGenerated: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

courseSchema.index({ category: 1, level: 1 });
courseSchema.index({ tags: 1 });
courseSchema.index({ skills: 1 });
courseSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Course', courseSchema);
