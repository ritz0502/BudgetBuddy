// backend/config/cloudinary.js
const multer = require('multer');

// Cloudinary is optional — only configure it if all 3 env vars are set
const hasCloudinaryConfig =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

let cloudinary = null;
let upload;

if (hasCloudinaryConfig) {
  const cloudinaryPkg = require('cloudinary').v2;
  const { CloudinaryStorage } = require('multer-storage-cloudinary');

  cloudinaryPkg.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  cloudinary = cloudinaryPkg;

  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'budgetbuddy/receipts',
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    },
  });

  upload = multer({ storage });
  console.log('Cloudinary storage: ENABLED');
} else {
  // No Cloudinary credentials — use memory storage, receiptUrl will be null
  upload = multer({ storage: multer.memoryStorage() });
  console.log('Cloudinary storage: DISABLED (no credentials) — receipts will not be saved');
}

module.exports = { cloudinary, upload };
