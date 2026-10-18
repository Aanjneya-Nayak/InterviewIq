import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * ai.service.js — Gemini wrapper with retry + fallback model support.
 *
 * CHANGES FROM PREVIOUS VERSION
 * ──────────────────────────────
 * 1. Retry on transient 503 (Google "high demand") — up to 3 attempts with
 *    exponential back-off (1s → 2s → 4s).  This handles the common spike
 *    where the first request fails but the second succeeds.
 *
 * 2. Fallback model — if the primary model is exhausted after all retries,
 *    the next model in FALLBACK_MODELS is tried (also with retries).
 *    Models are defined here rather than in gemini.js so retry / fallback
 *    logic lives in one place.
 *
 * 3. Proper 503 detection — Google returns HTTP 503 with err.status === 503.
 *    Previous code only caught 400/401/403 explicitly; 503 fell through to
 *    the generic 502 handler which returned a misleading error message.
 *
 * 4. AbortController is created fresh per attempt so a timed-out attempt
 *    does not cancel subsequent retry attempts.
 */

const DEFAULT_TIMEOUT_MS = 60_000;
const MAX_RETRIES        = 3;
const BASE_DELAY_MS      = 1_000; // 1 s → 2 s → 4 s

/**
 * Model priority list.  First available model that succeeds is used.
 * Override the primary via GEMINI_MODEL in .env.
 */
const FALLBACK_MODELS = [
  process.env.GEMINI_MODEL || "gemini-3.6-flash",
  "gemini-3.5-flash",
];

// ── Helpers ──────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Returns true for errors that are worth retrying (transient). */
const isRetryable = (err) =>
  err.status === 503 ||                         // Google "high demand"
  err.status === 429 ||                         // rate limit
  err.name === "AbortError" ||                  // local timeout
  err.message?.includes("abort") ||
  err.message?.includes("503") ||
  err.message?.includes("429");

/**
 * Attempt a single generateContent call with a fresh AbortController.
 * Throws on any error — caller decides whether to retry.
 */
const attemptGenerate = async (model, prompt, timeoutMs) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const result = await model.generateContent(prompt, {
      signal: controller.signal,
    });
    return result.response.text().trim();
  } finally {
    clearTimeout(timer);
  }
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Send a prompt to Gemini and return the text response.
 * Retries on transient failures and falls back to an alternate model if needed.
 *
 * @param {string} prompt
 * @param {object} [options]
 * @param {number} [options.timeoutMs=60000]
 * @returns {Promise<string>}
 *
 * @throws {Error} with .statusCode set for the global errorHandler:
 *   503 — API key missing or auth error
 *   429 — rate-limited and all retries exhausted
 *   504 — timed out and all retries exhausted
 *   502 — unexpected upstream failure
 */
export const generateContent = async (prompt, options = {}) => {
  const { timeoutMs = DEFAULT_TIMEOUT_MS } = options;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const err = new Error(
      "GEMINI_API_KEY is not set. Add it to your .env file before starting the server."
    );
    err.statusCode = 503;
    throw err;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  let lastErr = null;

  for (const modelName of FALLBACK_MODELS) {
    const model = genAI.getGenerativeModel({ model: modelName });

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const text = await attemptGenerate(model, prompt, timeoutMs);
        // Success — if we retried or fell back, log it so it's visible in dev
        if (attempt > 1 || modelName !== FALLBACK_MODELS[0]) {
          console.info(
            `[ai.service] Success on model=${modelName} attempt=${attempt}`
          );
        }
        return text;
      } catch (err) {
        lastErr = err;

        // ── 404 means the model name doesn't exist for this key → skip to next model
        if (err.status === 404) {
          console.warn(`[ai.service] Model not found: ${modelName} — trying fallback`);
          break; // break inner retry loop, continue to next model
        }

        // ── Auth / key problems → no point retrying
        if ([400, 401, 403].includes(err.status)) {
          const error = new Error(
            "The AI service is not available due to an authentication error. Contact support."
          );
          error.statusCode = 503;
          throw error;
        }

        // ── Timeout (local AbortController fired)
        if (err.name === "AbortError" || err.message?.includes("abort")) {
          lastErr = err;
          if (attempt < MAX_RETRIES) {
            await sleep(BASE_DELAY_MS * 2 ** (attempt - 1));
            continue;
          }
          // All retries timed out for this model → try fallback
          console.warn(`[ai.service] Timeout on model=${modelName} after ${attempt} attempts`);
          break;
        }

        // ── Retryable (503 demand spike, 429 rate limit)
        if (isRetryable(err)) {
          if (attempt < MAX_RETRIES) {
            const delay = BASE_DELAY_MS * 2 ** (attempt - 1);
            console.warn(
              `[ai.service] Retryable error (status=${err.status}) on model=${modelName} ` +
              `attempt=${attempt}/${MAX_RETRIES} — retrying in ${delay}ms`
            );
            await sleep(delay);
            continue;
          }
          // Exhausted retries for this model → try fallback
          console.warn(`[ai.service] Exhausted retries on model=${modelName}`);
          break;
        }

        // ── Non-retryable unexpected error → fail immediately
        console.error(`[ai.service] Non-retryable error on model=${modelName}:`, err.message);
        const error = new Error(
          "An unexpected error occurred while contacting the AI service. Please try again."
        );
        error.statusCode = 502;
        throw error;
      }
    }
  }

  // All models and all retries exhausted — surface a meaningful error
  const status = lastErr?.status;

  if (status === 503 || lastErr?.message?.includes("503")) {
    const error = new Error(
      "The AI service is currently experiencing high demand. Please try again in a minute."
    );
    error.statusCode = 503;
    throw error;
  }

  if (status === 429 || lastErr?.message?.includes("429")) {
    const error = new Error(
      "The AI service is currently rate-limited. Please wait a moment and try again."
    );
    error.statusCode = 429;
    throw error;
  }

  if (lastErr?.name === "AbortError" || lastErr?.message?.includes("abort")) {
    const error = new Error(
      "The AI request timed out after multiple attempts. Please try again."
    );
    error.statusCode = 504;
    throw error;
  }

  const error = new Error(
    "An unexpected error occurred while contacting the AI service. Please try again."
  );
  error.statusCode = 502;
  throw error;
};
