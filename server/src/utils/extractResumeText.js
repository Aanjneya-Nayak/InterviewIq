import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

/**
 * extractResumeText.js
 *
 * Extracts plain text from a resume buffer (PDF or DOCX).
 * Called at upload time so the result can be persisted to the Resume document.
 * The analysis pipeline then reads parsedText from the DB — no re-download,
 * no re-parse, no dependency on Cloudinary being reachable at query time.
 *
 * Supported MIME types:
 *   application/pdf        → pdf-parse (PDFParse class, v2 API)
 *   application/vnd.openxmlformats-officedocument.wordprocessingml.document
 *                          → mammoth
 */

const MIN_TEXT_LENGTH = 50; // Fewer chars → likely a scan or blank document

/**
 * Extract plain text from a PDF buffer.
 *
 * PDFParse v2 API: pass { data: buffer } to the constructor, then call
 * getText() which returns a result object with a .text string and a .pages array.
 *
 * @param {Buffer} buffer
 * @returns {Promise<string>}
 */
const extractFromPdf = async (buffer) => {
  // Buffer must be passed as `data` in the constructor options — NOT via load().
  // Calling load() without data triggers "getDocument - no `url` parameter".
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();

  // result.text is the full concatenated text; result.pages is an array of
  // { text, num } objects. Prefer the pre-joined .text when available.
  if (result && typeof result.text === "string") {
    return result.text;
  }

  // Fallback: join individual page texts
  if (result && Array.isArray(result.pages)) {
    return result.pages.map((p) => (typeof p.text === "string" ? p.text : "")).join(" ");
  }

  return "";
};

/**
 * Extract plain text from a DOCX buffer.
 *
 * @param {Buffer} buffer
 * @returns {Promise<string>}
 */
const extractFromDocx = async (buffer) => {
  const result = await mammoth.extractRawText({ buffer });
  return result.value || "";
};

/**
 * Extract and validate plain text from a resume buffer.
 * Used at upload time — the buffer comes from Multer's memoryStorage.
 *
 * @param {object} params
 * @param {Buffer} params.buffer   - Raw file bytes from Multer.
 * @param {string} params.mimeType - MIME type of the uploaded file.
 * @returns {Promise<string>}      - Trimmed, whitespace-normalised plain text.
 *
 * @throws {Error} statusCode 400 if the file yields no extractable text
 *                 (scanned image or blank document).
 * @throws {Error} statusCode 415 if the MIME type is unsupported.
 */
export const extractTextFromBuffer = async ({ buffer, mimeType }) => {
  let text = "";

  if (mimeType === "application/pdf") {
    text = await extractFromPdf(buffer);
  } else if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    text = await extractFromDocx(buffer);
  } else {
    const err = new Error(
      `Unsupported resume file type: ${mimeType}. Only PDF and DOCX are supported.`
    );
    err.statusCode = 415;
    throw err;
  }

  const trimmed = text.replace(/\s+/g, " ").trim();

  if (trimmed.length < MIN_TEXT_LENGTH) {
    const err = new Error(
      "The resume file appears to be empty or is a scanned image that cannot be parsed. " +
        "Please upload a text-based PDF or DOCX."
    );
    err.statusCode = 400;
    throw err;
  }

  return trimmed;
};
