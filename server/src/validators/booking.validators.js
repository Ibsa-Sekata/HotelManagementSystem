const { body, query } = require('express-validator');

const dateRules = [
  body('checkIn').isISO8601().withMessage('checkIn must be a valid date'),
  body('checkOut')
    .isISO8601().withMessage('checkOut must be a valid date')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.checkIn)) throw new Error('checkOut must be after checkIn');
      return true;
    }),
  body('roomType').isMongoId().withMessage('Invalid room type ID'),
  body('adults').isInt({ min: 1, max: 20 }).withMessage('Adults must be between 1 and 20'),
  body('children').optional().isInt({ min: 0, max: 20 }),
  body('specialRequests').optional().trim().isLength({ max: 500 }),
];

const listBookingRules = [
  query('status').optional().isIn(['confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show']),
];

module.exports = { dateRules, listBookingRules };
