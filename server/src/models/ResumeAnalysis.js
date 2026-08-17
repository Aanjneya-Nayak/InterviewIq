import mongoose from "mongoose";

/**
 * ResumeAnalysis model.
 *
 * Design decisions:
 * - One analysis document per user (unique index on `user`). Re-running
 *   analysis upserts the existing document so history doesn't accumulate
 *   silently — a separate history collection can be added later if needed.
 * - resumeRef stores the Resume._id at analysis time so we can detect stale
 *   analyses (resume was replaced after the last analysis ran).
 * - All score fields are constrained to [0, 100] at the schema level.
 * - Every array field defaults to [] so callers never receive null for lists.
 * - analysedAt tracks when the Gemini response was received, independently of
 *   Mongoose's updatedAt.
 */

// ─── Reusable sub-schemas ─────────────────────────────────────────────────────

const actionPlanItemSchema = new mongoose.Schema(
  {
    priority: {
      type: String,
      enum: ["high", "medium", "low"],
      required: true,
    },
    action: { type: String, required: true, trim: true },
    rationale: { type: String, required: true, trim: true },
  },
  { _id: false }
);

// ─── Main schema ──────────────────────────────────────────────────────────────

const resumeAnalysisSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // One active analysis per user — upsert on re-analysis
    },

    // Snapshot reference — lets us flag "resume changed since last analysis"
    resumeRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
      required: true,
    },

    // Human-readable snapshot of the resume that was analysed.
    // Stored so the UI can display "Analysed: MyResume.pdf" without a join,
    // and detect staleness when the user replaces their resume.
    resumeFileName: {
      type: String,
      default: "",
      trim: true,
    },
    resumeUploadedAt: {
      type: Date,
      default: null,
    },

    // ── Scores ───────────────────────────────────────────────────────────
    overallScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    atsScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    // ── Qualitative arrays ────────────────────────────────────────────────
    strengths: {
      type: [String],
      default: [],
    },
    weaknesses: {
      type: [String],
      default: [],
    },
    missingKeywords: {
      type: [String],
      default: [],
    },
    recommendedSkills: {
      type: [String],
      default: [],
    },

    // ── Suggestion arrays ─────────────────────────────────────────────────
    projectSuggestions: {
      type: [String],
      default: [],
    },
    experienceSuggestions: {
      type: [String],
      default: [],
    },
    educationSuggestions: {
      type: [String],
      default: [],
    },
    grammarSuggestions: {
      type: [String],
      default: [],
    },
    formattingSuggestions: {
      type: [String],
      default: [],
    },

    // ── Prioritised action plan ───────────────────────────────────────────
    actionPlan: {
      type: [actionPlanItemSchema],
      default: [],
    },

    // ── Meta ─────────────────────────────────────────────────────────────
    analysedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // createdAt + updatedAt managed by Mongoose
  }
);

resumeAnalysisSchema.set("toJSON", {
  transform(_doc, ret) {
    delete ret.__v;
    return ret;
  },
});

const ResumeAnalysis = mongoose.model("ResumeAnalysis", resumeAnalysisSchema);

export default ResumeAnalysis;
