/**
 * logger.js — Application-wide logger using Winston
 *
 * Winston is a logging library that gives us more control than console.log:
 * - Log levels: error > warn > info > debug
 * - In development: colourised, human-readable output
 * - In production: JSON format (easy to parse by log aggregation tools)
 * - The LOG_LEVEL env var controls how verbose the output is
 *
 * Usage anywhere in the app:
 *   const logger = require('../utils/logger');
 *   logger.info('Server started on port 5000');
 *   logger.error('Database connection failed', { error: err.message });
 */

const { createLogger, format, transports } = require('winston');

const { combine, timestamp, printf, colorize, errors, json } = format;

// Human-readable format for development
const devFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),       // include stack traces for errors
  printf(({ level, message, timestamp: ts, stack }) => {
    return stack
      ? `${ts} [${level}]: ${message}\n${stack}`
      : `${ts} [${level}]: ${message}`;
  })
);

// JSON format for production (each log line is a parseable JSON object)
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

const logger = createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'warn' : 'info'),
  format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
  transports: [
    new transports.Console(),
  ],
});

module.exports = logger;
