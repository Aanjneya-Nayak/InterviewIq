import { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  CheckCircle2,
  Clock,
  Briefcase,
  BarChart2,
  Hash,
  Tag,
  Zap,
  SkipForward,
  BrainCircuit,
  Plus,
  ArrowLeft,
} from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Button from "../components/ui/Button";
import useInterviewStore from "../store/useInterviewStore";
import { formatDate, formatDuration } from "../lib/format";
import usePageTitle from "../hooks/usePageTitle";

// ─── Constants ────────────────────────────────────────────────────────────────

const DIFFICULTY_STYLES = {
  easy:   "bg-green-100 text-green-700",
  medium: "bg-amber-100 text-amber-700",
  hard:   "bg-red-100   text-red-600",
};

const TYPE_STYLES = {
  technical: "bg-indigo-100 text-indigo-700",
  behavioral:"bg-purple-100 text-purple-700",
  hr:        "bg-blue-100   text-blue-700",
  project:   "bg-teal-100   text-teal-700",
  mixed:     "bg-gray-100   text-gray-700",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Stat card used in the summary grid */
const StatCard = ({ icon: Icon, iconBg, iconColor, label, value, sub }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
      <Icon className={`w-5 h-5 ${iconColor}`} aria-hidden="true" />
    </div>
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

/** Row for each question in the breakdown table */
const QuestionRow = ({ num, item }) => (
  <li className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
    {/* Number bubble */}
    <span
      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
        item.answered ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
      }`}
      aria-hidden="true"
    >
      {num}
    </span>

    {/* Question text + meta */}
    <div className="flex-1 min-w-0">
      <p className="text-sm text-gray-800 leading-snug line-clamp-2">{item.question}</p>
      <div className="flex flex-wrap gap-1.5 mt-1.5">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${TYPE_STYLES[item.type] ?? "bg-gray-100 text-gray-600"}`}>
          {item.type}
        </span>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${DIFFICULTY_STYLES[item.difficulty] ?? "bg-gray-100 text-gray-600"}`}>
          {item.difficulty}
        </span>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-500">
          {item.topic}
        </span>
      </div>
    </div>

    {/* Status badge */}
    <div className="shrink-0">
      {item.answered ? (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
          Answered
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400">
          <SkipForward className="w-3.5 h-3.5" aria-hidden="true" />
          Skipped
        </span>
      )}
    </div>
  </li>
);

// ─── Loading skeleton ─────────────────────────────────────────────────────────
const Skeleton = () => (
  <div className="min-h-screen bg-gray-50">
    <Navbar />
    <main className="max-w-3xl mx-auto px-4 py-10">
      <div className="animate-pulse space-y-5">
        <div className="h-20 bg-white rounded-2xl border border-gray-100" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-white rounded-2xl border border-gray-100" />)}
        </div>
        <div className="h-64 bg-white rounded-2xl border border-gray-100" />
      </div>
    </main>
  </div>
);

// ─── Main page ────────────────────────────────────────────────────────────────

const InterviewCompletePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { summary, fetching, error, fetchSummary, clearError, clearSummary } =
    useInterviewStore();

  usePageTitle(
    summary?.targetRole ? `${summary.targetRole} — Summary` : "Interview Summary"
  );

  useEffect(() => {
    if (id) fetchSummary(id);
    return () => clearSummary();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (error) { toast.error(error); clearError(); }
  }, [error, clearError]);

  // ── Guards ────────────────────────────────────────────────────────────────
  if (fetching && !summary) return <Skeleton />;

  if (!summary) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-16 text-center">
          <p className="text-gray-500 mb-4">Interview summary not found.</p>
          <Link to="/dashboard" className="text-indigo-600 text-sm hover:underline">
            Back to Dashboard
          </Link>
        </main>
      </div>
    );
  }

  const isFullyAnswered = summary.skippedQuestions === 0;
  const completionPct   = Math.round(
    (summary.answeredQuestions / summary.questionCount) * 100
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

        {/* ── Back link ── */}
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back to Dashboard
        </Link>

        {/* ── Hero banner ── */}
        <div className={`rounded-2xl border p-6 mb-7 ${
          isFullyAnswered
            ? "bg-green-50 border-green-200"
            : "bg-indigo-50 border-indigo-200"
        }`}>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
              isFullyAnswered ? "bg-green-200" : "bg-indigo-200"
            }`}>
              <CheckCircle2
                className={`w-6 h-6 ${isFullyAnswered ? "text-green-700" : "text-indigo-700"}`}
                aria-hidden="true"
              />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${isFullyAnswered ? "text-green-900" : "text-indigo-900"}`}>
                {isFullyAnswered ? "Interview Completed!" : "Interview Finished!"}
              </h1>
              <p className={`text-sm mt-1 ${isFullyAnswered ? "text-green-700" : "text-indigo-700"}`}>
                {isFullyAnswered
                  ? `You answered all ${summary.questionCount} questions for ${summary.targetRole}.`
                  : `You answered ${summary.answeredQuestions} of ${summary.questionCount} questions (${completionPct}%).`}
              </p>
              {summary.completedAt && (
                <p className="text-xs text-gray-500 mt-1">
                  Completed {formatDate(summary.completedAt)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Stats grid ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-7">
          <StatCard
            icon={Briefcase}
            iconBg="bg-indigo-50"
            iconColor="text-indigo-600"
            label="Interview Type"
            value={summary.interviewType}
          />
          <StatCard
            icon={BarChart2}
            iconBg="bg-purple-50"
            iconColor="text-purple-600"
            label="Difficulty"
            value={summary.difficulty}
          />
          <StatCard
            icon={Clock}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
            label="Duration"
            value={formatDuration(summary.totalDuration)}
            sub={summary.startedAt ? `Started ${formatDate(summary.startedAt)}` : undefined}
          />
          <StatCard
            icon={Hash}
            iconBg="bg-green-50"
            iconColor="text-green-600"
            label="Answered"
            value={`${summary.answeredQuestions}/${summary.questionCount}`}
            sub={summary.skippedQuestions > 0 ? `${summary.skippedQuestions} skipped` : "All answered"}
          />
        </div>

        {/* ── Target role ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 mb-7">
          <p className="text-xs text-gray-500 mb-0.5">Target Role</p>
          <p className="text-base font-semibold text-gray-900">{summary.targetRole}</p>
        </div>

        {/* ── Progress bar ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 mb-7">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>Completion</span>
            <span className="font-semibold text-gray-700">{completionPct}%</span>
          </div>
          <div
            className="w-full h-3 bg-gray-100 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={completionPct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isFullyAnswered ? "bg-green-500" : "bg-indigo-500"
              }`}
              style={{ width: `${completionPct}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span className="text-green-600 font-medium">
              {summary.answeredQuestions} answered
            </span>
            {summary.skippedQuestions > 0 && (
              <span className="text-gray-400">
                {summary.skippedQuestions} skipped
              </span>
            )}
          </div>
        </div>

        {/* ── Question breakdown ── */}
        {summary.questionBreakdown?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-7">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Tag className="w-4 h-4 text-gray-400" aria-hidden="true" />
              Question Breakdown
            </h2>
            <ul className="divide-y divide-gray-50" aria-label="Questions answered">
              {summary.questionBreakdown.map((item, i) => (
                <QuestionRow key={item.questionId} num={i + 1} item={item} />
              ))}
            </ul>
          </div>
        )}

        {/* ── Next steps ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-7">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">What's Next?</h2>
          <div className="space-y-3">
            {/* Evaluate button — connects to Phase 9 */}
            <div className="flex items-start gap-4 p-4 rounded-xl border border-dashed border-indigo-200 bg-indigo-50">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                <BrainCircuit className="w-4 h-4 text-indigo-600" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-indigo-900">Analyze My Interview</p>
                <p className="text-xs text-indigo-600 mt-0.5">
                  AI-powered evaluation with scores and feedback for each answer.
                  Coming in the next phase.
                </p>
              </div>
              <Button
                variant="secondary"
                disabled
                className="shrink-0 border-indigo-200 text-indigo-400 cursor-not-allowed opacity-60"
                title="AI evaluation coming soon"
                aria-disabled="true"
              >
                Analyze
              </Button>
            </div>

            {/* Start new interview */}
            <Link to="/interview/setup" className="block">
              <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/40 transition-all group">
                <div className="w-9 h-9 rounded-xl bg-gray-100 group-hover:bg-indigo-100 flex items-center justify-center shrink-0 transition-colors">
                  <Plus className="w-4 h-4 text-gray-500 group-hover:text-indigo-600 transition-colors" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Start New Interview</p>
                  <p className="text-xs text-gray-500 mt-0.5">Practice with a fresh set of questions.</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* ── Bottom actions ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/dashboard" className="w-full sm:w-auto">
            <Button variant="secondary" className="w-full">
              Back to Dashboard
            </Button>
          </Link>
          <Link to="/interview/setup" className="w-full sm:flex-1">
            <Button className="w-full">
              <Plus className="w-4 h-4" aria-hidden="true" />
              New Interview
            </Button>
          </Link>
        </div>

      </main>
    </div>
  );
};

export default InterviewCompletePage;
