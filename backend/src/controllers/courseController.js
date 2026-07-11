const Course = require('../models/Course');
const asyncHandler = require('../middleware/asyncHandler');

exports.getCourses = asyncHandler(async (req, res) => {
  const { category, level, search, platform, isPremium, limit = 20, page = 1 } = req.query;
  const query = { isActive: true };

  if (category) query.category = category;
  if (level) query.level = level;
  if (platform) query.platform = platform;
  if (isPremium !== undefined) query.isPremium = isPremium === 'true';
  if (search) query.$text = { $search: search };

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const courses = await Course.find(query).sort({ rating: -1, enrollmentCount: -1 }).skip(skip).limit(parseInt(limit));
  const total = await Course.countDocuments(query);

  res.json({ success: true, count: courses.length, total, data: courses });
});

exports.getCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
  res.json({ success: true, data: course });
});

exports.createCourse = asyncHandler(async (req, res) => {
  const course = await Course.create({ ...req.body, createdBy: req.user.id });
  res.status(201).json({ success: true, data: course });
});

exports.updateCourse = asyncHandler(async (req, res) => {
  const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
  res.json({ success: true, data: course });
});

exports.deleteCourse = asyncHandler(async (req, res) => {
  await Course.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json({ success: true, message: 'Course deactivated' });
});

exports.getCategories = asyncHandler(async (req, res) => {
  const categories = await Course.distinct('category', { isActive: true });
  res.json({ success: true, data: categories });
});
