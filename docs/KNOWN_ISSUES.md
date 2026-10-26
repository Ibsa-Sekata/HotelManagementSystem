# Known Issues & Pre-Production Requirements

This file tracks issues that are understood, accepted for development, and
**must be resolved before production deployment**.

---

## KI-001 — Booking Concurrency: Double-Booking Risk

**Status:** Open — development limitation  
**Severity:** High — must be resolved before production  
**Affects:** `BookingService.createBooking()` (Module 5)

### What the problem is

When two customers click "Book" for the same room and the same dates at exactly
the same moment, there is a window of time between the "check for conflicts" step
and the "save the booking" step where both requests could pass the conflict check
and both get saved, creating a double-booking.

```
Request A: check conflict → no conflict found ──────→ save booking A ✓
Request B:         check conflict → no conflict found → save booking B ✓  ← DOUBLE BOOKING
```

### Why it exists now

`ENABLE_TRANSACTIONS=false` is set because the local MongoDB Community Server
runs as a standalone instance without a Replica Set. MongoDB transactions
(which would make the check+save atomic) require a Replica Set.

Even with `ENABLE_TRANSACTIONS=true`, an atomic transaction alone is not
sufficient. The conflict-check query must also use a **write lock** or
**optimistic concurrency control** (document versioning) to prevent the race
condition. Simply wrapping the existing code in a transaction does not
guarantee safety without proper isolation.

### What must be done before production

1. **Deploy on a Replica Set** — MongoDB Atlas (any tier) or a locally
   configured `mongod --replSet rs0`.

2. **Implement and test proper atomic conflict prevention** using one of:
   - **Option A (Transactions + serialised writes):** Use a MongoDB transaction
     with `session.withTransaction()` and add a unique index on
     `{ room, status, checkIn, checkOut }` as a database-level safety net.
   - **Option B (Optimistic locking):** Use Mongoose `__v` version fields and
     retry on `VersionError` to detect concurrent modifications.
   - **Option C (Application-level mutex):** Use a distributed lock (e.g. via
     Redis `SET NX`) keyed on the room ID to serialise booking requests for
     the same room. Suitable if Redis is already part of the stack.

3. **Write and pass a concurrency test** that:
   - Fires 10 simultaneous booking requests for the same room and dates
   - Asserts that exactly 1 succeeds (HTTP 201) and the rest fail (HTTP 409)

4. **Do not set `ENABLE_TRANSACTIONS=true` in production until steps 1–3 are
   complete and tests are passing.**

### Current behaviour

In development (`ENABLE_TRANSACTIONS=false`), the booking service uses a
sequential read-then-write approach. This is safe under normal single-user
development testing. It is **not safe under concurrent load**.

---

## KI-002 — Access Token Blacklist Not Implemented

**Status:** Accepted limitation  
**Severity:** Low for this system  
**Affects:** Logout flow

### What the problem is

When a user logs out, we delete the refresh token from the database and clear
cookies. However, any access token issued before logout remains valid until its
natural expiry (24 hours by default).

If an access token is stolen and the legitimate user logs out, the stolen token
would still work for up to 24 hours.

### Why this is acceptable for now

Implementing a token blacklist requires a fast key-value store (typically Redis)
to check every incoming request against. Adding Redis is a meaningful
infrastructure dependency.

For a hotel management system:
- Staff tokens are 24h lived
- The main risk is a stolen token, not a compromised logout flow
- Reducing `JWT_EXPIRES_IN` to `15m` (with frequent refresh) reduces the
  exposure window significantly

### What to do before production

Either:
- Reduce `JWT_EXPIRES_IN` to `15m` in the production `.env` file, OR
- Add Redis and implement a token blacklist in `auth.middleware.js`

---

## KI-003 — Email is in Development/Fake Mode

**Status:** By design — development only  
**Severity:** Informational  
**Affects:** Booking confirmations, cancellation emails

All emails use Ethereal (fake SMTP) in development. No real emails are sent.
Preview URLs are logged to the console.

**Before production:** Set `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`
in the production environment to use a real SMTP provider.

---

## KI-004 — Payment Module is Mocked

**Status:** By design — development only  
**Severity:** High for production  
**Affects:** All payment flows

No real payments are processed. The mock provider returns a fake success response.

**Before production:** Integrate a real payment provider (Stripe recommended)
and complete end-to-end payment testing.
