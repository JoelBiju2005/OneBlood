const express = require('express');
const router = express.Router();
const noticeBoardController = require('../controllers/noticeBoardController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', noticeBoardController.getAllNotices); // Public - all roles see this
router.post('/', protect, upload.single('doctorLetter'), noticeBoardController.createNotice); // Seekers only
router.post('/:id/respond', protect, noticeBoardController.respondToNotice); // Donors only
router.get('/mine', protect, noticeBoardController.getMyNotices); // Seeker's own notices
router.patch('/:id/close', protect, noticeBoardController.closeNotice); // Seeker closes their notice

module.exports = router;
