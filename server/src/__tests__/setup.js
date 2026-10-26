/**
 * setup.js — Jest global setup
 * Sets NODE_ENV=test before any test file or module is loaded.
 * This ensures rate limiters are disabled and bcrypt uses low cost factors.
 */
process.env.NODE_ENV = 'test';

// Provide fallback secrets for tests that don't have a .env file.
// These are test-only values — never used in production.
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-jwt-secret-do-not-use-in-production-32chars';
}
if (!process.env.JWT_REFRESH_SECRET) {
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-do-not-use-in-prod-32chars';
}
if (!process.env.JWT_EXPIRES_IN) {
  process.env.JWT_EXPIRES_IN = '24h';
}
if (!process.env.JWT_REFRESH_EXPIRES_IN) {
  process.env.JWT_REFRESH_EXPIRES_IN = '7';
}
