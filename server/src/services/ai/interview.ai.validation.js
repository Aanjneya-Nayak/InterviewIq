/**
 * interview.ai.validation.js
 *
 * Parses and validates the raw Gemini JSON response for interview question
 * generation. Mirrors the pattern in ai.validation.js (resume analysis).
 *
 * Handles all known Gemini edge-cases:
 *   - Markdown code fences around JSON
 *   - Prose before/after the JSON object
 *   - Missing or extra fields on individual questions
 *   - Wrong enum values (clamped to nearest valid value)
 *   - Fewer questions than requested (throws so caller can retry or surface error)
 */

import { QUESTION_TYPES, DIFFICULTIES } from "../../models/InterviewSession.js";

// ─── Helpers (shared with ai.validation.js pattern) ──────────────────────────

const stripMarkdownFences = (raw) => {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenced) return fenced[1];

  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return raw.slice(start, end + 1);
  }
  return raw;
};

const toStringArray = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v) => v !== null && v !== undefined)
    .map((v) => String(v).trim())
    .filter(Boolean);
};

/**
 * Coerce a value to a valid enum member, or return the fallback.
 * @param {string[]} validValues
 * @param {*} value
 * @param {string} fallback
 */
const coerceEnum = (validValues, value, fallback) => {
  const s = String(value ?? "").toLowerCase().trim();
  return validValues.includes(s) ? s : fallback;
};

// ─── Main validator ───────────────────────────────────────────────────────────

/**
 * Parse and validate a raw Gemini response into a typed questions array.
 *
 * @param {string} raw             - Raw text from generateContent()
 * @param {number} expectedCount   - How many questions were requested
 * @returns {{ questionId, question, type, difficulty, topic, expectedSkills, tips }[]}
 *
 * @throws {Error} statusCode 502 — unparseable JSON
 * @throws {Error} statusCode 502 — no questions array in response
 * @throws {Error} statusCode 502 — fewer questions than requested (after filtering invalids)
 */
export const parseQuestionsResponse = (raw, expectedCount) => {
  // ── Strip fences and parse JSON ────────────────────────────────────────
  const cleaned = stripMarkdownFences(raw);

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const error = new Error(
      "The AI service returned an unreadable response. Please try generating again."
    );
    error.statusCode = 502;
    throw error;
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !Array.isArray(parsed.questions)
  ) {
    const error = new Error(
      "The AI service returned an unexpected response format. Please try again."
    );
    error.statusCode = 502;
    throw error;
  }

  // ── Normalise each question ────────────────────────────────────────────
  const questions = parsed.questions
    .filter(
      (q) =>
        q &&
        typeof q === "object" &&
        typeof q.question === "string" &&
        q.question.trim().length >= 10
    )
    .map((q, idx) => ({
      questionId: String(q.questionId ?? `q${idx + 1}`).trim(),
      question: String(q.question).trim(),
      type: coerceEnum(QUESTION_TYPES, q.type, "mixed"),
      difficulty: coerceEnum(DIFFICULTIES, q.difficulty, "medium"),
      topic: String(q.topic ?? "General").trim() || "General",
      expectedSkills: toStringArray(q.expectedSkills),
      tips: q.tips && typeof q.tips === "string" && q.tips.trim()
        ? q.tips.trim()
        : null,
    }));

  // ── Ensure we got enough valid questions ───────────────────────────────
  if (questions.length < expectedCount) {
    const error = new Error(
      `AI generated ${questions.length} valid questions but ${expectedCount} were requested. Please try again.`
    );
    error.statusCode = 502;
    throw error;
  }

  // Return exactly the requested count (trim any extras the model produced)
  return questions.slice(0, expectedCount);
};
