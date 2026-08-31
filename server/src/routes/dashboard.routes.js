import { Router } from "express";
import {
  getOverview,
  getActivity,
  getRecentInterviews,
  getProgress,
} from "../controllers/dashboard.controller.js";
import protect from "../middleware/protect.js";

const router = Router();

/**
 * All dashboard routes require authentication.
 * protect is applied at the router level — every handler below has req.user set.
 */
router.use(protect);

/**
 * GET /api/dashboard/overview
 * Aggregated session and resume metrics for the authenticated user.
 */
router.get("/overview", getOverview);

/**
 * GET /api/dashboard/activity
 * Per-day activity breakdown.
 * Optional query param: ?range=7d | 30d | 90d  (default: 7d)
 */
router.get("/activity", getActivity);

/**
 * GET /api/dashboard/recent-interviews
 * Latest 5 interview sessions, newest first.
 */
router.get("/recent-interviews", getRecentInterviews);

/**
 * GET /api/dashboard/progress
 * Streak and progression statistics derived from real practice activity.
 */
router.get("/progress", getProgress);

export default router;
