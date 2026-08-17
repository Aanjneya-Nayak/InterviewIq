import { validationResult } from "express-validator";

/**
 * Resume validation middleware.
 *
 * File content validation (MIME type, extension, size) is intentionally
 * handled in two places:
 *   1. upload.js (Multer fileFilter + limits) — fast, early rejection at the
 *      stream level before the buffer is fully read into memory.
 *   2. resumeService.js (validateFile) — authoritative server-side check
 *      because browser-reported MIME types can be spoofed.
 *
 * This module handles request-level checks: ensuring the multipart field
 * named "resume" is actually present before the request reaches the controller.
 */

/**
 * Validates that a file was attached to the request.
 * Multer populates req.file when a file is present; it is undefined otherwise.
 */
export const validateFilePresent = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: [
        {
          field: "resume",
          message:
            'No file attached. Send the file under the field name "resume".',
        },
      ],
    });
  }
  next();
};

/**
 * Reads express-validator results and responds with a structured 422
 * if any rule failed. Mirrors the pattern used in authValidator.js.
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};
