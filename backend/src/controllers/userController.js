const User = require('../models/User');
const Progress = require('../models/Progress');
const Roadmap = require('../models/Roadmap');
const Goal = require('../models/Goal');
const Certificate = require('../models/Certificate');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get user profile
// @route   GET /api/users/profile
exports.getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json({ success: true, data: user });
});

// @desc    Update user profile
// @route   PUT /api/users/profile
exports.updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = [
    'name', 'bio', 'phone', 'location', 'website', 'linkedIn', 'github',
    'careerGoal', 'currentRole', 'targetRole', 'industry', 'yearsOfExperience',
    'education', 'currentSkills', 'interests', 'learningPreferences', 'notifications',
  ];

  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const user = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true,
    runValidators: true,
  });

  res.json({ success: true, data: user, message: 'Profile updated successfully' });
});

// @desc    Get user stats summary
// @route   GET /api/users/stats
exports.getUserStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [user, progressCount, activeRoadmaps, completedGoals, certificates] = await Promise.all([
    User.findById(userId),
    Progress.countDocuments({ user: userId }),
    Roadmap.countDocuments({ user: userId, status: 'active' }),
    Goal.countDocuments({ user: userId, status: 'completed' }),
    Certificate.countDocuments({ user: userId }),
  ]);

  // Calculate weekly study hours
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weeklyProgress = await Progress.find({
    user: userId,
    type: 'daily',
    date: { $gte: oneWeekAgo },
  });
  const weeklyHours = weeklyProgress.reduce((sum, p) => sum + (p.hoursStudied || 0), 0);

  // Calculate monthly hours
  const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const monthlyProgress = await Progress.find({
    user: userId,
    type: 'daily',
    date: { $gte: oneMonthAgo },
  });
  const monthlyHours = monthlyProgress.reduce((sum, p) => sum + (p.hoursStudied || 0), 0);

  res.json({
    success: true,
    data: {
      xpPoints: user.xpPoints,
      level: user.level,
      streak: user.streak,
      totalCoursesCompleted: user.totalCoursesCompleted,
      totalHoursLearned: user.totalHoursLearned,
      productivityScore: user.productivityScore,
      careerReadinessScore: user.careerReadinessScore,
      profileCompleteness: user.profileCompleteness,
      weeklyHours,
      monthlyHours,
      activeRoadmaps,
      completedGoals,
      certificates,
      badges: user.badges || [],
    },
  });
});

// @desc    Log daily activity
// @route   POST /api/users/activity
exports.logActivity = asyncHandler(async (req, res) => {
  const { hoursStudied, topicsStudied, notes, mood, lessonsCompleted } = req.body;
  const userId = req.user.id;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let progress = await Progress.findOne({
    user: userId,
    type: 'daily',
    date: { $gte: today },
  });

  if (progress) {
    progress.hoursStudied += hoursStudied || 0;
    progress.lessonsCompleted += lessonsCompleted || 0;
    if (topicsStudied) progress.topicsStudied.push(...topicsStudied);
    if (notes) progress.notes = notes;
    if (mood) progress.mood = mood;
    await progress.save();
  } else {
    progress = await Progress.create({
      user: userId,
      type: 'daily',
      date: new Date(),
      hoursStudied: hoursStudied || 0,
      lessonsCompleted: lessonsCompleted || 0,
      topicsStudied: topicsStudied || [],
      notes: notes || '',
      mood: mood || 'good',
    });
  }

  // Update user stats
  const xpEarned = Math.round((hoursStudied || 0) * 50);
  const user = await User.findById(userId);
  user.totalHoursLearned += hoursStudied || 0;
  user.xpPoints += xpEarned;
  user.level = Math.floor(user.xpPoints / 500) + 1;
  user.updateStreak();
  await user.save({ validateBeforeSave: false });

  res.json({
    success: true,
    data: progress,
    xpEarned,
    message: `Great job! You earned ${xpEarned} XP today!`,
  });
});

// @desc    Get leaderboard
// @route   GET /api/users/leaderboard
exports.getLeaderboard = asyncHandler(async (req, res) => {
  const users = await User.find({ isActive: true, role: 'student' })
    .select('name avatar xpPoints level streak badges')
    .sort({ xpPoints: -1 })
    .limit(20);

  res.json({ success: true, data: users });
});
