/**
 * auth.test.js — Integration tests for the authentication module
 *
 * These are INTEGRATION tests: they make real HTTP requests to the Express app
 * and hit a real (test) database. This tests the entire stack together —
 * validation, controller logic, database writes, and response format.
 *
 * Test database: a separate "hotel_management_test" database.
 * It is created fresh for each test run and wiped after.
 * It NEVER touches your development database.
 *
 * Run: npm test
 *      or: node node_modules/jest/bin/jest.js src/__tests__/auth.test.js --verbose
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

// NODE_ENV=test is set by src/__tests__/setup.js (Jest setupFiles) before this file loads.
// This disables rate limiting and uses low bcrypt cost for test speed.

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');

// ─── Test database setup ───────────────────────────────────────────────────────
// Use a dedicated test database so tests never touch development data.
const TEST_DB_URI = (process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hotel_management')
  .replace(/\/hotel_management(\?|$)/, '/hotel_management_test$1');

beforeAll(async () => {
  await mongoose.connect(TEST_DB_URI, { serverSelectionTimeoutMS: 5000 });
});

afterAll(async () => {
  await mongoose.connection.dropDatabase(); // clean up test database
  await mongoose.connection.close();
});

// Clear the users collection before each test for isolation
beforeEach(async () => {
  await User.deleteMany({});
});

// ─── Shared test data ─────────────────────────────────────────────────────────
const validCustomer = {
  firstName: 'Abebe',
  lastName: 'Bekele',
  email: 'abebe.bekele@example.com',
  password: 'Password1',
};

// Helper: register and return the response
const registerUser = (data = validCustomer) =>
  request(app).post('/api/v1/auth/register').send(data);

// Helper: login and return the response
const loginUser = (email = validCustomer.email, password = validCustomer.password) =>
  request(app).post('/api/v1/auth/login').send({ email, password });

// ═══════════════════════════════════════════════════════════════════════════════
// REGISTRATION
// ═══════════════════════════════════════════════════════════════════════════════
describe('POST /api/v1/auth/register', () => {
  // ── Happy path ──────────────────────────────────────────────────────────────
  test('registers a new customer and returns 201 with access token', async () => {
    const res = await registerUser();

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.accessToken).toBeDefined();
    expect(typeof res.body.accessToken).toBe('string');
  });

  test('returns the user object without password or refreshTokenHash', async () => {
    const res = await registerUser();

    expect(res.body.user).toBeDefined();
    expect(res.body.user.password).toBeUndefined();
    expect(res.body.user.refreshTokenHash).toBeUndefined();
    expect(res.body.user.email).toBe(validCustomer.email);
  });

  test('always assigns role=customer regardless of what is sent in the body', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      ...validCustomer,
      role: 'admin', // attacker tries to register as admin
    });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('customer'); // must be ignored
  });

  test('sets a refreshToken httpOnly cookie', async () => {
    const res = await registerUser();
    const cookies = res.headers['set-cookie'] || [];
    const hasRefreshCookie = cookies.some(
      (c) => c.startsWith('refreshToken=') && c.includes('HttpOnly')
    );
    expect(hasRefreshCookie).toBe(true);
  });

  test('stores a hashed password in the database (not plaintext)', async () => {
    await registerUser();
    const user = await User.findOne({ email: validCustomer.email }).select('+password');
    expect(user.password).toBeDefined();
    expect(user.password).not.toBe(validCustomer.password); // must be hashed
    expect(user.password.startsWith('$2')).toBe(true);       // bcrypt hash prefix
  });

  // ── Duplicate email ──────────────────────────────────────────────────────────
  test('returns 409 if email already exists', async () => {
    await registerUser();                      // first registration
    const res = await registerUser();          // same email again

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  // ── Validation ───────────────────────────────────────────────────────────────
  test('returns 400 if email is missing', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      firstName: 'Test', lastName: 'User', password: 'Password1',
    });
    expect(res.status).toBe(400);
    expect(res.body.errors.some((e) => e.field === 'email')).toBe(true);
  });

  test('returns 400 if email is invalid', async () => {
    const res = await registerUser({ ...validCustomer, email: 'not-an-email' });
    expect(res.status).toBe(400);
  });

  test('returns 400 if password is too short (< 8 chars)', async () => {
    const res = await registerUser({ ...validCustomer, email: 'b@b.com', password: 'Ab1' });
    expect(res.status).toBe(400);
  });

  test('returns 400 if password has no uppercase letter', async () => {
    const res = await registerUser({ ...validCustomer, email: 'b@b.com', password: 'password1' });
    expect(res.status).toBe(400);
  });

  test('returns 400 if password has no number', async () => {
    const res = await registerUser({ ...validCustomer, email: 'b@b.com', password: 'PasswordA' });
    expect(res.status).toBe(400);
  });

  test('returns 400 if firstName is missing', async () => {
    const { firstName, ...rest } = validCustomer;
    const res = await registerUser({ ...rest, email: 'c@c.com' });
    expect(res.status).toBe(400);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════════════════════════════════════
describe('POST /api/v1/auth/login', () => {
  beforeEach(async () => {
    await registerUser(); // ensure a user exists before each login test
  });

  // ── Happy path ──────────────────────────────────────────────────────────────
  test('logs in with valid credentials and returns 200 with access token', async () => {
    const res = await loginUser();

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.accessToken).toBeDefined();
  });

  test('returns user object without password', async () => {
    const res = await loginUser();
    expect(res.body.user.password).toBeUndefined();
    expect(res.body.user.email).toBe(validCustomer.email);
  });

  test('sets refreshToken and userId cookies', async () => {
    const res = await loginUser();
    const cookies = res.headers['set-cookie'] || [];
    const hasRefresh = cookies.some((c) => c.startsWith('refreshToken=') && c.includes('HttpOnly'));
    const hasUserId = cookies.some((c) => c.startsWith('userId='));
    expect(hasRefresh).toBe(true);
    expect(hasUserId).toBe(true);
  });

  // ── Wrong credentials ────────────────────────────────────────────────────────
  test('returns 401 for wrong password', async () => {
    const res = await loginUser(validCustomer.email, 'WrongPass999');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    // Must NOT reveal whether the email exists
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  test('returns 401 for non-existent email', async () => {
    const res = await loginUser('nobody@example.com', 'Password1');
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  test('error message for wrong password matches error message for wrong email (no enumeration)', async () => {
    const wrongPasswordRes = await loginUser(validCustomer.email, 'WrongPass999');
    const wrongEmailRes = await loginUser('nobody@example.com', 'Password1');
    // Both must return the same message to prevent user enumeration
    expect(wrongPasswordRes.body.message).toBe(wrongEmailRes.body.message);
  });

  // ── Validation ───────────────────────────────────────────────────────────────
  test('returns 400 if email is missing', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ password: 'Password1' });
    expect(res.status).toBe(400);
  });

  test('returns 400 if password is missing', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'a@a.com' });
    expect(res.status).toBe(400);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// PROTECTED ROUTES — /me
// ═══════════════════════════════════════════════════════════════════════════════
describe('GET /api/v1/auth/me', () => {
  let accessToken;

  beforeEach(async () => {
    await registerUser();
    const loginRes = await loginUser();
    accessToken = loginRes.body.accessToken;
  });

  test('returns user profile for authenticated request', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(validCustomer.email);
    expect(res.body.user.password).toBeUndefined();
  });

  test('returns 401 with no token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  test('returns 401 with a malformed token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer this.is.not.valid');
    expect(res.status).toBe(401);
  });

  test('returns 401 with an expired token', async () => {
    // Sign a token that expired 1 second ago
    const jwt = require('jsonwebtoken');
    const expiredToken = jwt.sign(
      { id: 'fakeid', role: 'customer' },
      process.env.JWT_SECRET || 'fallbacktestsecret',
      { expiresIn: -1 } // already expired
    );
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
  });

  test('returns 401 with a token signed by a different secret', async () => {
    const jwt = require('jsonwebtoken');
    const wrongToken = jwt.sign({ id: 'fakeid', role: 'customer' }, 'wrong-secret', { expiresIn: '1h' });
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${wrongToken}`);
    expect(res.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// LOGOUT
// ═══════════════════════════════════════════════════════════════════════════════
describe('POST /api/v1/auth/logout', () => {
  let accessToken;

  beforeEach(async () => {
    await registerUser();
    const loginRes = await loginUser();
    accessToken = loginRes.body.accessToken;
  });

  test('returns 200 and clears refresh token from database', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify the refresh token hash was cleared from the database
    const user = await User.findOne({ email: validCustomer.email }).select('+refreshTokenHash');
    expect(user.refreshTokenHash).toBeUndefined();
  });

  test('returns 401 when trying to logout without a token', async () => {
    const res = await request(app).post('/api/v1/auth/logout');
    expect(res.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// UPDATE PROFILE
// ═══════════════════════════════════════════════════════════════════════════════
describe('PATCH /api/v1/auth/me', () => {
  let accessToken;

  beforeEach(async () => {
    await registerUser();
    const loginRes = await loginUser();
    accessToken = loginRes.body.accessToken;
  });

  test('updates firstName successfully', async () => {
    const res = await request(app)
      .patch('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ firstName: 'Dawit' });

    expect(res.status).toBe(200);
    expect(res.body.user.firstName).toBe('Dawit');
  });

  test('blocks role change via profile update', async () => {
    const res = await request(app)
      .patch('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ role: 'admin' }); // attacker tries to escalate their role

    expect(res.status).toBe(400);
  });

  test('blocks email change via profile update', async () => {
    const res = await request(app)
      .patch('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ email: 'hacker@evil.com' });

    expect(res.status).toBe(400);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ROLE-BASED AUTHORIZATION
// ═══════════════════════════════════════════════════════════════════════════════
describe('Role-based authorization', () => {
  // We test role guards by directly inserting users with specific roles
  // and hitting a role-protected endpoint.
  // For now, we test via the protect + authorize middleware on a real route.
  // We'll add a test-only endpoint to exercise the authorize middleware.

  const createUserWithRole = async (role, email) => {
    // Directly insert to bypass registration (which forces 'customer')
    return User.create({
      firstName: 'Test', lastName: 'User',
      email, password: 'Password1', role,
    });
  };

  const getTokenForRole = async (role, email) => {
    await createUserWithRole(role, email);
    const { signAccessToken } = require('../services/token.service');
    const user = await User.findOne({ email });
    return signAccessToken({ id: user._id, role: user.role });
  };

  test('customer token is rejected on logout endpoint... actually logout is available to all auth users', async () => {
    const token = await getTokenForRole('customer', 'customer@test.com');
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200); // customers CAN logout
  });

  test('a token with a non-existent user ID returns 401', async () => {
    const { signAccessToken } = require('../services/token.service');
    const fakeToken = signAccessToken({ id: new mongoose.Types.ObjectId(), role: 'customer' });
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${fakeToken}`);
    expect(res.status).toBe(401);
  });

  test('deactivated user is rejected with 401', async () => {
    await createUserWithRole('customer', 'deactivated@test.com');
    const user = await User.findOne({ email: 'deactivated@test.com' });

    // Get token BEFORE deactivating
    const { signAccessToken } = require('../services/token.service');
    const token = signAccessToken({ id: user._id, role: 'customer' });

    // Deactivate the account
    await User.findByIdAndUpdate(user._id, { isActive: false });

    // Try to use the token — should be rejected
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/deactivated/i);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// CHANGE PASSWORD
// ═══════════════════════════════════════════════════════════════════════════════
describe('PATCH /api/v1/auth/me/password', () => {
  let accessToken;

  beforeEach(async () => {
    await registerUser();
    const loginRes = await loginUser();
    accessToken = loginRes.body.accessToken;
  });

  test('changes password with correct current password', async () => {
    const res = await request(app)
      .patch('/api/v1/auth/me/password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currentPassword: validCustomer.password, newPassword: 'NewPass123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Old password should no longer work
    const loginOld = await loginUser(validCustomer.email, validCustomer.password);
    expect(loginOld.status).toBe(401);

    // New password should work
    const loginNew = await loginUser(validCustomer.email, 'NewPass123');
    expect(loginNew.status).toBe(200);
  });

  test('returns 400 for wrong current password', async () => {
    const res = await request(app)
      .patch('/api/v1/auth/me/password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currentPassword: 'WrongOld1', newPassword: 'NewPass123' });

    expect(res.status).toBe(400);
  });

  test('returns 400 if new password is same as current', async () => {
    const res = await request(app)
      .patch('/api/v1/auth/me/password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currentPassword: validCustomer.password, newPassword: validCustomer.password });

    expect(res.status).toBe(400);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TOKEN REFRESH
// ═══════════════════════════════════════════════════════════════════════════════
describe('POST /api/v1/auth/refresh', () => {
  test('returns 401 with no refresh token cookie', async () => {
    const res = await request(app).post('/api/v1/auth/refresh');
    expect(res.status).toBe(401);
  });

  test('returns 401 with an invalid refresh token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', ['refreshToken=invalidtoken; Path=/api/v1/auth', 'userId=507f1f77bcf86cd799439011; Path=/api/v1/auth']);
    expect(res.status).toBe(401);
  });

  test('issues a new access token with valid refresh token', async () => {
    // Register and login to get real cookies
    await registerUser();
    const loginRes = await loginUser();

    // Extract cookies from login response
    const cookieHeader = loginRes.headers['set-cookie'];
    expect(cookieHeader).toBeDefined(); // ensure login set cookies

    // Call refresh with the real cookies
    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookieHeader);

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.accessToken).toBeDefined();
    expect(typeof refreshRes.body.accessToken).toBe('string');
    expect(refreshRes.body.accessToken.split('.').length).toBe(3); // valid JWT structure

    // Verify the new token is a valid JWT that can be used immediately
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${refreshRes.body.accessToken}`);
    expect(meRes.status).toBe(200);
  });
});
