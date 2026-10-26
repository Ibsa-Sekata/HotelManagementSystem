/**
 * RoomType.js — Mongoose schema for room categories
 *
 * A RoomType is a category of room, not an individual room.
 * Examples: "Standard Double", "Deluxe King", "Executive Suite"
 *
 * Why separate RoomType from Room?
 * Because many physical rooms share the same category, price, amenities, and
 * photos. If you have 10 "Standard Double" rooms, you don't want to duplicate
 * the description, price, and photos 10 times. Instead:
 *   - RoomType stores: name, description, base price, amenities, photos
 *   - Room stores: room number, floor, which RoomType it belongs to, its status
 *
 * Images are stored as Cloudinary references:
 *   url:       the public URL to display in the browser
 *   publicId:  Cloudinary's internal ID, needed to delete the image later
 */

const mongoose = require('mongoose');

// Sub-schema for a single image (used inside the images array)
const imageSchema = new mongoose.Schema(
  {
    url:       { type: String, required: true },
    publicId:  { type: String, default: null }, // null for placeholder images
    caption:   { type: String, trim: true },
  },
  { _id: true } // each image gets its own _id so we can delete by image ID
);

const roomTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Room type name is required'],
      unique: true,
      trim: true,
      maxlength: [100, 'Room type name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Room type description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    // Base price per night in the hotel's configured currency (default: ETB)
    // The server always calculates the final price — the browser never does.
    basePrice: {
      type: Number,
      required: [true, 'Base price is required'],
      min: [0, 'Price cannot be negative'],
    },
    // Maximum number of guests this room type can accommodate
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1'],
      max: [20, 'Capacity cannot exceed 20'],
    },
    // List of features, e.g. ["Free WiFi", "Air Conditioning", "City View", "Mini-bar"]
    amenities: {
      type: [String],
      default: [],
    },
    // Cloudinary images for this room type
    images: {
      type: [imageSchema],
      default: [],
    },
    // Managers can deactivate a room type without deleting it.
    // Deactivated types don't appear in search results or the public listing.
    isActive: {
      type: Boolean,
      default: true,
    },
    // Optional: minimum nights required when booking this room type
    // Default 1 = no minimum stay restriction
    minStay: {
      type: Number,
      default: 1,
      min: [1, 'Minimum stay must be at least 1 night'],
    },
    // Optional: bed configuration description for the listing page
    bedConfiguration: {
      type: String,
      trim: true,
      // e.g. "1 King Bed" or "2 Single Beds"
    },
    // Room size in square metres
    sizeSqm: {
      type: Number,
      min: [0, 'Room size cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
roomTypeSchema.index({ isActive: 1, basePrice: 1 });
roomTypeSchema.index({ capacity: 1 });

// ─── Virtual: first image URL (convenience) ───────────────────────────────────
// Returns the URL of the first image, or a placeholder if none exist.
roomTypeSchema.virtual('thumbnailUrl').get(function () {
  if (this.images && this.images.length > 0) {
    return this.images[0].url;
  }
  // Placeholder from placehold.co — safe to use in development
  return `https://placehold.co/800x500/1a3c5e/ffffff?text=${encodeURIComponent(this.name)}`;
});

roomTypeSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

const RoomType = mongoose.model('RoomType', roomTypeSchema);
module.exports = RoomType;
