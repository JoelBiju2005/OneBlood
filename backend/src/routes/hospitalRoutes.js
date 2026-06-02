const express = require('express');
const router = express.Router();
const hospitalController = require('../controllers/hospitalController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/profile', protect, hospitalController.getProfile);
router.put('/profile', protect, hospitalController.updateProfile);
router.post('/upload-docs', protect, upload.fields([
  { name: 'registrationCertificate', maxCount: 1 },
  { name: 'govApproval', maxCount: 1 }
]), hospitalController.uploadDocs);

router.get('/dashboard', protect, hospitalController.getDashboardStats);
router.get('/facilities', protect, hospitalController.getApprovedFacilities);

module.exports = router;
