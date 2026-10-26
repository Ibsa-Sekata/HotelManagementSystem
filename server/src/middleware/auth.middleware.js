/**
 * auth.middleware.js — JWT verification middleware
 *
 * This middleware protects routes that require a logged-in user.
 * Place it BEFORE any controller that needs to know who is making the request.
 *
 * What it does:
 *   1. Reads the Authorization header: "Bearer <token>"
 *   2. Verifies the JWT signature and expiry using JWT_SECRET
 *   3. Loads the full user document from the database
 *   4. Attaches the user to req.user so controllers can use it
 *   5. Rejects with 401 if anything is wrong
 *
 * Why load the user from the database instead of just trusting the token?
 * The JWT payload contains the user's role at the TIME the token was issued.
 * If an admin later deactivates that account or changes the role, the old token
 * would still pass a "trust the payload" check. Loading from the database
 * catches deactivated accounts and fresh role changes.
 *
 * Usage:
 *   router.get('/profile', protect, myController);
 */

const asyncHandler = require('../utils/asyncHandler');
const ApiError     = require('../utils/ApiError');
const User         = require('../models/User');
const { verifyAccessToken } = require('../services/token.service');

const protect = asyncHandler(async (req, res, next) => {
  // ── 1. Extract token from the Authorization header ───────────────────────
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('No authentication token provided'));
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return next(ApiError.unauthorized('Malformed authorization header'));
  }

  // ── 2. Verify the token ───────────────────────────────────────────────────
  // verifyAccessToken throws JsonWebTokenError or TokenExpiredError on failure.
  // The global error handler in error.middleware.js converts those to clean 401s.
  const decoded = verifyAccessToken(token);

  // ── 3. Load the user from the database ───────────────────────────────────
  const user = await User.findById(decoded.id);

  if (!user) {
    return next(ApiError.unauthorized('The user belonging to this token no longer exists'));
  }

  if (!user.isActive) {
    return next(ApiError.unauthorized('Your account has been deactivated. Please contact support.'));
  }

  // ── 4. Attach to request ─────────────────────────────────────────────────
  // Controllers can now use req.user.id, req.user.role, req.user.email, etc.
  req.user = user;

  next();
});

module.exports = protect;
