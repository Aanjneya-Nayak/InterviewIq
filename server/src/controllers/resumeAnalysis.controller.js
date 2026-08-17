import * as resumeAnalysisService from "../services/resumeAnalysis.service.js";

/**
 * resumeAnalysis.controller.js
 *
 * Thin orchestration layer — delegates entirely to resumeAnalysis.service.
 * No business logic, no AI calls, no DB queries here.
 */

/**
 * POST /api/resume/analyze
 * Trigger AI analysis of the authenticated user's current resume.
 *
 * 200 — analysis returned (new or freshly computed)
 * 400 — resume has no extractable text (scanned image / blank file)
 * 404 — user has no resume on file
 * 429 — Gemini rate limit hit
 * 502 — AI returned invalid JSON or network failure
 * 503 — Gemini API key missing / auth error
 * 504 — request timed out
 */
export const analyzeResume = async (req, res, next) => {
  try {
    const analysis = await resumeAnalysisService.analyzeResume(
      req.user._id.toString()
    );

    res.status(200).json({
      success: true,
      message: "Resume analysed successfully.",
      analysis,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/resume/analysis
 * Retrieve the most recent analysis without triggering a new one.
 *
 * 200 + analysis — analysis exists
 * 200 + null     — no analysis has been run yet
 */
export const getAnalysis = async (req, res, next) => {
  try {
    const analysis = await resumeAnalysisService.getAnalysis(
      req.user._id.toString()
    );

    res.status(200).json({
      success: true,
      analysis: analysis ?? null,
    });
  } catch (err) {
    next(err);
  }
};
