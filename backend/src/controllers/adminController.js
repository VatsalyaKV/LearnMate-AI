const User = require('../models/User');
const Course = require('../models/Course');
const Roadmap = require('../models/Roadmap');
const Assessment = require('../models/Assessment');
const Progress = require('../models/Progress');
const Notification = require('../models/Notification');
const asyncHandler = require('../middleware/asyncHandler');

exports.getDashboard = asyncHandler(async (req, res) => {
  const [users, courses, roadmaps, assessments, recentUsers] = await Promise.all([
    User.countDocuments(),
    Course.countDocuments({ isActive: true }),
    Roadmap.countDocuments(),
    Assessment.countDocuments({ status: 'completed' }),
    User.find().select('name email role createdAt isActive').sort({ createdAt: -1 }).limit(10),
  ]);

  const activeUsers = await User.countDocuments({ isActive: true });
  const students = await User.countDocuments({ role: 'student' });

  const progressStats = await Progress.aggregate([
    { $group: { _id: null, totalHours: { $sum: '$hoursStudied' }, avgHours: { $avg: '$hoursStudied' } } },
  ]);

  res.json({
    success: true,
    data: {
      stats: {
        totalUsers: users,
        activeUsers,
        students,
        totalCourses: courses,
        totalRoadmaps: roadmaps,
        completedAssessments: assessments,
        totalHoursLearned: progressStats[0]?.totalHours?.toFixed(0) || 0,
      },
      recentUsers,
    },
  });
});

exports.getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, search, isActive } = req.query;
  const query = {};
  if (role) query.role = role;
  if (isActive !== undefined) query.isActive = isActive === 'true';
  if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const users = await User.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));
  const total = await User.countDocuments(query);

  res.json({ success: true, count: users.length, total, data: users });
});

exports.updateUser = asyncHandler(async (req, res) => {
  const { role, isActive, subscription } = req.body;
  const updates = {};
  if (role) updates.role = role;
  if (isActive !== undefined) updates.isActive = isActive;
  if (subscription) updates.subscription = subscription;

  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, data: user });
});

exports.sendBroadcastNotification = asyncHandler(async (req, res) => {
  const { title, message, type, role } = req.body;
  const query = { isActive: true };
  if (role) query.role = role;
  
  const users = await User.find(query).select('_id');
  const notifications = users.map((u) => ({ user: u._id, title, message, type: type || 'system', priority: 'normal' }));
  await Notification.insertMany(notifications);

  res.json({ success: true, message: `Broadcast sent to ${users.length} users` });
});
