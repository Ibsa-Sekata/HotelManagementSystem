/**
 * Invoice.js — Mongoose schema for guest invoices
 *
 * An invoice is generated at check-out and acts as the guest's receipt.
 * It lists every charge during the stay as line items:
 *   - Room charges per night
 *   - Additional services (future feature: mini-bar, restaurant, etc.)
 *   - Tax
 *
 * One booking = one invoice.
 * The invoice is immutable once issued (you don't edit a receipt after the
 * fact). Any corrections would require a credit note — a future feature.
 */

const mongoose = require('mongoose');

// A single line on the invoice (e.g. "Room charge — Night 1: 2,500 ETB")
const lineItemSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },
    unitPrice: {
      type: Number,
      required: true,
      min: [0, 'Unit price cannot be negative'],
    },
    total: {
      type: Number,
      required: true,
    },
  },
  { _id: false } // line items don't need their own IDs
);

const invoiceSchema = new mongoose.Schema(
  {
    // Link to the booking this invoice covers
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true,  // one invoice per booking
    },
    // Snapshot of customer info at invoice time (so it's accurate even if
    // the guest later changes their name or email)
    guestName: {
      type: String,
      required: true,
    },
    guestEmail: {
      type: String,
      required: true,
    },
    // Detailed line items
    lineItems: {
      type: [lineItemSchema],
      required: true,
      validate: {
        validator: (v) => v.length > 0,
        message: 'Invoice must have at least one line item',
      },
    },
    subtotal: {
      type: Number,
      required: true,
      min: [0, 'Subtotal cannot be negative'],
    },
    taxRate: {
      type: Number,
      required: true,
    },
    taxAmount: {
      type: Number,
      required: true,
    },
    totalDue: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'ETB',
    },
    // When and by whom the invoice was generated
    issuedAt: {
      type: Date,
      default: Date.now,
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Payment status at invoice issuance (may be 'paid' or 'pending')
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'partial'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
invoiceSchema.index({ booking: 1 }); // unique already, but explicit index helps
invoiceSchema.index({ issuedAt: -1 });

invoiceSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

const Invoice = mongoose.model('Invoice', invoiceSchema);
module.exports = Invoice;
