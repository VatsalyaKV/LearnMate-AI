const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const crypto = require('crypto');

const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();
  user.password = undefined;
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      onboardingCompleted: user.onboardingCompleted,
      xpPoints: user.xpPoints,
      level: user.level,
      streak: user.streak,
      subscription: user.subscription,
      careerGoal: user.careerGoal,
      targetRole: user.targetRole,
      currentSkills: user.currentSkills,
    },
  });
};

// @desc    Register user
// @route   POST /api/auth/register
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role, careerGoal, targetRole } = req.body;

  const user = await User.create({
    name,
    email,
    password,
    role: role === 'admin' ? 'student' : role || 'student',
    careerGoal: careerGoal || '',
    targetRole: targetRole || '',
  });

  sendTokenResponse(user, 201, res);
});

// @desc    Login user
// @route   POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password' });
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  if (!user.isActive) {
    return res.status(401).json({ success: false, message: 'Account has been deactivated' });
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res);
});

// @desc    Get current user
// @route   GET /api/auth/me
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json({ success: true, data: user });
});

// @desc    Update password
// @route   PUT /api/auth/updatepassword
exports.updatePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('+password');
  
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return res.status(401).json({ success: false, message: 'Current password is incorrect' });
  }

  user.password = req.body.newPassword;
  await user.save();
  sendTokenResponse(user, 200, res);
});

// @desc    Logout
// @route   POST /api/auth/logout
exports.logout = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// @desc    Complete onboarding
// @route   PUT /api/auth/onboarding
exports.completeOnboarding = asyncHandler(async (req, res) => {
  const {
    careerGoal, targetRole, currentRole, currentSkills, interests,
    education, yearsOfExperience, learningPreferences, industry,
  } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      careerGoal, targetRole, currentRole, currentSkills, interests,
      education, yearsOfExperience, learningPreferences, industry,
      onboardingCompleted: true,
    },
    { new: true, runValidators: true }
  );

  res.json({ success: true, data: user, message: 'Onboarding completed successfully!' });
});

exports.registerValidation = [
  body('name').notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  validate,
];

exports.loginValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];
