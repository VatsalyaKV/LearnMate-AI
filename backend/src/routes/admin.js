const express = require('express');
const router = express.Router();
const { getDashboard, getUsers, updateUser, sendBroadcastNotification } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));
router.get('/dashboard', getDashboard);
router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.post('/broadcast', sendBroadcastNotification);

module.exports = router;
