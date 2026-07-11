const express = require('express');
const router = express.Router();
const {
  sendMessage, getChatSessions, getChatSession,
  generateAssessment, generateRoadmap, generateStudyPlan,
  analyzeResume, generateInterviewPrep, getCareerPrediction,
  getProjectRecommendations, getLearningInsights, getMotivation,
} = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.post('/chat', sendMessage);
router.get('/chat/sessions', getChatSessions);
router.get('/chat/:sessionId', getChatSession);
router.post('/assessment', generateAssessment);
router.post('/roadmap', generateRoadmap);
router.post('/study-plan', generateStudyPlan);
router.post('/resume-analysis', analyzeResume);
router.post('/interview-prep', generateInterviewPrep);
router.get('/career-prediction', getCareerPrediction);
router.get('/project-recommendations', getProjectRecommendations);
router.get('/insights', getLearningInsights);
router.get('/motivation', getMotivation);

module.exports = router;
