const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate, registerRules, loginRules, forgotPasswordRules, resetPasswordRules } = require('../middleware/validate');

const isDev = process.env.NODE_ENV !== 'production';

// Sensitive auth limiter (forgot-password, reset-password)
const sensitiveAuthLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 10000 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again later.' }
});

router.post('/register', registerRules, validate, authController.register);
router.post('/login', loginRules, validate, authController.login);
router.post('/admin-portal-login', authController.adminPortalLogin);
router.post('/google', authController.googleLogin);
router.post('/logout', protect, authController.logout);
router.post('/refresh', authController.refreshToken);
router.post('/refresh-token', authController.refreshToken); // keep alias for compatibility
router.post('/forgot-password', sensitiveAuthLimiter, forgotPasswordRules, validate, authController.forgotPassword);
router.post('/reset-password', sensitiveAuthLimiter, resetPasswordRules, validate, authController.resetPassword);
router.get('/me', protect, authController.getMe);
router.put('/profile', protect, authController.updateProfile);
router.post('/switch-role', protect, authController.switchRole);
router.get('/verify-hospital', authController.verifyHospitalEmail);

module.exports = router;
