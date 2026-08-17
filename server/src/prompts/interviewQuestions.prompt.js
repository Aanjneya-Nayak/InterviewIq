/**
 * interviewQuestions.prompt.js
 *
 * Prompt template for AI interview question generation.
 *
 * WHY PROMPTS ARE SEPARATED
 * ─────────────────────────
 * Prompts are product content — they evolve independently of service logic.
 * Separating them means wording can be tuned without touching controllers
 * or validators.
 *
 * INPUT CONTRACT
 * ──────────────
 * buildInterviewQuestionsPrompt receives:
 *   - resumeText     : plain text extracted from the user's resume
 *   - analysisData   : key fields from the ResumeAnalysis document
 *   - targetRole     : user-selected role (e.g. "Frontend Developer")
 *   - interviewType  : "technical" | "behavioral" | "hr" | "mixed"
 *   - difficulty     : "easy" | "medium" | "hard"
 *   - questionCount  : integer (5 | 10 | 15 | 20)
 *
 * OUTPUT CONTRACT (validated in interview.ai.validation.js)
 * ──────────────────────────────────────────────────────────
 * {
 *   "questions": [
 *     {
 *       "questionId"    : string  — unique slug e.g. "q1"
 *       "question"      : string  — the actual question text
 *       "type"          : "technical"|"behavioral"|"hr"|"project"|"mixed"
 *       "difficulty"    : "easy"|"medium"|"hard"
 *       "topic"         : string  — e.g. "React hooks", "STAR method", "Salary negotiation"
 *       "expectedSkills": string[] — skills the answer should demonstrate
 *       "tips"          : string | null — optional interviewer tip
 *     },
 *     ...  (exactly questionCount items)
 *   ]
 * }
 */

/**
 * Build the interview question generation prompt.
 *
 * @param {object} params
 * @param {string} params.resumeText     - Plain text from the resume
 * @param {object} params.analysisData   - Subset of ResumeAnalysis fields
 * @param {string} params.targetRole     - e.g. "Frontend Developer"
 * @param {string} params.interviewType  - "technical"|"behavioral"|"hr"|"mixed"
 * @param {string} params.difficulty     - "easy"|"medium"|"hard"
 * @param {number} params.questionCount  - How many questions to generate
 * @returns {string} Ready-to-send prompt string
 */
export const buildInterviewQuestionsPrompt = ({
  resumeText,
  analysisData,
  targetRole,
  interviewType,
  difficulty,
  questionCount,
}) => {
  // ── Derive question type distribution from interviewType ─────────────────
  const typeGuide = {
    technical:
      `All ${questionCount} questions must be of type "technical". Focus on coding concepts, system design, algorithms, and technology-specific knowledge relevant to the role.`,
    behavioral:
      `All ${questionCount} questions must be of type "behavioral". Use the STAR format (Situation, Task, Action, Result). Focus on past experiences, teamwork, conflict resolution, and leadership.`,
    hr:
      `All ${questionCount} questions must be of type "hr". Cover culture fit, career goals, salary expectations, strengths/weaknesses, and background.`,
    mixed:
      `Distribute the ${questionCount} questions across types as follows:
  - ~40% technical (type: "technical")
  - ~30% behavioral (type: "behavioral")
  - ~20% project-based (type: "project") — ask about specific projects mentioned in the resume
  - ~10% HR (type: "hr")
  Round counts to the nearest integer. No type should be 0.`,
  }[interviewType];

  // ── Difficulty guidance ────────────────────────────────────────────────────
  const difficultyGuide = {
    easy:
      "Questions should be suitable for junior-level candidates (0–2 years experience). Focus on fundamentals and definitions.",
    medium:
      "Questions should target mid-level candidates (2–5 years). Expect deeper understanding and some design decisions.",
    hard:
      "Questions should challenge senior candidates (5+ years). Require architectural thinking, trade-off analysis, and advanced expertise.",
  }[difficulty];

  // ── Analysis context ────────────────────────────────────────────────────────
  const strengths = analysisData.strengths?.slice(0, 3).join(", ") || "not available";
  const weaknesses = analysisData.weaknesses?.slice(0, 3).join(", ") || "not available";
  const skills = analysisData.recommendedSkills?.slice(0, 5).join(", ") || "not available";

  return `
You are a senior technical interviewer with 15+ years of experience hiring for ${targetRole} positions at top technology companies.

Your task is to generate exactly ${questionCount} personalised interview questions tailored to the candidate below.

────────────────── CANDIDATE CONTEXT ──────────────────
TARGET ROLE     : ${targetRole}
INTERVIEW TYPE  : ${interviewType}
DIFFICULTY      : ${difficulty}

RESUME ANALYSIS HIGHLIGHTS:
  Strengths        : ${strengths}
  Weaknesses       : ${weaknesses}
  Recommended skills to probe: ${skills}

RESUME TEXT:
${resumeText.slice(0, 3000)}${resumeText.length > 3000 ? "\n[... truncated for brevity ...]" : ""}
────────────────── END CONTEXT ──────────────────────────

QUESTION TYPE INSTRUCTIONS:
${typeGuide}

DIFFICULTY INSTRUCTIONS:
${difficultyGuide}

PERSONALISATION RULES (follow all of them):
  1. Reference specific technologies, projects, or companies FROM THE RESUME where relevant.
  2. Probe the candidate's stated weaknesses with at least 1–2 questions.
  3. For project-type questions, name the actual project from the resume.
  4. Do NOT ask about technologies not relevant to ${targetRole}.
  5. Each question must be unique — no duplicates or paraphrases of the same question.
  6. Make questions open-ended (not yes/no).

OUTPUT RULES (strict):
  - Return ONLY a single valid JSON object — no markdown fences, no prose, no comments.
  - The "questions" array must contain EXACTLY ${questionCount} items.
  - questionId must be a unique string like "q1", "q2", ... "q${questionCount}".
  - All fields below are REQUIRED (tips may be null).
  - Strings must be plain text — no markdown inside string values.

Return EXACTLY this JSON structure:

{
  "questions": [
    {
      "questionId": "q1",
      "question": "<the full interview question text>",
      "type": "<technical | behavioral | hr | project | mixed>",
      "difficulty": "<easy | medium | hard>",
      "topic": "<short topic label, e.g. 'React hooks', 'System design', 'Conflict resolution'>",
      "expectedSkills": ["<skill 1>", "<skill 2>"],
      "tips": "<optional interviewer tip for what a strong answer looks like, or null>"
    }
  ]
}
`.trim();
};
