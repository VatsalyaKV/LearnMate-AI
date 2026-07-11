const express = require('express');
const router = express.Router();
const { register, login, getMe, updatePassword, logout, completeOnboarding, registerValidation, loginValidation } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/updatepassword', protect, updatePassword);
router.put('/onboarding', protect, completeOnboarding);

module.exports = router;
