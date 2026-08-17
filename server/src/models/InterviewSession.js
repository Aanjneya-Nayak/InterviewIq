import mongoose from "mongoose";

/**
 * InterviewSession model — Phase 7 extended.
 *
 * Additions over Phase 6:
 *   - questions[]   — AI-generated question objects stored on the session
 *   - answers[]     — sparse array keyed by questionId; populated as user answers
 *   - progress      — percentage complete (0-100), updated on each save-answer call
 *
 * Design decisions:
 * - questions are embedded (not a separate collection) because they are always
 *   accessed as a unit with the session and never queried independently.
 * - answers are stored as a sub-document array to allow partial saves and
 *   easy resume-from-last-position.
 * - currentQuestionIndex is the cursor; updated whenever the user navigates.
 */

export const INTERVIEW_TYPES = ["technical", "behavioral", "hr", "mixed"];
export const DIFFICULTIES = ["easy", "medium", "hard"];
export const QUESTION_COUNTS = [5, 10, 15, 20];
export const STATUSES = ["draft", "in_progress", "completed", "abandoned"];
export const QUESTION_TYPES = [
  "technical",
  "behavioral",
  "hr",
  "project",
  "mixed",
];

// ─── Question sub-schema ──────────────────────────────────────────────────────

const questionSchema = new mongoose.Schema(
  {
    questionId: {
      type: String,
      required: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: QUESTION_TYPES,
    },
    difficulty: {
      type: String,
      required: true,
      enum: DIFFICULTIES,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    expectedSkills: {
      type: [String],
      default: [],
    },
    tips: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { _id: false }
);

// ─── Answer sub-schema ────────────────────────────────────────────────────────

const answerSchema = new mongoose.Schema(
  {
    questionId: {
      type: String,
      required: true,
    },
    answer: {
      type: String,
      default: "",
      trim: true,
    },
    savedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

// ─── Main schema ──────────────────────────────────────────────────────────────

const interviewSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Snapshotted at creation time — immune to later resume replacements
    resume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
      required: true,
    },
    resumeAnalysis: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ResumeAnalysis",
      required: true,
    },

    // ── Interview configuration ───────────────────────────────────────────
    interviewType: {
      type: String,
      required: true,
      enum: INTERVIEW_TYPES,
    },
    difficulty: {
      type: String,
      required: true,
      enum: DIFFICULTIES,
    },
    targetRole: {
      type: String,
      required: true,
      trim: true,
      minlength: [2, "Target role must be at least 2 characters"],
      maxlength: [100, "Target role cannot exceed 100 characters"],
    },
    questionCount: {
      type: Number,
      required: true,
      enum: QUESTION_COUNTS,
    },

    // ── AI-generated questions (set once on /start) ───────────────────────
    questions: {
      type: [questionSchema],
      default: [],
    },

    // ── User answers (sparse, written incrementally) ──────────────────────
    answers: {
      type: [answerSchema],
      default: [],
    },

    // ── Session progress ──────────────────────────────────────────────────
    status: {
      type: String,
      required: true,
      enum: STATUSES,
      default: "draft",
    },
    currentQuestionIndex: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Percentage of questions that have a non-empty answer (0-100)
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // ── Completion stats (computed at completion, stored for summary page) ──
    // answeredQuestions: count of questions with a non-empty answer at completion
    answeredQuestions: {
      type: Number,
      default: 0,
      min: 0,
    },
    // skippedQuestions: questionCount minus answeredQuestions at completion
    skippedQuestions: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ── Timestamps ────────────────────────────────────────────────────────
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    totalDuration: {
      type: Number,
      default: null,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
interviewSessionSchema.index({ user: 1, createdAt: -1 });
interviewSessionSchema.index(
  { user: 1, status: 1 },
  { partialFilterExpression: { status: { $in: ["draft", "in_progress"] } } }
);

interviewSessionSchema.set("toJSON", {
  transform(_doc, ret) {
    delete ret.__v;
    return ret;
  },
});

const InterviewSession = mongoose.model(
  "InterviewSession",
  interviewSessionSchema
);

export default InterviewSession;
