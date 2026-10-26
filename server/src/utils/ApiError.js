/**
 * ApiError.js — Custom error class for HTTP errors
 *
 * Why we need this:
 * When something goes wrong in a controller (e.g. room not found, access
 * denied), we want to send a consistent JSON error response with a specific
 * HTTP status code.
 *
 * Without a custom class we'd have to write res.status(404).json(...)
 * everywhere. Instead we throw an ApiError and let the global error handler
 * in middleware/error.middleware.js catch it and format the response.
 *
 * Usage:
 *   throw new ApiError(404, 'Room not found');
 *   throw new ApiError(409, 'Room already booked for those dates');
 *   throw new ApiError(403, 'You do not have permission to do this');
 */

class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code (400, 401, 403, 404, 409, 500…)
   * @param {string} message    - Human-readable error message
   * @param {Array}  errors     - Optional array of validation errors
   */
  constructor(statusCode, message, errors = []) {
    super(message);       // sets this.message via the built-in Error class
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true; // marks this as an expected (handled) error
                               // vs an unexpected programming bug

    // Capture the stack trace, excluding this constructor from it
    Error.captureStackTrace(this, this.constructor);
  }

  // Convenience static methods for common errors
  static badRequest(message, errors = []) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = 'Not authenticated') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Access denied') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }

  static conflict(message) {
    return new ApiError(409, message);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(500, message);
  }
}

module.exports = ApiError;
