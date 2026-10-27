const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const RoomType = require('../models/RoomType');
const HotelSettings = require('../models/HotelSettings');
const { calculateNights, toMidnightUTC } = require('../utils/dateUtils');
const { generateBookingRef } = require('../utils/generateRef');

const populateBooking = (query) => query
  .populate('roomType', 'name basePrice capacity amenities thumbnailUrl')
  .populate('room', 'roomNumber floor status')
  .populate('customer', 'firstName lastName email phone');

const findAvailableRoom = async (roomTypeId, checkIn, checkOut) => {
  const rooms = await Room.find({ roomType: roomTypeId, isActive: true }).select('_id');
  if (!rooms.length) return null;
  const blocked = await Booking.find({
    room: { $in: rooms.map((room) => room._id) },
    status: { $in: [Booking.STATUS.CONFIRMED, Booking.STATUS.CHECKED_IN] },
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn },
  }).distinct('room');
  const blockedIds = new Set(blocked.map((id) => id.toString()));
  return rooms.find((room) => !blockedIds.has(room._id.toString())) || null;
};

const create = asyncHandler(async (req, res, next) => {
  const checkIn = toMidnightUTC(req.body.checkIn);
  const checkOut = toMidnightUTC(req.body.checkOut);
  const roomType = await RoomType.findOne({ _id: req.body.roomType, isActive: true });
  if (!roomType) return next(ApiError.notFound('Room type not found'));

  const adults = Number(req.body.adults);
  const children = Number(req.body.children || 0);
  if (adults + children > roomType.capacity) return next(ApiError.badRequest('Guest count exceeds room capacity'));

  const room = await findAvailableRoom(roomType._id, checkIn, checkOut);
  if (!room) return next(ApiError.conflict('No rooms of this type are available for the selected dates'));

  const settings = await HotelSettings.getSettings();
  const nights = calculateNights(checkIn, checkOut);
  const subtotal = roomType.basePrice * nights;
  const taxAmount = Math.round(subtotal * settings.taxRate * 100) / 100;
  const booking = await Booking.create({
    bookingRef: generateBookingRef(),
    customer: req.body.customer || req.user._id,
    createdBy: req.user._id,
    room: room._id,
    roomType: roomType._id,
    checkIn,
    checkOut,
    nights,
    adults,
    children,
    pricePerNight: roomType.basePrice,
    subtotal,
    taxRate: settings.taxRate,
    taxAmount,
    totalPrice: subtotal + taxAmount,
    currency: settings.currency,
    source: req.body.source || (req.body.customer ? 'walk_in' : 'online'),
    specialRequests: req.body.specialRequests,
  });
  res.status(201).json({ success: true, data: await populateBooking(Booking.findById(booking._id)) });
});

const getMine = asyncHandler(async (req, res) => {
  const filter = { customer: req.user._id };
  if (req.query.status) filter.status = req.query.status;
  const bookings = await populateBooking(Booking.find(filter).sort({ checkIn: -1 }));
  res.json({ success: true, count: bookings.length, data: bookings });
});

const getAll = asyncHandler(async (req, res) => {
  const filter = req.query.status ? { status: req.query.status } : {};
  const bookings = await populateBooking(Booking.find(filter).sort({ checkIn: 1 }));
  res.json({ success: true, count: bookings.length, data: bookings });
});

const getOne = asyncHandler(async (req, res, next) => {
  const booking = await populateBooking(Booking.findById(req.params.id));
  if (!booking) return next(ApiError.notFound('Booking not found'));
  if (req.user.role === 'customer' && booking.customer._id.toString() !== req.user._id.toString()) {
    return next(ApiError.forbidden('You are not allowed to view this booking'));
  }
  res.json({ success: true, data: booking });
});

const cancel = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return next(ApiError.notFound('Booking not found'));
  if (req.user.role === 'customer' && booking.customer.toString() !== req.user._id.toString()) {
    return next(ApiError.forbidden('You are not allowed to cancel this booking'));
  }
  if (booking.status !== Booking.STATUS.CONFIRMED) return next(ApiError.badRequest('Only confirmed bookings can be cancelled'));
  booking.status = Booking.STATUS.CANCELLED;
  booking.cancellationReason = req.body.reason || '';
  booking.cancelledAt = new Date();
  await booking.save();
  res.json({ success: true, data: booking });
});

const changeStatus = (status, timestampField) => asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return next(ApiError.notFound('Booking not found'));
  const expected = status === Booking.STATUS.CHECKED_IN ? Booking.STATUS.CONFIRMED : Booking.STATUS.CHECKED_IN;
  if (booking.status !== expected) return next(ApiError.badRequest(`Only ${expected} bookings can be ${status.replace('_', ' ')}`));
  booking.status = status;
  booking[timestampField] = new Date();
  await booking.save();
  res.json({ success: true, data: booking });
});

module.exports = {
  create, getMine, getAll, getOne, cancel,
  checkIn: changeStatus(Booking.STATUS.CHECKED_IN, 'actualCheckIn'),
  checkOut: changeStatus(Booking.STATUS.CHECKED_OUT, 'actualCheckOut'),
};
