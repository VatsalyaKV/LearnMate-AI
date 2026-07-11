const Certificate = require('../models/Certificate');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const { v4: uuidv4 } = require('uuid');

exports.getCertificates = asyncHandler(async (req, res) => {
  const certificates = await Certificate.find({ user: req.user.id }).populate('course', 'title').sort({ issuedAt: -1 });
  res.json({ success: true, data: certificates });
});

exports.getCertificate = asyncHandler(async (req, res) => {
  const cert = await Certificate.findOne({ _id: req.params.id, user: req.user.id }).populate('course', 'title thumbnail');
  if (!cert) return res.status(404).json({ success: false, message: 'Certificate not found' });
  res.json({ success: true, data: cert });
});

exports.issueCertificate = asyncHandler(async (req, res) => {
  const { courseId, roadmapId, title, skills, score, grade, type } = req.body;
  
  const certId = `LM-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;
  
  const cert = await Certificate.create({
    user: req.user.id,
    course: courseId,
    roadmap: roadmapId,
    title: title || 'Course Completion Certificate',
    issuer: 'LearnMate AI',
    certificateId: certId,
    verificationUrl: `${process.env.FRONTEND_URL}/verify/${certId}`,
    skills: skills || [],
    score: score,
    grade: grade,
    type: type || 'course',
  });

  // Update user
  const user = await User.findById(req.user.id);
  user.xpPoints += 500;
  user.badges.push(`certificate-${type || 'course'}`);
  await user.save({ validateBeforeSave: false });

  res.status(201).json({ success: true, data: cert });
});

exports.verifyCertificate = asyncHandler(async (req, res) => {
  const cert = await Certificate.findOne({ certificateId: req.params.certId }).populate('user', 'name email').populate('course', 'title');
  if (!cert) return res.status(404).json({ success: false, message: 'Certificate not found or invalid' });
  res.json({ success: true, data: { isValid: true, certificate: cert } });
});
