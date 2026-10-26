/**
 * HotelSettings.js — Mongoose schema for hotel-wide configuration
 *
 * This collection holds exactly ONE document — the hotel's configuration.
 * Think of it as the "control panel" for the system.
 *
 * Why a database document instead of environment variables?
 * Env vars require a server restart to change. A database document can be
 * updated by an admin through the dashboard at any time, without redeployment.
 * Only truly secret values (API keys, database passwords) belong in .env files.
 *
 * The `getSettings()` static method provides a cached way to read the single
 * settings document throughout the application.
 *
 * All cancellation policy values, tax rates, check-in/out times, etc. come
 * from here — they are NEVER hardcoded in business logic.
 */

const mongoose = require('mongoose');

const hotelSettingsSchema = new mongoose.Schema(
  {
    // ─── Hotel Identity ──────────────────────────────────────────────────────
    hotelName: {
      type: String,
      default: 'Grand Horizon Hotel',
      trim: true,
    },
    tagline: {
      type: String,
      default: 'Your Home Away From Home',
      trim: true,
    },
    address: {
      street:  { type: String, default: '123 Main Street' },
      city:    { type: String, default: 'Addis Ababa' },
      country: { type: String, default: 'Ethiopia' },
      postalCode: { type: String },
    },
    contactPhone: {
      type: String,
      default: '+251 11 000 0000',
    },
    contactEmail: {
      type: String,
      default: 'info@grandhorizon.example',
    },
    website: {
      type: String,
    },

    // ─── Financial ───────────────────────────────────────────────────────────
    // ISO 4217 currency code: ETB, USD, EUR, etc.
    currency: {
      type: String,
      default: 'ETB',
      uppercase: true,
    },
    // Tax rate as a decimal: 0.15 = 15%
    taxRate: {
      type: Number,
      default: 0.15,
      min: [0, 'Tax rate cannot be negative'],
      max: [1, 'Tax rate cannot exceed 100%'],
    },

    // ─── Cancellation Policy ─────────────────────────────────────────────────
    // Number of hours before check-in within which cancellation is FREE
    freeCancellationHours: {
      type: Number,
      default: 48,
      min: [0, 'Free cancellation hours cannot be negative'],
    },
    // Percentage of first night charged if cancelled within the window (0–100)
    lateCancellationFeePercent: {
      type: Number,
      default: 50,
      min: [0, 'Fee cannot be negative'],
      max: [100, 'Fee cannot exceed 100%'],
    },
    // Percentage charged for no-shows (0–100)
    noShowChargePercent: {
      type: Number,
      default: 100,
      min: [0, 'Charge cannot be negative'],
      max: [100, 'Charge cannot exceed 100%'],
    },

    // ─── Check-in / Check-out ────────────────────────────────────────────────
    // Stored as "HH:MM" 24-hour strings, e.g. "14:00"
    checkInTime: {
      type: String,
      default: '14:00',
      match: [/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'],
    },
    checkOutTime: {
      type: String,
      default: '11:00',
      match: [/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'],
    },

    // ─── Booking Rules ───────────────────────────────────────────────────────
    // Maximum number of days in advance a customer can book
    maxAdvanceBookingDays: {
      type: Number,
      default: 365,
    },
    // Minimum number of nights per stay (hotel-wide default)
    defaultMinStay: {
      type: Number,
      default: 1,
    },

    // ─── Hotel Policies (displayed on booking page) ──────────────────────────
    cancellationPolicyText: {
      type: String,
      default:
        'Free cancellation is available up to 48 hours before your check-in date. ' +
        'Cancellations made within 48 hours of check-in will incur a fee equal to ' +
        '50% of the first night\'s rate. No-shows will be charged in full.',
    },
    childPolicy: {
      type: String,
      default: 'Children of all ages are welcome.',
    },
    petPolicy: {
      type: String,
      default: 'Pets are not allowed.',
    },
  },
  {
    timestamps: true,
    // Only one document should ever exist — enforced by the application layer
    // and the getSettings() / ensureSettingsExist() methods below.
  }
);

// ─── Static method: get settings (with lightweight caching) ──────────────────
/**
 * Returns the single hotel settings document, creating it with defaults if it
 * doesn't exist yet.
 *
 * Usage:
 *   const settings = await HotelSettings.getSettings();
 *   console.log(settings.taxRate); // 0.15
 */
hotelSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

hotelSettingsSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

const HotelSettings = mongoose.model('HotelSettings', hotelSettingsSchema);
module.exports = HotelSettings;
