/**
 * upload.middleware.js — Multer configuration for image uploads
 *
 * Multer is a Node.js middleware for handling multipart/form-data (file uploads).
 * We use in-memory storage (the file buffer is passed directly to Cloudinary)
 * rather than saving files to disk.
 *
 * Restrictions:
 *   - Accepted formats: JPEG, JPG, PNG, WEBP
 *   - Maximum file size: 5MB
 *   - Field name expected in form body: "image"
 *
 * Usage in a route:
 *   const upload = require('../middleware/upload.middleware');
 *   router.post('/:id/images', protect, authorize('manager', 'admin'), upload.single('image'), controller);
 */

const multer = require('multer');
const ApiError = require('../utils/ApiError');

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const storage = multer.memoryStorage(); // keep file in memory, pass buffer to Cloudinary

const fileFilter = (req, file, cb) => {
  if (ACCEPTED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      ApiError.badRequest(
        'Invalid file type. Only JPEG, PNG, and WEBP images are accepted.'
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE_BYTES },
});

module.exports = upload;
