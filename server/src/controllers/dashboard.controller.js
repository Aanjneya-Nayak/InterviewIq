import * as dashboardService from "../services/dashboard.service.js";

/**
 * dashboard.controller.js — Phase 8.1: Dashboard Analytics
 *
 * Thin orchestration layer — delegates entirely to dashboard.service.
 * No DB queries or business logic here.
 *
 * All routes are protected by the `protect` middleware mounted at the router
 * level in dashboard.routes.js, so req.user is always available here.
 */

const VALID_RANGES = new Set(["7d", "30d", "90d"]);

/**
 * GET /api/dashboard/overview
 *
 * Returns aggregated metrics for the authenticated user:
 *   - Interview counts by status
 *   - Question counts (generated / answered / skipped)
 *   - Interview completion rate
 *   - Total practice time in seconds
 *   - Resume overall score and ATS score (null if no analysis)
 *
 * 200 — overview object (always succeeds; empty data → zero values)
 */
export const getOverview = async (req, res, next) => {
  try {
    const overview = await dashboardService.getOverview(
      req.user._id.toString()
    );
    res.status(200).json({ success: true, overview });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/activity
 *
 * Returns per-day activity for the authenticated user.
 *
 * Query parameters:
 *   range (optional): "7d" | "30d" | "90d" — defaults to "7d"
 *
 * 200 — array of daily activity objects covering every day in the range
 * 400 — invalid range value
 */
export const getActivity = async (req, res, next) => {
  try {
    const { range = "7d" } = req.query;

    if (!VALID_RANGES.has(range)) {
      const err = new Error(
        `Invalid range parameter. Must be one of: ${[...VALID_RANGES].join(", ")}.`
      );
      err.statusCode = 400;
      return next(err);
    }

    const activity = await dashboardService.getActivity(
      req.user._id.toString(),
      range
    );
    res.status(200).json({ success: true, range, activity });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/recent-interviews
 *
 * Returns the 5 most recently created interview sessions for the authenticated
 * user, sorted newest first with only dashboard-relevant fields.
 *
 * 200 — array of up to 5 session objects (empty array if none)
 */
export const getRecentInterviews = async (req, res, next) => {
  try {
    const interviews = await dashboardService.getRecentInterviews(
      req.user._id.toString()
    );
    res.status(200).json({ success: true, interviews });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/progress
 *
 * Returns real progression statistics calculated from actual interview activity:
 *   - currentStreak   — consecutive practice days ending today or yesterday
 *   - longestStreak   — all-time longest consecutive practice day run
 *   - activeDays      — distinct practice days in the last 30 days
 *   - practiceDays    — all-time distinct practice days
 *   - interviewsThisWeek  — completed interviews in the current UTC week
 *   - interviewsThisMonth — completed interviews in the current UTC month
 *
 * 200 — progress object (zero values for new users)
 */
export const getProgress = async (req, res, next) => {
  try {
    const progress = await dashboardService.getProgress(
      req.user._id.toString()
    );
    res.status(200).json({ success: true, progress });
  } catch (err) {
    next(err);
  }
};
