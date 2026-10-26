/**
 * User.js — Mongoose schema for all users (customers AND staff)
 *
 * One collection holds every person who uses the system.
 * The `role` field determines what they can do:
 *   customer     — guests who book rooms
 *   receptionist — front desk staff
 *   manager      — can manage rooms, view reports
 *   admin        — full access including staff management
 *
 * SECURITY NOTES:
 * - Passwords are hashed with bcrypt BEFORE saving (see the pre-save hook below).
 * - The `password` field is excluded from query results by default (select: false).
 *   You must explicitly ask for it when you need to verify a login.
 * - The `role` field defaults to 'customer'. The registration endpoint never
 *   accepts a role from the request body, so customers cannot give themselves
 *   staff roles.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,             // enforced at the database level
      lowercase: true,          // always store as lowercase
      trim: true,
      match: [
        /^\S+@\S+\.\S+$/,
        'Please provide a valid email address',
      ],
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [20, 'Phone number cannot exceed 20 characters'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,  // IMPORTANT: never return password in query results by default
    },
    role: {
      type: String,
      enum: {
        values: ['customer', 'receptionist', 'manager', 'admin'],
        message: 'Role must be one of: customer, receptionist, manager, admin',
      },
      default: 'customer',
    },
    isActive: {
      type: Boolean,
      default: true,  // admins can deactivate accounts without deleting them
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      country: { type: String, trim: true },
    },
    // Refresh tokens are stored here so we can invalidate them on logout.
    // Only the hashed version of the token is stored (never the raw token).
    refreshTokenHash: {
      type: String,
      select: false,
    },
    // Track last login for admin audit purposes
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true, // automatically adds createdAt and updatedAt fields
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// The email unique index is already created by `unique: true` above.
// Additional index for staff queries (admins listing staff by role)
userSchema.index({ role: 1, isActive: 1 });

// ─── Pre-save hook: hash the password ─────────────────────────────────────────
/**
 * This runs automatically BEFORE a user document is saved to the database.
 * It hashes the password so we NEVER store the plain text.
 *
 * The `isModified` check is important — without it, the password would be
 * re-hashed every time any field on the user is saved (e.g. updating the phone
 * number would re-hash the already-hashed password, breaking login).
 */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  // Cost factor: 12 in production (secure), 4 in tests (fast).
  // bcrypt at cost 12 is intentionally slow to resist cracking.
  // In tests we want speed, not security hardening.
  const saltRounds = process.env.NODE_ENV === 'test' ? 4 : 12;
  this.password = await bcrypt.hash(this.password, saltRounds);
  next();
});

// ─── Instance method: verify a password ───────────────────────────────────────
/**
 * Compare a plain-text password (from a login form) with the stored hash.
 * Returns true if they match, false otherwise.
 *
 * Usage:
 *   const user = await User.findOne({ email }).select('+password');
 *   const isMatch = await user.comparePassword('the-password-they-typed');
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ─── Virtual: full name ────────────────────────────────────────────────────────
// A virtual field is not stored in the database — it is computed on the fly.
// This lets us use user.fullName anywhere instead of `${user.firstName} ${user.lastName}`
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// ─── Transform: remove sensitive fields from JSON output ──────────────────────
// When Express sends a user object as JSON (res.json(user)), this removes fields
// that should never appear in API responses.
userSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.refreshTokenHash;
    delete ret.__v; // Mongoose version key — not useful to clients
    return ret;
  },
});

const User = mongoose.model('User', userSchema);
module.exports = User;
