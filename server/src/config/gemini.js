import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * gemini.js — Gemini client factory.
 *
 * Centralising client construction here means:
 *  - Every AI service imports a single, pre-validated instance.
 *  - The API key check fires once at startup, not per-request.
 *  - Swapping models or adding generation config happens in one place.
 *
 * The function is exported (rather than a pre-built instance) so that tests
 * can call it after setting process.env.GEMINI_API_KEY without module-load
 * order problems.
 */

/**
 * Build and return a configured GenerativeModel.
 * Throws immediately if GEMINI_API_KEY is absent so the server refuses
 * to start in a broken state rather than failing silently on first request.
 *
 * @returns {import("@google/generative-ai").GenerativeModel}
 */
export const createGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to your .env file before starting the server."
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  // Model is configurable via env so staging/production can pin different
  // versions without a code change.
  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";

  return genAI.getGenerativeModel({ model });
};
