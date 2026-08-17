import { Router } from "express";
import {
  createInterview,
  getInterviews,
  getInterview,
  updateInterview,
  deleteInterview,
  startInterview,
  saveAnswer,
  updateProgress,
  getCurrentState,
  completeInterview,
  getInterviewSummary,
} from "../controllers/interview.controller.js";
import {
  validateCreateInterview,
  validateUpdateInterview,
  validateSaveAnswer,
  validateUpdateProgress,
  validateSessionId,
  handleValidationErrors,
} from "../validators/interview.validation.js";
import protect from "../middleware/protect.js";

const router = Router();

/** All interview routes require authentication. */
router.use(protect);

// ─── Phase 6 routes ───────────────────────────────────────────────────────────

/** POST /api/interviews — create session */
router.post(
  "/",
  ...validateCreateInterview,
  handleValidationErrors,
  createInterview
);

/** GET /api/interviews — list all sessions for current user */
router.get("/", getInterviews);

/** GET /api/interviews/:id — single session detail */
router.get("/:id", ...validateSessionId, handleValidationErrors, getInterview);

/** PATCH /api/interviews/:id — update status */
router.patch(
  "/:id",
  ...validateSessionId,
  ...validateUpdateInterview,
  handleValidationErrors,
  updateInterview
);

/** DELETE /api/interviews/:id — delete session */
router.delete(
  "/:id",
  ...validateSessionId,
  handleValidationErrors,
  deleteInterview
);

// ─── Phase 7 routes ───────────────────────────────────────────────────────────

/**
 * POST /api/interviews/:id/start
 * Generate AI questions and transition session to in_progress.
 * No additional body validation — session config was set at creation.
 */
router.post(
  "/:id/start",
  ...validateSessionId,
  handleValidationErrors,
  startInterview
);

/**
 * POST /api/interviews/:id/save-answer
 * Upsert an answer for one question; recalculates progress.
 */
router.post(
  "/:id/save-answer",
  ...validateSessionId,
  ...validateSaveAnswer,
  handleValidationErrors,
  saveAnswer
);

/**
 * PATCH /api/interviews/:id/progress
 * Update the currentQuestionIndex cursor (navigation, no answer saved).
 */
router.patch(
  "/:id/progress",
  ...validateSessionId,
  ...validateUpdateProgress,
  handleValidationErrors,
  updateProgress
);

/**
 * GET /api/interviews/:id/current
 * Return session with currentQuestion and currentAnswer convenience fields.
 */
router.get(
  "/:id/current",
  ...validateSessionId,
  handleValidationErrors,
  getCurrentState
);

/**
 * POST /api/interviews/:id/complete
 * Explicitly complete a session (supports partial completion).
 */
router.post(
  "/:id/complete",
  ...validateSessionId,
  handleValidationErrors,
  completeInterview
);

/**
 * GET /api/interviews/:id/summary
 * Return computed summary stats for the summary / completion page.
 */
router.get(
  "/:id/summary",
  ...validateSessionId,
  handleValidationErrors,
  getInterviewSummary
);

export default router;
