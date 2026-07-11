const express = require('express');
const router = express.Router();
const { getCertificates, getCertificate, issueCertificate, verifyCertificate } = require('../controllers/certificateController');
const { protect } = require('../middleware/auth');

router.get('/verify/:certId', verifyCertificate);
router.use(protect);
router.get('/', getCertificates);
router.post('/', issueCertificate);
router.get('/:id', getCertificate);

module.exports = router;
