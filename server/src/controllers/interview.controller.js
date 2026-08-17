import * as interviewService from "../services/interview.service.js";

/**
 * interview.controller.js
 *
 * Thin orchestration layer — delegates entirely to interview.service.
 * Phase 7 additions: startInterview, saveAnswer, updateProgress, getCurrentState.
 */

// ─── Phase 6 controllers ──────────────────────────────────────────────────────

export const createInterview = async (req, res, next) => {
  try {
    const { interviewType, difficulty, targetRole, questionCount } = req.body;
    const session = await interviewService.createSession(req.user._id, {
      interviewType,
      difficulty,
      targetRole,
      questionCount,
    });
    res.status(201).json({
      success: true,
      message: "Interview session created successfully.",
      session,
    });
  } catch (err) {
    next(err);
  }
};

export const getInterviews = async (req, res, next) => {
  try {
    const sessions = await interviewService.getUserSessions(req.user._id);
    res.status(200).json({ success: true, sessions });
  } catch (err) {
    next(err);
  }
};

export const getInterview = async (req, res, next) => {
  try {
    const session = await interviewService.getSessionById(
      req.user._id,
      req.params.id
    );
    res.status(200).json({ success: true, session });
  } catch (err) {
    next(err);
  }
};

export const updateInterview = async (req, res, next) => {
  try {
    const session = await interviewService.updateSessionStatus(
      req.user._id,
      req.params.id,
      req.body.status
    );
    res.status(200).json({
      success: true,
      message: "Interview session updated successfully.",
      session,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteInterview = async (req, res, next) => {
  try {
    await interviewService.deleteSession(req.user._id, req.params.id);
    res.status(200).json({
      success: true,
      message: "Interview session deleted successfully.",
    });
  } catch (err) {
    next(err);
  }
};

// ─── Phase 7 controllers ──────────────────────────────────────────────────────

/**
 * POST /api/interviews/:id/start
 *
 * Generates AI questions via Gemini and transitions the session to in_progress.
 *
 * 200 — session with questions populated
 * 400 — session not in draft / prerequisites missing
 * 502 — Gemini returned invalid JSON
 * 503 — Gemini API key missing
 * 504 — Gemini request timed out
 */
export const startInterview = async (req, res, next) => {
  try {
    const session = await interviewService.startSession(
      req.user._id,
      req.params.id
    );
    res.status(200).json({
      success: true,
      message: "Interview started. Questions generated successfully.",
      session,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/interviews/:id/save-answer
 *
 * Upserts an answer for one question. Returns updated progress.
 *
 * 200 — answer saved, progress recalculated
 * 400 — session not in_progress
 * 404 — questionId not found in session
 * 422 — validation failed
 */
export const saveAnswer = async (req, res, next) => {
  try {
    const { questionId, answer } = req.body;
    const { session, progress, isCompleted } =
      await interviewService.saveAnswer(
        req.user._id,
        req.params.id,
        questionId,
        answer
      );
    res.status(200).json({
      success: true,
      message: isCompleted
        ? "Answer saved. Interview completed!"
        : "Answer saved.",
      progress,
      isCompleted,
      session,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/interviews/:id/progress
 *
 * Saves the currentQuestionIndex cursor (navigation, no answer).
 *
 * 200 — index updated
 * 400 — session not in_progress or index out of bounds
 * 422 — validation failed
 */
export const updateProgress = async (req, res, next) => {
  try {
    const session = await interviewService.updateProgress(
      req.user._id,
      req.params.id,
      req.body.currentQuestionIndex
    );
    res.status(200).json({
      success: true,
      message: "Progress updated.",
      currentQuestionIndex: session.currentQuestionIndex,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/interviews/:id/current
 *
 * Returns the session with the currentQuestion and currentAnswer fields injected.
 *
 * 200 — session + currentQuestion + currentAnswer
 * 404 — session not found or not owned
 */
export const getCurrentState = async (req, res, next) => {
  try {
    const state = await interviewService.getCurrentState(
      req.user._id,
      req.params.id
    );
    res.status(200).json({ success: true, session: state });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/interviews/:id/complete
 *
 * Explicitly marks a session as completed (handles partial completion
 * where the user presses "Finish" before answering every question).
 *
 * 200 — session marked completed, stats stored
 * 400 — session not in_progress
 * 404 — session not found or not owned
 */
export const completeInterview = async (req, res, next) => {
  try {
    const session = await interviewService.completeSession(
      req.user._id,
      req.params.id
    );
    res.status(200).json({
      success: true,
      message: "Interview completed successfully.",
      session,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/interviews/:id/summary
 *
 * Returns computed summary stats for the completion/summary page.
 * Safe to call on any session status (not just completed).
 *
 * 200 — summary object
 * 404 — session not found or not owned
 */
export const getInterviewSummary = async (req, res, next) => {
  try {
    const summary = await interviewService.getSessionSummary(
      req.user._id,
      req.params.id
    );
    res.status(200).json({ success: true, summary });
  } catch (err) {
    next(err);
  }
};
