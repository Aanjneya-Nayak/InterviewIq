/**
 * ai.validation.js — parse and validate raw Gemini text into a typed result.
 *
 * Gemini is instructed to return pure JSON, but models can occasionally:
 *   - Wrap output in markdown code fences (```json … ```)
 *   - Emit trailing prose after the closing brace
 *   - Return a score outside the 0-100 range
 *   - Omit an optional array (returning null instead of [])
 *
 * This module is the single place that handles all of those edge-cases so
 * every downstream consumer receives a guaranteed-shape object.
 */

/**
 * Strip markdown code fences that a model might accidentally include.
 * Handles ```json … ```, ``` … ```, and bare text that starts with {.
 *
 * @param {string} raw
 * @returns {string}
 */
const stripMarkdownFences = (raw) => {
  // Remove ```json … ``` or ``` … ```
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenced) return fenced[1];

  // Find first { and last } in case the model added prose around the JSON
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return raw.slice(start, end + 1);
  }

  return raw;
};

/**
 * Clamp a value to an integer in [0, 100].
 * Returns 0 for non-numeric values.
 *
 * @param {*} value
 * @returns {number}
 */
const clampScore = (value) => {
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return 0;
  return Math.min(100, Math.max(0, n));
};

/**
 * Ensure a value is an array of strings.
 * Converts null / undefined / non-array to [].
 * Converts non-string array items to strings and trims whitespace.
 *
 * @param {*} value
 * @returns {string[]}
 */
const toStringArray = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item !== null && item !== undefined)
    .map((item) => String(item).trim())
    .filter(Boolean);
};

/**
 * Validate and normalise the actionPlan array.
 * Each item must have { priority, action, rationale }.
 * Invalid items are filtered out rather than causing a hard failure.
 *
 * @param {*} value
 * @returns {{ priority: string, action: string, rationale: string }[]}
 */
const toActionPlan = (value) => {
  if (!Array.isArray(value)) return [];

  const VALID_PRIORITIES = new Set(["high", "medium", "low"]);

  return value
    .filter(
      (item) =>
        item &&
        typeof item === "object" &&
        VALID_PRIORITIES.has(String(item.priority).toLowerCase()) &&
        typeof item.action === "string" &&
        item.action.trim() &&
        typeof item.rationale === "string" &&
        item.rationale.trim()
    )
    .map((item) => ({
      priority: String(item.priority).toLowerCase(),
      action: item.action.trim(),
      rationale: item.rationale.trim(),
    }));
};

/**
 * Parse and validate a raw Gemini response string into a typed analysis object.
 *
 * @param {string} raw - The raw text returned by generateContent().
 * @returns {{
 *   overallScore: number,
 *   atsScore: number,
 *   strengths: string[],
 *   weaknesses: string[],
 *   missingKeywords: string[],
 *   recommendedSkills: string[],
 *   projectSuggestions: string[],
 *   experienceSuggestions: string[],
 *   educationSuggestions: string[],
 *   grammarSuggestions: string[],
 *   formattingSuggestions: string[],
 *   actionPlan: { priority: string, action: string, rationale: string }[]
 * }}
 *
 * @throws {Error} with statusCode 502 if the response cannot be parsed as JSON.
 */
export const parseAnalysisResponse = (raw) => {
  const cleaned = stripMarkdownFences(raw);

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const error = new Error(
      "The AI service returned an unreadable response. Please try again."
    );
    error.statusCode = 502;
    throw error;
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    const error = new Error(
      "The AI service returned an unexpected response format. Please try again."
    );
    error.statusCode = 502;
    throw error;
  }

  // Normalise every field — no caller needs to defensive-check nulls
  return {
    overallScore: clampScore(parsed.overallScore),
    atsScore: clampScore(parsed.atsScore),
    strengths: toStringArray(parsed.strengths),
    weaknesses: toStringArray(parsed.weaknesses),
    missingKeywords: toStringArray(parsed.missingKeywords),
    recommendedSkills: toStringArray(parsed.recommendedSkills),
    projectSuggestions: toStringArray(parsed.projectSuggestions),
    experienceSuggestions: toStringArray(parsed.experienceSuggestions),
    educationSuggestions: toStringArray(parsed.educationSuggestions),
    grammarSuggestions: toStringArray(parsed.grammarSuggestions),
    formattingSuggestions: toStringArray(parsed.formattingSuggestions),
    actionPlan: toActionPlan(parsed.actionPlan),
  };
};
