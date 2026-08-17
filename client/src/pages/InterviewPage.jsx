import { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  BrainCircuit,
  Clock,
  BarChart2,
  Briefcase,
  Hash,
  ArrowLeft,
  Play,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "../components/layout/Navbar";
import Button from "../components/ui/Button";
import useInterviewStore from "../store/useInterviewStore";
import { formatDate } from "../lib/format";

/**
 * InterviewPage — session detail / lobby view at /interview/:id.
 *
 * Shows session metadata and the "Generate & Start" button which calls
 * POST /api/interviews/:id/start to trigger Gemini question generation.
 * On success, navigates to /interview/:id/session (the active interview UI).
 */

const STATUS_COLORS = {
  draft: "bg-gray-100 text-gray-600",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  abandoned: "bg-red-100 text-red-600",
};

const STATUS_LABELS = {
  draft: "Draft",
  in_progress: "In Progress",
  completed: "Completed",
  abandoned: "Abandoned",
};

const MetaRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
      <Icon className="w-4 h-4 text-gray-500" aria-hidden="true" />
    </div>
    <div className="flex-1 flex items-center justify-between">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-800 capitalize">{value}</span>
    </div>
  </div>
);

const InterviewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    currentSession,
    fetching,
    starting,
    updating,
    fetchSession,
    startSession,
    updateStatus,
    error,
    clearError,
  } = useInterviewStore();

  useEffect(() => {
    if (id) fetchSession(id);
  }, [id, fetchSession]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  // "Generate & Start" — calls Gemini, then navigates to the session page
  const handleStart = async () => {
    const result = await startSession(id);
    if (result.success) {
      toast.success("Questions generated! Let's go 🎯");
      navigate(`/interview/${id}/session`);
    }
  };

  // Resume an in_progress session
  const handleResume = () => {
    navigate(`/interview/${id}/session`);
  };

  const handleAbandon = async () => {
    const result = await updateStatus(id, "abandoned");
    if (result.success) {
      toast("Session marked as abandoned.", { icon: "⚠️" });
      navigate("/dashboard");
    }
  };

  // ── Skeleton ────────────────────────────────────────────────────────────────
  if (fetching && !currentSession) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-10">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="h-40 bg-white rounded-2xl border border-gray-100" />
            <div className="h-56 bg-white rounded-2xl border border-gray-100" />
          </div>
        </main>
      </div>
    );
  }

  if (!currentSession) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-10 text-center">
          <p className="text-gray-500 mb-4">Session not found.</p>
          <Link to="/dashboard" className="text-indigo-600 text-sm hover:underline">
            Back to Dashboard
          </Link>
        </main>
      </div>
    );
  }

  const s = currentSession;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">

        {/* ── Header ── */}
        <div className="mb-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back to Dashboard
          </Link>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 capitalize">
                {s.targetRole}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Created {formatDate(s.createdAt)}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[s.status]}`}>
              {STATUS_LABELS[s.status]}
            </span>
          </div>
        </div>

        {/* ── Session metadata ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Session Details</h2>
          <MetaRow icon={Briefcase} label="Interview Type" value={s.interviewType} />
          <MetaRow icon={BarChart2} label="Difficulty" value={s.difficulty} />
          <MetaRow icon={Hash} label="Questions" value={`${s.questionCount} questions`} />
          {s.startedAt && (
            <MetaRow icon={Clock} label="Started" value={formatDate(s.startedAt)} />
          )}
          {s.completedAt && (
            <MetaRow icon={Clock} label="Completed" value={formatDate(s.completedAt)} />
          )}
          {s.totalDuration != null && (
            <MetaRow
              icon={Clock}
              label="Duration"
              value={`${Math.floor(s.totalDuration / 60)}m ${s.totalDuration % 60}s`}
            />
          )}
          {s.progress > 0 && (
            <MetaRow icon={CheckCircle2} label="Progress" value={`${s.progress}%`} />
          )}
        </div>

        {/* ── Status-dependent action area ── */}
        {s.status === "draft" && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <BrainCircuit className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-indigo-800">
                  Ready to generate your questions?
                </p>
                <p className="text-xs text-indigo-600 mt-0.5">
                  Gemini will generate {s.questionCount} personalised {s.interviewType} questions
                  for a {s.targetRole} role at {s.difficulty} difficulty.
                  This takes 5–15 seconds.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleStart}
                loading={starting}
                className="w-full sm:flex-1"
              >
                <Play className="w-4 h-4" aria-hidden="true" />
                {starting ? "Generating questions…" : "Generate & Start"}
              </Button>
              <Button
                variant="secondary"
                onClick={handleAbandon}
                disabled={starting}
                className="w-full sm:w-auto"
              >
                Abandon
              </Button>
            </div>
          </div>
        )}

        {s.status === "in_progress" && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mb-6">
            <p className="text-sm font-semibold text-blue-800 mb-1">
              Interview in progress — {s.progress}% complete
            </p>
            <p className="text-xs text-blue-600 mb-4">
              {s.answers?.filter((a) => a.answer?.length > 0).length ?? 0} of{" "}
              {s.questionCount} questions answered.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={handleResume} className="w-full sm:flex-1">
                Resume Interview
              </Button>
              <Button
                variant="secondary"
                onClick={handleAbandon}
                disabled={updating}
                className="w-full sm:w-auto"
              >
                Abandon
              </Button>
            </div>
          </div>
        )}

        {s.status === "completed" && (
          <div className="bg-green-50 border border-green-100 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" aria-hidden="true" />
              <p className="text-sm font-semibold text-green-800">
                Interview completed!
              </p>
            </div>
            <p className="text-xs text-green-600 mb-4">
              All {s.questionCount} questions answered.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to={`/interview/${id}/complete`} className="w-full sm:flex-1">
                <Button className="w-full">View Summary</Button>
              </Link>
              <Link to="/interview/setup" className="w-full sm:w-auto">
                <Button variant="secondary" className="w-full">
                  Start New Interview
                </Button>
              </Link>
            </div>
          </div>
        )}

        {s.status === "abandoned" && (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-6">
            <p className="text-sm text-gray-600 mb-4">
              This session was abandoned.
            </p>
            <Link to="/interview/setup">
              <Button variant="secondary" className="w-full sm:w-auto">
                Start New Interview
              </Button>
            </Link>
          </div>
        )}

      </main>
    </div>
  );
};

export default InterviewPage;
