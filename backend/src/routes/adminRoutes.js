const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/auth');

// All routes require admin authentication
router.use(protect, restrictTo('admin'));

router.get('/users', adminController.getUsers);
router.get('/donors', adminController.getDonors);
router.get('/banks', adminController.getBanks);
router.get('/requests', adminController.getRequests);
router.get('/messages', adminController.getMessages);
router.get('/stats', adminController.getStats);

router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.delete('/donors/:id', adminController.deleteDonor);
router.delete('/banks/:id', adminController.deleteBank);

module.exports = router;
