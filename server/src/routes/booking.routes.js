const express = require('express');
const protect = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const controller = require('../controllers/booking.controller');
const { dateRules, listBookingRules } = require('../validators/booking.validators');

const router = express.Router();
router.use(protect);
router.post('/', dateRules, validate, controller.create);
router.get('/my', listBookingRules, validate, controller.getMine);
router.get('/', authorize('receptionist', 'manager', 'admin'), listBookingRules, validate, controller.getAll);
router.get('/:id', controller.getOne);
router.patch('/:id/cancel', controller.cancel);
router.patch('/:id/checkin', authorize('receptionist', 'manager', 'admin'), controller.checkIn);
router.patch('/:id/checkout', authorize('receptionist', 'manager', 'admin'), controller.checkOut);

module.exports = router;
