/**
 * room.controller.js — Handlers for individual room endpoints
 *
 * Physical rooms are the actual rentable units (room 101, 202, etc.).
 * Each room belongs to a RoomType which defines price, amenities, and photos.
 *
 * AVAILABILITY LOGIC (important):
 *   A room is "available for dates X–Y" only if:
 *   1. The room's isActive is true (not soft-deleted)
 *   2. There is NO booking for that room with status IN ('confirmed', 'checked_in')
 *      whose dates overlap with X–Y.
 *
 *   The room's operational `status` field ('available', 'occupied', 'dirty', etc.)
 *   reflects the CURRENT physical state for housekeeping/front-desk use.
 *   It is NOT used to determine future date availability.
 *   A room in 'dirty' status after checkout can still have future confirmed bookings.
 *
 * See docs/KNOWN_ISSUES.md KI-001 for the concurrency limitation during development.
 *
 * Endpoints handled here:
 *   GET  /api/v1/rooms/available     Public  — search available rooms
 *   GET  /api/v1/rooms               Staff   — list all rooms (with status)
 *   GET  /api/v1/rooms/:id           Staff   — get one room
 *   POST /api/v1/rooms               Staff   — create room
 *   PATCH /api/v1/rooms/:id          Staff   — update room
 */

const asyncHandler   = require('../utils/asyncHandler');
const ApiError       = require('../utils/ApiError');
const Room           = require('../models/Room');
const RoomType       = require('../models/RoomType');
const Booking        = require('../models/Booking');
const { toMidnightUTC } = require('../utils/dateUtils');

// ─── GET /api/v1/rooms/available ─────────────────────────────────────────────
/**
 * Public. Search for room types that have at least one available room
 * for the given dates and guest count.
 *
 * Query parameters (all optional):
 *   checkIn   YYYY-MM-DD  — desired check-in date
 *   checkOut  YYYY-MM-DD  — desired check-out date
 *   guests    number      — total guest count (adults + children)
 *   roomType  ObjectId    — filter by a specific room type
 *   minPrice  number      — minimum base price per night
 *   maxPrice  number      — maximum base price per night
 *   floor     number      — filter by floor
 *
 * Returns room TYPES (with availability status), not individual rooms,
 * because guests browse by category, not by room number.
 */
const searchAvailable = asyncHandler(async (req, res) => {
  const {
    checkIn:   checkInStr,
    checkOut:  checkOutStr,
    guests,
    roomType:  roomTypeFilter,
    minPrice,
    maxPrice,
    floor,
  } = req.query;

  // ── Build the RoomType filter ─────────────────────────────────────────────
  const typeFilter = { isActive: true };

  if (guests)    typeFilter.capacity   = { $gte: Number(guests) };
  if (minPrice)  typeFilter.basePrice  = { ...typeFilter.basePrice, $gte: Number(minPrice) };
  if (maxPrice)  typeFilter.basePrice  = { ...typeFilter.basePrice, $lte: Number(maxPrice) };
  if (roomTypeFilter) typeFilter._id   = roomTypeFilter;

  const roomTypes = await RoomType.find(typeFilter)
    .sort({ basePrice: 1 })
    .lean({ virtuals: true });

  if (roomTypes.length === 0) {
    return res.status(200).json({ success: true, count: 0, data: [] });
  }

  // ── If no dates provided, return types with room counts (no availability check) ──
  if (!checkInStr || !checkOutStr) {
    const roomTypeIds = roomTypes.map((rt) => rt._id);
    const roomCounts  = await Room.aggregate([
      { $match: { roomType: { $in: roomTypeIds }, isActive: true } },
      { $group: { _id: '$roomType', totalRooms: { $sum: 1 } } },
    ]);

    const countMap = {};
    roomCounts.forEach((r) => { countMap[r._id.toString()] = r.totalRooms; });

    const data = roomTypes.map((rt) => ({
      ...rt,
      totalRooms: countMap[rt._id.toString()] || 0,
    }));

    return res.status(200).json({ success: true, count: data.length, data });
  }

  // ── Date-based availability check ──────────────────────────────────────────
  const checkIn  = toMidnightUTC(checkInStr);
  const checkOut = toMidnightUTC(checkOutStr);

  const roomTypeIds = roomTypes.map((rt) => rt._id);

  // Find ALL active rooms for these types
  const allRoomsFilter = { roomType: { $in: roomTypeIds }, isActive: true };
  if (floor !== undefined) allRoomsFilter.floor = Number(floor);

  const allRooms = await Room.find(allRoomsFilter).select('_id roomType');

  if (allRooms.length === 0) {
    return res.status(200).json({ success: true, count: 0, data: [] });
  }

  const allRoomIds = allRooms.map((r) => r._id);

  // Find rooms that are BLOCKED by an active booking in the requested date range.
  // A booking blocks a room if:
  //   booking.status IN ['confirmed', 'checked_in']
  //   AND booking.checkIn < requested checkOut
  //   AND booking.checkOut > requested checkIn
  const blockedBookings = await Booking.find({
    room:    { $in: allRoomIds },
    status:  { $in: [Booking.STATUS.CONFIRMED, Booking.STATUS.CHECKED_IN] },
    checkIn: { $lt: checkOut },   // existing check-in is before our check-out
    checkOut: { $gt: checkIn },   // existing check-out is after our check-in
  }).select('room');

  const blockedRoomIds = new Set(
    blockedBookings.map((b) => b.room.toString())
  );

  // Group available rooms by room type
  const availableByType = {};
  allRooms.forEach((room) => {
    if (!blockedRoomIds.has(room._id.toString())) {
      const typeId = room.roomType.toString();
      availableByType[typeId] = (availableByType[typeId] || 0) + 1;
    }
  });

  // Attach availability count to each room type
  const data = roomTypes
    .map((rt) => ({
      ...rt,
      availableRooms: availableByType[rt._id.toString()] || 0,
    }))
    .filter((rt) => rt.availableRooms > 0); // only return types with free rooms

  return res.status(200).json({
    success: true,
    count: data.length,
    data,
    meta: {
      checkIn:   checkIn.toISOString().split('T')[0],
      checkOut:  checkOut.toISOString().split('T')[0],
      guests:    guests ? Number(guests) : null,
    },
  });
});

// ─── GET /api/v1/rooms ────────────────────────────────────────────────────────
/**
 * Staff only. List all rooms with their type populated.
 * Supports filtering by status, floor, and roomType.
 */
const getAll = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.query.status)   filter.status   = req.query.status;
  if (req.query.floor)    filter.floor    = Number(req.query.floor);
  if (req.query.roomType) filter.roomType = req.query.roomType;
  if (req.query.active !== 'false') filter.isActive = true; // default: active only

  const rooms = await Room.find(filter)
    .populate('roomType', 'name basePrice capacity amenities thumbnailUrl')
    .sort({ floor: 1, roomNumber: 1 });

  return res.status(200).json({
    success: true,
    count: rooms.length,
    data: rooms,
  });
});

// ─── GET /api/v1/rooms/:id ────────────────────────────────────────────────────
const getOne = asyncHandler(async (req, res, next) => {
  const room = await Room.findById(req.params.id)
    .populate('roomType', 'name description basePrice capacity amenities images bedConfiguration sizeSqm');

  if (!room) {
    return next(ApiError.notFound('Room not found'));
  }

  return res.status(200).json({
    success: true,
    data: room,
  });
});

// ─── POST /api/v1/rooms ───────────────────────────────────────────────────────
/**
 * Staff only (manager/admin). Create an individual physical room.
 * Validates that the referenced RoomType exists.
 */
const create = asyncHandler(async (req, res, next) => {
  const { roomNumber, floor, roomType: roomTypeId, status, notes } = req.body;

  // Verify the roomType exists
  const roomTypeDoc = await RoomType.findById(roomTypeId);
  if (!roomTypeDoc) {
    return next(ApiError.notFound('Room type not found — cannot create room'));
  }

  const room = await Room.create({
    roomNumber: roomNumber.toUpperCase(),
    floor:      Number(floor),
    roomType:   roomTypeId,
    status:     status || Room.STATUS.AVAILABLE,
    notes,
  });

  const roomData = await Room.findById(room._id)
    .populate('roomType', 'name basePrice capacity amenities');

  return res.status(201).json({
    success: true,
    data: roomData,
  });
});

// ─── PATCH /api/v1/rooms/:id ──────────────────────────────────────────────────
/**
 * Staff only. Update room details.
 * Status changes (available → maintenance, etc.) go through this endpoint too.
 * Deactivation is done by setting isActive: false (never hard-delete).
 */
const update = asyncHandler(async (req, res, next) => {
  const allowed = ['roomNumber', 'floor', 'roomType', 'status', 'notes', 'isActive'];
  const updates = {};

  allowed.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  if (Object.keys(updates).length === 0) {
    return next(ApiError.badRequest('No valid fields provided for update'));
  }

  // If roomType is being changed, verify the new type exists
  if (updates.roomType) {
    const typeExists = await RoomType.findById(updates.roomType);
    if (!typeExists) {
      return next(ApiError.notFound('Room type not found'));
    }
  }

  if (updates.roomNumber) {
    updates.roomNumber = updates.roomNumber.toUpperCase();
  }

  const room = await Room.findByIdAndUpdate(
    req.params.id,
    { $set: updates },
    { new: true, runValidators: true }
  ).populate('roomType', 'name basePrice capacity amenities');

  if (!room) {
    return next(ApiError.notFound('Room not found'));
  }

  return res.status(200).json({
    success: true,
    data: room,
  });
});

module.exports = {
  searchAvailable,
  getAll,
  getOne,
  create,
  update,
};
