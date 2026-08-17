import Resume from "../models/Resume.js";
import ResumeHistory from "../models/ResumeHistory.js";
import * as cloudinaryService from "./cloudinary.service.js";
import { extractTextFromBuffer } from "../utils/extractResumeText.js";

/**
 * Resume service — business logic layer.
 *
 * Responsibilities:
 *   - Validate the incoming file (MIME type, extension, size).
 *   - Coordinate Cloudinary uploads and deletions via cloudinary.service.js.
 *   - Persist and manage Resume documents in MongoDB.
 *   - Surface meaningful, HTTP-aware errors to the controller.
 *
 * What this module deliberately does NOT do:
 *   - Touch the Cloudinary SDK directly (that's cloudinary.service.js).
 *   - Shape HTTP responses (that's resumeController.js).
 *   - Parse the request object (controllers extract req.user / req.file first).
 *
 * ─── Upload flow ──────────────────────────────────────────────────────────────
 *
 *  POST /api/resume/upload  (first time)
 *  ┌──────────┐     ┌─────────────┐     ┌───────────────┐     ┌──────────────┐
 *  │ protect  │────▶│ uploadSingle│────▶│validateFile   │────▶│ Cloudinary   │
 *  │(JWT auth)│     │  (Multer)   │     │(MIME+ext+size)│     │ upload_stream│
 *  └──────────┘     └─────────────┘     └───────────────┘     └──────┬───────┘
 *                                                                      │ result
 *                                                                ┌─────▼──────┐
 *                                                                │  MongoDB   │
 *                                                                │  upsert    │
 *                                                                └─────┬──────┘
 *                                                                      │ resume doc
 *                                                                ┌─────▼──────┐
 *                                                                │  201 JSON  │
 *                                                                └────────────┘
 *
 *  PUT /api/resume/replace  (replace existing)
 *  Same pipeline, but before the MongoDB upsert:
 *    - New file is uploaded to Cloudinary first (overwrite: true handles same publicId).
 *    - If the stored publicId differs from the new one (legacy data guard),
 *      the old Cloudinary asset is deleted explicitly.
 *
 *  DELETE /api/resume
 *    1. Find the Resume document.
 *    2. Delete the Cloudinary asset (non-fatal on failure).
 *    3. Delete the MongoDB document.
 */

// ─────────────────────────────────────────────────────────────────────────────
// File validation (authoritative server-side check)
// ─────────────────────────────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const ALLOWED_EXTENSIONS = new Set(["pdf", "docx"]);

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Validates file MIME type, extension, and size.
 *
 * Three-layer defence:
 *   Layer 1 — Multer fileFilter (upload.js): rejects non-PDF/DOCX at stream time.
 *   Layer 2 — Multer limits.fileSize (upload.js): rejects oversized files early.
 *   Layer 3 — validateFile (here): authoritative check; MIME can be spoofed by clients.
 *
 * @param {Express.Multer.File} file
 * @throws {Error} with statusCode 400 on any violation
 */
const validateFile = (file) => {
  if (!file) {
    const err = new Error("No file provided. Please select a file to upload.");
    err.statusCode = 400;
    throw err;
  }

  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    const err = new Error(
      "Invalid file type. Only PDF and DOCX files are accepted."
    );
    err.statusCode = 400;
    throw err;
  }

  const ext = file.originalname.split(".").pop().toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    const err = new Error(
      "Invalid file extension. Only .pdf and .docx files are accepted."
    );
    err.statusCode = 400;
    throw err;
  }

  if (file.size > MAX_SIZE_BYTES) {
    const err = new Error("File is too large. Maximum allowed size is 5 MB.");
    err.statusCode = 400;
    throw err;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Public service methods
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Upload a new resume or replace an existing one.
 *
 * Uses a deterministic publicId (`userId`) so each user occupies exactly one
 * slot in Cloudinary. The `overwrite: true` option in cloudinary.service handles
 * in-place replacement — no orphaned assets accumulate on re-upload.
 *
 * Replace guard: if a previous Resume document stores a different publicId
 * (possible with legacy data), the old asset is deleted explicitly after the
 * new upload succeeds. We upload first so a Cloudinary failure never leaves
 * the user without a resume.
 *
 * @param {string}                userId - MongoDB ObjectId of the authenticated user
 * @param {Express.Multer.File}   file   - File object from Multer memoryStorage
 * @returns {Promise<Resume>}            - The upserted Resume document
 */
export const uploadResume = async (userId, file) => {
  // Step 1 — validate file before touching any external service
  validateFile(file);

  // Step 2 — extract plain text from the in-memory buffer now.
  // Persisting it in the DB means analysis never needs to re-download from
  // Cloudinary — the service reads resume.parsedText directly.
  // Throws 400 (empty/scanned) or 415 (unsupported type) on failure.
  const parsedText = await extractTextFromBuffer({
    buffer: file.buffer,
    mimeType: file.mimetype,
  });

  // Step 3 — check for an existing resume (needed for the replace guard below)
  const existing = await Resume.findOne({ user: userId });

  // Step 4 — upload to Cloudinary
  // Throws a 502 error if Cloudinary is unreachable or rejects the file.
  const result = await cloudinaryService.uploadResume(
    file.buffer,
    userId.toString()
  );

  // Step 5 — replace guard: delete the old asset if its publicId differs.
  // With deterministic publicIds this should never trigger, but it protects
  // against any legacy Resume documents that stored a different publicId.
  if (existing && existing.publicId && existing.publicId !== result.public_id) {
    await cloudinaryService.deleteResume(existing.publicId);
  }

  // Step 6 — upsert the Resume document in MongoDB, including the parsed text.
  // { new: true } returns the updated document; { upsert: true } creates it
  // if this is the user's first upload.
  const resume = await Resume.findOneAndUpdate(
    { user: userId },
    {
      user: userId,
      originalFileName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      publicId: result.public_id,
      secureUrl: result.secure_url,
      resourceType: result.resource_type,
      uploadedAt: new Date(),
      parsedText,
    },
    { new: true, upsert: true, runValidators: true }
  );

  // Step 7 — append a history snapshot (non-fatal if it fails).
  try {
    await ResumeHistory.create({
      user: userId,
      originalFileName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      secureUrl: result.secure_url,
      uploadedAt: new Date(),
    });
  } catch (err) {
    console.error("[resumeService] Failed to write history entry:", err.message);
  }

  return resume;
};

/**
 * Fetch the current user's resume metadata.
 * Returns null if no resume has been uploaded yet.
 *
 * @param {string} userId
 * @returns {Promise<Resume|null>}
 */
export const getResume = async (userId) => {
  return Resume.findOne({ user: userId });
};

/**
 * Fetch the last `limit` resume upload history entries for a user.
 *
 * @param {string} userId
 * @param {number} limit  - Max entries to return (default 5)
 * @returns {Promise<ResumeHistory[]>}
 */
export const getResumeHistory = async (userId, limit = 5) => {
  return ResumeHistory.find({ user: userId })
    .sort({ uploadedAt: -1 })
    .limit(limit)
    .lean();
};

/**
 * Delete a user's resume — removes the Cloudinary asset then the DB document.
 *
 * Order matters: we attempt Cloudinary deletion first. If it fails, the error
 * is logged but not thrown (see cloudinary.service.deleteResume). We always
 * proceed to delete the MongoDB document so the user isn't left with a broken
 * record pointing to a non-existent or inaccessible file.
 *
 * @param {string} userId
 * @throws {Error} with statusCode 404 if no resume exists for the user
 */
export const deleteResume = async (userId) => {
  const resume = await Resume.findOne({ user: userId });

  if (!resume) {
    const err = new Error("No resume found to delete.");
    err.statusCode = 404;
    throw err;
  }

  // Step 1 — delete from Cloudinary (non-fatal; see cloudinary.service.js)
  if (resume.publicId) {
    await cloudinaryService.deleteResume(resume.publicId);
  }

  // Step 2 — delete from MongoDB
  await resume.deleteOne();
};
