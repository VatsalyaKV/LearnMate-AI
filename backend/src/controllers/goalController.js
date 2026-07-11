const Goal = require('../models/Goal');
const Notification = require('../models/Notification');
const asyncHandler = require('../middleware/asyncHandler');

exports.createGoal = asyncHandler(async (req, res) => {
  const goal = await Goal.create({ ...req.body, user: req.user.id });
  
  await Notification.create({
    user: req.user.id,
    title: '🎯 New Goal Set!',
    message: `You set a new goal: "${goal.title}". Stay focused and consistent!`,
    type: 'goal',
  });

  res.status(201).json({ success: true, data: goal });
});

exports.getGoals = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const query = { user: req.user.id };
  if (status) query.status = status;
  const goals = await Goal.find(query).populate('relatedRoadmap', 'title').sort({ createdAt: -1 });
  res.json({ success: true, data: goals });
});

exports.getGoal = asyncHandler(async (req, res) => {
  const goal = await Goal.findOne({ _id: req.params.id, user: req.user.id });
  if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });
  res.json({ success: true, data: goal });
});

exports.updateGoal = asyncHandler(async (req, res) => {
  const goal = await Goal.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, req.body, { new: true, runValidators: true });
  if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });
  
  if (req.body.status === 'completed') {
    await Notification.create({
      user: req.user.id,
      title: '🏆 Goal Achieved!',
      message: `Congratulations! You completed your goal: "${goal.title}"`,
      type: 'achievement',
      priority: 'high',
    });
  }
  
  res.json({ success: true, data: goal });
});

exports.deleteGoal = asyncHandler(async (req, res) => {
  const goal = await Goal.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });
  res.json({ success: true, message: 'Goal deleted' });
});

exports.updateMilestone = asyncHandler(async (req, res) => {
  const { milestoneIndex, isCompleted } = req.body;
  const goal = await Goal.findOne({ _id: req.params.id, user: req.user.id });
  if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });

  if (goal.milestones[milestoneIndex]) {
    goal.milestones[milestoneIndex].isCompleted = isCompleted;
    if (isCompleted) goal.milestones[milestoneIndex].completedAt = new Date();
  }

  const completedMilestones = goal.milestones.filter((m) => m.isCompleted).length;
  goal.progress = goal.milestones.length > 0 ? Math.round((completedMilestones / goal.milestones.length) * 100) : 0;
  
  if (goal.progress === 100) goal.status = 'completed';
  
  await goal.save();
  res.json({ success: true, data: goal });
});
