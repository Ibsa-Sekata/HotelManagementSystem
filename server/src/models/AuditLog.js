/**
 * AuditLog.js — Mongoose schema for the admin audit trail
 *
 * An audit log is a permanent record of important actions taken in the system.
 * Think of it as the hotel's security camera footage — it records WHO did WHAT,
 * to WHICH record, and WHEN.
 *
 * Audit logs are write-only: they are created but never updated or deleted.
 * This ensures a tamper-evident history.
 *
 * Example log entries:
 *   { action: 'BOOKING_CANCELLED',  actor: receptionistId, targetId: bookingId }
 *   { action: 'ROLE_CHANGED',       actor: adminId,        targetId: userId }
 *   { action: 'ROOM_DEACTIVATED',   actor: managerId,      targetId: roomId }
 *   { action: 'PAYMENT_RECORDED',   actor: receptionistId, targetId: paymentId }
 *
 * The `before` and `after` fields store a snapshot of the data BEFORE and AFTER
 * the change, so admins can see exactly what was changed.
 *
 * NOTE: Do not store passwords or payment card data in audit logs.
 */

const mongoose = require('mongoose');

// Predefined action names — using constants prevents typos across the codebase
const AUDIT_ACTIONS = [
  // Bookings
  'BOOKING_CREATED',
  'BOOKING_CANCELLED',
  'BOOKING_CHECKED_IN',
  'BOOKING_CHECKED_OUT',
  'BOOKING_MARKED_NO_SHOW',
  // Rooms
  'ROOM_CREATED',
  'ROOM_UPDATED',
  'ROOM_DEACTIVATED',
  'ROOM_STATUS_CHANGED',
  // Room Types
  'ROOM_TYPE_CREATED',
  'ROOM_TYPE_UPDATED',
  'ROOM_TYPE_DEACTIVATED',
  // Users
  'USER_REGISTERED',
  'USER_LOGIN',
  'USER_ROLE_CHANGED',
  'USER_DEACTIVATED',
  'USER_PASSWORD_CHANGED',
  // Payments
  'PAYMENT_RECORDED',
  'PAYMENT_REFUNDED',
  // Settings
  'SETTINGS_UPDATED',
];

const auditLogSchema = new mongoose.Schema(
  {
    // Who performed the action
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // What action was performed
    action: {
      type: String,
      required: [true, 'Action is required'],
      enum: {
        values: AUDIT_ACTIONS,
        message: 'Unknown audit action',
      },
    },
    // Which collection was affected (e.g. 'bookings', 'rooms', 'users')
    targetCollection: {
      type: String,
      required: true,
    },
    // The ID of the affected document
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    // Optional: data snapshot before the change
    before: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    // Optional: data snapshot after the change
    after: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    // IP address of the request (for security investigations)
    ipAddress: {
      type: String,
      trim: true,
    },
    // Free-text description for human readers
    description: {
      type: String,
      trim: true,
    },
  },
  {
    // Only createdAt — audit logs are never updated
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// Admin views: most recent actions first
auditLogSchema.index({ createdAt: -1 });
// Filter by who did what
auditLogSchema.index({ actor: 1, createdAt: -1 });
// Filter by which record was affected
auditLogSchema.index({ targetCollection: 1, targetId: 1, createdAt: -1 });

auditLogSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

// Export the action names so controllers can use them without magic strings
AuditLog.ACTIONS = AUDIT_ACTIONS.reduce((acc, action) => {
  acc[action] = action;
  return acc;
}, {});

module.exports = AuditLog;
