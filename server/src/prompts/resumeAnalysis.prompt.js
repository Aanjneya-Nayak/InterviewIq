/**
 * resumeAnalysis.prompt.js — prompt template for resume analysis.
 *
 * WHY PROMPTS ARE SEPARATED
 * ─────────────────────────
 * Prompts are product content, not infrastructure.  Keeping them here means:
 *   1. Wording is iterated without touching controller or service logic.
 *   2. The expected JSON contract is documented next to the instructions
 *      that produce it — single source of truth.
 *   3. Controllers stay thin: they pass structured data in, get structured
 *      data out.
 *
 * INPUT CONTRACT
 * ──────────────
 * buildResumeAnalysisPrompt receives a plain-text representation of the
 * resume extracted server-side from PDF/DOCX.  Raw binary is never sent
 * to the model.
 *
 * OUTPUT CONTRACT (enforced by ai.validation.js)
 * ────────────────────────────────────────────────
 * {
 *   overallScore          : integer 0-100
 *   atsScore              : integer 0-100
 *   strengths             : string[]   (min 1)
 *   weaknesses            : string[]   (min 1)
 *   missingKeywords       : string[]
 *   recommendedSkills     : string[]
 *   projectSuggestions    : string[]
 *   experienceSuggestions : string[]
 *   educationSuggestions  : string[]
 *   grammarSuggestions    : string[]
 *   formattingSuggestions : string[]
 *   actionPlan            : { priority, action, rationale }[]
 * }
 */

/**
 * Build the full prompt string for Gemini resume analysis.
 *
 * @param {object} params
 * @param {string} params.resumeText - Plain text extracted from the resume file.
 * @returns {string} Fully assembled, ready-to-send prompt.
 */
export const buildResumeAnalysisPrompt = ({ resumeText }) => `
You are a senior technical recruiter and career strategist with 15+ years of
experience reviewing software-engineering resumes for top-tier technology companies.

Analyse the resume below and respond with ONLY a single valid JSON object.
Rules you MUST follow:
  - Output pure JSON — no markdown code fences, no prose, no comments.
  - Every field listed in the schema is REQUIRED.
  - All arrays must be arrays even when empty.
  - Scores must be integers between 0 and 100 (inclusive).
  - Strings must be plain text — no markdown inside string values.
  - Be specific and actionable. Generic advice ("improve your resume") is rejected.

────────────────────── RESUME START ──────────────────────
${resumeText}
─────────────────────── RESUME END ───────────────────────

Return EXACTLY this JSON structure — no extra keys, no missing keys:

{
  "overallScore": <integer 0-100 — holistic quality: clarity, impact, formatting, relevance>,
  "atsScore": <integer 0-100 — likelihood of passing ATS keyword filters>,

  "strengths": [
    "<specific strength observed in this resume>",
    "..."
  ],

  "weaknesses": [
    "<specific weakness observed in this resume>",
    "..."
  ],

  "missingKeywords": [
    "<keyword or phrase absent from the resume that recruiters and ATS systems look for>",
    "..."
  ],

  "recommendedSkills": [
    "<skill not present or under-represented that would strengthen this candidate's profile>",
    "..."
  ],

  "projectSuggestions": [
    "<actionable suggestion for improving or adding project descriptions>",
    "..."
  ],

  "experienceSuggestions": [
    "<actionable suggestion for improving work experience bullet points>",
    "..."
  ],

  "educationSuggestions": [
    "<actionable suggestion about education section — or empty array if no changes needed>",
    "..."
  ],

  "grammarSuggestions": [
    "<specific grammar, spelling, or language issue found>",
    "..."
  ],

  "formattingSuggestions": [
    "<specific formatting improvement — layout, length, whitespace, section order, etc.>",
    "..."
  ],

  "actionPlan": [
    {
      "priority": "<high | medium | low>",
      "action": "<single concrete action the candidate should take>",
      "rationale": "<one sentence explaining why this action matters>"
    }
  ]
}

Scoring rubric:
  overallScore  — Penalise vague bullet points, missing metrics, unexplained gaps,
                  poor formatting, and generic objective statements.
                  Reward quantified achievements, clear impact, concise language,
                  and logical structure.
  atsScore      — Penalise lack of role-relevant keywords, unusual section headings,
                  tables/columns/images (unreadable by parsers), and non-standard fonts.
                  Reward standard headings, keyword density, and plain-text friendliness.

The actionPlan must be sorted high → medium → low priority.
Provide at minimum 3 action plan items and at most 8.
`.trim();
