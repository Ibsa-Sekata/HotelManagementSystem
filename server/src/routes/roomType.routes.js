/**
 * roomType.routes.js — Routes for room type catalog management
 *
 * Route map:
 *   GET    /api/v1/room-types                      Public  — list active types
 *   GET    /api/v1/room-types/:id                  Public  — get one type
 *   POST   /api/v1/room-types                      Manager/Admin — create
 *   PATCH  /api/v1/room-types/:id                  Manager/Admin — update / deactivate
 *   POST   /api/v1/room-types/:id/images           Manager/Admin — upload photo
 *   DELETE /api/v1/room-types/:id/images/:imgId    Manager/Admin — remove photo
 *
 * Middleware stack (consistent with auth.routes.js pattern):
 *   Public:         controller
 *   Staff-only:     protect → authorize → [rules] → validate → controller
 *   File upload:    protect → authorize → upload.single('image') → [rules] → validate → controller
 */

const express    = require('express');
const protect    = require('../middleware/auth.middleware');
const authorize  = require('../middleware/role.middleware');
const validate   = require('../middleware/validate.middleware');
const upload     = require('../middleware/upload.middleware');
const {
  createRoomTypeRules,
  updateRoomTypeRules,
  addImageRules,
} = require('../validators/roomType.validators');
const roomTypeController = require('../controllers/roomType.controller');

const router = express.Router();

// ─── Public routes ─────────────────────────────────────────────────────────────
router.get('/',    roomTypeController.getAll);
router.get('/:id', roomTypeController.getOne);

// ─── Staff routes (manager or admin) ───────────────────────────────────────────
router.post(
  '/',
  protect,
  authorize('manager', 'admin'),
  createRoomTypeRules,
  validate,
  roomTypeController.create
);

router.patch(
  '/:id',
  protect,
  authorize('manager', 'admin'),
  updateRoomTypeRules,
  validate,
  roomTypeController.update
);

// ─── Image management ──────────────────────────────────────────────────────────
router.post(
  '/:id/images',
  protect,
  authorize('manager', 'admin'),
  upload.single('image'),
  addImageRules,
  validate,
  roomTypeController.addImage
);

router.delete(
  '/:id/images/:imgId',
  protect,
  authorize('manager', 'admin'),
  roomTypeController.removeImage
);

module.exports = router;
