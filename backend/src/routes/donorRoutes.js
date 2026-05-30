const express = require('express');
const router = express.Router();
const donorController = require('../controllers/donorController');
const { protect } = require('../middleware/auth');

router.get('/', donorController.getDonors);
router.post('/register', protect, donorController.registerDonor);
router.get('/profile', protect, donorController.getDonorProfile);
router.patch('/availability', protect, donorController.updateAvailabilitySelf);

// Specific donor endpoints
router.get('/:id/profile', donorController.getDonorProfilePublic);
router.get('/:id/contact', protect, donorController.getDonorContact);
router.post('/:id/contact/unlock', protect, donorController.unlockDonorContact);

router.get('/:id', protect, donorController.getDonorById);
router.put('/:id', protect, donorController.updateDonor);
router.patch('/:id/availability', protect, donorController.updateAvailability);
router.get('/:id/history', protect, donorController.getDonorHistory);

module.exports = router;
