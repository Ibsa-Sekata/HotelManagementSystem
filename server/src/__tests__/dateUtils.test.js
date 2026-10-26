/**
 * dateUtils.test.js — Unit tests for date utility functions
 *
 * These tests verify that our date math is correct.
 * Booking conflict detection, cancellation fees, and price calculations
 * all depend on these functions, so they must be rock-solid.
 *
 * Run with: npm test
 */

const {
  calculateNights,
  toMidnightUTC,
  getCancellationInfo,
  datesOverlap,
} = require('../utils/dateUtils');

describe('calculateNights', () => {
  test('calculates 1 night correctly', () => {
    const checkIn = new Date('2026-11-01');
    const checkOut = new Date('2026-11-02');
    expect(calculateNights(checkIn, checkOut)).toBe(1);
  });

  test('calculates 3 nights correctly', () => {
    const checkIn = new Date('2026-11-01');
    const checkOut = new Date('2026-11-04');
    expect(calculateNights(checkIn, checkOut)).toBe(3);
  });

  test('calculates 7 nights correctly', () => {
    const checkIn = new Date('2026-11-01');
    const checkOut = new Date('2026-11-08');
    expect(calculateNights(checkIn, checkOut)).toBe(7);
  });

  test('throws an error if check-out is before check-in', () => {
    const checkIn = new Date('2026-11-05');
    const checkOut = new Date('2026-11-01');
    expect(() => calculateNights(checkIn, checkOut)).toThrow();
  });

  test('throws an error if check-out equals check-in (0 nights)', () => {
    const date = new Date('2026-11-01');
    expect(() => calculateNights(date, date)).toThrow();
  });

  test('works with string date inputs', () => {
    expect(calculateNights('2026-12-24', '2026-12-26')).toBe(2);
  });
});

describe('toMidnightUTC', () => {
  test('sets time to midnight UTC', () => {
    const result = toMidnightUTC('2026-11-01T14:30:00');
    expect(result.getUTCHours()).toBe(0);
    expect(result.getUTCMinutes()).toBe(0);
    expect(result.getUTCSeconds()).toBe(0);
    expect(result.getUTCMilliseconds()).toBe(0);
  });

  test('preserves the date (using explicit UTC input to avoid timezone differences)', () => {
    // Use 'Z' suffix to specify UTC explicitly — avoids system timezone ambiguity
    const result = toMidnightUTC('2026-11-15T12:00:00Z');
    expect(result.getUTCFullYear()).toBe(2026);
    expect(result.getUTCMonth()).toBe(10); // months are 0-indexed: 10 = November
    expect(result.getUTCDate()).toBe(15);
  });
});

describe('getCancellationInfo', () => {
  // Hotel policy: free cancellation if ≥ 48 hours before check-in

  test('returns isFree=true when cancelling 72 hours before check-in', () => {
    const checkIn = new Date('2026-11-10T14:00:00Z');
    const cancellationTime = new Date('2026-11-07T14:00:00Z'); // exactly 72 hours before
    const result = getCancellationInfo(checkIn, cancellationTime, 48);
    expect(result.isFree).toBe(true);
    expect(result.hoursUntilCheckIn).toBe(72);
  });

  test('returns isFree=true when cancelling exactly 48 hours before', () => {
    const checkIn = new Date('2026-11-10T14:00:00Z');
    const cancellationTime = new Date('2026-11-08T14:00:00Z'); // exactly 48 hours before
    const result = getCancellationInfo(checkIn, cancellationTime, 48);
    expect(result.isFree).toBe(true);
  });

  test('returns isFree=false when cancelling 24 hours before (within window)', () => {
    const checkIn = new Date('2026-11-10T14:00:00Z');
    const cancellationTime = new Date('2026-11-09T14:00:00Z'); // 24 hours before
    const result = getCancellationInfo(checkIn, cancellationTime, 48);
    expect(result.isFree).toBe(false);
    expect(result.hoursUntilCheckIn).toBe(24);
  });

  test('returns isFree=false when cancelling on the day of check-in', () => {
    const checkIn = new Date('2026-11-10T14:00:00Z');
    const cancellationTime = new Date('2026-11-10T10:00:00Z'); // same day, 4 hours before
    const result = getCancellationInfo(checkIn, cancellationTime, 48);
    expect(result.isFree).toBe(false);
  });
});

describe('datesOverlap', () => {
  // New booking: Nov 5 → Nov 8
  const newIn = new Date('2026-11-05');
  const newOut = new Date('2026-11-08');

  test('detects overlap when existing booking contains new booking', () => {
    // Existing: Nov 3 → Nov 10 (contains Nov 5 → Nov 8)
    expect(datesOverlap(new Date('2026-11-03'), new Date('2026-11-10'), newIn, newOut)).toBe(true);
  });

  test('detects overlap when bookings partially overlap (start)', () => {
    // Existing: Nov 3 → Nov 6 (overlaps with Nov 5 → Nov 8)
    expect(datesOverlap(new Date('2026-11-03'), new Date('2026-11-06'), newIn, newOut)).toBe(true);
  });

  test('detects overlap when bookings partially overlap (end)', () => {
    // Existing: Nov 7 → Nov 11 (overlaps with Nov 5 → Nov 8)
    expect(datesOverlap(new Date('2026-11-07'), new Date('2026-11-11'), newIn, newOut)).toBe(true);
  });

  test('does NOT detect overlap when existing booking ends on new booking start date', () => {
    // Existing: Nov 2 → Nov 5 (check-out Nov 5 = check-in Nov 5 — no overlap)
    // A guest checking out on Nov 5 and another checking in Nov 5 is fine
    expect(datesOverlap(new Date('2026-11-02'), new Date('2026-11-05'), newIn, newOut)).toBe(false);
  });

  test('does NOT detect overlap when existing booking starts on new booking end date', () => {
    // Existing: Nov 8 → Nov 12 (starts on Nov 8 = our check-out — no overlap)
    expect(datesOverlap(new Date('2026-11-08'), new Date('2026-11-12'), newIn, newOut)).toBe(false);
  });

  test('does NOT detect overlap when bookings are completely separate (before)', () => {
    // Existing: Nov 1 → Nov 4 (ends before our Nov 5 check-in)
    expect(datesOverlap(new Date('2026-11-01'), new Date('2026-11-04'), newIn, newOut)).toBe(false);
  });

  test('does NOT detect overlap when bookings are completely separate (after)', () => {
    // Existing: Nov 10 → Nov 14 (starts after our Nov 8 check-out)
    expect(datesOverlap(new Date('2026-11-10'), new Date('2026-11-14'), newIn, newOut)).toBe(false);
  });
});
