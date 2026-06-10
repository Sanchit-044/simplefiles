const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// Configure Cloudinary with your credentials from .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Tell multer to upload directly to Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "image-backend",       // folder name in your Cloudinary account
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    transformation: [{ quality: "auto" }], // auto-optimize quality
  },
});

const upload = multer({ storage });

module.exports = { upload, cloudinary };