const Assessment = require('../models/Assessment');
const User = require('../models/User');
const watsonxService = require('../services/watsonxService');
const Notification = require('../models/Notification');
const asyncHandler = require('../middleware/asyncHandler');
const { v4: uuidv4 } = require('uuid');

// @desc    Start assessment
// @route   POST /api/assessments/start
exports.startAssessment = asyncHandler(async (req, res) => {
  const { type, domain, skills, level } = req.body;
  const user = await User.findById(req.user.id);

  const domainName = domain || user.careerGoal || 'Software Development';
  const skillsList = skills?.join(', ') || user.currentSkills?.join(', ') || 'General Programming';
  const userLevel = level || user.learningPreferences?.difficulty || 'beginner';

  // Generate questions via AI with graceful fallback
  let questions = null;
  try {
    const questionsResult = await watsonxService.generateText(
    `<|system|>You are an expert AI skill assessor. Generate precise assessment questions.<|end_of_text|>
<|user|>
Domain: ${domainName}
Skills: ${skillsList}
Level: ${userLevel}
Student Background: ${user.yearsOfExperience || 0} years experience

Generate exactly 10 assessment questions as JSON array. Include a mix of easy (4), medium (4), hard (2) questions:
[
  {
    "question": "<question>",
    "type": "multiple-choice",
    "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
    "correctAnswer": "A",
    "skillArea": "<skill>",
    "difficulty": "easy",
    "points": 1,
    "explanation": "<why this answer>"
  }
]
<|end_of_text|>
<|assistant|>`,
      { maxTokens: 3500, temperature: 0.2 }
    );
    questions = watsonxService._parseJSON(questionsResult.text);
  } catch (err) {
    // IBM API not available — use rich domain-specific defaults
    console.warn(`AI question generation failed: ${err.message}. Using defaults.`);
  }

  const finalQuestions = questions || getDefaultQuestions(domainName);

  const assessment = await Assessment.create({
    user: req.user.id,
    type: type || 'initial',
    title: `${domain || 'Software Development'} Skill Assessment`,
    description: `Comprehensive assessment of your ${domain || 'technical'} skills`,
    questions: finalQuestions.map((q) => ({
      question: q.question,
      type: q.type || 'multiple-choice',
      options: q.options || [],
      correctAnswer: q.correctAnswer,
      skillArea: q.skillArea,
      difficulty: q.difficulty,
      points: q.points || 1,
      explanation: q.explanation,
    })),
    totalPoints: finalQuestions.reduce((s, q) => s + (q.points || 1), 0),
    status: 'in-progress',
  });

  // Return questions without answers
  const safeQuestions = assessment.questions.map((q) => ({
    _id: q._id,
    question: q.question,
    type: q.type,
    options: q.options,
    skillArea: q.skillArea,
    difficulty: q.difficulty,
    points: q.points,
  }));

  res.status(201).json({
    success: true,
    data: {
      assessmentId: assessment._id,
      title: assessment.title,
      questions: safeQuestions,
      totalPoints: assessment.totalPoints,
    },
  });
});

// @desc    Submit assessment
// @route   POST /api/assessments/:id/submit
exports.submitAssessment = asyncHandler(async (req, res) => {
  const { answers, timeTaken } = req.body;
  const assessment = await Assessment.findOne({ _id: req.params.id, user: req.user.id }).select('+questions.correctAnswer');

  if (!assessment) {
    return res.status(404).json({ success: false, message: 'Assessment not found' });
  }

  if (assessment.status === 'completed') {
    return res.status(400).json({ success: false, message: 'Assessment already completed' });
  }

  // Grade answers
  let earnedPoints = 0;
  const skillScores = {};

  assessment.questions.forEach((question, idx) => {
    const userAnswer = answers[idx]?.answer || answers[question._id.toString()];
    question.userAnswer = userAnswer;
    
    const isCorrect = userAnswer?.toString().trim().toLowerCase() === 
                      question.correctAnswer?.toString().trim().toLowerCase() ||
                      userAnswer?.toString().startsWith(question.correctAnswer?.toString()?.charAt(0));
    question.isCorrect = isCorrect;
    question.earnedPoints = isCorrect ? question.points : 0;
    earnedPoints += question.earnedPoints;

    const skill = question.skillArea || 'General';
    if (!skillScores[skill]) skillScores[skill] = { earned: 0, total: 0 };
    skillScores[skill].earned += question.earnedPoints;
    skillScores[skill].total += question.points;
  });

  const overallScore = Math.round((earnedPoints / assessment.totalPoints) * 100);

  // AI Analysis
  const user = await User.findById(req.user.id);
  const aiData = await watsonxService.assessSkills(user, {
    score: overallScore,
    skillScores,
    domain: assessment.title,
  });

  // Build skill results
  const skillResults = Object.entries(skillScores).map(([skill, data]) => {
    const pct = data.total > 0 ? Math.round((data.earned / data.total) * 100) : 0;
    return {
      skill,
      score: pct,
      level: pct >= 85 ? 'expert' : pct >= 70 ? 'advanced' : pct >= 50 ? 'intermediate' : pct >= 30 ? 'beginner' : 'novice',
      recommendation: pct < 50 ? `Focus on improving ${skill} fundamentals` : `Good ${skill} skills! Practice more advanced topics.`,
    };
  });

  assessment.earnedPoints = earnedPoints;
  assessment.overallScore = overallScore;
  assessment.skillResults = skillResults;
  assessment.status = 'completed';
  assessment.completedAt = new Date();
  assessment.timeTaken = timeTaken;
  assessment.aiAnalysis = aiData.aiAnalysis || `Score: ${overallScore}%`;
  assessment.strengthAreas = aiData.strengthAreas || skillResults.filter((s) => s.score >= 70).map((s) => s.skill);
  assessment.weakAreas = aiData.weakAreas || skillResults.filter((s) => s.score < 50).map((s) => s.skill);
  assessment.recommendations = aiData.recommendations || ['Continue practicing', 'Review weak areas'];

  await assessment.save();

  // Update user skills profile
  user.xpPoints += overallScore > 70 ? 150 : 50;
  await user.save({ validateBeforeSave: false });

  await Notification.create({
    user: req.user.id,
    title: '📊 Assessment Complete!',
    message: `You scored ${overallScore}% on your ${assessment.title}. Check your detailed results.`,
    type: 'achievement',
    priority: overallScore >= 80 ? 'high' : 'normal',
  });

  res.json({
    success: true,
    data: {
      assessmentId: assessment._id,
      overallScore,
      earnedPoints,
      totalPoints: assessment.totalPoints,
      skillResults,
      strengthAreas: assessment.strengthAreas,
      weakAreas: assessment.weakAreas,
      aiAnalysis: assessment.aiAnalysis,
      recommendations: assessment.recommendations,
    },
  });
});

// @desc    Get all assessments
// @route   GET /api/assessments
exports.getAssessments = asyncHandler(async (req, res) => {
  const assessments = await Assessment.find({ user: req.user.id })
    .select('-questions.correctAnswer')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: assessments });
});

// @desc    Get single assessment
// @route   GET /api/assessments/:id
exports.getAssessment = asyncHandler(async (req, res) => {
  const assessment = await Assessment.findOne({ _id: req.params.id, user: req.user.id });
  if (!assessment) return res.status(404).json({ success: false, message: 'Assessment not found' });
  res.json({ success: true, data: assessment });
});

function getDefaultQuestions(domain) {
  return [
    { question: `What is a fundamental concept in ${domain || 'programming'}?`, type: 'multiple-choice', options: ['A) Variables', 'B) Databases', 'C) Networks', 'D) Hardware'], correctAnswer: 'A', skillArea: domain || 'Programming', difficulty: 'easy', points: 1, explanation: 'Variables are foundational.' },
    { question: 'What does HTML stand for?', type: 'multiple-choice', options: ['A) HyperText Markup Language', 'B) High Tech Modern Language', 'C) Home Tool Markup Language', 'D) Hyperlink Text Mode Language'], correctAnswer: 'A', skillArea: 'Web Development', difficulty: 'easy', points: 1, explanation: 'HTML = HyperText Markup Language' },
  ];
}
