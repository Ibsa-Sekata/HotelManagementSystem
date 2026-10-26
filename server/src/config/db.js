/**
 * db.js — MongoDB connection using Mongoose
 *
 * Reads MONGODB_URI from environment variables and connects.
 * Works with both a local MongoDB Community Server and MongoDB Atlas.
 *
 * TRANSACTIONS & REPLICA SETS:
 *   MongoDB transactions (used for booking conflict prevention) only work when
 *   MongoDB is running as a Replica Set.
 *
 *   - MongoDB Atlas:   Replica Set is built in. Set ENABLE_TRANSACTIONS=true.
 *   - Local Community: Standalone by default — does NOT support transactions.
 *     Set ENABLE_TRANSACTIONS=false to use a safe non-transactional conflict
 *     check instead (fine for development and single-server deployments).
 *     Or start a local single-node replica set (see .env.example for steps).
 *
 * The ENABLE_TRANSACTIONS value is exported so BookingService can decide
 * which conflict-check path to use at runtime.
 */

const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Whether transactions are enabled.
 * Reads the ENABLE_TRANSACTIONS env var; defaults to false for safety.
 * Set to 'true' (string) in .env when connected to a Replica Set.
 */
const transactionsEnabled = process.env.ENABLE_TRANSACTIONS === 'true';

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    logger.error(
      'MONGODB_URI is not defined in environment variables.\n' +
      'Create a server/.env file based on server/.env.example and set MONGODB_URI.'
    );
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // surface connection errors quickly
    });

    const host = conn.connection.host;
    const isLocal = host === '127.0.0.1' || host === 'localhost';

    logger.info(`MongoDB connected: ${host} (${isLocal ? 'local' : 'remote'})`);

    if (transactionsEnabled) {
      logger.info('Transactions: ENABLED (Replica Set mode)');
    } else {
      logger.warn(
        'Transactions: DISABLED — using sequential conflict-check instead. ' +
        'This is safe for development. Set ENABLE_TRANSACTIONS=true on a ' +
        'Replica Set for production-grade atomicity.'
      );
    }
  } catch (error) {
    logger.error(`MongoDB connection failed: ${error.message}`);

    // Give a helpful hint for the most common local setup mistake
    if (error.message.includes('ECONNREFUSED') || error.message.includes('connect')) {
      logger.error(
        'Hint: Make sure MongoDB is running locally.\n' +
        '  Windows: Start "MongoDB" from Services, or run: mongod\n' +
        '  Check that port 27017 is not blocked by a firewall.'
      );
    }

    process.exit(1);
  }
};

module.exports = connectDB;
module.exports.transactionsEnabled = transactionsEnabled;
