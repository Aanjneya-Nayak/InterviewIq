import { body, param, validationResult } from "express-validator";
import {
  INTERVIEW_TYPES,
  DIFFICULTIES,
  QUESTION_COUNTS,
  STATUSES,
} from "../models/InterviewSession.js";

/**
 * interview.validation.js
 *
 * Validation middleware chains for all interview routes.
 * Phase 7 additions: validateSaveAnswer, validateUpdateProgress.
 */

// ─── Reusable field validators ────────────────────────────────────────────────

const interviewTypeField = body("interviewType")
  .trim()
  .notEmpty()
  .withMessage("Interview type is required")
  .isIn(INTERVIEW_TYPES)
  .withMessage(`Interview type must be one of: ${INTERVIEW_TYPES.join(", ")}`);

const difficultyField = body("difficulty")
  .trim()
  .notEmpty()
  .withMessage("Difficulty is required")
  .isIn(DIFFICULTIES)
  .withMessage(`Difficulty must be one of: ${DIFFICULTIES.join(", ")}`);

const targetRoleField = body("targetRole")
  .trim()
  .notEmpty()
  .withMessage("Target role is required")
  .isLength({ min: 2, max: 100 })
  .withMessage("Target role must be between 2 and 100 characters");

const questionCountField = body("questionCount")
  .notEmpty()
  .withMessage("Question count is required")
  .isInt()
  .withMessage("Question count must be an integer")
  .custom((val) => QUESTION_COUNTS.includes(Number(val)))
  .withMessage(`Question count must be one of: ${QUESTION_COUNTS.join(", ")}`);

// ─── Route-level validation chains ───────────────────────────────────────────

/** POST /api/interviews */
export const validateCreateInterview = [
  interviewTypeField,
  difficultyField,
  targetRoleField,
  questionCountField,
];

/** PATCH /api/interviews/:id */
export const validateUpdateInterview = [
  body("status")
    .trim()
    .notEmpty()
    .withMessage("Status is required")
    .isIn(STATUSES)
    .withMessage(`Status must be one of: ${STATUSES.join(", ")}`),
];

/**
 * POST /api/interviews/:id/save-answer
 *
 * questionId: required, non-empty string
 * answer    : required, string, 0–5000 chars
 *             (empty string is valid — user may save a blank and continue)
 */
export const validateSaveAnswer = [
  body("questionId")
    .trim()
    .notEmpty()
    .withMessage("questionId is required"),

  body("answer")
    .exists({ checkNull: true })
    .withMessage("answer field is required")
    .isString()
    .withMessage("answer must be a string")
    .isLength({ max: 5000 })
    .withMessage("Answer cannot exceed 5000 characters"),
];

/**
 * PATCH /api/interviews/:id/progress
 *
 * currentQuestionIndex: required integer >= 0
 */
export const validateUpdateProgress = [
  body("currentQuestionIndex")
    .notEmpty()
    .withMessage("currentQuestionIndex is required")
    .isInt({ min: 0 })
    .withMessage("currentQuestionIndex must be a non-negative integer"),
];

/** :id param on any session route */
export const validateSessionId = [
  param("id").isMongoId().withMessage("Invalid interview session ID"),
];

/** Reads express-validator results and short-circuits with 422 if any failed. */
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
