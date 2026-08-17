import Resume from "../models/Resume.js";
import ResumeAnalysis from "../models/ResumeAnalysis.js";
import { generateContent } from "./ai/ai.service.js";
import { parseAnalysisResponse } from "./ai/ai.validation.js";
import { buildResumeAnalysisPrompt } from "../prompts/resumeAnalysis.prompt.js";

/**
 * resumeAnalysis.service.js — orchestrates the full analysis pipeline.
 *
 * Flow:
 *   1. Load Resume document from DB              → guards: no resume, no parsed text
 *   2. Build the Gemini prompt from resume.parsedText (stored at upload time)
 *   3. Call Gemini via ai.service.generateContent
 *   4. Parse + validate the raw JSON response
 *   5. Upsert ResumeAnalysis document in MongoDB
 *   6. Return the persisted analysis
 *
 * Why parsedText from DB, not re-downloading the file:
 *   - The spec requires "structured resume data from database" as input.
 *   - Text is extracted once at upload time and persisted on the Resume document.
 *   - Analysis calls are fast: no Cloudinary download, no PDF/DOCX parsing per request.
 *   - Reduces external dependencies at query time — only Gemini needs to be reachable.
 *
 * This service does NOT:
 *   - Touch HTTP req/res objects (that's the controller's job).
 *   - Log or format error messages (errors bubble to the global errorHandler).
 */

/**
 * Run AI analysis on the authenticated user's current resume.
 *
 * @param {string} userId - MongoDB ObjectId string of the authenticated user.
 * @returns {Promise<import("../models/ResumeAnalysis.js").default>} Persisted analysis document.
 *
 * @throws {Error} statusCode 404 — user has no resume on file.
 * @throws {Error} statusCode 400 — resume has no parsedText (scanned/blank file).
 * @throws {Error} statusCode 429 — Gemini rate limit hit.
 * @throws {Error} statusCode 502 — AI returned invalid JSON or network failure.
 * @throws {Error} statusCode 503 — Gemini API key missing or auth error.
 * @throws {Error} statusCode 504 — request timed out.
 */
export const analyzeResume = async (userId) => {
  // ── Step 1: Load the resume document from DB ───────────────────────────────
  const resume = await Resume.findOne({ user: userId });

  if (!resume) {
    const err = new Error(
      "No resume found. Please upload a resume before requesting analysis."
    );
    err.statusCode = 404;
    throw err;
  }

  // Guard: parsedText must be present — it is set at upload time.
  // An empty or null value means the file was a scanned image or blank document.
  if (!resume.parsedText || resume.parsedText.trim().length < 50) {
    const err = new Error(
      "Your resume could not be parsed. Please replace it with a text-based PDF or DOCX file."
    );
    err.statusCode = 400;
    throw err;
  }

  // ── Step 2: Build prompt from stored parsed text ───────────────────────────
  const prompt = buildResumeAnalysisPrompt({ resumeText: resume.parsedText });

  // ── Step 3: Call Gemini ────────────────────────────────────────────────────
  // generateContent throws normalised errors (503 missing key, 429 rate limit,
  // 504 timeout, 502 network failure) — they bubble straight to errorHandler.
  const rawResponse = await generateContent(prompt, { timeoutMs: 60_000 });

  // ── Step 4: Parse + validate ───────────────────────────────────────────────
  // parseAnalysisResponse throws 502 if JSON is malformed or missing fields.
  const analysisData = parseAnalysisResponse(rawResponse);

  // ── Step 5: Upsert analysis document ──────────────────────────────────────
  // Use $set explicitly so every field is overwritten on re-analysis.
  // Without $set, Mongoose v9 findOneAndUpdate with a plain object wraps it
  // in $set for updates but does a full replacement for inserts — using $set
  // explicitly makes the behaviour identical in both cases.
  const analysis = await ResumeAnalysis.findOneAndUpdate(
    { user: userId },
    {
      $set: {
        user: userId,
        resumeRef: resume._id,
        resumeFileName: resume.originalFileName,
        resumeUploadedAt: resume.uploadedAt,
        analysedAt: new Date(),
        ...analysisData,
      },
    },
    { new: true, upsert: true, runValidators: true }
  );

  // ── Step 6: Return ─────────────────────────────────────────────────────────
  return analysis;
};

/**
 * Retrieve the most recent analysis for a user without triggering a new one.
 *
 * @param {string} userId
 * @returns {Promise<import("../models/ResumeAnalysis.js").default | null>}
 */
export const getAnalysis = async (userId) => {
  return ResumeAnalysis.findOne({ user: userId });
};
