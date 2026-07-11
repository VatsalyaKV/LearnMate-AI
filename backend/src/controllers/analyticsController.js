const Progress = require('../models/Progress');
const User = require('../models/User');
const Roadmap = require('../models/Roadmap');
const Assessment = require('../models/Assessment');
const Goal = require('../models/Goal');
const Certificate = require('../models/Certificate');
const watsonxService = require('../services/watsonxService');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get full analytics
// @route   GET /api/analytics
exports.getAnalytics = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { period = '30' } = req.query;
  const daysAgo = new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000);

  const [user, progress, roadmaps, assessments, goals, certificates] = await Promise.all([
    User.findById(userId),
    Progress.find({ user: userId, date: { $gte: daysAgo }, type: 'daily' }).sort({ date: 1 }),
    Roadmap.find({ user: userId }),
    Assessment.find({ user: userId, status: 'completed' }).sort({ completedAt: -1 }).limit(5),
    Goal.find({ user: userId }),
    Certificate.find({ user: userId }),
  ]);

  // Daily study chart data
  const dailyChart = progress.map((p) => ({
    date: p.date.toISOString().split('T')[0],
    hours: parseFloat(p.hoursStudied.toFixed(1)),
    lessons: p.lessonsCompleted,
    xp: p.xpEarned,
  }));

  // Weekly aggregation
  const weeklyMap = {};
  progress.forEach((p) => {
    const date = new Date(p.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const key = weekStart.toISOString().split('T')[0];
    if (!weeklyMap[key]) weeklyMap[key] = { week: key, hours: 0, lessons: 0 };
    weeklyMap[key].hours += p.hoursStudied;
    weeklyMap[key].lessons += p.lessonsCompleted;
  });

  // Roadmap progress
  const roadmapProgress = roadmaps.map((r) => ({
    id: r._id,
    title: r.title,
    progress: r.overallProgress,
    status: r.status,
    phases: r.phases.length,
    completedPhases: r.phases.filter((ph) => ph.status === 'completed').length,
  }));

  // Skill radar data
  const skillData = assessments.length > 0
    ? assessments[0].skillResults?.map((s) => ({ skill: s.skill, score: s.score })) || []
    : user.currentSkills?.map((s) => ({ skill: s, score: 50 })) || [];

  // Goal analytics
  const goalStats = {
    total: goals.length,
    active: goals.filter((g) => g.status === 'active').length,
    completed: goals.filter((g) => g.status === 'completed').length,
    completionRate: goals.length > 0 ? Math.round((goals.filter((g) => g.status === 'completed').length / goals.length) * 100) : 0,
  };

  // Mood tracking
  const moodData = progress.map((p) => ({ date: p.date.toISOString().split('T')[0], mood: p.mood }));

  res.json({
    success: true,
    data: {
      overview: {
        totalHoursLearned: user.totalHoursLearned,
        totalCoursesCompleted: user.totalCoursesCompleted,
        xpPoints: user.xpPoints,
        level: user.level,
        streak: user.streak,
        productivityScore: user.productivityScore,
        careerReadinessScore: user.careerReadinessScore,
        profileCompleteness: user.profileCompleteness,
        periodHours: progress.reduce((s, p) => s + p.hoursStudied, 0),
        avgDailyHours: progress.length > 0 ? parseFloat((progress.reduce((s, p) => s + p.hoursStudied, 0) / progress.length).toFixed(1)) : 0,
      },
      dailyChart,
      weeklyChart: Object.values(weeklyMap),
      roadmapProgress,
      skillData,
      goalStats,
      moodData,
      certificates: certificates.length,
      assessmentScores: assessments.map((a) => ({ title: a.title, score: a.overallScore, date: a.completedAt })),
    },
  });
});

// @desc    Get AI performance report
// @route   GET /api/analytics/performance-report
exports.getPerformanceReport = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const user = await User.findById(userId);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const progress = await Progress.find({ user: userId, date: { $gte: sevenDaysAgo }, type: 'daily' });

  const progressSummary = {
    totalDays: progress.length,
    totalHours: progress.reduce((s, p) => s + p.hoursStudied, 0),
    totalLessons: progress.reduce((s, p) => s + p.lessonsCompleted, 0),
    streak: user.streak,
    topics: [...new Set(progress.flatMap((p) => p.topicsStudied))],
    avgHoursPerDay: progress.length > 0 ? (progress.reduce((s, p) => s + p.hoursStudied, 0) / progress.length).toFixed(1) : 0,
  };

  const insights = await watsonxService.generateLearningInsights(progressSummary, user);

  if (insights.productivityScore) {
    await User.findByIdAndUpdate(userId, { productivityScore: insights.productivityScore });
  }

  res.json({ success: true, data: { insights, progressSummary } });
});
