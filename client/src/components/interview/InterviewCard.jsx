import { useState } from "react";
import { Link } from "react-router-dom";
import {
  PlayCircle,
  CheckCircle2,
  ArrowRight,
  Trash2,
  Clock,
  Hash,
  BarChart2,
  Briefcase,
} from "lucide-react";
import ConfirmModal from "../ui/ConfirmModal";
import { formatDate, formatDuration } from "../../lib/format";

/**
 * InterviewCard
 *
 * A single row / card in the interview history list.
 * Adapts its primary action based on session status:
 *   draft        → "Open"     → /interview/:id
 *   in_progress  → "Continue" → /interview/:id/session  (blue accent)
 *   completed    → "Summary"  → /interview/:id/complete (green accent)
 *   abandoned    → "View"     → /interview/:id
 *
 * Props:
 *   session   — InterviewSession document from the API
 *   onDelete  — async (id: string) => void — called after confirmation
 *   deleting  — boolean — true while this specific session is being deleted
 */

// ─── Visual constants ─────────────────────────────────────────────────────────

const STATUS_BADGE = {
  draft:       "bg-gray-100 text-gray-600",
  in_progress: "bg-blue-100 text-blue-700",
  completed:   "bg-green-100 text-green-700",
  abandoned:   "bg-red-100  text-red-600",
};

const STATUS_LABEL = {
  draft:       "Draft",
  in_progress: "In Progress",
  completed:   "Completed",
  abandoned:   "Abandoned",
};

const DIFFICULTY_STYLES = {
  easy:   "bg-green-100 text-green-700",
  medium: "bg-amber-100 text-amber-700",
  hard:   "bg-red-100   text-red-600",
};

const TYPE_STYLES = {
  technical: "bg-indigo-100 text-indigo-700",
  behavioral:"bg-purple-100 text-purple-700",
  hr:        "bg-blue-100   text-blue-700",
  mixed:     "bg-gray-100   text-gray-600",
};

// ─── Action helper ─────────────────────────────────────────────────────────────

const getAction = (session) => {
  switch (session.status) {
    case "in_progress":
      return {
        label: "Continue",
        href: `/interview/${session._id}/session`,
        icon: PlayCircle,
        style:
          "bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-600",
      };
    case "completed":
      return {
        label: "Summary",
        href: `/interview/${session._id}/complete`,
        icon: CheckCircle2,
        style:
          "bg-green-600 text-white hover:bg-green-700 border-green-600",
      };
    default:
      return {
        label: "Open",
        href: `/interview/${session._id}`,
        icon: ArrowRight,
        style:
          "bg-white text-gray-700 border-gray-300 hover:border-indigo-300 hover:text-indigo-600",
      };
  }
};

// ─── Progress bar (in_progress only) ─────────────────────────────────────────

const ProgressBar = ({ progress, answeredQuestions, questionCount }) => {
  const pct = progress ?? 0;
  const answered = answeredQuestions ?? 0;
  return (
    <div className="mt-3">
      <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
        <span>{answered} of {questionCount} answered</span>
        <span className="font-medium text-indigo-600">{pct}%</span>
      </div>
      <div
        className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${pct}% complete`}
      >
        <div
          className="h-full bg-indigo-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const InterviewCard = ({ session, onDelete, deleting = false }) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const action = getAction(session);
  const ActionIcon = action.icon;

  const isCompleted  = session.status === "completed";
  const isInProgress = session.status === "in_progress";

  // Answered count for in_progress: use live answers array if available,
  // fall back to answeredQuestions field
  const liveAnswered = Array.isArray(session.answers)
    ? session.answers.filter((a) => a.answer?.trim().length > 0).length
    : (session.answeredQuestions ?? 0);

  const handleConfirmDelete = async () => {
    await onDelete(session._id);
    setConfirmOpen(false);
  };

  return (
    <>
      <article
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-gray-200 transition-all"
        aria-label={`Interview: ${session.targetRole}`}
      >
        {/* ── Top row: role + status badge ── */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 truncate">
              {session.targetRole}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Created {formatDate(session.createdAt)}
            </p>
          </div>
          <span
            className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
              STATUS_BADGE[session.status] ?? "bg-gray-100 text-gray-500"
            }`}
          >
            {STATUS_LABEL[session.status] ?? session.status}
          </span>
        </div>

        {/* ── Badges row: type + difficulty ── */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
              TYPE_STYLES[session.interviewType] ?? "bg-gray-100 text-gray-600"
            }`}
          >
            <Briefcase className="w-3 h-3" aria-hidden="true" />
            {session.interviewType}
          </span>
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
              DIFFICULTY_STYLES[session.difficulty] ?? "bg-gray-100 text-gray-600"
            }`}
          >
            <BarChart2 className="w-3 h-3" aria-hidden="true" />
            {session.difficulty}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600">
            <Hash className="w-3 h-3" aria-hidden="true" />
            {session.questionCount} questions
          </span>
        </div>

        {/* ── Stats row: answered / skipped / duration ── */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mb-3">
          {isCompleted && (
            <>
              <span className="text-green-600 font-medium">
                ✓ {session.answeredQuestions ?? liveAnswered} answered
              </span>
              {(session.skippedQuestions ?? 0) > 0 && (
                <span className="text-gray-400">
                  {session.skippedQuestions} skipped
                </span>
              )}
            </>
          )}

          {session.totalDuration != null && session.totalDuration > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" aria-hidden="true" />
              {formatDuration(session.totalDuration)}
            </span>
          )}

          {isCompleted && session.completedAt && (
            <span className="text-gray-400">
              Completed {formatDate(session.completedAt)}
            </span>
          )}
        </div>

        {/* ── In-progress: progress bar ── */}
        {isInProgress && (
          <ProgressBar
            progress={session.progress}
            answeredQuestions={liveAnswered}
            questionCount={session.questionCount}
          />
        )}

        {/* ── Actions row ── */}
        <div className="flex items-center gap-2 mt-4">
          <Link
            to={action.href}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${action.style}`}
            aria-label={`${action.label} – ${session.targetRole}`}
          >
            <ActionIcon className="w-4 h-4" aria-hidden="true" />
            {action.label}
          </Link>

          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={deleting}
            className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1 disabled:opacity-50"
            aria-label={`Delete interview: ${session.targetRole}`}
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </article>

      <ConfirmModal
        isOpen={confirmOpen}
        title="Delete interview?"
        description={`"${session.targetRole}" will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => !deleting && setConfirmOpen(false)}
      />
    </>
  );
};

export default InterviewCard;
