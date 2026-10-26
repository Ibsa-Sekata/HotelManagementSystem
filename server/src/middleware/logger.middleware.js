/**
 * logger.middleware.js — HTTP request logger using Morgan
 *
 * Morgan logs every incoming HTTP request in a standard format.
 * This is different from our application logger (winston) — Morgan specifically
 * handles HTTP traffic: "who requested what URL, how long it took, what status
 * code was returned."
 *
 * Example output:
 *   POST /api/v1/auth/login 200 45ms
 *   GET  /api/v1/rooms      200 12ms
 *   POST /api/v1/bookings   409 8ms   ← 409 = conflict (room already booked)
 *
 * In development: uses the 'dev' format (colourised, concise)
 * In production:  uses the 'combined' format (full Apache-style log, good for
 *                 log aggregation tools like Datadog or CloudWatch)
 */

const morgan = require('morgan');
const logger = require('../utils/logger');

// Create a Morgan stream that writes to our Winston logger
// This keeps all logs in one place instead of half going to console.log
// and half going to Winston
const stream = {
  write: (message) => logger.http(message.trim()),
};

// Add 'http' as a valid log level for winston
// (Morgan uses 'http', winston doesn't include it by default)
const morganMiddleware = morgan(
  process.env.NODE_ENV === 'production' ? 'combined' : 'dev',
  { stream }
);

module.exports = morganMiddleware;
