/**
 * Room.js — Mongoose schema for individual physical rooms
 *
 * Each document here represents one actual room in the hotel building.
 * It stores:
 *   - Which RoomType it belongs to (this links it to price, amenities, photos)
 *   - Its physical attributes: room number, floor
 *   - Its current operational status
 *
 * Room statuses explained:
 *   available   — ready to sell; no guest currently in it
 *   occupied    — a checked-in guest is currently staying
 *   dirty       — guest has checked out; needs housekeeping before reselling
 *   maintenance — under repair; can still be reserved for future dates
 *   out_of_order — completely unavailable (structural issue, renovation)
 *
 * Status transitions (enforced by the application layer, not the schema):
 *   booking confirmed → (no change to room status yet)
 *   check-in          → available → occupied
 *   check-out         → occupied  → dirty
 *   housekeeping done → dirty     → available
 *   maintenance start → available → maintenance
 *   maintenance end   → maintenance → available
 */

const mongoose = require('mongoose');

const ROOM_STATUSES = ['available', 'occupied', 'dirty', 'maintenance', 'out_of_order'];

const roomSchema = new mongoose.Schema(
  {
    // Human-readable identifier for the physical room (printed on key cards, etc.)
    roomNumber: {
      type: String,
      required: [true, 'Room number is required'],
      unique: true,
      trim: true,
      uppercase: true, // store as "101" or "302A" consistently
    },
    floor: {
      type: Number,
      required: [true, 'Floor number is required'],
      min: [0, 'Floor cannot be negative'], // 0 = ground floor
    },
    // Which category does this room belong to?
    // ref: 'RoomType' tells Mongoose which collection to join when we call .populate()
    roomType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RoomType',
      required: [true, 'Room type is required'],
    },
    // Current housekeeping/operational status of the physical room
    status: {
      type: String,
      enum: {
        values: ROOM_STATUSES,
        message: `Status must be one of: ${ROOM_STATUSES.join(', ')}`,
      },
      default: 'available',
    },
    // Staff notes (e.g. "window latch is broken — maintenance aware")
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    // Soft-delete: admins deactivate rather than delete rooms
    // This preserves historical booking records that reference this room
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// Used when searching for available rooms of a specific type
roomSchema.index({ roomType: 1, status: 1 });
roomSchema.index({ floor: 1 });

roomSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

const Room = mongoose.model('Room', roomSchema);

// Attach constants to the model for use in other files:
//   const Room = require('./Room');
//   if (room.status === Room.STATUS.AVAILABLE) ...
Room.STATUS = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  DIRTY: 'dirty',
  MAINTENANCE: 'maintenance',
  OUT_OF_ORDER: 'out_of_order',
};

module.exports = Room;
