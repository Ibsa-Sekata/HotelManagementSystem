/**
 * auth.routes.js — Routes for authentication endpoints
 *
 * Route map:
 *   POST   /api/v1/auth/register          Public  — create customer account
 *   POST   /api/v1/auth/login             Public  — get access + refresh tokens
 *   POST   /api/v1/auth/refresh           Public  — rotate tokens using cookie
 *   POST   /api/v1/auth/logout            Auth    — clear tokens
 *   GET    /api/v1/auth/me                Auth    — get own profile
 *   PATCH  /api/v1/auth/me                Auth    — update own profile
 *   PATCH  /api/v1/auth/me/password       Auth    — change password
 *
 * Middleware stack per route:
 *   Public routes:     [validate rules] → validate → controller
 *   Protected routes:  protect → [validate rules] → validate → controller
 */

const express = require('express');
const rateLimit = require('express-rate-limit');

const authController = require('../controllers/auth.controller');
const {
  registerRules,
  loginRules,
  changePasswordRules,
  updateProfileRules,
} = require('../validators/auth.validators');
const validate = require('../middleware/validate.middleware');
const protect = require('../middleware/auth.middleware');

const router = express.Router();

// ─── Strict rate limiter for auth endpoints ────────────────────────────────────
// Login and register are the most likely targets for brute-force attacks.
// 10 attempts per 15 minutes per IP is generous for legitimate use but stops bots.
// Rate limiting is DISABLED in test environment to allow automated test suites to run.
const authLimiter = process.env.NODE_ENV === 'test'
  ? (req, res, next) => next()  // no-op in tests
  : rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many authentication attempts. Please try again in 15 minutes.',
    },
  });

// ─── Public routes ─────────────────────────────────────────────────────────────
router.post('/register', authLimiter, registerRules, validate, authController.register);
router.post('/login', authLimiter, loginRules, validate, authController.login);
router.post('/refresh', authController.refresh);

// ─── Protected routes ──────────────────────────────────────────────────────────
router.post('/logout', protect, authController.logout);
router.get('/me', protect, authController.getMe);
router.patch('/me', protect, updateProfileRules, validate, authController.updateMe);
router.patch('/me/password', protect, changePasswordRules, validate, authController.changePassword);

module.exports = router;
