/**
 * room.validators.js — Validation rules for individual room endpoints
 */

const { body, query } = require('express-validator');

const VALID_STATUSES = ['available', 'occupied', 'dirty', 'maintenance', 'out_of_order'];

// ─── Create room ──────────────────────────────────────────────────────────────
const createRoomRules = [
  body('roomNumber')
    .trim()
    .notEmpty().withMessage('Room number is required')
    .isLength({ max: 10 }).withMessage('Room number cannot exceed 10 characters')
    .matches(/^[A-Za-z0-9]+$/).withMessage('Room number must be alphanumeric'),

  body('floor')
    .notEmpty().withMessage('Floor number is required')
    .isInt({ min: 0 }).withMessage('Floor must be a non-negative integer'),

  body('roomType')
    .notEmpty().withMessage('Room type is required')
    .isMongoId().withMessage('Invalid room type ID'),

  body('status')
    .optional()
    .isIn(VALID_STATUSES).withMessage(`Status must be one of: ${VALID_STATUSES.join(', ')}`),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
];

// ─── Update room ──────────────────────────────────────────────────────────────
const updateRoomRules = [
  body('roomNumber')
    .optional()
    .trim()
    .notEmpty().withMessage('Room number cannot be empty')
    .isLength({ max: 10 }).withMessage('Room number cannot exceed 10 characters')
    .matches(/^[A-Za-z0-9]+$/).withMessage('Room number must be alphanumeric'),

  body('floor')
    .optional()
    .isInt({ min: 0 }).withMessage('Floor must be a non-negative integer'),

  body('roomType')
    .optional()
    .isMongoId().withMessage('Invalid room type ID'),

  body('status')
    .optional()
    .isIn(VALID_STATUSES).withMessage(`Status must be one of: ${VALID_STATUSES.join(', ')}`),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),

  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean'),
];

// ─── Search / availability query params ───────────────────────────────────────
const searchRoomsRules = [
  query('checkIn')
    .optional()
    .isISO8601().withMessage('checkIn must be a valid ISO 8601 date (YYYY-MM-DD)')
    .custom((val) => {
      const d = new Date(val);
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      if (d < today) throw new Error('checkIn cannot be in the past');
      return true;
    }),

  query('checkOut')
    .optional()
    .isISO8601().withMessage('checkOut must be a valid ISO 8601 date (YYYY-MM-DD)')
    .custom((val, { req }) => {
      if (req.query.checkIn) {
        if (new Date(val) <= new Date(req.query.checkIn)) {
          throw new Error('checkOut must be after checkIn');
        }
      }
      return true;
    }),

  query('guests')
    .optional()
    .isInt({ min: 1, max: 20 }).withMessage('Guest count must be between 1 and 20'),

  query('minPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Minimum price must be non-negative'),

  query('maxPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Maximum price must be non-negative'),

  query('roomType')
    .optional()
    .isMongoId().withMessage('Invalid room type ID filter'),

  query('floor')
    .optional()
    .isInt({ min: 0 }).withMessage('Floor must be a non-negative integer'),
];

module.exports = {
  createRoomRules,
  updateRoomRules,
  searchRoomsRules,
};
