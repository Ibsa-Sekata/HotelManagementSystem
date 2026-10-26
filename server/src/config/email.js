/**
 * email.js — Nodemailer transporter configuration
 *
 * Nodemailer is a Node.js library for sending emails.
 * A "transporter" is like a configured email sender — it knows which
 * SMTP server to use and how to authenticate.
 *
 * Two modes:
 *
 * 1. DEVELOPMENT mode (NODE_ENV=development OR no EMAIL_HOST set):
 *    Uses Ethereal Email — a fake SMTP service. Emails are NOT delivered to
 *    real inboxes. Instead, a preview URL is logged to the console so you
 *    can inspect what the email would look like. Perfect for testing.
 *
 * 2. PRODUCTION mode (NODE_ENV=production AND EMAIL_HOST is set):
 *    Uses the real SMTP credentials from environment variables.
 *    Works with SendGrid, Gmail SMTP, Resend, Mailgun, etc.
 */

const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

let transporter = null;

/**
 * Creates and returns the Nodemailer transporter.
 * Called once during app startup.
 */
const createTransporter = async () => {
  // Use real SMTP if credentials are provided and we're in production
  if (process.env.NODE_ENV === 'production' && process.env.EMAIL_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT, 10) || 587,
      secure: parseInt(process.env.EMAIL_PORT, 10) === 465, // true for port 465 (SSL)
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    logger.info(`[Email] Using real SMTP: ${process.env.EMAIL_HOST}`);
    return transporter;
  }

  // Development: create a temporary Ethereal test account automatically
  try {
    const testAccount = await nodemailer.createTestAccount();

    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    logger.info(
      `[Email] Development mode — using Ethereal fake SMTP. ` +
      `Emails will NOT be delivered. Preview URLs will be logged.`
    );
  } catch (err) {
    logger.warn(`[Email] Could not create Ethereal test account: ${err.message}. Emails disabled.`);
    transporter = null;
  }

  return transporter;
};

/**
 * Returns the configured transporter. Call createTransporter() first.
 */
const getTransporter = () => transporter;

module.exports = { createTransporter, getTransporter };
