/**
 * auth.validators.js — Input validation rules for authentication endpoints
 *
 * express-validator lets us declare rules as arrays of middleware.
 * Each rule checks one field. If any rule fails, the error is collected and
 * the validate middleware (validate.middleware.js) returns a 400 response
 * before the controller even runs.
 *
 * Why validate on the server?
 * Frontend validation improves UX but can be bypassed (Postman, curl, scripts).
 * Server-side validation is the real security boundary.
 *
 * NOTE on email normalisation:
 * We use .customSanitizer(v => v.toLowerCase()) instead of .normalizeEmail().
 * normalizeEmail() aggressively transforms addresses (strips Gmail dots, expands
 * aliases) which can cause the same email to be stored differently than looked up.
 * Simple lowercase is sufficient and predictable.
 */

const { body } = require('express-validator');

// ─── Register ─────────────────────────────────────────────────────────────────
const registerRules = [
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required')
    .isLength({ max: 50 }).withMessage('First name cannot exceed 50 characters')
    .matches(/^[A-Za-z\s'-]+$/).withMessage('First name contains invalid characters'),

  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .isLength({ max: 50 }).withMessage('Last name cannot exceed 50 characters')
    .matches(/^[A-Za-z\s'-]+$/).withMessage('Last name contains invalid characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .customSanitizer((v) => v.toLowerCase()),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),

  body('phone')
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage('Phone number cannot exceed 20 characters'),

  // SECURITY: role is silently stripped in the controller — never trusted from the client.
];

// ─── Login ────────────────────────────────────────────────────────────────────
const loginRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .customSanitizer((v) => v.toLowerCase()),

  body('password')
    .notEmpty().withMessage('Password is required'),
];

// ─── Change password ──────────────────────────────────────────────────────────
const changePasswordRules = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),

  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('New password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('New password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('New password must contain at least one number')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password must be different from the current password');
      }
      return true;
    }),
];

// ─── Update profile ───────────────────────────────────────────────────────────
const updateProfileRules = [
  body('firstName')
    .optional()
    .trim()
    .notEmpty().withMessage('First name cannot be empty')
    .isLength({ max: 50 }).withMessage('First name cannot exceed 50 characters')
    .matches(/^[A-Za-z\s'-]+$/).withMessage('First name contains invalid characters'),

  body('lastName')
    .optional()
    .trim()
    .notEmpty().withMessage('Last name cannot be empty')
    .isLength({ max: 50 }).withMessage('Last name cannot exceed 50 characters')
    .matches(/^[A-Za-z\s'-]+$/).withMessage('Last name contains invalid characters'),

  body('phone')
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage('Phone number cannot exceed 20 characters'),

  body('address.street').optional().trim(),
  body('address.city').optional().trim(),
  body('address.country').optional().trim(),

  // Prevent clients from changing role or email via this endpoint
  body('role')
    .not().exists()
    .withMessage('Role cannot be changed via this endpoint'),

  body('email')
    .not().exists()
    .withMessage('Email cannot be changed via this endpoint'),
];

module.exports = {
  registerRules,
  loginRules,
  changePasswordRules,
  updateProfileRules,
};
