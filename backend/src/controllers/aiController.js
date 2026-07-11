const ChatHistory = require('../models/ChatHistory');
const Notification = require('../models/Notification');
const User = require('../models/User');
const watsonxService = require('../services/watsonxService');
const asyncHandler = require('../middleware/asyncHandler');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

// @desc    Send message to AI Coach
// @route   POST /api/ai/chat
exports.sendMessage = asyncHandler(async (req, res) => {
  const { message, sessionId, context } = req.body;
  const userId = req.user.id;

  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, message: 'Message cannot be empty' });
  }

  const sid = sessionId || uuidv4();
  const user = await User.findById(userId);

  // Get or create chat session
  let session = await ChatHistory.findOne({ user: userId, sessionId: sid });
  
  if (!session) {
    session = await ChatHistory.create({
      user: userId,
      sessionId: sid,
      title: message.substring(0, 60),
      context: context || 'general',
      messages: [],
      agentState: {
        currentPhase: user.onboardingCompleted ? 'active' : 'onboarding',
        collectedInfo: {
          hasCareerGoal: !!user.careerGoal,
          hasSkills: user.currentSkills?.length > 0,
          hasLearningPrefs: user.onboardingCompleted,
        },
      },
    });
  }

  // Add user message
  session.messages.push({ role: 'user', content: message.trim(), timestamp: new Date() });

  // Build conversation context (last 10 messages)
  const recentMessages = session.messages.slice(-10).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  // Get user context for AI
  const userContext = {
    name: user.name,
    careerGoal: user.careerGoal,
    targetRole: user.targetRole,
    currentRole: user.currentRole,
    currentSkills: user.currentSkills,
    interests: user.interests,
    xpPoints: user.xpPoints,
    streak: user.streak,
    learningPreferences: user.learningPreferences,
    onboardingCompleted: user.onboardingCompleted,
  };

  // Call AI
  const aiResponse = await watsonxService.getCoachResponse(
    recentMessages,
    userContext,
    session.agentState
  );

  // Add AI response
  const assistantMessage = {
    role: 'assistant',
    content: aiResponse.text,
    timestamp: new Date(),
    tokensUsed: aiResponse.tokensUsed,
    model: aiResponse.model,
  };

  session.messages.push(assistantMessage);
  session.totalMessages = session.messages.length;
  session.totalTokens += aiResponse.tokensUsed || 0;

  // Update agent state based on conversation
  await updateAgentState(session, message, aiResponse.text, user);

  await session.save();

  // Award XP for engagement
  user.xpPoints += 5;
  await user.save({ validateBeforeSave: false });

  res.json({
    success: true,
    data: {
      sessionId: sid,
      message: assistantMessage,
      agentState: session.agentState,
    },
  });
});

// @desc    Get chat sessions
// @route   GET /api/ai/chat/sessions
exports.getChatSessions = asyncHandler(async (req, res) => {
  const sessions = await ChatHistory.find({ user: req.user.id, isActive: true })
    .select('sessionId title context totalMessages createdAt updatedAt agentState')
    .sort({ updatedAt: -1 })
    .limit(20);
  
  res.json({ success: true, data: sessions });
});

// @desc    Get chat session messages
// @route   GET /api/ai/chat/:sessionId
exports.getChatSession = asyncHandler(async (req, res) => {
  const session = await ChatHistory.findOne({
    user: req.user.id,
    sessionId: req.params.sessionId,
  });

  if (!session) {
    return res.status(404).json({ success: false, message: 'Session not found' });
  }

  res.json({ success: true, data: session });
});

// @desc    Generate skill assessment
// @route   POST /api/ai/assessment
exports.generateAssessment = asyncHandler(async (req, res) => {
  const { skills, domain, level } = req.body;
  const user = await User.findById(req.user.id);

  let parsed = null;
  try {
    const questions = await watsonxService.generateText(
      `<|system|>
You are an expert AI skill assessor. Generate a comprehensive assessment.
<|end_of_text|>
<|user|>
Domain: ${domain || user.careerGoal || 'Software Development'}
Skills to assess: ${skills?.join(', ') || user.currentSkills?.join(', ') || 'General Programming'}
Level: ${level || 'beginner'}

Generate 10 assessment questions as a JSON array:
[
  {
    "question": "<question text>",
    "type": "multiple-choice",
    "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
    "correctAnswer": "A",
    "skillArea": "<skill being tested>",
    "difficulty": "<easy|medium|hard>",
    "points": 1,
    "explanation": "<why this is the answer>"
  }
]
Include a mix of difficulties and skill areas. Return ONLY the JSON array.
<|end_of_text|>
<|assistant|>`,
      { maxTokens: 3000 }
    );
    parsed = watsonxService._parseJSON(questions.text);
  } catch (err) {
    logger.warn(`AI assessment generation failed: ${err.message}, using defaults`);
  }

  res.json({
    success: true,
    data: {
      questions: parsed || generateDefaultQuestions(domain || 'Programming'),
      domain: domain || 'Software Development',
    },
  });
});

// @desc    Generate learning roadmap
// @route   POST /api/ai/roadmap
exports.generateRoadmap = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  const { assessmentResults } = req.body;

  // Auto-set default goal if missing so it never blocks
  if (!user.targetRole && !user.careerGoal) {
    user.careerGoal = 'Software Developer';
    user.targetRole = 'Software Developer';
  }

  let roadmapData;
  try {
    roadmapData = await watsonxService.generateRoadmap(user, assessmentResults);
  } catch (err) {
    logger.warn(`AI roadmap generation failed: ${err.message}, using defaults`);
    roadmapData = watsonxService._defaultRoadmap(user);
  }
  
  res.json({ success: true, data: roadmapData });
});

// @desc    Generate study plan
// @route   POST /api/ai/study-plan
exports.generateStudyPlan = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  const { roadmapId, weekNumber } = req.body;

  const Roadmap = require('../models/Roadmap');
  let roadmap = null;
  if (roadmapId) {
    roadmap = await Roadmap.findOne({ _id: roadmapId, user: req.user.id });
  }

  let plan;
  try {
    plan = await watsonxService.generateStudyPlan(user, roadmap, weekNumber || 1);
  } catch (err) {
    logger.warn(`AI study plan failed: ${err.message}, using defaults`);
    plan = watsonxService._defaultStudyPlan(user, weekNumber || 1);
  }
  
  res.json({ success: true, data: plan });
});

// @desc    Analyze resume
// @route   POST /api/ai/resume-analysis
exports.analyzeResume = asyncHandler(async (req, res) => {
  const { resumeText } = req.body;
  const user = await User.findById(req.user.id);

  if (!resumeText) {
    return res.status(400).json({ success: false, message: 'Resume text is required' });
  }

  const analysis = await watsonxService.analyzeResume(
    resumeText,
    user.targetRole || user.careerGoal || 'Software Developer'
  );

  // Update user career readiness score
  if (analysis.careerReadinessScore) {
    await User.findByIdAndUpdate(req.user.id, {
      careerReadinessScore: analysis.careerReadinessScore,
    });
  }

  res.json({ success: true, data: analysis });
});

// @desc    Generate interview prep
// @route   POST /api/ai/interview-prep
exports.generateInterviewPrep = asyncHandler(async (req, res) => {
  const { role, skills, experienceLevel } = req.body;
  const user = await User.findById(req.user.id);

  const prep = await watsonxService.generateInterviewPrep(
    role || user.targetRole,
    skills || user.currentSkills,
    experienceLevel || 'junior'
  );

  res.json({ success: true, data: prep });
});

// @desc    Get career prediction
// @route   GET /api/ai/career-prediction
exports.getCareerPrediction = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  const Assessment = require('../models/Assessment');
  const latestAssessment = await Assessment.findOne({ user: req.user.id, status: 'completed' })
    .sort({ completedAt: -1 });

  const prediction = await watsonxService.predictCareerPath(user, latestAssessment);
  
  if (prediction.careerReadinessScore) {
    await User.findByIdAndUpdate(req.user.id, { careerReadinessScore: prediction.careerReadinessScore });
  }

  res.json({ success: true, data: prediction });
});

// @desc    Get project recommendations
// @route   GET /api/ai/project-recommendations
exports.getProjectRecommendations = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  
  const projects = await watsonxService.generateProjectRecommendations(
    user.currentSkills,
    user.learningPreferences?.difficulty || 'beginner'
  );

  res.json({ success: true, data: projects });
});

// @desc    Get learning insights
// @route   GET /api/ai/insights
exports.getLearningInsights = asyncHandler(async (req, res) => {
  const Progress = require('../models/Progress');
  const user = await User.findById(req.user.id);
  
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentProgress = await Progress.find({
    user: req.user.id,
    date: { $gte: thirtyDaysAgo },
  }).sort({ date: 1 });

  const progressSummary = {
    totalDays: recentProgress.length,
    totalHours: recentProgress.reduce((s, p) => s + p.hoursStudied, 0),
    totalLessons: recentProgress.reduce((s, p) => s + p.lessonsCompleted, 0),
    avgHoursPerDay: recentProgress.length > 0 ? (recentProgress.reduce((s, p) => s + p.hoursStudied, 0) / recentProgress.length).toFixed(1) : 0,
    streak: user.streak,
    topics: [...new Set(recentProgress.flatMap((p) => p.topicsStudied))],
  };

  const insights = await watsonxService.generateLearningInsights(progressSummary, user);
  
  if (insights.productivityScore) {
    await User.findByIdAndUpdate(req.user.id, { productivityScore: insights.productivityScore });
  }

  res.json({ success: true, data: insights });
});

// @desc    Get motivational message
// @route   GET /api/ai/motivation
exports.getMotivation = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  
  const result = await watsonxService.generateText(
    `<|system|>You are an expert motivational coach specializing in learning and career development.<|end_of_text|>
<|user|>Generate a personalized, powerful motivational message for ${user.name} who is working toward becoming a ${user.targetRole || user.careerGoal || 'developer'}. They have a ${user.streak?.current || 0}-day learning streak and ${user.xpPoints} XP points. Make it specific, inspiring, and action-oriented in 2-3 sentences.<|end_of_text|>
<|assistant|>`,
    { maxTokens: 200, temperature: 0.9 }
  );

  res.json({ success: true, data: { message: result.text } });
});

async function updateAgentState(session, userMessage, aiResponse, user) {
  const msg = userMessage.toLowerCase();
  const state = session.agentState;

  if (!user.careerGoal && (msg.includes('career') || msg.includes('job') || msg.includes('developer') || msg.includes('engineer'))) {
    state.currentPhase = 'career-discovery';
  } else if (msg.includes('roadmap') || msg.includes('path') || msg.includes('plan')) {
    state.currentPhase = 'roadmap-generation';
  } else if (msg.includes('assessment') || msg.includes('skill') || msg.includes('level')) {
    state.currentPhase = 'skill-assessment';
  } else if (msg.includes('project') || msg.includes('build') || msg.includes('practice')) {
    state.currentPhase = 'project-guidance';
  } else {
    state.currentPhase = 'active-coaching';
  }
}

function generateDefaultQuestions(domain) {
  return [
    {
      question: `What is the primary purpose of ${domain}?`,
      type: 'multiple-choice',
      options: ['A) Building applications', 'B) Data storage only', 'C) Network management', 'D) Hardware control'],
      correctAnswer: 'A',
      skillArea: domain,
      difficulty: 'easy',
      points: 1,
      explanation: `${domain} is primarily used for building applications.`,
    },
  ];
}
