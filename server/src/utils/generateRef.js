/**
 * generateRef.js — Booking reference number generator
 *
 * Each booking gets a unique human-readable reference like: HMS-20261025-A3F7
 *
 * Format: HMS-{YYYYMMDD}-{4 random uppercase alphanumeric characters}
 *
 * Why not use MongoDB's ObjectId as the reference?
 * ObjectIds look like "507f1f77bcf86cd799439011" — hard for a hotel receptionist
 * or guest to read over the phone or write on a receipt.
 * Our format is shorter, readable, and still unique enough for a hotel's volume.
 *
 * The chance of collision on the same day is 1 in 36^4 = 1 in 1,679,616.
 * For a hotel, this is effectively zero. We still check for uniqueness in the
 * database before saving (see booking.service.js).
 */

const generateBookingRef = () => {
  const today = new Date();
  const year  = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0'); // months are 0-indexed
  const day   = String(today.getDate()).padStart(2, '0');

  // 4 random characters from: 0-9 and A-Z
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `HMS-${year}${month}${day}-${suffix}`;
};

module.exports = { generateBookingRef };
