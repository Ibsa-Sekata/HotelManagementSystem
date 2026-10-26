/**
 * auth.controller.js — Handlers for all authentication endpoints
 *
 * Controllers are the "glue" between a route and the database/services.
 * Each function here handles one HTTP endpoint.
 *
 * SECURITY RULES enforced here:
 *   - Passwords are NEVER logged or returned in responses.
 *   - The `role` field from registration requests is IGNORED — always 'customer'.
 *   - Generic error messages are used for login failures to prevent user enumeration
 *     (an attacker should not be able to tell whether the email exists).
 *   - Refresh token values are NEVER logged.
 */

const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');
const {
  signAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  verifyRefreshToken,
  refreshCookieOptions,
} = require('../services/token.service');

// ─── Helper: build and send the standard auth response ────────────────────────
/**
 * Issues tokens and sends the auth response.
 * Used by both register and login to avoid code duplication.
 *
 * TWO COOKIES are set:
 *   refreshToken — httpOnly (JS cannot read it) — contains the secret token value
 *   userId       — NOT httpOnly (JS can read it) — contains only the user's public ID
 *
 * The userId cookie is not secret — MongoDB ObjectIds are not sensitive.
 * It lets the refresh endpoint look up the right user without scanning all users.
 *
 * @param {User}     user - the authenticated user document
 * @param {number}   statusCode - HTTP status (201 for register, 200 for login)
 * @param {Response} res
 */
const sendAuthResponse = async (user, statusCode, res) => {
  // Issue access token
  const accessToken = signAccessToken({ id: user._id, role: user.role });

  // Issue refresh token (random bytes — NOT a JWT)
  const rawRefreshToken = generateRefreshToken();

  // Hash and store the refresh token in the database
  const refreshHash = await hashRefreshToken(rawRefreshToken);
  user.refreshTokenHash = refreshHash;
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const cookieOpts = refreshCookieOptions();

  // Secret cookie: the raw token — httpOnly so JS cannot steal it
  res.cookie('refreshToken', rawRefreshToken, cookieOpts);

  // Non-secret cookie: the user ID — allows the refresh endpoint to find the user
  // Not httpOnly because the frontend may want to read it for UI purposes
  res.cookie('userId', user._id.toString(), {
    ...cookieOpts,
    httpOnly: false,
  });

  // Build the safe user object (toJSON transform removes password/refreshTokenHash)
  const userResponse = user.toJSON();

  return res.status(statusCode).json({
    success: true,
    accessToken,
    user: userResponse,
  });
};

// ─── POST /api/v1/auth/register ───────────────────────────────────────────────
/**
 * Register a new customer account.
 *
 * SECURITY: role is always set to 'customer' here regardless of what was sent.
 */
const register = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, email, password, phone } = req.body;

  // Check for duplicate email BEFORE attempting to create (gives a clearer error)
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return next(ApiError.conflict('An account with this email address already exists'));
  }

  // Create user — role is ALWAYS 'customer' from registration
  // The pre-save hook in User.js hashes the password automatically
  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    phone,
    role: 'customer', // NEVER trust req.body.role
  });

  await sendAuthResponse(user, 201, res);
});

// ─── POST /api/v1/auth/login ──────────────────────────────────────────────────
/**
 * Log in with email and password.
 *
 * SECURITY: The error message is intentionally generic ("Invalid credentials")
 * for both "email not found" and "wrong password" to prevent user enumeration.
 */
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Fetch user WITH password (excluded by default via select: false)
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  // SECURITY: always run bcrypt compare even when the user does not exist.
  // Without this, an attacker could distinguish "email not found" from "wrong password"
  // by measuring response time (bcrypt is intentionally slow — its absence is detectable).
  const DUMMY_HASH = '$2a$12$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345';
  const hashToCompare = user ? user.password : DUMMY_HASH;
  const passwordMatch = await require('bcryptjs').compare(password, hashToCompare);

  if (!user || !passwordMatch) {
    return next(ApiError.unauthorized('Invalid email or password'));
  }

  if (!user.isActive) {
    return next(ApiError.unauthorized('Your account has been deactivated. Please contact support.'));
  }

  await sendAuthResponse(user, 200, res);
});

// ─── POST /api/v1/auth/refresh ────────────────────────────────────────────────
/**
 * Issue a new access token using a valid refresh token from the cookie.
 *
 * This is called automatically by the frontend when the access token expires.
 */
const refresh = asyncHandler(async (req, res, next) => {
  const rawRefreshToken = req.cookies?.refreshToken;

  if (!rawRefreshToken) {
    return next(ApiError.unauthorized('No refresh token provided'));
  }

  // Find user who has a refresh token hash stored
  // We can't query by hash (it's one-way), so we use a secondary lookup.
  // The refresh token contains enough entropy that we find the user by
  // their stored hash. We decode a partial identifier from the cookie.
  //
  // Practical approach: the cookie alone does not tell us which user it belongs to.
  // We must search. To avoid full-table scans we require the user to also send
  // their userId in the request body OR we store the userId in a separate plain field.
  //
  // CHOSEN APPROACH: Store userId alongside the hash (refreshTokenUserId field).
  // This avoids scanning the whole users collection on every token refresh.
  // We add this field to the User model via an inline update below.
  //
  // For now (Module 2): we do a targeted find using a userId stored in the cookie
  // as a second non-secret value alongside the secret token.
  const userId = req.cookies?.userId;

  if (!userId) {
    return next(ApiError.unauthorized('Refresh token is invalid or expired'));
  }

  const user = await User.findById(userId).select('+refreshTokenHash');

  if (!user || !user.refreshTokenHash) {
    return next(ApiError.unauthorized('Refresh token is invalid or expired'));
  }

  const isValid = await verifyRefreshToken(rawRefreshToken, user.refreshTokenHash);

  if (!isValid) {
    // Possible token theft — clear the stored hash to force full re-login
    user.refreshTokenHash = undefined;
    await user.save({ validateBeforeSave: false });
    return next(ApiError.unauthorized('Refresh token is invalid or expired'));
  }

  if (!user.isActive) {
    return next(ApiError.unauthorized('Your account has been deactivated'));
  }

  // Rotate: issue a new refresh token (old one is replaced)
  const newRawRefreshToken = generateRefreshToken();
  const newHash = await hashRefreshToken(newRawRefreshToken);
  user.refreshTokenHash = newHash;
  await user.save({ validateBeforeSave: false });

  // Issue new access token
  const accessToken = signAccessToken({ id: user._id, role: user.role });

  // Set new refresh token cookie (rotated)
  res.cookie('refreshToken', newRawRefreshToken, refreshCookieOptions());

  return res.status(200).json({
    success: true,
    accessToken,
  });
});

// ─── POST /api/v1/auth/logout ─────────────────────────────────────────────────
/**
 * Log out: clear the refresh token from the database and clear the cookie.
 * The access token will expire naturally — we do not maintain a token blacklist
 * (that would require Redis; a 24h expiry is acceptable for this system).
 */
const logout = asyncHandler(async (req, res) => {
  // req.user is set by protect middleware
  if (req.user) {
    req.user.refreshTokenHash = undefined;
    await req.user.save({ validateBeforeSave: false });
  }

  // Clear both cookies
  res.clearCookie('refreshToken', { path: '/api/v1/auth' });
  res.clearCookie('userId', { path: '/api/v1/auth' });

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

// ─── GET /api/v1/auth/me ──────────────────────────────────────────────────────
/**
 * Return the currently logged-in user's profile.
 * The user is already loaded by the protect middleware.
 */
const getMe = asyncHandler(async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
});

// ─── PATCH /api/v1/auth/me ────────────────────────────────────────────────────
/**
 * Update the logged-in user's profile (name, phone, address).
 * Role and email changes are blocked by the validator.
 */
const updateMe = asyncHandler(async (req, res, next) => {
  const allowed = ['firstName', 'lastName', 'phone', 'address'];
  const updates = {};

  allowed.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  if (Object.keys(updates).length === 0) {
    return next(ApiError.badRequest('No valid fields provided for update'));
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true, runValidators: true }
  );

  return res.status(200).json({
    success: true,
    user,
  });
});

// ─── PATCH /api/v1/auth/me/password ───────────────────────────────────────────
/**
 * Change the logged-in user's password.
 * Requires the current password to be provided (prevents session hijacking).
 */
const changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  // Fetch with password (normally excluded)
  const user = await User.findById(req.user._id).select('+password');

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return next(ApiError.badRequest('Current password is incorrect'));
  }

  // Assign new password — the pre-save hook will hash it
  user.password = newPassword;
  // Invalidate existing refresh tokens (force re-login on all devices)
  user.refreshTokenHash = undefined;
  await user.save();

  // Clear the refresh token cookie on this device too
  res.clearCookie('refreshToken', { path: '/api/v1/auth' });
  res.clearCookie('userId', { path: '/api/v1/auth' });

  return res.status(200).json({
    success: true,
    message: 'Password changed successfully. Please log in again.',
  });
});

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
  updateMe,
  changePassword,
};
