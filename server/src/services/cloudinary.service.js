/**
 * cloudinary.service.js — Image upload and delete helpers
 *
 * Wraps the Cloudinary SDK so controllers never call the SDK directly.
 * Provides a clean fallback to placeholder images when Cloudinary is not
 * configured (during local development without credentials).
 *
 * Two exported functions:
 *
 *   uploadRoomImage(fileBuffer, originalName)
 *     → { url, publicId }     — from Cloudinary, or a placeholder if not configured
 *
 *   deleteRoomImage(publicId)
 *     → void                  — deletes from Cloudinary, or no-ops on placeholder
 *
 * Usage in controller:
 *   const { url, publicId } = await uploadRoomImage(req.file.buffer, req.file.originalname);
 *   roomType.images.push({ url, publicId, caption: req.body.caption });
 */

const { cloudinary } = require('../config/cloudinary');
const logger = require('../utils/logger');

/** Returns true if Cloudinary SDK is properly configured. */
const isConfigured = () => {
  const cfg = cloudinary.config();
  return !!(cfg.cloud_name && cfg.api_key && cfg.api_secret);
};

/**
 * Upload a room image.
 *
 * @param {Buffer} buffer          — file buffer from multer (memoryStorage)
 * @param {string} originalName    — original file name (used for the public_id prefix)
 * @returns {Promise<{ url: string, publicId: string|null }>}
 */
const uploadRoomImage = async (buffer, originalName) => {
  if (!isConfigured()) {
    // Return a deterministic placeholder based on the file name
    const label = encodeURIComponent(
      originalName.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
    );
    return {
      url: `https://placehold.co/800x500/1a3c5e/ffffff?text=${label}`,
      publicId: null,
    };
  }

  // Upload to Cloudinary via a stream (avoids writing temp files to disk)
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder:           'hotel_management/rooms',
        allowed_formats:  ['jpg', 'jpeg', 'png', 'webp'],
        transformation:   [{ width: 1200, height: 800, crop: 'limit', quality: 'auto' }],
      },
      (error, result) => {
        if (error) {
          logger.error(`Cloudinary upload failed: ${error.message}`);
          return reject(error);
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    uploadStream.end(buffer);
  });
};

/**
 * Delete a room image from Cloudinary.
 * Silently succeeds if publicId is null (placeholder image) or Cloudinary is not configured.
 *
 * @param {string|null} publicId — the Cloudinary public_id stored with the image
 */
const deleteRoomImage = async (publicId) => {
  if (!publicId || !isConfigured()) return;

  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    // Log but do not throw — a failed Cloudinary delete should not break the request
    logger.warn(`Cloudinary delete failed for ${publicId}: ${err.message}`);
  }
};

module.exports = { uploadRoomImage, deleteRoomImage };
