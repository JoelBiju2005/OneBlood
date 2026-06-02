const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const requestController = require('../controllers/requestController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Rate limiters to prevent AI and email spam
const requestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  // Emergency Mode: Critical requests bypass the 5-per-hour limit
  skip: (req) => req.body && req.body.urgencyLevel === 'critical',
  message: { message: 'Too many blood requests submitted. Limit is 5 per hour. Critical emergencies are exempt.' }
});

const ocrLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { message: 'Too many prescription uploads. Limit is 10 verification scans per hour.' }
});

router.get('/', requestController.getRequests);
router.get('/my-requests', protect, requestController.getMyRequests);
router.post('/', protect, requestLimiter, requestController.createRequest);
router.get('/:id', requestController.getRequestById);
router.patch('/:id', protect, requestController.updateRequest);
router.delete('/:id', protect, requestController.deleteRequest);
router.patch('/:id/status', protect, requestController.updateStatus);

// AI prescription validation with OCR processing
router.post('/verify-letter', protect, ocrLimiter, upload.single('letter'), requestController.verifyLetter);

// Donor matches responses
router.post('/:id/respond', protect, requestController.respondToRequest);
router.post('/:id/target-donor/:donorId', protect, requestController.targetDonor);
router.post('/:id/accept', protect, requestController.acceptRequest);
router.post('/:id/decline', protect, requestController.declineRequest);

module.exports = router;
