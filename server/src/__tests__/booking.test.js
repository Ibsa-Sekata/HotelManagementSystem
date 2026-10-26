/**
 * booking.test.js — Integration tests for Modules 4, 5, and 6
 *
 * Tests cover:
 *   - Booking creation (customer and staff)
 *   - Availability and overlap prevention
 *   - Server-side price calculation
 *   - Concurrency: two simultaneous requests for the same room/dates
 *   - Cancellation with fee calculation
 *   - Payment recording (mock + cash)
 *   - Invoice generation and access control
 *   - Check-in and check-out state transitions
 *   - Invalid state transition prevention
 *   - Role-based authorization
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Room = require('../models/Room');
const RoomType = require('../models/RoomType');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const HotelSettings = require('../models/HotelSettings');
const { signAccessToken } = require('../services/token.service');

// ─── Test database ─────────────────────────────────────────────────────────────
const TEST_DB_URI = (process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hotel_management')
  .replace(/\/hotel_management(\?|$)/, '/hotel_management_test$1');

beforeAll(async () => {
  await mongoose.connect(TEST_DB_URI, { serverSelectionTimeoutMS: 5000 });
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Room.deleteMany({}),
    RoomType.deleteMany({}),
    Booking.deleteMany({}),
    Payment.deleteMany({}),
    Invoice.deleteMany({}),
    HotelSettings.deleteMany({}),
  ]);
});

// ─── Helpers ───────────────────────────────────────────────────────────────────
const createUser = (role = 'customer') =>
  User.create({
    firstName: role === 'customer' ? 'Abebe' : 'Staff',
    lastName: 'Test',
    email: `${role}.${Date.now()}@test.com`,
    password: 'Password1',
    role,
  });

const tokenFor = (user) => signAccessToken({ id: user._id, role: user.role });

const createRoomType = (overrides = {}) =>
  RoomType.create({
    name: overrides.name || `TestType${Date.now()}`,
    description: 'Test room type',
    basePrice: overrides.basePrice || 2000,
    capacity: overrides.capacity || 2,
    isActive: true,
    ...overrides,
  });

const createRoom = (roomTypeId, overrides = {}) =>
  Room.create({
    roomNumber: overrides.roomNumber || `T${Date.now()}`.slice(-4),
    floor: 1,
    roomType: roomTypeId,
    status: Room.STATUS.AVAILABLE,
    isActive: true,
    ...overrides,
  });

const createSettings = (overrides = {}) =>
  HotelSettings.create({
    currency: 'ETB',
    taxRate: 0.15,
    freeCancellationHours: 48,
    lateCancellationFeePercent: 50,
    noShowChargePercent: 100,
    ...overrides,
  });

// Future dates relative to today
const futureDate = (daysFromNow) => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
};

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 4 — BOOKING CREATION
// ═══════════════════════════════════════════════════════════════════════════════
describe('POST /api/v1/bookings — Create booking', () => {
  let customer, token, roomType, room;

  beforeEach(async () => {
    customer = await createUser('customer');
    token = tokenFor(customer);
    roomType = await createRoomType({ basePrice: 2000 });
    room = await createRoom(roomType._id);
    await createSettings();
  });

  test('customer creates a valid booking and gets 201 with populated data', async () => {
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ roomId: room._id, checkIn: futureDate(5), checkOut: futureDate(8), adults: 2 });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.bookingRef).toMatch(/^HMS-/);
    expect(res.body.data.nights).toBe(3);
    expect(res.body.data.status).toBe('confirmed');
    expect(res.body.data.paymentStatus).toBe('pending');
  });

  test('server calculates price; client-submitted total is ignored', async () => {
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        roomId: room._id,
        checkIn: futureDate(5), checkOut: futureDate(7),
        adults: 2,
        totalPrice: 99999, // attacker tries to override price — must be ignored
      });

    expect(res.status).toBe(201);
    // 2 nights × 2000 = 4000, tax 15% = 600, total = 4600
    expect(res.body.data.subtotal).toBe(4000);
    expect(res.body.data.taxAmount).toBe(600);
    expect(res.body.data.totalPrice).toBe(4600);
    expect(res.body.data.totalPrice).not.toBe(99999);
  });

  test('returns 401 if not authenticated', async () => {
    const res = await request(app).post('/api/v1/bookings').send({
      roomId: room._id, checkIn: futureDate(5), checkOut: futureDate(8), adults: 2,
    });
    expect(res.status).toBe(401);
  });

  test('returns 403 if staff tries to use customer booking endpoint', async () => {
    const staff = await createUser('receptionist');
    const staffToken = tokenFor(staff);
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ roomId: room._id, checkIn: futureDate(5), checkOut: futureDate(8), adults: 2 });
    expect(res.status).toBe(403);
  });

  test('returns 400 if check-in date is in the past', async () => {
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ roomId: room._id, checkIn: '2020-01-01', checkOut: '2020-01-03', adults: 2 });
    expect(res.status).toBe(400);
  });

  test('returns 400 if check-out is not after check-in', async () => {
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ roomId: room._id, checkIn: futureDate(8), checkOut: futureDate(5), adults: 2 });
    expect(res.status).toBe(400);
  });

  test('returns 400 if guest count exceeds room capacity', async () => {
    const smallType = await createRoomType({ name: 'SmallRoom', capacity: 1 });
    const smallRoom = await createRoom(smallType._id);
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ roomId: smallRoom._id, checkIn: futureDate(5), checkOut: futureDate(7), adults: 2 });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/capacity/i);
  });

  test('returns 400 if minimum stay not met', async () => {
    const suiteType = await createRoomType({ name: 'Suite', minStay: 3 });
    const suite = await createRoom(suiteType._id);
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ roomId: suite._id, checkIn: futureDate(5), checkOut: futureDate(6), adults: 1 });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/minimum/i);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 4 — BOOKING CONFLICT / AVAILABILITY
// ═══════════════════════════════════════════════════════════════════════════════
describe('Booking overlap prevention', () => {
  let customer, token, room;

  beforeEach(async () => {
    customer = await createUser('customer');
    token = tokenFor(customer);
    const rt = await createRoomType();
    room = await createRoom(rt._id);
    await createSettings();
  });

  test('rejects a booking whose dates fully overlap an existing booking', async () => {
    // First booking: days 10–15
    await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ roomId: room._id, checkIn: futureDate(10), checkOut: futureDate(15), adults: 1 });

    // Second booking: days 12–14 (inside the first)
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ roomId: room._id, checkIn: futureDate(12), checkOut: futureDate(14), adults: 1 });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/not available/i);
  });

  test('rejects a booking whose dates partially overlap (start overlap)', async () => {
    await request(app).post('/api/v1/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ roomId: room._id, checkIn: futureDate(10), checkOut: futureDate(15), adults: 1 });

    const res = await request(app).post('/api/v1/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ roomId: room._id, checkIn: futureDate(8), checkOut: futureDate(12), adults: 1 });

    expect(res.status).toBe(409);
  });

  test('rejects a booking whose dates partially overlap (end overlap)', async () => {
    await request(app).post('/api/v1/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ roomId: room._id, checkIn: futureDate(10), checkOut: futureDate(15), adults: 1 });

    const res = await request(app).post('/api/v1/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ roomId: room._id, checkIn: futureDate(13), checkOut: futureDate(18), adults: 1 });

    expect(res.status).toBe(409);
  });

  test('allows a booking that starts exactly when another ends (adjacent dates)', async () => {
    await request(app).post('/api/v1/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ roomId: room._id, checkIn: futureDate(10), checkOut: futureDate(13), adults: 1 });

    // Starts exactly when first ends — allowed
    const res = await request(app).post('/api/v1/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ roomId: room._id, checkIn: futureDate(13), checkOut: futureDate(16), adults: 1 });

    expect(res.status).toBe(201);
  });

  test('allows booking the same room on completely different dates', async () => {
    await request(app).post('/api/v1/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ roomId: room._id, checkIn: futureDate(5), checkOut: futureDate(8), adults: 1 });

    const res = await request(app).post('/api/v1/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ roomId: room._id, checkIn: futureDate(20), checkOut: futureDate(23), adults: 1 });

    expect(res.status).toBe(201);
  });

  test('allows booking a different room on the same dates', async () => {
    const rt2 = await createRoomType({ name: 'RoomType2' });
    const room2 = await createRoom(rt2._id);

    await request(app).post('/api/v1/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ roomId: room._id, checkIn: futureDate(10), checkOut: futureDate(13), adults: 1 });

    const res = await request(app).post('/api/v1/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ roomId: room2._id, checkIn: futureDate(10), checkOut: futureDate(13), adults: 1 });

    expect(res.status).toBe(201);
  });

  test('cancelled booking does NOT block new booking on same dates', async () => {
    // Create and cancel a booking
    const b1Res = await request(app).post('/api/v1/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ roomId: room._id, checkIn: futureDate(10), checkOut: futureDate(13), adults: 1 });
    const bookingId = b1Res.body.data._id;

    await request(app).patch(`/api/v1/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Test cancellation' });

    // Now same dates should be bookable again
    const res = await request(app).post('/api/v1/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ roomId: room._id, checkIn: futureDate(10), checkOut: futureDate(13), adults: 1 });

    expect(res.status).toBe(201);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 4 — CONCURRENCY TEST
// ═══════════════════════════════════════════════════════════════════════════════
describe('Concurrency: simultaneous booking attempts', () => {
  test('only ONE of N simultaneous requests for the same room/dates succeeds', async () => {
    const rt = await createRoomType({ basePrice: 3000 });
    const room = await createRoom(rt._id);
    await createSettings();

    // Create 5 customers
    const users = await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        User.create({ firstName: 'User', lastName: `${i}`, email: `c${i}@test.com`, password: 'Password1', role: 'customer' })
      )
    );
    const tokens = users.map(tokenFor);

    // Fire 5 simultaneous booking requests for the same room and dates
    const results = await Promise.all(
      tokens.map((tok) =>
        request(app)
          .post('/api/v1/bookings')
          .set('Authorization', `Bearer ${tok}`)
          .send({ roomId: room._id, checkIn: futureDate(30), checkOut: futureDate(33), adults: 1 })
      )
    );

    const successes = results.filter((r) => r.status === 201);
    const conflicts = results.filter((r) => r.status === 409);

    expect(successes.length).toBe(1);
    expect(conflicts.length).toBe(4);

    // Verify only one booking exists in the database
    const bookings = await Booking.find({
      room: room._id,
      status: { $in: [Booking.STATUS.CONFIRMED, Booking.STATUS.CHECKED_IN] },
    });
    expect(bookings.length).toBe(1);
  }, 30000); // Extended timeout for concurrent operations
});

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 4 — CANCELLATION AND FEES
// ═══════════════════════════════════════════════════════════════════════════════
describe('Booking cancellation and fees', () => {
  let customer, token, room;

  beforeEach(async () => {
    customer = await createUser('customer');
    token = tokenFor(customer);
    const rt = await createRoomType({ basePrice: 2000 });
    room = await createRoom(rt._id);
    await createSettings({ freeCancellationHours: 48, lateCancellationFeePercent: 50 });
  });

  test('cancels a confirmed booking successfully', async () => {
    const b = await request(app).post('/api/v1/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ roomId: room._id, checkIn: futureDate(10), checkOut: futureDate(12), adults: 1 });

    const res = await request(app)
      .patch(`/api/v1/bookings/${b.body.data._id}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Change of plans' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('cancelled');
    expect(res.body.data.cancellationReason).toMatch(/change of plans/i);
  });

  test('free cancellation when more than 48h before check-in', async () => {
    const b = await request(app).post('/api/v1/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ roomId: room._id, checkIn: futureDate(10), checkOut: futureDate(12), adults: 1 });

    const res = await request(app)
      .patch(`/api/v1/bookings/${b.body.data._id}/cancel`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.cancellationInfo.isFree).toBe(true);
    expect(res.body.cancellationInfo.fee).toBe(0);
  });

  test('customer cannot cancel another customer\'s booking', async () => {
    const other = await createUser('customer');
    const bRes = await request(app).post('/api/v1/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ roomId: room._id, checkIn: futureDate(10), checkOut: futureDate(12), adults: 1 });

    const res = await request(app)
      .patch(`/api/v1/bookings/${bRes.body.data._id}/cancel`)
      .set('Authorization', `Bearer ${tokenFor(other)}`);

    expect(res.status).toBe(403);
  });

  test('cannot cancel an already-cancelled booking', async () => {
    const b = await request(app).post('/api/v1/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ roomId: room._id, checkIn: futureDate(10), checkOut: futureDate(12), adults: 1 });

    // Cancel once
    await request(app).patch(`/api/v1/bookings/${b.body.data._id}/cancel`)
      .set('Authorization', `Bearer ${token}`);

    // Try again
    const res = await request(app)
      .patch(`/api/v1/bookings/${b.body.data._id}/cancel`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(409);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 5 — PAYMENTS
// ═══════════════════════════════════════════════════════════════════════════════
describe('POST /api/v1/payments/initiate', () => {
  let customer, token, booking;

  beforeEach(async () => {
    customer = await createUser('customer');
    token = tokenFor(customer);
    const rt = await createRoomType({ basePrice: 1500 });
    const rm = await createRoom(rt._id);
    await createSettings();
    const bRes = await request(app).post('/api/v1/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ roomId: rm._id, checkIn: futureDate(5), checkOut: futureDate(7), adults: 1 });
    booking = bRes.body.data;
  });

  test('initiates a mock payment and returns simulatedPayment:true', async () => {
    const res = await request(app)
      .post('/api/v1/payments/initiate')
      .set('Authorization', `Bearer ${token}`)
      .send({ bookingId: booking._id, method: 'card' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.simulatedPayment).toBe(true);
    expect(res.body.warning).toMatch(/mock/i);
    expect(res.body.data.amount).toBe(booking.totalPrice);
    expect(res.body.data.status).toBe('pending');
  });

  test('rejects raw card data in the request body', async () => {
    const res = await request(app)
      .post('/api/v1/payments/initiate')
      .set('Authorization', `Bearer ${token}`)
      .send({ bookingId: booking._id, method: 'card', cardNumber: '4111111111111111' });

    expect(res.status).toBe(400);
    expect(res.body.errors.some((e) => e.field === 'cardNumber')).toBe(true);
  });

  test('customer cannot pay for another customer\'s booking', async () => {
    const other = await createUser('customer');
    const res = await request(app)
      .post('/api/v1/payments/initiate')
      .set('Authorization', `Bearer ${tokenFor(other)}`)
      .send({ bookingId: booking._id, method: 'card' });

    expect(res.status).toBe(403);
  });

  test('confirms payment and updates booking paymentStatus to paid', async () => {
    const initRes = await request(app)
      .post('/api/v1/payments/initiate')
      .set('Authorization', `Bearer ${token}`)
      .send({ bookingId: booking._id, method: 'card' });

    const { providerRefId } = initRes.body.data;

    const confirmRes = await request(app)
      .post('/api/v1/payments/confirm')
      .set('Authorization', `Bearer ${token}`)
      .send({ providerRefId });

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.data.status).toBe('completed');

    // Booking should now show paymentStatus: paid
    const bRes = await request(app)
      .get(`/api/v1/bookings/${booking._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(bRes.body.data.paymentStatus).toBe('paid');
  });
});

describe('POST /api/v1/payments/cash — Cash payment', () => {
  test('receptionist records a cash payment', async () => {
    const receptionist = await createUser('receptionist');
    const customer = await createUser('customer');
    const rt = await createRoomType({ basePrice: 2000 });
    const rm = await createRoom(rt._id);
    await createSettings();

    const bRes = await request(app).post('/api/v1/bookings/staff')
      .set('Authorization', `Bearer ${tokenFor(receptionist)}`)
      .send({ customerId: customer._id, roomId: rm._id, checkIn: futureDate(5), checkOut: futureDate(7), adults: 1, source: 'walk_in' });

    const res = await request(app)
      .post('/api/v1/payments/cash')
      .set('Authorization', `Bearer ${tokenFor(receptionist)}`)
      .send({ bookingId: bRes.body.data._id, amount: bRes.body.data.totalPrice });

    expect(res.status).toBe(201);
    expect(res.body.data.method).toBe('cash');
    expect(res.body.data.status).toBe('completed');
    expect(res.body.bookingPaymentStatus).toBe('paid');
  });

  test('customer cannot record a cash payment', async () => {
    const customer = await createUser('customer');
    const res = await request(app)
      .post('/api/v1/payments/cash')
      .set('Authorization', `Bearer ${tokenFor(customer)}`)
      .send({ bookingId: new mongoose.Types.ObjectId(), amount: 100 });
    expect(res.status).toBe(403);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 5 — INVOICES
// ═══════════════════════════════════════════════════════════════════════════════
describe('Invoice generation', () => {
  let customer, token, bookingId;

  beforeEach(async () => {
    customer = await createUser('customer');
    token = tokenFor(customer);
    const rt = await createRoomType({ basePrice: 3000 });
    const rm = await createRoom(rt._id);
    await createSettings();
    const bRes = await request(app).post('/api/v1/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ roomId: rm._id, checkIn: futureDate(5), checkOut: futureDate(8), adults: 2 });
    bookingId = bRes.body.data._id;
  });

  test('generates an invoice with correct line items and totals', async () => {
    const res = await request(app)
      .post(`/api/v1/invoices/${bookingId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(201);
    expect(res.body.data.lineItems.length).toBeGreaterThan(0);
    expect(res.body.data.totalDue).toBeGreaterThan(0);
    expect(res.body.data.currency).toBe('ETB');
    expect(res.body.hotel.name).toBeDefined();
  });

  test('returns existing invoice on second request (idempotent)', async () => {
    await request(app).post(`/api/v1/invoices/${bookingId}`).set('Authorization', `Bearer ${token}`);
    const res = await request(app).post(`/api/v1/invoices/${bookingId}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/already exists/i);
  });

  test('customer can retrieve their own invoice', async () => {
    await request(app).post(`/api/v1/invoices/${bookingId}`).set('Authorization', `Bearer ${token}`);
    const res = await request(app)
      .get(`/api/v1/invoices/${bookingId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.guestEmail).toBe(customer.email);
  });

  test('customer cannot retrieve another customer\'s invoice', async () => {
    const other = await createUser('customer');
    const rt2 = await createRoomType({ name: 'Room2' });
    const rm2 = await createRoom(rt2._id);
    const bRes2 = await request(app).post('/api/v1/bookings')
      .set('Authorization', `Bearer ${tokenFor(other)}`)
      .send({ roomId: rm2._id, checkIn: futureDate(5), checkOut: futureDate(8), adults: 1 });
    await request(app).post(`/api/v1/invoices/${bRes2.body.data._id}`)
      .set('Authorization', `Bearer ${tokenFor(other)}`);

    const res = await request(app)
      .get(`/api/v1/invoices/${bRes2.body.data._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 6 — CHECK-IN / CHECK-OUT
// ═══════════════════════════════════════════════════════════════════════════════
describe('Check-in and check-out', () => {
  let receptionist, customer, room, booking;

  beforeEach(async () => {
    receptionist = await createUser('receptionist');
    customer = await createUser('customer');
    const rt = await createRoomType({ basePrice: 2500 });
    room = await createRoom(rt._id);
    await createSettings();

    const bRes = await request(app).post('/api/v1/bookings')
      .set('Authorization', `Bearer ${tokenFor(customer)}`)
      .send({ roomId: room._id, checkIn: futureDate(1), checkOut: futureDate(3), adults: 1 });
    booking = bRes.body.data;
  });

  test('receptionist checks in a confirmed booking', async () => {
    const res = await request(app)
      .patch(`/api/v1/bookings/${booking._id}/checkin`)
      .set('Authorization', `Bearer ${tokenFor(receptionist)}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('checked_in');
    expect(res.body.data.actualCheckIn).toBeDefined();

    // Room should be marked occupied
    const updatedRoom = await Room.findById(room._id);
    expect(updatedRoom.status).toBe(Room.STATUS.OCCUPIED);
  });

  test('receptionist checks out a checked-in booking', async () => {
    // Check in first
    await request(app).patch(`/api/v1/bookings/${booking._id}/checkin`)
      .set('Authorization', `Bearer ${tokenFor(receptionist)}`);

    const res = await request(app)
      .patch(`/api/v1/bookings/${booking._id}/checkout`)
      .set('Authorization', `Bearer ${tokenFor(receptionist)}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('checked_out');
    expect(res.body.data.actualCheckOut).toBeDefined();

    // Room should be dirty
    const updatedRoom = await Room.findById(room._id);
    expect(updatedRoom.status).toBe(Room.STATUS.DIRTY);
  });

  test('cannot check in a booking that is already checked in', async () => {
    await request(app).patch(`/api/v1/bookings/${booking._id}/checkin`)
      .set('Authorization', `Bearer ${tokenFor(receptionist)}`);

    const res = await request(app)
      .patch(`/api/v1/bookings/${booking._id}/checkin`)
      .set('Authorization', `Bearer ${tokenFor(receptionist)}`);

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/checked_in/i);
  });

  test('cannot check out a booking that is not checked in', async () => {
    const res = await request(app)
      .patch(`/api/v1/bookings/${booking._id}/checkout`)
      .set('Authorization', `Bearer ${tokenFor(receptionist)}`);

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/checked_in/i);
  });

  test('cannot check in a cancelled booking', async () => {
    await request(app).patch(`/api/v1/bookings/${booking._id}/cancel`)
      .set('Authorization', `Bearer ${tokenFor(customer)}`);

    const res = await request(app)
      .patch(`/api/v1/bookings/${booking._id}/checkin`)
      .set('Authorization', `Bearer ${tokenFor(receptionist)}`);

    expect(res.status).toBe(409);
  });

  test('customer cannot perform check-in', async () => {
    const res = await request(app)
      .patch(`/api/v1/bookings/${booking._id}/checkin`)
      .set('Authorization', `Bearer ${tokenFor(customer)}`);
    expect(res.status).toBe(403);
  });

  test('customer cannot perform check-out', async () => {
    await request(app).patch(`/api/v1/bookings/${booking._id}/checkin`)
      .set('Authorization', `Bearer ${tokenFor(receptionist)}`);
    const res = await request(app)
      .patch(`/api/v1/bookings/${booking._id}/checkout`)
      .set('Authorization', `Bearer ${tokenFor(customer)}`);
    expect(res.status).toBe(403);
  });

  test('staff creates a walk-in booking', async () => {
    const rt2 = await createRoomType({ name: 'WalkInType' });
    const rm2 = await createRoom(rt2._id);
    const res = await request(app)
      .post('/api/v1/bookings/staff')
      .set('Authorization', `Bearer ${tokenFor(receptionist)}`)
      .send({
        customerId: customer._id,
        roomId: rm2._id,
        checkIn: futureDate(1),
        checkOut: futureDate(3),
        adults: 1,
        source: 'walk_in',
      });
    expect(res.status).toBe(201);
    expect(res.body.data.source).toBe('walk_in');
  });

  test('customer cannot use staff booking endpoint', async () => {
    const res = await request(app)
      .post('/api/v1/bookings/staff')
      .set('Authorization', `Bearer ${tokenFor(customer)}`)
      .send({ customerId: customer._id, roomId: room._id, checkIn: futureDate(10), checkOut: futureDate(12), adults: 1 });
    expect(res.status).toBe(403);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// PRICE PREVIEW
// ═══════════════════════════════════════════════════════════════════════════════
describe('GET /api/v1/bookings/:id/price-preview', () => {
  test('returns server-calculated price without creating a booking', async () => {
    const rt = await createRoomType({ basePrice: 4000 });
    const room = await createRoom(rt._id);
    await createSettings({ taxRate: 0.15 });

    const res = await request(app)
      .get(`/api/v1/bookings/${room._id}/price-preview`)
      .query({ roomId: room._id, checkIn: futureDate(5), checkOut: futureDate(8) });

    expect(res.status).toBe(200);
    expect(res.body.data.nights).toBe(3);
    // 3 × 4000 = 12000, tax 15% = 1800, total = 13800
    expect(res.body.data.subtotal).toBe(12000);
    expect(res.body.data.taxAmount).toBe(1800);
    expect(res.body.data.totalPrice).toBe(13800);
    expect(res.body.data.available).toBe(true);

    // Verify no booking was created
    const count = await Booking.countDocuments();
    expect(count).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// BOOKING LISTING AND ACCESS CONTROL
// ═══════════════════════════════════════════════════════════════════════════════
describe('Booking listing and access control', () => {
  test('customer gets only their own bookings from /bookings/my', async () => {
    const c1 = await createUser('customer');
    const c2 = await createUser('customer');
    const rt = await createRoomType();
    const rm1 = await createRoom(rt._id);
    const rm2 = await createRoom(rt._id);
    await createSettings();

    await request(app).post('/api/v1/bookings')
      .set('Authorization', `Bearer ${tokenFor(c1)}`)
      .send({ roomId: rm1._id, checkIn: futureDate(5), checkOut: futureDate(7), adults: 1 });
    await request(app).post('/api/v1/bookings')
      .set('Authorization', `Bearer ${tokenFor(c2)}`)
      .send({ roomId: rm2._id, checkIn: futureDate(5), checkOut: futureDate(7), adults: 1 });

    const res = await request(app).get('/api/v1/bookings/my')
      .set('Authorization', `Bearer ${tokenFor(c1)}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].customer.email).toBe(c1.email);
  });

  test('staff can list all bookings', async () => {
    const manager = await createUser('manager');
    const customer = await createUser('customer');
    const rt = await createRoomType();
    const rm = await createRoom(rt._id);
    await createSettings();

    await request(app).post('/api/v1/bookings')
      .set('Authorization', `Bearer ${tokenFor(customer)}`)
      .send({ roomId: rm._id, checkIn: futureDate(5), checkOut: futureDate(7), adults: 1 });

    const res = await request(app).get('/api/v1/bookings')
      .set('Authorization', `Bearer ${tokenFor(manager)}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
  });

  test('customer cannot list all bookings', async () => {
    const customer = await createUser('customer');
    const res = await request(app).get('/api/v1/bookings')
      .set('Authorization', `Bearer ${tokenFor(customer)}`);
    expect(res.status).toBe(403);
  });
});
