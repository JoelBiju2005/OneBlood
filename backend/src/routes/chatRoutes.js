const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

router.get('/rooms', protect, chatController.getChatRooms);
router.get('/:requestId/messages', protect, chatController.getMessages);
router.post('/:requestId/send', protect, chatController.sendMessage);
router.post('/:requestId/read', protect, chatController.markAsRead);

module.exports = router;
