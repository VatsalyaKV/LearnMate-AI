const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const ChatHistory = require('../models/ChatHistory');
const asyncHandler = require('../middleware/asyncHandler');

router.use(protect);

router.get('/', asyncHandler(async (req, res) => {
  const sessions = await ChatHistory.find({ user: req.user.id, isActive: true })
    .select('sessionId title context totalMessages updatedAt')
    .sort({ updatedAt: -1 })
    .limit(20);
  res.json({ success: true, data: sessions });
}));

router.delete('/:sessionId', asyncHandler(async (req, res) => {
  await ChatHistory.findOneAndUpdate(
    { user: req.user.id, sessionId: req.params.sessionId },
    { isActive: false }
  );
  res.json({ success: true, message: 'Chat session deleted' });
}));

module.exports = router;
