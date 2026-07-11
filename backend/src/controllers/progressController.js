const Progress = require('../models/Progress');
const User = require('../models/User');
const Roadmap = require('../models/Roadmap');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Log progress
// @route   POST /api/progress
exports.logProgress = asyncHandler(async (req, res) => {
  const data = { ...req.body, user: req.user.id };
  const progress = await Progress.create(data);

  // Update user stats
  if (req.body.hoursStudied) {
    const user = await User.findById(req.user.id);
    user.totalHoursLearned += req.body.hoursStudied;
    user.xpPoints += Math.round(req.body.hoursStudied * 50);
    user.updateStreak();
    await user.save({ validateBeforeSave: false });
  }

  res.status(201).json({ success: true, data: progress });
});

// @desc    Get progress
// @route   GET /api/progress
exports.getProgress = asyncHandler(async (req, res) => {
  const { days = 30, type } = req.query;
  const startDate = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

  const query = { user: req.user.id, date: { $gte: startDate } };
  if (type) query.type = type;

  const progress = await Progress.find(query).sort({ date: 1 });
  res.json({ success: true, count: progress.length, data: progress });
});

// @desc    Get progress analytics
// @route   GET /api/progress/analytics
exports.getProgressAnalytics = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const progress = await Progress.find({ user: userId, date: { $gte: thirtyDaysAgo }, type: 'daily' }).sort({ date: 1 });

  const dailyData = progress.map((p) => ({
    date: p.date.toISOString().split('T')[0],
    hours: p.hoursStudied,
    lessons: p.lessonsCompleted,
    mood: p.mood,
  }));

  // Weekly aggregation
  const weeklyData = {};
  progress.forEach((p) => {
    const weekStart = new Date(p.date);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];
    if (!weeklyData[weekKey]) weeklyData[weekKey] = { week: weekKey, hours: 0, lessons: 0, days: 0 };
    weeklyData[weekKey].hours += p.hoursStudied;
    weeklyData[weekKey].lessons += p.lessonsCompleted;
    weeklyData[weekKey].days += 1;
  });

  const user = await User.findById(userId);
  const activeRoadmaps = await Roadmap.find({ user: userId, status: 'active' }).select('title overallProgress');

  res.json({
    success: true,
    data: {
      dailyData,
      weeklyData: Object.values(weeklyData),
      totalHours: progress.reduce((s, p) => s + p.hoursStudied, 0),
      totalLessons: progress.reduce((s, p) => s + p.lessonsCompleted, 0),
      avgHoursPerDay: progress.length > 0 ? (progress.reduce((s, p) => s + p.hoursStudied, 0) / progress.length).toFixed(1) : 0,
      activeDays: progress.length,
      streak: user.streak,
      roadmapProgress: activeRoadmaps,
    },
  });
});

// @desc    Update roadmap course progress
// @route   PUT /api/progress/course/:courseId
exports.updateCourseProgress = asyncHandler(async (req, res) => {
  const { percentage, completedLessons, currentLesson } = req.body;

  let progress = await Progress.findOne({ user: req.user.id, course: req.params.courseId, type: 'course' });

  if (progress) {
    progress.courseProgress = percentage || progress.courseProgress;
    if (completedLessons) progress.completedLessons = completedLessons;
    if (currentLesson) progress.currentLesson = currentLesson;
    await progress.save();
  } else {
    progress = await Progress.create({
      user: req.user.id,
      course: req.params.courseId,
      type: 'course',
      courseProgress: percentage || 0,
      completedLessons: completedLessons || [],
      currentLesson: currentLesson || '',
    });
  }

  if (percentage === 100) {
    const user = await User.findById(req.user.id);
    user.totalCoursesCompleted += 1;
    user.xpPoints += 200;
    await user.save({ validateBeforeSave: false });
  }

  res.json({ success: true, data: progress });
});
