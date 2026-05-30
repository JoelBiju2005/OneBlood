const express = require('express');
const router = express.Router();
const donationController = require('../controllers/donationController');
const { protect } = require('../middleware/auth');

router.post('/', protect, donationController.createDonation);
router.get('/my-history', protect, donationController.getMyHistory);
router.get('/bank/:bankId', protect, donationController.getBankDonations);

module.exports = router;
