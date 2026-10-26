/**
 * cloudinary.js — Cloudinary SDK configuration
 *
 * Cloudinary is a cloud service that stores and serves images.
 * We upload room photos here so we don't store large files on our own server.
 *
 * If Cloudinary credentials are not set (e.g. during early development),
 * the upload service will fall back to a placeholder image URL instead of
 * throwing an error. This lets us build and test everything else without
 * needing a Cloudinary account immediately.
 */

const cloudinary = require('cloudinary').v2;

const configureCloudinary = () => {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    // Not fatal — the system will use placeholder images instead
    console.warn(
      '[Cloudinary] Credentials not set. Image uploads will use placeholder URLs. ' +
      'Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET to enable uploads.'
    );
    return false;
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });

  return true;
};

module.exports = { cloudinary, configureCloudinary };
