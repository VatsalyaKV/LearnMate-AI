const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getUserStats, logActivity, getLeaderboard } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/stats', getUserStats);
router.post('/activity', logActivity);
router.get('/leaderboard', getLeaderboard);

module.exports = router;
