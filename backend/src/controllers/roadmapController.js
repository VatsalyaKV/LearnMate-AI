const Roadmap = require('../models/Roadmap');
const User = require('../models/User');
const Notification = require('../models/Notification');
const watsonxService = require('../services/watsonxService');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Create roadmap
// @route   POST /api/roadmaps
exports.createRoadmap = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  const { assessmentResults } = req.body;

  const aiRoadmapData = await watsonxService.generateRoadmap(user, assessmentResults);
  
  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + (aiRoadmapData.estimatedDuration || 24) * 7);

  const roadmap = await Roadmap.create({
    user: req.user.id,
    title: aiRoadmapData.title,
    description: aiRoadmapData.description,
    goal: user.targetRole || user.careerGoal,
    targetRole: user.targetRole,
    currentLevel: user.learningPreferences?.difficulty || 'beginner',
    estimatedDuration: aiRoadmapData.estimatedDuration || 24,
    estimatedCompletionDate: estimatedDate,
    phases: (aiRoadmapData.phases || []).map((phase, idx) => ({
      ...phase,
      status: idx === 0 ? 'in-progress' : 'locked',
    })),
    isAIGenerated: true,
    aiReasoning: aiRoadmapData.aiReasoning,
  });

  // Notify user
  await Notification.create({
    user: req.user.id,
    title: '🗺️ Your Learning Roadmap is Ready!',
    message: `Your personalized roadmap "${roadmap.title}" has been created. Start your journey!`,
    type: 'ai-insight',
    priority: 'high',
    actionUrl: `/roadmap/${roadmap._id}`,
    actionLabel: 'View Roadmap',
  });

  // Update user XP
  user.xpPoints += 100;
  await user.save({ validateBeforeSave: false });

  res.status(201).json({ success: true, data: roadmap });
});

// @desc    Get all roadmaps
// @route   GET /api/roadmaps
exports.getRoadmaps = asyncHandler(async (req, res) => {
  const roadmaps = await Roadmap.find({ user: req.user.id }).sort({ createdAt: -1 });
  res.json({ success: true, count: roadmaps.length, data: roadmaps });
});

// @desc    Get single roadmap
// @route   GET /api/roadmaps/:id
exports.getRoadmap = asyncHandler(async (req, res) => {
  const roadmap = await Roadmap.findOne({ _id: req.params.id, user: req.user.id }).populate('phases.courses.course');
  
  if (!roadmap) {
    return res.status(404).json({ success: false, message: 'Roadmap not found' });
  }

  res.json({ success: true, data: roadmap });
});

// @desc    Update roadmap progress
// @route   PUT /api/roadmaps/:id/progress
exports.updateProgress = asyncHandler(async (req, res) => {
  const { phaseIndex, courseIndex, lessonId, status, projectIndex } = req.body;
  const roadmap = await Roadmap.findOne({ _id: req.params.id, user: req.user.id });

  if (!roadmap) {
    return res.status(404).json({ success: false, message: 'Roadmap not found' });
  }

  if (phaseIndex !== undefined && roadmap.phases[phaseIndex]) {
    const phase = roadmap.phases[phaseIndex];

    if (courseIndex !== undefined && phase.courses[courseIndex]) {
      phase.courses[courseIndex].status = status;
      if (status === 'completed') {
        phase.courses[courseIndex].completedDate = new Date();
      }
    }

    if (projectIndex !== undefined && phase.projects[projectIndex]) {
      phase.projects[projectIndex].status = status;
    }

    // Check if phase is complete
    const allCoursesComplete = phase.courses.every((c) => c.status === 'completed');
    if (allCoursesComplete && phase.courses.length > 0) {
      phase.status = 'completed';
      phase.completedDate = new Date();
      
      // Unlock next phase
      if (roadmap.phases[phaseIndex + 1]) {
        roadmap.phases[phaseIndex + 1].status = 'in-progress';
        roadmap.phases[phaseIndex + 1].startDate = new Date();
      }

      // Award XP
      const user = await User.findById(req.user.id);
      user.xpPoints += 500;
      user.level = Math.floor(user.xpPoints / 500) + 1;
      await user.save({ validateBeforeSave: false });

      await Notification.create({
        user: req.user.id,
        title: '🎉 Phase Completed!',
        message: `Congratulations! You completed "${phase.title}". Moving to the next phase!`,
        type: 'achievement',
        priority: 'high',
      });
    }
  }

  // Calculate overall progress
  const totalCourses = roadmap.phases.reduce((sum, p) => sum + p.courses.length, 0);
  const completedCourses = roadmap.phases.reduce(
    (sum, p) => sum + p.courses.filter((c) => c.status === 'completed').length,
    0
  );
  roadmap.overallProgress = totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0;

  if (roadmap.overallProgress === 100) {
    roadmap.status = 'completed';
  }

  await roadmap.save();
  res.json({ success: true, data: roadmap });
});

// @desc    Adapt roadmap with AI
// @route   POST /api/roadmaps/:id/adapt
exports.adaptRoadmap = asyncHandler(async (req, res) => {
  const { reason, progressData } = req.body;
  const roadmap = await Roadmap.findOne({ _id: req.params.id, user: req.user.id });
  const user = await User.findById(req.user.id);

  if (!roadmap) {
    return res.status(404).json({ success: false, message: 'Roadmap not found' });
  }

  const adaptationPrompt = `<|system|>
You are an expert AI curriculum adaptor. Analyze the student's progress and suggest roadmap adaptations.
<|end_of_text|>
<|user|>
Student: ${user.name}
Current Roadmap: ${roadmap.title}
Progress: ${roadmap.overallProgress}%
Reason for Adaptation: ${reason || 'Performance-based optimization'}
Progress Data: ${JSON.stringify(progressData || {})}

Suggest specific adaptations as JSON:
{
  "adaptations": [
    {"phase": "<phase name>", "change": "<what to change>", "reason": "<why>"}
  ],
  "summary": "<overall adaptation summary>",
  "estimatedImpact": "<expected improvement>"
}
<|end_of_text|>
<|assistant|>`,

  adaptationResult = await watsonxService.generateText(adaptationPrompt, { maxTokens: 1000 });
  const parsed = watsonxService._parseJSON(adaptationResult.text);

  roadmap.adaptationHistory.push({
    adaptedAt: new Date(),
    reason: reason || 'AI-driven optimization',
    changes: parsed?.summary || adaptationResult.text.substring(0, 200),
  });
  roadmap.lastAdaptedAt = new Date();
  await roadmap.save();

  res.json({ success: true, data: roadmap, adaptations: parsed });
});

// @desc    Delete roadmap
// @route   DELETE /api/roadmaps/:id
exports.deleteRoadmap = asyncHandler(async (req, res) => {
  const roadmap = await Roadmap.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!roadmap) {
    return res.status(404).json({ success: false, message: 'Roadmap not found' });
  }
  res.json({ success: true, message: 'Roadmap deleted' });
});
