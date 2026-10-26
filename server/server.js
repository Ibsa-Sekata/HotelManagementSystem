/**
 * server.js — Application entry point
 *
 * This file:
 *   1. Loads environment variables from .env
 *   2. Connects to MongoDB
 *   3. Initialises Cloudinary and email services
 *   4. Starts listening on the configured port
 *
 * It is kept intentionally short. All Express configuration lives in app.js.
 *
 * To start the server:
 *   Development (auto-restart on file changes): npm run dev
 *   Production:                                  npm start
 */

// Load .env file FIRST, before any other require, so all env vars are available
require('dotenv').config();

const app                          = require('./src/app');
const connectDB                    = require('./src/config/db');
const { configureCloudinary }      = require('./src/config/cloudinary');
const { createTransporter }        = require('./src/config/email');
const logger                       = require('./src/utils/logger');
const HotelSettings                = require('./src/models/HotelSettings');

const PORT = process.env.PORT || 5000;

// ─── Startup sequence ─────────────────────────────────────────────────────────
const startServer = async () => {
  // Step 1: Connect to MongoDB (exits if connection fails)
  await connectDB();

  // Step 2: Ensure hotel settings document exists (creates with defaults if not)
  try {
    await HotelSettings.getSettings();
    logger.info('Hotel settings loaded successfully');
  } catch (err) {
    logger.warn(`Could not load hotel settings: ${err.message}`);
  }

  // Step 3: Configure Cloudinary (logs a warning if credentials are missing)
  configureCloudinary();

  // Step 4: Set up email transporter (uses Ethereal in development)
  await createTransporter();

  // Step 5: Start the HTTP server
  const server = app.listen(PORT, () => {
    logger.info(`=================================================`);
    logger.info(` Hotel Management System API`);
    logger.info(` Environment : ${process.env.NODE_ENV || 'development'}`);
    logger.info(` Port        : ${PORT}`);
    logger.info(` Health check: http://localhost:${PORT}/health`);
    logger.info(`=================================================`);
  });

  // ─── Graceful shutdown ──────────────────────────────────────────────────────
  // When the server process receives a stop signal (e.g. Ctrl+C or a deploy),
  // we close the HTTP server and the database connection cleanly before exiting.
  // This prevents requests from being cut off mid-processing.
  const shutdown = (signal) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      const mongoose = require('mongoose');
      await mongoose.connection.close();
      logger.info('MongoDB connection closed. Server stopped.');
      process.exit(0);
    });

    // Force exit after 10 seconds if graceful shutdown hangs
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));

  // Catch unhandled promise rejections (programming errors in async code)
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Promise Rejection:', { reason: reason?.message || reason });
    // In production, we might want to exit here. For now, just log.
  });
};

// Run the startup sequence
startServer().catch((err) => {
  logger.error(`Failed to start server: ${err.message}`);
  process.exit(1);
});
