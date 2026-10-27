/**
 * app.js — Express application setup
 *
 * This file configures the Express application: middleware, routes, and error handlers.
 * It does NOT start the HTTP server (that is done in server.js).
 *
 * Why separate app.js from server.js?
 * Tests can import app.js and make HTTP calls to it WITHOUT starting a real server
 * on a port. This makes tests faster and avoids port conflicts when running multiple
 * test suites.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const morganMiddleware = require('./middleware/logger.middleware');
const notFound = require('./middleware/notFound.middleware');
const errorHandler = require('./middleware/error.middleware');

const app = express();

// ─── Security middleware ───────────────────────────────────────────────────────

// Helmet sets sensible HTTP security headers automatically.
// e.g. X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security
app.use(helmet());

// CORS (Cross-Origin Resource Sharing):
// Allows the React frontend (running on a different port) to call this API.
// In production, this should be restricted to your actual frontend domain.
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, Postman, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} is not allowed`));
    },
    credentials: true, // Allow cookies (used for refresh tokens)
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);

// Rate limiting: prevents brute-force attacks on the API.
// Disabled in test environment to allow automated test suites to run freely.
if (process.env.NODE_ENV !== 'test') {
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later.',
    },
  });
  app.use('/api/', globalLimiter);
}

// ─── Request parsing middleware ────────────────────────────────────────────────

// Parse incoming JSON request bodies (e.g. POST /api/bookings with { roomId, checkIn })
app.use(express.json({ limit: '10kb' })); // 10kb limit prevents large payload attacks

// Parse URL-encoded bodies (used by some HTML forms)
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Parse cookies (needed for refresh token and userId cookies)
app.use(cookieParser());

// ─── Logging ──────────────────────────────────────────────────────────────────
app.use(morganMiddleware);

// ─── Health check ─────────────────────────────────────────────────────────────
// A simple endpoint that monitoring tools (or a load balancer) can call
// to verify the server is running
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Hotel Management System API is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
// Module 2 — Authentication
const authRoutes = require('./routes/auth.routes');
// Module 3 — Room Catalog
const roomTypeRoutes = require('./routes/roomType.routes');
const roomRoutes = require('./routes/room.routes');
const bookingRoutes    = require('./routes/booking.routes');

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/room-types', roomTypeRoutes);
app.use('/api/v1/rooms', roomRoutes);
app.use('/api/v1/bookings', bookingRoutes);

// Future routes (uncommented as each module is built):
// const bookingRoutes      = require('./routes/booking.routes');
// const paymentRoutes      = require('./routes/payment.routes');
// const invoiceRoutes      = require('./routes/invoice.routes');
// const housekeepingRoutes = require('./routes/housekeeping.routes');
// const reportRoutes       = require('./routes/report.routes');
// const staffRoutes        = require('./routes/staff.routes');
//
// app.use('/api/v1/bookings',     bookingRoutes);
// app.use('/api/v1/payments',     paymentRoutes);
// app.use('/api/v1/invoices',     invoiceRoutes);
// app.use('/api/v1/housekeeping', housekeepingRoutes);
// app.use('/api/v1/reports',      reportRoutes);
// app.use('/api/v1/staff',        staffRoutes);

// ─── Error handling (must be LAST) ────────────────────────────────────────────

// 1. Catch requests to routes that don't exist → 404
app.use(notFound);

// 2. Handle all errors thrown anywhere in the application
app.use(errorHandler);

module.exports = app;
