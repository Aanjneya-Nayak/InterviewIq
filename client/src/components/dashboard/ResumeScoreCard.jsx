import { Link } from "react-router-dom";
import { BrainCircuit, FileText, ArrowRight } from "lucide-react";
import ScoreRing from "../analysis/ScoreRing";

/**
 * ResumeScoreCard
 *
 * Displays Overall Score and ATS Score from the dashboard overview.
 * Shows a meaningful empty state when no resume or no analysis exists.
 *
 * Props:
 *   resumeOverallScore — number | null
 *   atsScore           — number | null
 *   hasResume          — boolean (resume uploaded but maybe no analysis)
 */
const ResumeScoreCard = ({ resumeOverallScore, atsScore, hasResume }) => {
  const hasScores =
    resumeOverallScore !== null && resumeOverallScore !== undefined;

  // ── Empty: no resume at all ────────────────────────────────────────────
  if (!hasResume) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center text-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
          <FileText className="w-6 h-6 text-gray-400" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-700">No resume uploaded</p>
          <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
            Upload a PDF or DOCX resume to unlock AI-powered scoring and analysis.
          </p>
        </div>
        <Link
          to="/resume"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          Upload resume
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  // ── Empty: resume exists but no analysis run yet ───────────────────────
  if (!hasScores) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center text-center gap-4">
        <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center">
          <BrainCircuit className="w-6 h-6 text-indigo-400" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-700">No analysis yet</p>
          <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
            Run an AI analysis to see your Overall Score and ATS compatibility.
          </p>
        </div>
        <Link
          to="/analysis"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          Analyse my resume
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  // ── Scores present ─────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-gray-700">Resume Scores</h3>
        <Link
          to="/analysis"
          className="text-xs font-medium text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 transition-colors"
          aria-label="View full analysis"
        >
          View report
          <ArrowRight className="w-3 h-3" aria-hidden="true" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col items-center gap-2">
          <ScoreRing score={resumeOverallScore} label="Overall Score" size={96} />
        </div>
        <div className="flex flex-col items-center gap-2">
          <ScoreRing score={atsScore ?? 0} label="ATS Score" size={96} />
        </div>
      </div>
    </div>
  );
};

export default ResumeScoreCard;
