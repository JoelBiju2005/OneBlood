const express = require('express');
const router = express.Router();
const donationController = require('../controllers/donationController');
const matchController = require('../controllers/matchController');
const { protect } = require('../middleware/auth');

// Existing donation records (banks)
router.post('/', protect, donationController.createDonation);
router.get('/my-history', protect, donationController.getMyHistory);
router.get('/bank/:bankId', protect, donationController.getBankDonations);

// New Donation Matches Workflows (MOB-XXXXXXX)
router.post('/matches/approve', protect, matchController.approveDonorAndSelectFacility);
router.post('/matches/:matchId/complete', protect, matchController.completeDonation);
router.post('/matches/:matchId/cancel', protect, matchController.cancelMatch);
router.get('/matches/in-progress', protect, matchController.getMatchesInProgress);
router.get('/matches/history', protect, matchController.getMatchHistory);

module.exports = router;
