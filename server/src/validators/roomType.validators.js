/**
 * roomType.validators.js — Validation rules for room type endpoints
 *
 * Follows the same pattern as auth.validators.js:
 *   - body() chains from express-validator
 *   - .trim() before .notEmpty() on all strings
 *   - .optional() for partial-update rules
 *   - .custom() for cross-field or complex logic
 */

const { body } = require('express-validator');

// ─── Create room type ─────────────────────────────────────────────────────────
const createRoomTypeRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Room type name is required')
    .isLength({ max: 100 }).withMessage('Room type name cannot exceed 100 characters'),

  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),

  body('basePrice')
    .notEmpty().withMessage('Base price is required')
    .isFloat({ min: 0 }).withMessage('Base price must be a non-negative number'),

  body('capacity')
    .notEmpty().withMessage('Capacity is required')
    .isInt({ min: 1, max: 20 }).withMessage('Capacity must be between 1 and 20'),

  body('amenities')
    .optional()
    .isArray().withMessage('Amenities must be an array')
    .custom((arr) => arr.every((a) => typeof a === 'string' && a.trim().length > 0))
    .withMessage('Each amenity must be a non-empty string'),

  body('minStay')
    .optional()
    .isInt({ min: 1 }).withMessage('Minimum stay must be at least 1 night'),

  body('bedConfiguration')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Bed configuration cannot exceed 100 characters'),

  body('sizeSqm')
    .optional()
    .isFloat({ min: 0 }).withMessage('Room size must be a non-negative number'),
];

// ─── Update room type ─────────────────────────────────────────────────────────
const updateRoomTypeRules = [
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Room type name cannot be empty')
    .isLength({ max: 100 }).withMessage('Room type name cannot exceed 100 characters'),

  body('description')
    .optional()
    .trim()
    .notEmpty().withMessage('Description cannot be empty')
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),

  body('basePrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Base price must be a non-negative number'),

  body('capacity')
    .optional()
    .isInt({ min: 1, max: 20 }).withMessage('Capacity must be between 1 and 20'),

  body('amenities')
    .optional()
    .isArray().withMessage('Amenities must be an array')
    .custom((arr) => arr.every((a) => typeof a === 'string' && a.trim().length > 0))
    .withMessage('Each amenity must be a non-empty string'),

  body('minStay')
    .optional()
    .isInt({ min: 1 }).withMessage('Minimum stay must be at least 1 night'),

  body('bedConfiguration')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Bed configuration cannot exceed 100 characters'),

  body('sizeSqm')
    .optional()
    .isFloat({ min: 0 }).withMessage('Room size must be a non-negative number'),

  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean'),
];

// ─── Add image caption (used when uploading an image) ─────────────────────────
const addImageRules = [
  body('caption')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Caption cannot exceed 200 characters'),
];

module.exports = {
  createRoomTypeRules,
  updateRoomTypeRules,
  addImageRules,
};
