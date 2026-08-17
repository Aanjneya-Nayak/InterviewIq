import streamifier from "streamifier";
import cloudinary from "../config/cloudinary.js";

/**
 * Cloudinary service — all SDK interactions live here.
 *
 * Why isolate this into its own module?
 * - resumeService handles business rules (validate, upsert, error messages).
 * - cloudinary.service handles transport (stream to Cloudinary, destroy asset).
 * - Keeping them separate makes it trivial to swap storage providers later
 *   without touching any business logic.
 *
 * Why upload_stream + streamifier instead of base64?
 * - Base64 encoding inflates payload size by ~33%, wasting memory and bandwidth.
 * - upload_stream accepts a Node.js Readable, so we convert the Multer buffer
 *   (req.file.buffer) to a stream with streamifier and pipe it directly.
 * - No temporary files are ever written to disk.
 *
 * Folder / publicId strategy:
 * - Folder : "InterviewIQ/resumes"
 * - publicId: "<userId>"   (one deterministic slot per user)
 * - overwrite: true        (replace-in-place — no orphaned assets accumulate)
 * - resource_type: "raw"   (required for PDF and DOCX; "image" would corrupt them)
 */

const FOLDER = "InterviewIQ/resumes";

// ─────────────────────────────────────────────────────────────────────────────
// uploadResume
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Streams a Multer buffer to Cloudinary and returns the upload result.
 *
 * @param {Buffer} buffer      - req.file.buffer from Multer memoryStorage
 * @param {string} userId      - MongoDB ObjectId string; used as publicId
 * @returns {Promise<object>}  - Cloudinary upload result
 *                               { public_id, secure_url, resource_type, ... }
 *
 * Throws a structured error (statusCode 502) if Cloudinary rejects the upload,
 * so the global error handler can surface a meaningful response to the client.
 */
export const uploadResume = (buffer, userId) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw", // PDF / DOCX must use "raw" — never "image" or "auto"
        folder: FOLDER,
        public_id: userId, // Deterministic: one asset slot per user
        overwrite: true, // Replace-in-place on re-upload
        use_filename: false, // publicId is our key, not the original filename
        unique_filename: false, // No random suffix — we control the publicId
      },
      (error, result) => {
        if (error) {
          const err = new Error(
            "Failed to upload file to storage. Please try again."
          );
          err.statusCode = 502;
          err.cause = error; // Preserve original Cloudinary error for server logs
          return reject(err);
        }
        resolve(result);
      }
    );

    // Convert the in-memory buffer to a Readable stream and pipe into Cloudinary.
    // streamifier.createReadStream is the standard pattern for this — it handles
    // all the Node.js stream lifecycle boilerplate correctly.
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// deleteResume
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Deletes a Cloudinary asset by its publicId.
 *
 * @param {string} publicId - The Cloudinary public_id stored in the Resume document
 * @returns {Promise<void>}
 *
 * resource_type "raw" must match the upload resource_type exactly —
 * Cloudinary treats "raw", "image", and "video" as separate namespaces.
 *
 * Error handling strategy: log and swallow.
 * We never want a Cloudinary failure to block a DB delete. The asset may
 * already be gone (manually deleted, expired, etc.). The MongoDB document
 * is the source of truth for the user; the Cloudinary asset is derived storage.
 * Orphaned assets can be cleaned up via Cloudinary's admin API if needed.
 */
export const deleteResume = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
  } catch (err) {
    // Intentionally non-fatal — log for ops visibility, don't propagate
    console.error(
      `[cloudinary.service] Failed to delete asset "${publicId}":`,
      err.message
    );
  }
};
