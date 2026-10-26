/**
 * Booking.js — Mongoose schema for reservations
 *
 * A Booking document represents one room reservation.
 * It captures everything agreed at the time of booking — including the price —
 * so that later price changes don't alter historical records.
 *
 * Price fields explained:
 *   pricePerNight  — the rate agreed at booking time (snapshot, never changes)
 *   nights         — number of nights (server-calculated from checkIn/checkOut)
 *   subtotal       — pricePerNight × nights
 *   taxAmount      — tax calculated from hotel settings at booking time
 *   totalPrice     — subtotal + taxAmount (what the guest owes)
 *
 * Status lifecycle:
 *   confirmed   → checked_in   (receptionist checks in the guest)
 *   checked_in  → checked_out  (receptionist checks out the guest)
 *   confirmed   → cancelled    (customer or staff cancels before arrival)
 *   confirmed   → no_show      (guest never arrived; staff marks manually)
 *
 * The `source` field records HOW the booking was made:
 *   online    — customer booked via the website themselves
 *   walk_in   — receptionist created it for a walk-in guest
 *   phone     — receptionist created it from a phone call
 */

const mongoose = require('mongoose');

const BOOKING_STATUSES = ['confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'];
const PAYMENT_STATUSES = ['pending', 'paid', 'refunded', 'partial'];
const BOOKING_SOURCES = ['online', 'walk_in', 'phone'];

const bookingSchema = new mongoose.Schema(
  {
    // Human-readable reference, e.g. "HMS-20261025-A3F7"
    bookingRef: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    // The guest this booking belongs to
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer is required'],
    },
    // Who actually created this record (could be the customer themselves,
    // or a receptionist on their behalf)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Which physical room is reserved
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Room is required'],
    },
    // Snapshot of the room type at booking time (for reporting and display)
    roomType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RoomType',
      required: true,
    },
    // Dates are stored as midnight UTC to avoid timezone confusion.
    // checkIn  = start of first night
    // checkOut = start of last day (morning)
    checkIn: {
      type: Date,
      required: [true, 'Check-in date is required'],
    },
    checkOut: {
      type: Date,
      required: [true, 'Check-out date is required'],
    },
    // Server-calculated number of nights (checkOut - checkIn in days)
    nights: {
      type: Number,
      required: true,
      min: [1, 'Minimum stay is 1 night'],
    },
    // Guest count
    adults: {
      type: Number,
      required: [true, 'Number of adults is required'],
      min: [1, 'At least 1 adult is required'],
    },
    children: {
      type: Number,
      default: 0,
      min: [0, 'Children count cannot be negative'],
    },
    // ─── Price snapshot (all set by server at booking time, never changed) ───
    pricePerNight: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative'],
    },
    subtotal: {
      type: Number,
      required: true,
    },
    taxRate: {
      type: Number,   // e.g. 0.15 for 15% — snapshot from settings at booking time
      required: true,
    },
    taxAmount: {
      type: Number,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'ETB',  // snapshot from settings at booking time
    },
    // ─────────────────────────────────────────────────────────────────────────

    status: {
      type: String,
      enum: {
        values: BOOKING_STATUSES,
        message: `Status must be one of: ${BOOKING_STATUSES.join(', ')}`,
      },
      default: 'confirmed',
    },
    paymentStatus: {
      type: String,
      enum: {
        values: PAYMENT_STATUSES,
        message: `Payment status must be one of: ${PAYMENT_STATUSES.join(', ')}`,
      },
      default: 'pending',
    },
    source: {
      type: String,
      enum: {
        values: BOOKING_SOURCES,
        message: `Source must be one of: ${BOOKING_SOURCES.join(', ')}`,
      },
      default: 'online',
    },
    // Guest's special requests (dietary, accessibility, etc.)
    specialRequests: {
      type: String,
      trim: true,
      maxlength: [500, 'Special requests cannot exceed 500 characters'],
    },
    // Cancellation details (populated when status changes to 'cancelled')
    cancellationReason: {
      type: String,
      trim: true,
    },
    cancelledAt: {
      type: Date,
    },
    cancellationFee: {
      type: Number,
      default: 0,
    },
    // Actual check-in and check-out timestamps (logged by receptionist)
    actualCheckIn: {
      type: Date,
    },
    actualCheckOut: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// THE MOST IMPORTANT INDEX — used by the conflict-check query on every booking
// Covering index: room + date range query + status filter all in one index
bookingSchema.index({ room: 1, checkIn: 1, checkOut: 1 });
bookingSchema.index({ customer: 1, status: 1, checkIn: -1 });
// Note: bookingRef has unique:true on the field itself — no separate index() call needed
bookingSchema.index({ status: 1, checkIn: 1 }); // receptionist dashboard: today's arrivals

// ─── Validation: checkOut must be after checkIn ────────────────────────────────
bookingSchema.pre('validate', function (next) {
  if (this.checkOut && this.checkIn && this.checkOut <= this.checkIn) {
    next(new Error('Check-out date must be after check-in date'));
  } else {
    next();
  }
});

bookingSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

const Booking = mongoose.model('Booking', bookingSchema);

// Attach status constants after model creation
Booking.STATUS = {
  CONFIRMED: 'confirmed',
  CHECKED_IN: 'checked_in',
  CHECKED_OUT: 'checked_out',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
};

module.exports = Booking;
