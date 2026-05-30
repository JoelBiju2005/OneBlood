const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { protect, restrictTo } = require('../middleware/auth');

router.get('/platform', protect, restrictTo('super_admin'), analyticsController.getPlatformAnalytics);
router.get('/banks/:id', protect, analyticsController.getBankAnalytics);

module.exports = router;
