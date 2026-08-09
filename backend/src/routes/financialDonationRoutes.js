const express = require('express');
const router  = express.Router();
const { createOrder, verifyPayment, getPublicStats, adminGetAllDonations, adminExportDonationsCSV } = require('../controllers/financialDonationController');
const { protect, restrictTo, optionalAuth } = require('../middleware/auth');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const rateLimit = require('express-rate-limit');

const donationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,   // 1 hour
  max: 10,
  message: { success: false, message: 'Too many donation attempts. Please try again later.' }
});

const createOrderRules = [
  body('amount').isInt({ min: 10, max: 100000 }).withMessage('Amount must be between ₹10 and ₹1,00,000.'),
  body('donorName').trim().notEmpty().isLength({ min: 2, max: 80 }).escape().withMessage('Please enter your name.'),
  body('donorEmail').isEmail().normalizeEmail().withMessage('Please enter a valid email address.'),
  body('donorPhone').optional().isMobilePhone('en-IN').withMessage('Please enter a valid Indian mobile number.'),
  body('message').optional().trim().isLength({ max: 300 }).escape(),
];

const verifyRules = [
  body('razorpay_order_id').notEmpty().withMessage('Order ID is required.'),
  body('razorpay_payment_id').notEmpty().withMessage('Payment ID is required.'),
  body('razorpay_signature').notEmpty().withMessage('Signature is required.'),
];

router.post('/create-order',    donationLimiter, optionalAuth, createOrderRules, validate, createOrder);
router.post('/verify-payment',  donationLimiter, optionalAuth, verifyRules,      validate, verifyPayment);
router.get('/stats',            getPublicStats);

// Admin-only endpoints
router.get('/admin/all',        protect, restrictTo('admin'), adminGetAllDonations);
router.get('/admin/export',     protect, restrictTo('admin'), adminExportDonationsCSV);

module.exports = router;
