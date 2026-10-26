/**
 * token.service.js — JWT access-token and refresh-token helpers
 *
 * Why two tokens?
 * ─────────────────────────────────────────────────────────────────
 * Access token  — short-lived (default 24h). Sent in the Authorization header
 *                 on every API request. If stolen, it expires quickly.
 *
 * Refresh token — long-lived (default 7d). Sent ONCE to get a new access token
 *                 when the access token expires. Stored in an httpOnly cookie
 *                 (JavaScript on the page cannot read it) AND hashed in the
 *                 database. This lets us invalidate it on logout.
 *
 * Flow:
 *   Login          → server issues both tokens; refresh token set as httpOnly cookie
 *   API call       → client sends access token in Authorization: Bearer <token>
 *   Access expires → client calls POST /auth/refresh; server checks the cookie,
 *                    verifies the hash in the DB, issues a new access token
 *   Logout         → server deletes the refresh token hash from DB; cookie cleared
 *
 * Security notes:
 *   - Tokens are signed with secrets from .env (JWT_SECRET, JWT_REFRESH_SECRET).
 *   - The refresh token stored in the database is a bcrypt hash of the real token.
 *     Even if someone reads the database they cannot reuse the token.
 *   - Passwords and token values are NEVER logged.
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// ─── Access token ─────────────────────────────────────────────────────────────

/**
 * Sign a new short-lived JWT access token.
 * The payload contains only what the server needs per request: id and role.
 *
 * @param   {{ id: string, role: string }} payload
 * @returns {string} signed JWT
 */
const signAccessToken = (payload) => {
  const secret = process.env.JWT_SECRET;
  const expires = process.env.JWT_EXPIRES_IN || '24h';

  if (!secret) throw new Error('JWT_SECRET is not set in environment variables');

  return jwt.sign(
    { id: payload.id, role: payload.role },
    secret,
    { expiresIn: expires }
  );
};

/**
 * Verify and decode a JWT access token.
 * Throws JsonWebTokenError or TokenExpiredError on failure.
 *
 * @param   {string} token
 * @returns {{ id: string, role: string, iat: number, exp: number }}
 */
const verifyAccessToken = (token) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set in environment variables');
  return jwt.verify(token, secret);
};

// ─── Refresh token ────────────────────────────────────────────────────────────

/**
 * Generate a cryptographically random refresh token (not a JWT).
 * Using crypto.randomBytes gives us 64 bytes of randomness, which is
 * effectively impossible to guess.
 *
 * @returns {string} hex string — 128 characters long
 */
const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

/**
 * Hash a refresh token for safe storage in the database.
 * We use bcrypt so the stored value cannot be reversed.
 * Cost factor 10 is intentionally lower than password hashing (12) because
 * refresh token rotation happens more frequently and we want it to be fast.
 *
 * @param   {string} token — the raw refresh token
 * @returns {Promise<string>} bcrypt hash
 */
const hashRefreshToken = (token) => {
  // Cost 10 in production, 4 in tests for speed
  const cost = process.env.NODE_ENV === 'test' ? 4 : 10;
  return bcrypt.hash(token, cost);
};

/**
 * Compare a raw refresh token against its stored bcrypt hash.
 *
 * @param   {string} token     — the raw token from the cookie
 * @param   {string} storedHash — the hash from the database
 * @returns {Promise<boolean>}
 */
const verifyRefreshToken = (token, storedHash) => {
  return bcrypt.compare(token, storedHash);
};

/**
 * Build the options object for the refresh-token httpOnly cookie.
 * httpOnly: true  → JavaScript on the page cannot read it (XSS protection)
 * secure:         → only sent over HTTPS in production
 * sameSite: strict → not sent on cross-site requests (CSRF protection)
 *
 * @returns {import('express').CookieOptions}
 */
const refreshCookieOptions = () => {
  const days = parseInt(process.env.JWT_REFRESH_EXPIRES_IN || '7', 10);
  const maxAge = days * 24 * 60 * 60 * 1000; // milliseconds

  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge,
    path: '/api/v1/auth', // cookie is only sent to auth endpoints
  };
};

module.exports = {
  signAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  verifyRefreshToken,
  refreshCookieOptions,
};
