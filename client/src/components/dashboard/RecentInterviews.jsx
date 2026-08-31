import { Link } from "react-router-dom";
import {
  PlayCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  RefreshCw,
} from "lucide-react";
import { formatDate } from "../../lib/format";

/**
 * RecentInterviews
 *
 * Lists the last 5 interviews with key metadata and contextual actions.
 * - Completed → "View Summary" link
 * - In-progress → "Continue" link
 * - Draft → "Open" link
 *
 * Props:
 *   interviews — array from GET /api/dashboard/recent-interviews
 *   loading    — boolean
 *   error      — string | null
 *   onRetry    — () => void
 */

const STATUS_BADGE = {
  completed: "bg-green-100 text-green-700",
  in_progress: "bg-blue-100 text-blue-700",
  draft: "bg-gray-100 text-gray-600",
  abandoned: "bg-red-100 text-red-500",
};

const STATUS_LABEL = {
  completed: "Completed",
  in_progress: "In Progress",
  draft: "Draft",
  abandoned: "Abandoned",
};

const DIFFICULTY_DOT = {
  easy: "bg-green-400",
  medium: "bg-amber-400",
  hard: "bg-red-400",
};

const InterviewRow = ({ interview }) => {
  const isCompleted = interview.status === "completed";
  const isInProgress = interview.status === "in_progress";

  // Build the action link
  const actionHref = isCompleted
    ? `/interview/${interview.id}/complete`
    : `/interview/${interview.id}`;

  const actionLabel = isCompleted
    ? "View Summary"
    : isInProgress
    ? "Continue"
    : "Open";

  const ActionIcon = isInProgress ? PlayCircle : isCompleted ? CheckCircle2 : ArrowRight;

  const answeredCount =
    interview.currentQuestionIndex != null
      ? Math.min(interview.currentQuestionIndex, interview.questionCount)
      : 0;

  return (
    <li className="flex items-center gap-4 py-3.5 border-b border-gray-50 last:border-0">
      {/* Status dot */}
      <div
        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
          DIFFICULTY_DOT[interview.difficulty] ?? "bg-gray-300"
        }`}
        aria-hidden="true"
        title={`Difficulty: ${interview.difficulty}`}
      />

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-gray-800 truncate">
            {interview.targetRole}
          </p>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
              STATUS_BADGE[interview.status] ?? "bg-gray-100 text-gray-500"
            }`}
          >
            {STATUS_LABEL[interview.status] ?? interview.status}
          </span>
        </div>

        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          <span className="text-xs text-gray-400 capitalize">
            {interview.interviewType}
          </span>
          <span className="text-gray-200 text-xs" aria-hidden="true">·</span>
          <span className="text-xs text-gray-400 capitalize">
            {interview.difficulty}
          </span>
          <span className="text-gray-200 text-xs" aria-hidden="true">·</span>
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Clock className="w-3 h-3" aria-hidden="true" />
            {formatDate(interview.createdAt)}
          </span>
        </div>

        {/* Progress bar (only for in_progress) */}
        {isInProgress && interview.questionCount > 0 && (
          <div className="mt-1.5 flex items-center gap-2">
            <div
              className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-[120px]"
              role="progressbar"
              aria-valuenow={answeredCount}
              aria-valuemin={0}
              aria-valuemax={interview.questionCount}
              aria-label={`${answeredCount} of ${interview.questionCount} answered`}
            >
              <div
                className="h-full bg-indigo-500 rounded-full transition-all"
                style={{
                  width: `${(answeredCount / interview.questionCount) * 100}%`,
                }}
              />
            </div>
            <span className="text-[10px] text-gray-400">
              {answeredCount}/{interview.questionCount}
            </span>
          </div>
        )}

        {/* Completed: show question count */}
        {isCompleted && (
          <p className="text-[10px] text-gray-400 mt-0.5">
            {interview.questionCount} questions
          </p>
        )}
      </div>

      {/* Action link */}
      <Link
        to={actionHref}
        className={`shrink-0 inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${
          isInProgress
            ? "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
            : "border-gray-200 bg-white text-gray-600 hover:border-indigo-200 hover:text-indigo-600"
        }`}
        aria-label={`${actionLabel} – ${interview.targetRole}`}
      >
        <ActionIcon className="w-3.5 h-3.5" aria-hidden="true" />
        {actionLabel}
      </Link>
    </li>
  );
};

const RecentInterviews = ({ interviews, loading, error, onRetry }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">Recent Interviews</h3>
        <Link
          to="/interview/setup"
          className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
          aria-label="Start a new interview"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          New
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="flex flex-col items-center py-10 gap-3 text-center">
          <p className="text-sm text-gray-500">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700"
          >
            <RefreshCw className="w-3 h-3" aria-hidden="true" />
            Retry
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {!error && loading && (
        <ul className="space-y-3" aria-busy="true" aria-label="Loading recent interviews">
          {[1, 2, 3].map((i) => (
            <li key={i} className="animate-pulse flex items-center gap-4 py-2">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-200 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-2.5 bg-gray-100 rounded w-1/3" />
              </div>
              <div className="h-7 w-20 bg-gray-100 rounded-lg shrink-0" />
            </li>
          ))}
        </ul>
      )}

      {/* Empty state */}
      {!error && !loading && interviews.length === 0 && (
        <div className="flex flex-col items-center py-10 gap-3 text-center">
          <p className="text-sm font-medium text-gray-500">No interviews yet</p>
          <p className="text-xs text-gray-400">
            Start your first mock interview to see it here.
          </p>
          <Link
            to="/interview/setup"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors mt-1"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Start Interview
          </Link>
        </div>
      )}

      {/* List */}
      {!error && !loading && interviews.length > 0 && (
        <ul aria-label="Recent interview sessions">
          {interviews.map((interview) => (
            <InterviewRow key={interview.id} interview={interview} />
          ))}
        </ul>
      )}
    </div>
  );
};

export default RecentInterviews;
