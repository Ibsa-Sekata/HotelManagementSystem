/**
 * Payment.js — Mongoose schema for payment records
 *
 * Each Payment document records one payment transaction against a booking.
 * A booking can have multiple payments (e.g. deposit + balance, or partial refund).
 *
 * SECURITY RULE: We NEVER store raw card numbers, CVVs, or any sensitive
 * payment card data here. Only the payment provider's reference ID is stored.
 *
 * For the mock payment provider (used in development):
 *   providerName  = "mock"
 *   providerRefId = a generated fake reference like "MOCK-PAY-XXXX"
 *
 * For a real Stripe integration (future):
 *   providerName  = "stripe"
 *   providerRefId = Stripe's PaymentIntent ID, e.g. "pi_3OqABC2eZvKYlo2C1xVz9Qfk"
 *
 * Payment methods:
 *   card          — online card payment via provider
 *   cash          — cash at the front desk (recorded manually by receptionist)
 *   bank_transfer — direct bank transfer
 */

const mongoose = require('mongoose');

const PAYMENT_METHODS   = ['card', 'cash', 'bank_transfer'];
const PAYMENT_STATUSES  = ['pending', 'completed', 'failed', 'refunded'];

const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking reference is required'],
    },
    // Who made the payment (the guest)
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Payer is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    currency: {
      type: String,
      default: 'ETB',
    },
    method: {
      type: String,
      enum: {
        values: PAYMENT_METHODS,
        message: `Method must be one of: ${PAYMENT_METHODS.join(', ')}`,
      },
      required: [true, 'Payment method is required'],
    },
    // Which payment provider processed this? "mock", "stripe", "paypal", etc.
    providerName: {
      type: String,
      default: 'mock',
    },
    // The provider's own reference ID for this transaction.
    // Used to look up the transaction in the provider's dashboard.
    // NEVER a card number or sensitive card detail.
    providerRefId: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: PAYMENT_STATUSES,
        message: `Status must be one of: ${PAYMENT_STATUSES.join(', ')}`,
      },
      default: 'pending',
    },
    // URL to the payment receipt (provided by the payment gateway)
    receiptUrl: {
      type: String,
    },
    // For cash payments: which staff member recorded it
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // Internal notes (e.g. "Customer paid in two installments")
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
paymentSchema.index({ booking: 1, status: 1 });
paymentSchema.index({ paidBy: 1, createdAt: -1 });

paymentSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;
