const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/auth');

// All routes require admin authentication
router.use(protect, restrictTo('admin'));

router.get('/users', adminController.getUsers);
router.get('/donors', adminController.getDonors);
router.get('/banks', adminController.getBanks);
router.get('/hospitals', adminController.getHospitals);
router.get('/requests', adminController.getRequests);
router.get('/messages', adminController.getMessages);
router.get('/stats', adminController.getStats);

router.put('/hospitals/:id/approve', adminController.approveHospital);
router.put('/banks/:id/approve', adminController.approveBloodBank);

router.get('/email-templates', adminController.getEmailTemplates);
router.post('/email-templates', adminController.updateEmailTemplate);
router.get('/email-logs', adminController.getEmailLogs);

router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);

router.post('/seed-hubballi', adminController.seedHubballiData);

router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.delete('/donors/:id', adminController.deleteDonor);
router.delete('/banks/:id', adminController.deleteBank);
router.delete('/requests/:id', adminController.deleteRequest);
router.get('/notices', adminController.getNotices);
router.delete('/notices/:id', adminController.deleteNotice);

module.exports = router;
