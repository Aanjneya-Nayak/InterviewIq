import { useEffect } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  BrainCircuit,
  RefreshCw,
  AlertCircle,
  FileText,
  Info,
  AlertTriangle,
} from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Button from "../components/ui/Button";
import AnalysisSkeleton from "../components/analysis/AnalysisSkeleton";
import AnalysisResult from "../components/analysis/AnalysisResult";
import useAnalysisStore from "../store/useAnalysisStore";
import { formatDate } from "../lib/format";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns true if the current resume was uploaded AFTER the last analysis ran.
 * This means the analysis is stale and should be re-run.
 */
const isAnalysisStale = (analysis, currentResume) => {
  if (!analysis || !currentResume) return false;
  const resumeChanged =
    currentResume._id &&
    analysis.resumeRef &&
    currentResume._id.toString() !== analysis.resumeRef.toString();
  if (resumeChanged) return true;
  // Same resume doc but file was replaced (uploadedAt is newer than analysedAt)
  const resumeUploadedAt = new Date(currentResume.uploadedAt ?? 0);
  const analysedAt = new Date(analysis.analysedAt ?? 0);
  return resumeUploadedAt > analysedAt;
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const PageHeader = ({ analysis, analyzing, onAnalyse }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Resume Analysis</h1>
      <p className="text-gray-500 mt-1">
        AI-powered feedback on your resume&apos;s quality, ATS compatibility, and
        actionable improvements.
      </p>
    </div>
    <Button
      onClick={onAnalyse}
      loading={analyzing}
      disabled={analyzing}
      className="shrink-0 sm:self-start"
      aria-label={analysis ? "Re-analyse resume" : "Analyse resume"}
    >
      {!analyzing && <BrainCircuit className="w-4 h-4" aria-hidden="true" />}
      {analysis ? "Re-analyse" : "Analyse Resume"}
    </Button>
  </div>
);

/** Banner showing which resume this analysis is based on + stale warning */
const AnalysisSourceBanner = ({ analysis, currentResume, onAnalyse, analyzing }) => {
  const stale = isAnalysisStale(analysis, currentResume);
  const fileName =
    analysis.resumeFileName ||
    currentResume?.originalFileName ||
    "Unknown file";

  if (stale) {
    return (
      <div
        role="alert"
        className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4"
      >
        <AlertTriangle
          className="w-5 h-5 text-amber-500 shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-800">
            Analysis is out of date
          </p>
          <p className="text-xs text-amber-600 mt-0.5 leading-relaxed">
            You replaced your resume with{" "}
            <span className="font-medium">{currentResume?.originalFileName}</span>{" "}
            after this analysis ran. The scores below are still based on{" "}
            <span className="font-medium">{fileName}</span>. Re-analyse to get
            up-to-date results.
          </p>
        </div>
        <Button
          onClick={onAnalyse}
          loading={analyzing}
          disabled={analyzing}
          className="shrink-0 px-3 py-1.5 text-sm"
        >
          {!analyzing && <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />}
          Re-analyse
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-5 py-3">
      <FileText className="w-4 h-4 text-gray-400 shrink-0" aria-hidden="true" />
      <p className="text-xs text-gray-500 flex-1 min-w-0">
        Analysed:{" "}
        <span className="font-semibold text-gray-700 truncate">
          {fileName}
        </span>
        {analysis.analysedAt && (
          <span className="ml-2 text-gray-400">
            · {formatDate(analysis.analysedAt)}
          </span>
        )}
      </p>
    </div>
  );
};

const ErrorBanner = ({ message, onRetry, onDismiss }) => (
  <div
    role="alert"
    className="flex items-start gap-4 bg-red-50 border border-red-200 rounded-xl px-5 py-4"
  >
    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" aria-hidden="true" />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-red-800">{message}</p>
      <p className="text-xs text-red-600 mt-0.5">
        Check your resume is uploaded, then try again.
      </p>
    </div>
    <div className="flex items-center gap-2 shrink-0">
      <Button
        variant="secondary"
        onClick={onRetry}
        className="px-3 py-1.5 text-sm"
        aria-label="Retry analysis"
      >
        <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
        Retry
      </Button>
      <button
        type="button"
        onClick={onDismiss}
        className="text-red-400 hover:text-red-600 text-xs underline focus:outline-none"
        aria-label="Dismiss error"
      >
        Dismiss
      </button>
    </div>
  </div>
);

const NoResumeState = () => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-12 flex flex-col items-center text-center gap-4">
    <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center">
      <FileText className="w-7 h-7 text-indigo-400" aria-hidden="true" />
    </div>
    <div>
      <h2 className="text-base font-semibold text-gray-800">No resume on file</h2>
      <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">
        Upload a PDF or DOCX resume first, then come back here to run your
        AI-powered analysis.
      </p>
    </div>
    <Link
      to="/resume"
      className="inline-flex items-center gap-2 text-sm font-medium bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
    >
      <FileText className="w-4 h-4" aria-hidden="true" />
      Go to Resume
    </Link>
  </div>
);

const EmptyAnalysisState = ({ currentResume, onAnalyse, analyzing }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-12 flex flex-col items-center text-center gap-4">
    <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center">
      <BrainCircuit className="w-7 h-7 text-indigo-400" aria-hidden="true" />
    </div>
    <div>
      <h2 className="text-base font-semibold text-gray-800">No analysis yet</h2>
      {currentResume && (
        <p className="text-xs text-gray-400 mt-1 flex items-center justify-center gap-1.5">
          <FileText className="w-3.5 h-3.5" aria-hidden="true" />
          {currentResume.originalFileName}
        </p>
      )}
      <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">
        Run your first analysis to get an overall score, ATS score, improvement
        suggestions, and a prioritised action plan.
      </p>
    </div>
    <Button
      onClick={onAnalyse}
      loading={analyzing}
      disabled={analyzing}
      aria-label="Run first analysis"
    >
      {!analyzing && <BrainCircuit className="w-4 h-4" aria-hidden="true" />}
      Analyse My Resume
    </Button>
    <div className="flex items-start gap-2 mt-1 text-left max-w-sm mx-auto bg-gray-50 rounded-lg px-4 py-3">
      <Info className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" aria-hidden="true" />
      <p className="text-xs text-gray-500 leading-relaxed">
        Analysis uses Gemini to evaluate your resume against real recruiter
        expectations. Re-run anytime after you replace your resume.
      </p>
    </div>
  </div>
);

const AnalyzingBanner = ({ fileName }) => (
  <div
    role="status"
    aria-live="polite"
    className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-xl px-5 py-4"
  >
    <BrainCircuit
      className="w-5 h-5 text-indigo-500 shrink-0 animate-pulse"
      aria-hidden="true"
    />
    <div>
      <p className="text-sm font-medium text-indigo-800">
        Analysing{fileName ? ` "${fileName}"` : " your resume"}…
      </p>
      <p className="text-xs text-indigo-500 mt-0.5">
        This usually takes 10–30 seconds. Please don&apos;t close the page.
      </p>
    </div>
  </div>
);

const TipsSidebar = () => (
  <aside
    className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 lg:sticky lg:top-24"
    aria-label="Analysis tips"
  >
    <div className="flex items-center gap-2 mb-4">
      <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
        <Info className="w-4 h-4 text-indigo-600" aria-hidden="true" />
      </div>
      <h2 className="text-sm font-semibold text-gray-800">Tips</h2>
    </div>
    <ul className="space-y-2.5" role="list">
      {[
        "Re-analyse after replacing your resume to see updated scores.",
        "Aim for an ATS score above 70 to pass automated screening.",
        "Address high-priority action items first for biggest gains.",
        "Add missing keywords from job descriptions you're targeting.",
        "Quantify achievements with numbers, percentages, or time saved.",
      ].map((tip) => (
        <li key={tip} className="flex items-start gap-2">
          <span
            className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-400"
            aria-hidden="true"
          />
          <span className="text-xs text-gray-600 leading-relaxed">{tip}</span>
        </li>
      ))}
    </ul>
  </aside>
);

// ─── Page ────────────────────────────────────────────────────────────────────
const AnalysisPage = () => {
  const {
    analysis,
    currentResume,
    fetching,
    analyzing,
    error,
    fetchAnalysis,
    runAnalysis,
    clearError,
  } = useAnalysisStore();

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  const handleAnalyse = async () => {
    const result = await runAnalysis();
    if (result.success) {
      toast.success("Analysis complete!");
    } else {
      toast.error(result.message);
    }
  };

  // ── Initial page load skeleton ────────────────────────────────────────────
  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="mb-8">
            <div className="animate-pulse h-8 bg-gray-200 rounded w-56 mb-2" />
            <div className="animate-pulse h-4 bg-gray-200 rounded w-96" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2">
              <AnalysisSkeleton />
            </div>
            <div className="animate-pulse h-64 bg-gray-200 rounded-xl" />
          </div>
        </main>
      </div>
    );
  }

  const isNoResume =
    !currentResume ||
    (error &&
      (error.toLowerCase().includes("no resume") ||
        error.toLowerCase().includes("upload a resume")));

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <PageHeader
          analysis={analysis}
          analyzing={analyzing}
          onAnalyse={handleAnalyse}
        />

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-5">

            {/* Error banner (non-resume errors) */}
            {error && !isNoResume && (
              <ErrorBanner
                message={error}
                onRetry={handleAnalyse}
                onDismiss={clearError}
              />
            )}

            {/* No resume uploaded */}
            {isNoResume && !analyzing && <NoResumeState />}

            {/* AI running */}
            {analyzing && (
              <>
                <AnalyzingBanner fileName={currentResume?.originalFileName} />
                <AnalysisSkeleton analyzing />
              </>
            )}

            {/* No analysis yet */}
            {!analyzing && !error && !analysis && !isNoResume && (
              <EmptyAnalysisState
                currentResume={currentResume}
                onAnalyse={handleAnalyse}
                analyzing={analyzing}
              />
            )}

            {/* Results */}
            {!analyzing && analysis && (
              <>
                {/* Which resume / staleness banner */}
                <AnalysisSourceBanner
                  analysis={analysis}
                  currentResume={currentResume}
                  onAnalyse={handleAnalyse}
                  analyzing={analyzing}
                />
                <AnalysisResult analysis={analysis} />
              </>
            )}
          </div>

          <div className="lg:col-span-1">
            <TipsSidebar />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AnalysisPage;
