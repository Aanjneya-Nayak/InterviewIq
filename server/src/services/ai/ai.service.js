import { createGeminiClient } from "../../config/gemini.js";

/**
 * ai.service.js — reusable Gemini wrapper.
 *
 * WHY THIS SERVICE EXISTS
 * ───────────────────────
 * Controllers should orchestrate, not communicate directly with third-party
 * SDKs.  Placing all Gemini I/O here means:
 *
 *  1. Every future AI feature (resume analysis, interview feedback, question
 *     generation) calls ONE function — `generateContent` — instead of
 *     duplicating SDK calls, timeout logic, and error normalisation.
 *
 *  2. When the Gemini SDK is updated or we switch providers, we change ONE
 *     file instead of hunting through every controller.
 *
 *  3. Error handling (missing key, timeout, rate limit, network failure) is
 *     defined once and inherited automatically by all callers.
 *
 * HOW FUTURE AI MODULES REUSE THIS
 * ─────────────────────────────────
 * Any new AI-powered feature follows the same pattern:
 *
 *   1. Add a prompt template under src/prompts/<feature>.prompt.js
 *   2. Call generateContent(prompt) from the relevant service or controller
 *   3. Parse / validate the returned text as needed
 *
 * The transport layer (this file) never needs to change.
 */

/** Default timeout in milliseconds before aborting a Gemini request. */
const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * Send a prompt to Gemini and return the text response.
 *
 * @param {string} prompt          - The fully-assembled prompt string.
 * @param {object} [options]
 * @param {number} [options.timeoutMs=30000] - Abort after this many ms.
 * @returns {Promise<string>}      - Trimmed text from the model.
 *
 * @throws Will throw a normalised Error with a `statusCode` property so the
 *         global errorHandler can forward the right HTTP status to the client.
 */
export const generateContent = async (prompt, options = {}) => {
  const { timeoutMs = DEFAULT_TIMEOUT_MS } = options;

  // ── Guard: key must be present ──────────────────────────────────────────
  // createGeminiClient() throws if the key is missing; we catch it here so we
  // can attach an HTTP status code before re-throwing.
  let model;
  try {
    model = createGeminiClient();
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 503; // Service Unavailable — misconfiguration, not client fault
    throw error;
  }

  // ── Timeout via AbortController ─────────────────────────────────────────
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const result = await model.generateContent(prompt, {
      signal: controller.signal,
    });

    const text = result.response.text();
    return text.trim();
  } catch (err) {
    // Re-throw already-normalised errors (e.g. missing key caught above and
    // re-thrown by a nested call — shouldn't happen but defensive).
    if (err.statusCode) throw err;

    // ── Timeout ─────────────────────────────────────────────────────────
    if (err.name === "AbortError" || err.message?.includes("abort")) {
      const error = new Error(
        "The AI request timed out. Please try again in a moment."
      );
      error.statusCode = 504; // Gateway Timeout
      throw error;
    }

    // ── Rate limit (HTTP 429 from Google) ───────────────────────────────
    if (err.status === 429 || err.message?.includes("429")) {
      const error = new Error(
        "The AI service is currently rate-limited. Please wait a moment and try again."
      );
      error.statusCode = 429;
      throw error;
    }

    // ── Invalid / revoked API key (HTTP 400 / 401 / 403) ────────────────
    if ([400, 401, 403].includes(err.status)) {
      const error = new Error(
        "The AI service is not available due to an authentication error. Contact support."
      );
      error.statusCode = 503;
      throw error;
    }

    // ── Generic network failure ──────────────────────────────────────────
    const error = new Error(
      "An unexpected error occurred while contacting the AI service. Please try again."
    );
    error.statusCode = 502; // Bad Gateway — upstream failure
    throw error;
  } finally {
    clearTimeout(timer);
  }
};
