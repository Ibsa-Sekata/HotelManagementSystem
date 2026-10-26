/**
 * notFound.middleware.js — 404 handler for unmatched routes
 *
 * If a request arrives that doesn't match any of our defined routes,
 * Express would normally return a blank response or an HTML error page.
 * This middleware catches those unmatched requests and returns a clean JSON 404.
 *
 * It must be registered AFTER all your routes in app.js.
 */

const ApiError = require('../utils/ApiError');

const notFound = (req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

module.exports = notFound;
