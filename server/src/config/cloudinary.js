import { v2 as cloudinary } from "cloudinary";

/**
 * Cloudinary is configured once at module load.
 * Credentials come exclusively from environment variables — never hardcoded.
 * This module is imported by the resume service; nothing else needs to
 * know about the Cloudinary SDK directly.
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Always use HTTPS URLs
});

export default cloudinary;
