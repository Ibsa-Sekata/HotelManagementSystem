/**
 * roomType.controller.js — Handlers for room type endpoints
 *
 * Room types are categories of rooms (e.g. "Deluxe King", "Executive Suite").
 * Each type holds the shared information: name, description, price, amenities, photos.
 * Individual physical rooms (Room.js) reference a RoomType.
 *
 * Endpoints handled here:
 *   GET    /api/v1/room-types           Public — list active room types
 *   GET    /api/v1/room-types/:id       Public — get one room type
 *   POST   /api/v1/room-types           Staff  — create room type
 *   PATCH  /api/v1/room-types/:id       Staff  — update room type
 *   POST   /api/v1/room-types/:id/images  Staff  — upload image
 *   DELETE /api/v1/room-types/:id/images/:imgId  Staff  — remove image
 *
 * Response envelope (consistent with the rest of the API):
 *   List:   { success: true, count: N, data: [...] }
 *   Single: { success: true, data: {...} }
 *   Create: 201, { success: true, data: {...} }
 *   Update: { success: true, data: {...} }
 */

const asyncHandler          = require('../utils/asyncHandler');
const ApiError              = require('../utils/ApiError');
const RoomType              = require('../models/RoomType');
const { uploadRoomImage, deleteRoomImage } = require('../services/cloudinary.service');

// ─── GET /api/v1/room-types ───────────────────────────────────────────────────
/**
 * Public endpoint. Returns all active room types.
 * Staff can also pass ?all=true to include deactivated types.
 */
const getAll = asyncHandler(async (req, res) => {
  // Only staff (manager/admin) can request deactivated room types
  const staffRole = ['admin', 'manager', 'receptionist'];
  const showAll   = req.query.all === 'true' &&
                    req.user &&
                    staffRole.includes(req.user.role);

  const filter = showAll ? {} : { isActive: true };

  const roomTypes = await RoomType.find(filter)
    .sort({ basePrice: 1 }) // cheapest first
    .lean({ virtuals: true }); // include the thumbnailUrl virtual

  return res.status(200).json({
    success: true,
    count: roomTypes.length,
    data: roomTypes,
  });
});

// ─── GET /api/v1/room-types/:id ───────────────────────────────────────────────
/**
 * Public endpoint. Fetch a single room type by its MongoDB ID.
 * Inactive types are still accessible if you know the ID (needed by staff).
 */
const getOne = asyncHandler(async (req, res, next) => {
  const roomType = await RoomType.findById(req.params.id)
    .lean({ virtuals: true });

  if (!roomType) {
    return next(ApiError.notFound('Room type not found'));
  }

  return res.status(200).json({
    success: true,
    data: roomType,
  });
});

// ─── POST /api/v1/room-types ──────────────────────────────────────────────────
/**
 * Staff only (manager/admin). Create a new room type.
 * The duplicate-name 409 is handled automatically by error.middleware.js
 * (Mongoose unique index → err.code 11000 → 409).
 */
const create = asyncHandler(async (req, res) => {
  // Whitelist allowed fields — never spread req.body directly
  const {
    name, description, basePrice, capacity,
    amenities, minStay, bedConfiguration, sizeSqm,
  } = req.body;

  const roomType = await RoomType.create({
    name,
    description,
    basePrice: Number(basePrice),
    capacity:  Number(capacity),
    amenities: amenities || [],
    minStay:   minStay ? Number(minStay) : 1,
    bedConfiguration,
    sizeSqm:   sizeSqm ? Number(sizeSqm) : undefined,
  });

  // Use lean+virtuals for the response so thumbnailUrl is included
  const roomTypeData = await RoomType.findById(roomType._id).lean({ virtuals: true });

  return res.status(201).json({
    success: true,
    data: roomTypeData,
  });
});

// ─── PATCH /api/v1/room-types/:id ─────────────────────────────────────────────
/**
 * Staff only. Partial update of a room type.
 * isActive: false is the soft-delete (deactivation) mechanism.
 */
const update = asyncHandler(async (req, res, next) => {
  const allowed = [
    'name', 'description', 'basePrice', 'capacity',
    'amenities', 'minStay', 'bedConfiguration', 'sizeSqm', 'isActive',
  ];

  const updates = {};
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  if (Object.keys(updates).length === 0) {
    return next(ApiError.badRequest('No valid fields provided for update'));
  }

  const roomType = await RoomType.findByIdAndUpdate(
    req.params.id,
    { $set: updates },
    { new: true, runValidators: true }
  ).lean({ virtuals: true });

  if (!roomType) {
    return next(ApiError.notFound('Room type not found'));
  }

  return res.status(200).json({
    success: true,
    data: roomType,
  });
});

// ─── POST /api/v1/room-types/:id/images ───────────────────────────────────────
/**
 * Staff only. Upload a photo for a room type.
 * Expects a multipart/form-data body with a file field named "image".
 * Optional field: "caption" (text describing the photo).
 *
 * If Cloudinary is not configured, a deterministic placeholder URL is used.
 */
const addImage = asyncHandler(async (req, res, next) => {
  const roomType = await RoomType.findById(req.params.id);
  if (!roomType) {
    return next(ApiError.notFound('Room type not found'));
  }

  if (!req.file) {
    return next(ApiError.badRequest('No image file provided'));
  }

  const { url, publicId } = await uploadRoomImage(req.file.buffer, req.file.originalname);

  roomType.images.push({
    url,
    publicId,
    caption: req.body.caption || '',
  });

  await roomType.save();

  const roomTypeData = await RoomType.findById(roomType._id).lean({ virtuals: true });

  return res.status(200).json({
    success: true,
    message: 'Image uploaded successfully',
    data: roomTypeData,
  });
});

// ─── DELETE /api/v1/room-types/:id/images/:imgId ──────────────────────────────
/**
 * Staff only. Remove a specific photo from a room type.
 * Uses MongoDB $pull to remove the image sub-document.
 * Deletes the file from Cloudinary if a publicId exists.
 */
const removeImage = asyncHandler(async (req, res, next) => {
  const roomType = await RoomType.findById(req.params.id);
  if (!roomType) {
    return next(ApiError.notFound('Room type not found'));
  }

  const image = roomType.images.id(req.params.imgId);
  if (!image) {
    return next(ApiError.notFound('Image not found'));
  }

  // Delete from Cloudinary (no-op if publicId is null or Cloudinary not configured)
  await deleteRoomImage(image.publicId);

  // Remove from the images array using Mongoose subdocument method
  roomType.images.pull({ _id: req.params.imgId });
  await roomType.save();

  return res.status(200).json({
    success: true,
    message: 'Image removed successfully',
  });
});

module.exports = {
  getAll,
  getOne,
  create,
  update,
  addImage,
  removeImage,
};
