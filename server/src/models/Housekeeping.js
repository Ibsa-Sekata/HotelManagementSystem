/**
 * Housekeeping.js — Mongoose schema for housekeeping tasks
 *
 * A housekeeping task is a work order for cleaning a specific room on a
 * specific date. Managers create tasks; housekeeping staff update the status.
 *
 * Status flow:
 *   pending → in_progress → clean → inspected
 *
 *   pending     — task created, not yet started
 *   in_progress — housekeeping staff is currently cleaning
 *   clean       — staff has finished cleaning
 *   inspected   — a supervisor has verified the room is ready to sell again
 *
 * When status reaches 'clean' (or 'inspected'), the room's status in the
 * Room collection should also be updated to 'available'.
 * This happens in the housekeeping controller, not here in the schema.
 */

const mongoose = require('mongoose');

const HOUSEKEEPING_STATUSES = ['pending', 'in_progress', 'clean', 'inspected'];
const TASK_TYPES = ['standard_clean', 'deep_clean', 'turndown', 'inspection', 'maintenance_check'];

const housekeepingSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Room is required'],
    },
    // The date this task is scheduled for (stored as midnight UTC)
    date: {
      type: Date,
      required: [true, 'Task date is required'],
    },
    type: {
      type: String,
      enum: {
        values: TASK_TYPES,
        message: `Task type must be one of: ${TASK_TYPES.join(', ')}`,
      },
      default: 'standard_clean',
    },
    status: {
      type: String,
      enum: {
        values: HOUSEKEEPING_STATUSES,
        message: `Status must be one of: ${HOUSEKEEPING_STATUSES.join(', ')}`,
      },
      default: 'pending',
    },
    // Which staff member is assigned to this task
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // Priority level: high = needs to be done urgently (guest checking in soon)
    priority: {
      type: String,
      enum: ['low', 'normal', 'high'],
      default: 'normal',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    completedAt: {
      type: Date,
    },
    // Which manager/supervisor created this task
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// Most common query: show all tasks for today
housekeepingSchema.index({ date: 1, status: 1 });
// Show tasks assigned to a specific staff member today
housekeepingSchema.index({ assignedTo: 1, date: 1 });
// Show all tasks for a specific room
housekeepingSchema.index({ room: 1, date: -1 });

housekeepingSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

const Housekeeping = mongoose.model('Housekeeping', housekeepingSchema);
module.exports = Housekeeping;
