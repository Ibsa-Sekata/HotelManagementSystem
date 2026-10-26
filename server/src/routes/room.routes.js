/**
 * room.routes.js — Routes for individual physical rooms
 *
 * Route map:
 *   GET   /api/v1/rooms/available     Public  — search available rooms by dates/guests
 *   GET   /api/v1/rooms               Staff   — list all rooms with status
 *   GET   /api/v1/rooms/:id           Staff   — get a single room
 *   POST  /api/v1/rooms               Manager/Admin — create a room
 *   PATCH /api/v1/rooms/:id           Manager/Admin — update / deactivate a room
 *
 * IMPORTANT: /available MUST be registered before /:id
 * If /:id is registered first, Express would interpret "available" as an ID
 * and call getOne('available') which would fail with a CastError.
 */

const express   = require('express');
const protect   = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const validate  = require('../middleware/validate.middleware');
const {
  createRoomRules,
  updateRoomRules,
  searchRoomsRules,
} = require('../validators/room.validators');
const roomController = require('../controllers/room.controller');

const router = express.Router();

// ─── Public route: must come before /:id ──────────────────────────────────────
router.get('/available', searchRoomsRules, validate, roomController.searchAvailable);

// ─── Staff-only routes ─────────────────────────────────────────────────────────
router.get('/',    protect, authorize('receptionist', 'manager', 'admin'), roomController.getAll);
router.get('/:id', protect, authorize('receptionist', 'manager', 'admin'), roomController.getOne);

// ─── Manager/admin routes ──────────────────────────────────────────────────────
router.post(
  '/',
  protect,
  authorize('manager', 'admin'),
  createRoomRules,
  validate,
  roomController.create
);

router.patch(
  '/:id',
  protect,
  authorize('manager', 'admin'),
  updateRoomRules,
  validate,
  roomController.update
);

module.exports = router;
