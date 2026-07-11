const express = require('express');
const router = express.Router();
const { getAnalytics, getPerformanceReport } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getAnalytics);
router.get('/performance-report', getPerformanceReport);

module.exports = router;
