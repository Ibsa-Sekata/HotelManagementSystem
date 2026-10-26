/**
 * dateUtils.js — Date calculation helpers
 *
 * Hotels work heavily with dates: how many nights between two dates?
 * Is the cancellation within the free-cancel window?
 * These helpers keep date logic in one place so it is easy to test and reuse.
 */

/**
 * Calculate the number of nights between check-in and check-out.
 *
 * Example: checkIn = June 1, checkOut = June 3 → 2 nights
 *
 * @param {Date|string} checkIn
 * @param {Date|string} checkOut
 * @returns {number} number of nights (always a positive integer)
 */
const calculateNights = (checkIn, checkOut) => {
  const inDate  = new Date(checkIn);
  const outDate = new Date(checkOut);

  // getTime() gives milliseconds since Jan 1 1970
  // We divide by ms-per-day to get whole days
  const msPerDay = 1000 * 60 * 60 * 24;
  const nights = Math.round((outDate.getTime() - inDate.getTime()) / msPerDay);

  if (nights <= 0) {
    throw new Error('Check-out date must be after check-in date');
  }

  return nights;
};

/**
 * Strip the time portion from a date, returning midnight UTC.
 * This ensures date comparisons are not affected by time zones or clock times.
 *
 * Example: new Date('2026-10-25T14:30:00') → 2026-10-25T00:00:00.000Z
 *
 * @param {Date|string} date
 * @returns {Date}
 */
const toMidnightUTC = (date) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

/**
 * Determine whether a cancellation is within the free-cancellation window.
 *
 * @param {Date|string} checkInDate         - The booking's check-in date
 * @param {Date|string} cancellationTime    - When the customer is cancelling (usually now)
 * @param {number}      freeCancelHours     - Policy: free if this many hours before check-in
 * @returns {{ isFree: boolean, hoursUntilCheckIn: number }}
 */
const getCancellationInfo = (checkInDate, cancellationTime, freeCancelHours) => {
  const checkIn     = new Date(checkInDate);
  const cancelledAt = new Date(cancellationTime);

  const msPerHour = 1000 * 60 * 60;
  const hoursUntilCheckIn = (checkIn.getTime() - cancelledAt.getTime()) / msPerHour;

  return {
    isFree: hoursUntilCheckIn >= freeCancelHours,
    hoursUntilCheckIn: Math.round(hoursUntilCheckIn),
  };
};

/**
 * Check whether two date ranges overlap.
 * Used as a secondary check in date conflict logic.
 *
 * Ranges overlap if: startA < endB AND startB < endA
 *
 * @param {Date} startA
 * @param {Date} endA
 * @param {Date} startB
 * @param {Date} endB
 * @returns {boolean}
 */
const datesOverlap = (startA, endA, startB, endB) => {
  return new Date(startA) < new Date(endB) && new Date(startB) < new Date(endA);
};

module.exports = {
  calculateNights,
  toMidnightUTC,
  getCancellationInfo,
  datesOverlap,
};
