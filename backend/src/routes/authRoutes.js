const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/admin-portal-login', authController.adminPortalLogin);
router.post('/google', authController.googleLogin);
router.post('/logout', protect, authController.logout);
router.post('/refresh', authController.refreshToken);
router.post('/refresh-token', authController.refreshToken); // keep alias for compatibility
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/me', protect, authController.getMe);
router.put('/profile', protect, authController.updateProfile);
router.post('/switch-role', protect, authController.switchRole);

module.exports = router;
