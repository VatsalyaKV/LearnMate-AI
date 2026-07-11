const express = require('express');
const router = express.Router();
const { startAssessment, submitAssessment, getAssessments, getAssessment } = require('../controllers/assessmentController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.post('/start', startAssessment);
router.post('/:id/submit', submitAssessment);
router.get('/', getAssessments);
router.get('/:id', getAssessment);

module.exports = router;
