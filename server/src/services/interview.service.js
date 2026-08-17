import InterviewSession from "../models/InterviewSession.js";
import Resume from "../models/Resume.js";
import ResumeAnalysis from "../models/ResumeAnalysis.js";
import { generateContent } from "./ai/ai.service.js";
import { parseQuestionsResponse } from "./ai/interview.ai.validation.js";
import { buildInterviewQuestionsPrompt } from "../prompts/interviewQuestions.prompt.js";

/**
 * interview.service.js
 *
 * All business logic for interview session management.
 * Phase 7 additions:
 *   - startSession      — generates questions via Gemini and transitions to in_progress
 *   - saveAnswer        — upserts a single answer, recalculates progress
 *   - updateProgress    — updates currentQuestionIndex
 *   - getCurrentState   — returns the session with current question focused
 */

// ─── Internal helper ──────────────────────────────────────────────────────────

/**
 * Verify the user has a resume with parsedText AND a completed analysis.
 * Returns { resume, analysis } on success; throws a 400 otherwise.
 */
const assertPrerequisites = async (userId) => {
  const resume = await Resume.findOne({ user: userId });

  if (!resume) {
    const error = new Error(
      "You must upload a resume before starting an interview."
    );
    error.statusCode = 400;
    throw error;
  }

  if (!resume.parsedText || resume.parsedText.trim().length === 0) {
    const error = new Error(
      "Your resume could not be parsed. Please re-upload your resume file."
    );
    error.statusCode = 400;
    throw error;
  }

  const analysis = await ResumeAnalysis.findOne({ user: userId });

  if (!analysis) {
    const error = new Error(
      "You must run a resume analysis before starting an interview."
    );
    error.statusCode = 400;
    throw error;
  }

  return { resume, analysis };
};

// ─── Phase 6 services (unchanged) ────────────────────────────────────────────

export const createSession = async (userId, config) => {
  const { resume, analysis } = await assertPrerequisites(userId);

  const session = await InterviewSession.create({
    user: userId,
    resume: resume._id,
    resumeAnalysis: analysis._id,
    interviewType: config.interviewType,
    difficulty: config.difficulty,
    targetRole: config.targetRole.trim(),
    questionCount: Number(config.questionCount),
    status: "draft",
  });

  return session;
};

export const getUserSessions = async (userId) => {
  return InterviewSession.find({ user: userId })
    .sort({ createdAt: -1 })
    .populate("resume", "originalFileName uploadedAt")
    .lean();
};

export const getSessionById = async (userId, sessionId) => {
  const session = await InterviewSession.findById(sessionId)
    .populate("resume", "originalFileName uploadedAt mimeType")
    .populate("resumeAnalysis", "overallScore atsScore analysedAt");

  if (!session) {
    const error = new Error("Interview session not found.");
    error.statusCode = 404;
    throw error;
  }

  if (session.user.toString() !== userId.toString()) {
    const error = new Error("Interview session not found.");
    error.statusCode = 404;
    throw error;
  }

  return session;
};

export const updateSessionStatus = async (userId, sessionId, newStatus) => {
  const session = await getSessionById(userId, sessionId);
  const now = new Date();

  const VALID_TRANSITIONS = {
    draft: ["in_progress", "abandoned"],
    in_progress: ["completed", "abandoned"],
    completed: [],
    abandoned: [],
  };

  const allowed = VALID_TRANSITIONS[session.status];
  if (!allowed.includes(newStatus)) {
    const error = new Error(
      `Cannot transition session from "${session.status}" to "${newStatus}".`
    );
    error.statusCode = 400;
    throw error;
  }

  if (newStatus === "in_progress" && !session.startedAt) {
    session.startedAt = now;
  }

  if (newStatus === "completed") {
    session.completedAt = now;
    if (session.startedAt) {
      session.totalDuration = Math.round(
        (now.getTime() - session.startedAt.getTime()) / 1000
      );
    }
  }

  session.status = newStatus;
  await session.save();
  return session;
};

export const deleteSession = async (userId, sessionId) => {
  await getSessionById(userId, sessionId);
  await InterviewSession.findByIdAndDelete(sessionId);
};

// ─── Phase 7 services ─────────────────────────────────────────────────────────

/**
 * POST /api/interviews/:id/start
 *
 * Generates AI questions via Gemini then transitions the session to in_progress.
 *
 * Rules:
 *   - Session must be in "draft" status (idempotent: if already in_progress
 *     and has questions, returns the session as-is so refreshes don't re-bill).
 *   - Re-generating on an in_progress session with no questions is allowed
 *     (handles the case where the first generation succeeded but failed to save).
 *
 * @param {string} userId
 * @param {string} sessionId
 * @returns {Promise<InterviewSession>}
 */
export const startSession = async (userId, sessionId) => {
  const session = await getSessionById(userId, sessionId);

  // Idempotency: already started with questions → return immediately
  if (session.status === "in_progress" && session.questions.length > 0) {
    return session;
  }

  if (session.status !== "draft" && session.status !== "in_progress") {
    const error = new Error(
      `Cannot start a session with status "${session.status}".`
    );
    error.statusCode = 400;
    throw error;
  }

  // ── Load resume text and analysis ────────────────────────────────────────
  const resume = await Resume.findById(session.resume);
  if (!resume?.parsedText) {
    const error = new Error(
      "Resume text is no longer available. Please re-upload your resume."
    );
    error.statusCode = 400;
    throw error;
  }

  const analysis = await ResumeAnalysis.findById(session.resumeAnalysis);
  if (!analysis) {
    const error = new Error(
      "Resume analysis is no longer available. Please re-run your analysis."
    );
    error.statusCode = 400;
    throw error;
  }

  // ── Build prompt ──────────────────────────────────────────────────────────
  const prompt = buildInterviewQuestionsPrompt({
    resumeText: resume.parsedText,
    analysisData: {
      strengths: analysis.strengths,
      weaknesses: analysis.weaknesses,
      recommendedSkills: analysis.recommendedSkills,
    },
    targetRole: session.targetRole,
    interviewType: session.interviewType,
    difficulty: session.difficulty,
    questionCount: session.questionCount,
  });

  // ── Call Gemini (60-second timeout for larger question sets) ──────────────
  const rawResponse = await generateContent(prompt, { timeoutMs: 60_000 });

  // ── Parse and validate ────────────────────────────────────────────────────
  const questions = parseQuestionsResponse(rawResponse, session.questionCount);

  // ── Persist questions and transition status ───────────────────────────────
  session.questions = questions;
  session.answers = [];
  session.currentQuestionIndex = 0;
  session.progress = 0;
  session.status = "in_progress";
  session.startedAt = session.startedAt ?? new Date();
  await session.save();

  return session;
};

/**
 * POST /api/interviews/:id/save-answer
 *
 * Upsert an answer for a specific question. Recalculates progress.
 * Marks session as completed if all questions have a non-empty answer.
 *
 * @param {string} userId
 * @param {string} sessionId
 * @param {string} questionId
 * @param {string} answer
 * @returns {Promise<{ session, progress, isCompleted }>}
 */
export const saveAnswer = async (userId, sessionId, questionId, answer) => {
  const session = await getSessionById(userId, sessionId);

  if (session.status !== "in_progress") {
    const error = new Error(
      "Answers can only be saved while the session is in progress."
    );
    error.statusCode = 400;
    throw error;
  }

  // Verify the questionId belongs to this session
  const questionExists = session.questions.some(
    (q) => q.questionId === questionId
  );
  if (!questionExists) {
    const error = new Error("Question not found in this session.");
    error.statusCode = 404;
    throw error;
  }

  // Upsert the answer (replace existing or add new)
  const existingIdx = session.answers.findIndex(
    (a) => a.questionId === questionId
  );

  const answerEntry = {
    questionId,
    answer: String(answer ?? "").trim(),
    savedAt: new Date(),
  };

  if (existingIdx >= 0) {
    session.answers[existingIdx] = answerEntry;
  } else {
    session.answers.push(answerEntry);
  }

  // Recalculate progress: % of questions with a non-empty answer
  const answeredCount = session.answers.filter((a) => a.answer.length > 0).length;
  session.progress = Math.round((answeredCount / session.questionCount) * 100);

  // Auto-complete when all questions are answered
  const isCompleted = answeredCount >= session.questionCount;
  if (isCompleted && session.status === "in_progress") {
    session.status = "completed";
    session.completedAt = new Date();
    session.answeredQuestions = answeredCount;
    session.skippedQuestions = session.questionCount - answeredCount;
    if (session.startedAt) {
      session.totalDuration = Math.round(
        (session.completedAt.getTime() - session.startedAt.getTime()) / 1000
      );
    }
  }

  await session.save();

  return {
    session,
    progress: session.progress,
    isCompleted,
  };
};

/**
 * PATCH /api/interviews/:id/progress
 *
 * Update the currentQuestionIndex cursor (navigation only — no answer saved).
 *
 * @param {string} userId
 * @param {string} sessionId
 * @param {number} currentQuestionIndex
 * @returns {Promise<InterviewSession>}
 */
export const updateProgress = async (
  userId,
  sessionId,
  currentQuestionIndex
) => {
  const session = await getSessionById(userId, sessionId);

  if (session.status !== "in_progress") {
    const error = new Error(
      "Progress can only be updated while the session is in progress."
    );
    error.statusCode = 400;
    throw error;
  }

  const idx = Number(currentQuestionIndex);
  if (
    !Number.isInteger(idx) ||
    idx < 0 ||
    idx >= session.questions.length
  ) {
    const error = new Error(
      `currentQuestionIndex must be between 0 and ${session.questions.length - 1}.`
    );
    error.statusCode = 400;
    throw error;
  }

  session.currentQuestionIndex = idx;
  await session.save();
  return session;
};

/**
 * GET /api/interviews/:id/current
 *
 * Returns the session with a `currentQuestion` convenience field injected,
 * pointing to questions[currentQuestionIndex].
 *
 * @param {string} userId
 * @param {string} sessionId
 * @returns {Promise<object>} Session POJO with currentQuestion attached
 */
export const getCurrentState = async (userId, sessionId) => {
  const session = await getSessionById(userId, sessionId);
  const plain = session.toJSON();

  // Attach current question and current answer as convenience fields
  const currentQuestion = plain.questions[plain.currentQuestionIndex] ?? null;
  const currentAnswer =
    plain.answers.find(
      (a) => a.questionId === currentQuestion?.questionId
    )?.answer ?? "";

  return {
    ...plain,
    currentQuestion,
    currentAnswer,
  };
};

/**
 * POST /api/interviews/:id/complete
 *
 * Explicitly marks an in_progress session as completed.
 * Called when the user clicks "Finish Interview" without having answered
 * every question (partial completion).
 * Stores final answeredQuestions / skippedQuestions counts.
 *
 * @param {string} userId
 * @param {string} sessionId
 * @returns {Promise<InterviewSession>}
 */
export const completeSession = async (userId, sessionId) => {
  const session = await getSessionById(userId, sessionId);

  if (session.status !== "in_progress") {
    const error = new Error(
      `Cannot complete a session with status "${session.status}".`
    );
    error.statusCode = 400;
    throw error;
  }

  const now = new Date();
  const answeredCount = session.answers.filter((a) => a.answer.trim().length > 0).length;

  session.status = "completed";
  session.completedAt = now;
  session.answeredQuestions = answeredCount;
  session.skippedQuestions = session.questionCount - answeredCount;
  session.progress = Math.round((answeredCount / session.questionCount) * 100);

  if (session.startedAt) {
    session.totalDuration = Math.round(
      (now.getTime() - session.startedAt.getTime()) / 1000
    );
  }

  await session.save();
  return session;
};

/**
 * GET /api/interviews/:id/summary
 *
 * Returns a summary-shaped object for the completion/summary page.
 * Includes computed stats: answeredQuestions, skippedQuestions, duration,
 * and a breakdown of question types answered.
 *
 * @param {string} userId
 * @param {string} sessionId
 * @returns {Promise<object>}
 */
export const getSessionSummary = async (userId, sessionId) => {
  const session = await getSessionById(userId, sessionId);
  const plain = session.toJSON();

  // Compute live stats in case the session was completed before these fields existed
  const answeredCount =
    plain.answeredQuestions ??
    plain.answers.filter((a) => a.answer?.trim().length > 0).length;
  const skippedCount =
    plain.skippedQuestions ?? plain.questionCount - answeredCount;

  // Build a per-question breakdown: question text, type, topic, answer status
  const questionBreakdown = plain.questions.map((q) => {
    const answerEntry = plain.answers.find((a) => a.questionId === q.questionId);
    return {
      questionId: q.questionId,
      question: q.question,
      type: q.type,
      difficulty: q.difficulty,
      topic: q.topic,
      answered: !!(answerEntry?.answer?.trim()),
      // Phase 9 will populate score/feedback here
    };
  });

  // Format duration as "Xm Ys" or "X seconds"
  const durationSec = plain.totalDuration ?? 0;
  const durationFormatted =
    durationSec >= 60
      ? `${Math.floor(durationSec / 60)}m ${durationSec % 60}s`
      : `${durationSec}s`;

  return {
    _id: plain._id,
    status: plain.status,
    interviewType: plain.interviewType,
    difficulty: plain.difficulty,
    targetRole: plain.targetRole,
    questionCount: plain.questionCount,
    answeredQuestions: answeredCount,
    skippedQuestions: skippedCount,
    progress: plain.progress,
    totalDuration: durationSec,
    durationFormatted,
    startedAt: plain.startedAt,
    completedAt: plain.completedAt,
    createdAt: plain.createdAt,
    questionBreakdown,
    // Placeholder for Phase 9 evaluation fields
    overallScore: null,
    evaluationReady: false,
  };
};
