import { Router } from "express";
import {
  uploadResume,
  getResume,
  replaceResume,
  deleteResume,
  getResumeHistory,
} from "../controllers/resumeController.js";
import {
  analyzeResume,
  getAnalysis,
} from "../controllers/resumeAnalysis.controller.js";
import protect from "../middleware/protect.js";
import { uploadSingle } from "../middleware/upload.js";
import { validateFilePresent } from "../validators/resumeValidator.js";

const router = Router();

/**
 * All resume routes require authentication.
 * protect is applied at the router level so it runs before every handler below.
 */
router.use(protect);

/**
 * POST /api/resume/upload
 * Upload a resume for the first time.
 * Pipeline: authenticate → parse multipart file → validate file present → controller
 */
router.post("/upload", uploadSingle, validateFilePresent, uploadResume);

/**
 * GET /api/resume
 * Retrieve the authenticated user's resume metadata.
 */
router.get("/", getResume);

/**
 * PUT /api/resume/replace
 * Replace an existing resume with a new file.
 * Uses the same upload pipeline as POST /upload.
 */
router.put("/replace", uploadSingle, validateFilePresent, replaceResume);

/**
 * DELETE /api/resume
 * Remove the authenticated user's resume.
 */
router.delete("/", deleteResume);

/**
 * POST /api/resume/analyze
 * Trigger AI analysis of the authenticated user's current resume.
 * Returns the full analysis object on success.
 */
router.post("/analyze", analyzeResume);

/**
 * GET /api/resume/history
 * Last 5 resume uploads for the authenticated user.
 */
router.get("/history", getResumeHistory);

/**
 * GET /api/resume/analysis
 * Retrieve the most recent stored analysis without re-running Gemini.
 * Returns null if no analysis has been run yet.
 */
router.get("/analysis", getAnalysis);

export default router;
