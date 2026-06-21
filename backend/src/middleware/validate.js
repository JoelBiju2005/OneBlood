const { body, validationResult } = require('express-validator');

/**
 * Express middleware that checks express-validator results.
 * Place after validation rule arrays in route definitions.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
};

// ─── Auth Validation Rules ───────────────────────────────────────────────────
const registerRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain at least one number.'),
  body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Name must be between 1 and 100 characters.'),
  body('phone').optional().trim(),
  body('role').optional().isIn(['donor', 'seeker', 'blood_bank', 'hospital']).withMessage('Invalid role.'),
  body('city').optional().trim().isLength({ max: 100 })
];

const loginRules = [
  body('password').notEmpty().withMessage('Password is required.'),
  // onebloodId or email — at least one must be present (validated in controller)
];

const forgotPasswordRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.')
];

const verifyOTPRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
  body('otp')
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be exactly 6 digits.')
    .isNumeric().withMessage('OTP must contain only numbers.')
];

const resetPasswordRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain at least one number.')
];

// ─── Request / Notice Board Rules ────────────────────────────────────────────
const createRequestRules = [
  body('bloodGroup').notEmpty().withMessage('Blood group is required.'),
  body('urgencyLevel').optional().isIn(['normal', 'urgent', 'critical']).withMessage('Invalid urgency level.'),
  body('unitsNeeded').optional().isInt({ min: 1, max: 50 }).withMessage('Units needed must be between 1 and 50.'),
];

const createNoticeRules = [
  body('bloodGroup').notEmpty().withMessage('Blood group is required.'),
  body('patientName').notEmpty().trim().isLength({ max: 200 }).withMessage('Patient name is required.'),
  body('hospital').notEmpty().trim().withMessage('Hospital name is required.'),
  body('city').notEmpty().trim().withMessage('City is required.'),
  body('urgency').optional().isIn(['normal', 'urgent', 'critical']).withMessage('Invalid urgency level.')
];

module.exports = {
  validate,
  registerRules,
  loginRules,
  forgotPasswordRules,
  verifyOTPRules,
  resetPasswordRules,
  createRequestRules,
  createNoticeRules
};
