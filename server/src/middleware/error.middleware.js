/**
 * error.middleware.js — Global error handler
 *
 * In Express, a middleware function that takes FOUR parameters (err, req, res, next)
 * is treated as an error handler. Express routes any error to this function when:
 *   1. A controller calls next(error), OR
 *   2. An async function wrapped in asyncHandler() throws an error
 *
 * This middleware is the LAST middleware registered in app.js so every
 * unhandled error in the whole app ends up here.
 *
 * What it does:
 * - Logs the error to the console (or log file in production)
 * - Returns a consistent JSON error response to the client
 * - Handles known error types from Mongoose and JWT
 */

const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

const errorHandler = (err, req, res, next) => {
  let error = err;

  // If the error is not already an ApiError, wrap it in one
  if (!(error instanceof ApiError)) {
    let statusCode = error.statusCode || 500;
    let message    = error.message || 'Internal Server Error';

    // ── Mongoose: duplicate key (e.g. email already registered) ─────────────
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue || {})[0] || 'field';
      message    = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
      statusCode  = 409;
    }

    // ── Mongoose: validation error (e.g. required field missing) ────────────
    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map((e) => ({
        field:   e.path,
        message: e.message,
      }));
      message    = 'Validation failed';
      statusCode  = 400;
      error = new ApiError(statusCode, message, validationErrors);
    }

    // ── Mongoose: CastError (e.g. invalid ObjectId in URL param) ────────────
    if (err.name === 'CastError') {
      message    = `Invalid ${err.path}: "${err.value}"`;
      statusCode  = 400;
    }

    // ── JWT: token expired ───────────────────────────────────────────────────
    if (err.name === 'TokenExpiredError') {
      message    = 'Your session has expired. Please log in again.';
      statusCode  = 401;
    }

    // ── JWT: invalid token ───────────────────────────────────────────────────
    if (err.name === 'JsonWebTokenError') {
      message    = 'Invalid authentication token. Please log in again.';
      statusCode  = 401;
    }

    if (!(error instanceof ApiError)) {
      error = new ApiError(statusCode, message);
    }
  }

  // Log the error
  if (error.statusCode >= 500) {
    // 500-range errors are unexpected bugs — log the full stack trace
    logger.error(`${error.statusCode} ${error.message}`, {
      stack: err.stack,
      url:   req.url,
      method: req.method,
    });
  } else {
    // 4xx errors are client mistakes — log at a lower level
    logger.warn(`${error.statusCode} ${error.message} — ${req.method} ${req.url}`);
  }

  // Build the response body
  const response = {
    success: false,
    message: error.message,
  };

  // Include validation errors if present
  if (error.errors && error.errors.length > 0) {
    response.errors = error.errors;
  }

  // In development, include the stack trace in the response for easier debugging
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  return res.status(error.statusCode).json(response);
};

module.exports = errorHandler;
