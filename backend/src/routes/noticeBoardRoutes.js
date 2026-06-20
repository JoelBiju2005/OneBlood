const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const noticeBoardController = require('../controllers/noticeBoardController');
const { protect, optionalAuth } = require('../middleware/auth');
const { handleUpload } = require('../middleware/upload');
const { validate, createNoticeRules } = require('../middleware/validate');

const isDev = process.env.NODE_ENV !== 'production';

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 10000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many uploads. Limit is 20 per hour.' }
});

router.get('/', optionalAuth, noticeBoardController.getAllNotices); // Public with soft auth for data redaction
router.post('/', protect, uploadLimiter, handleUpload('single', 'doctorLetter'), createNoticeRules, validate, noticeBoardController.createNotice);
router.post('/:id/respond', protect, noticeBoardController.respondToNotice);
router.get('/mine', protect, noticeBoardController.getMyNotices);
router.patch('/:id/close', protect, noticeBoardController.closeNotice);

module.exports = router;
