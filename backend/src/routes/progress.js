const express = require('express');
const router = express.Router();
const { logProgress, getProgress, getProgressAnalytics, updateCourseProgress } = require('../controllers/progressController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/').get(getProgress).post(logProgress);
router.get('/analytics', getProgressAnalytics);
router.put('/course/:courseId', updateCourseProgress);

module.exports = router;
