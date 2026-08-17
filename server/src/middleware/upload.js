import multer from "multer";

/**
 * Multer upload middleware using memoryStorage.
 *
 * Why memoryStorage?
 * Files land in `req.file.buffer` — never touch the filesystem.
 * This is required for streaming directly to Cloudinary and works
 * correctly on serverless/containerised environments with ephemeral disks.
 *
 * Validation layers (defense in depth):
 *   1. fileFilter  — checks MIME type reported by the browser (fast, first line of defence)
 *   2. limits.fileSize — multer hard-caps the byte stream (prevents OOM before the service runs)
 *   3. resumeService — re-validates MIME type and extension server-side (the authoritative check)
 */

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const fileFilter = (_req, file, cb) => {
  if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error(
      "Invalid file type. Only PDF and DOCX files are accepted."
    );
    error.statusCode = 400;
    cb(error, false);
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter,
});

/**
 * Wraps multer's single-field upload to convert its callback-style errors
 * into Express-compatible next(err) calls so the global error handler catches them.
 *
 * Multer's LIMIT_FILE_SIZE error has no statusCode by default — we attach one here.
 */
export const uploadSingle = (req, res, next) => {
  upload.single("resume")(req, res, (err) => {
    if (!err) return next();

    if (err.code === "LIMIT_FILE_SIZE") {
      err.message = "File is too large. Maximum allowed size is 5 MB.";
      err.statusCode = 400;
    } else if (!err.statusCode) {
      err.statusCode = 400;
    }

    next(err);
  });
};
