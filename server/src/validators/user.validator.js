import { body, validationResult } from "express-validator";

/**
 * user.validator.js
 *
 * Validation rules for the user profile endpoints.
 * Only name and targetRole can be updated — email changes are not supported.
 */

export const validateUpdateProfile = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),

  body("targetRole")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage("Target role cannot exceed 100 characters"),
];

/**
 * Reads express-validator results and responds with a structured 422
 * if any rule failed. Mirrors the pattern used across all other validators.
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
