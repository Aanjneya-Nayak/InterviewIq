import { useEffect, useRef, useCallback, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  ArrowRight,
  SkipForward,
  Save,
  CheckCircle2,
  Tag,
  Zap,
  Lightbulb,
  ChevronLeft,
  Clock,
  Flag,
  RefreshCw,
} from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Button from "../components/ui/Button";
import ConfirmModal from "../components/ui/ConfirmModal";
import useInterviewStore from "../store/useInterviewStore";
import usePageTitle from "../hooks/usePageTitle";

// ─── Constants ────────────────────────────────────────────────────────────────
const AUTOSAVE_INTERVAL_MS = 10_000;

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

// ─── Elapsed timer hook ───────────────────────────────────────────────────────
/**
 * Returns elapsed seconds since `startedAt`.
 * Ticks every second, pauses when the document is hidden.
 */
const useElapsedTimer = (startedAt) => {
  const [elapsed, setElapsed] = useState(() =>
    startedAt ? Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000) : 0
  );

  useEffect(() => {
    if (!startedAt) return;

    const tick = () => {
      if (!document.hidden) {
        setElapsed(Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
      }
    };

    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;

  const formatted = h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;

  return { elapsed, formatted };
};

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Circular SVG progress ring */
const ProgressRing = ({ progress }) => {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const offset = circ - (progress / 100) * circ;
  return (
    <div className="relative w-12 h-12 shrink-0" aria-label={`${progress}% complete`}>
      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 44 44" aria-hidden="true">
        <circle cx="22" cy="22" r={r} fill="none" stroke="#e5e7eb" strokeWidth="4" />
        <circle
          cx="22" cy="22" r={r} fill="none"
          stroke="#6366f1" strokeWidth="4"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-indigo-600">
        {progress}%
      </span>
    </div>
  );
};

/** Horizontal progress bar with question count label */
const ProgressBar = ({ current, total, answeredCount }) => {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between items-center text-xs text-gray-500 mb-1.5">
        <span className="font-medium">
          Question <span className="text-indigo-600">{current}</span> of {total}
        </span>
        <span>{answeredCount} answered · {total - answeredCount} remaining</span>
      </div>
      <div
        className="w-full h-2 bg-gray-100 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Interview progress"
      >
        <div
          className="h-full bg-indigo-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

/** Autosave indicator */
const AutosaveIndicator = ({ lastSaved, saving }) => (
  <div className="flex items-center gap-1.5 text-xs text-gray-400" aria-live="polite" aria-atomic="true">
    {saving ? (
      <>
        <RefreshCw className="w-3 h-3 animate-spin" aria-hidden="true" />
        <span>Saving…</span>
      </>
    ) : lastSaved ? (
      <>
        <CheckCircle2 className="w-3 h-3 text-green-500" aria-hidden="true" />
        <span>Saved</span>
      </>
    ) : (
      <span className="text-gray-300">Not yet saved</span>
    )}
  </div>
);

/** Elapsed clock display */
const ElapsedClock = ({ formatted }) => (
  <div
    className="flex items-center gap-1.5 text-xs font-mono font-semibold text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1.5"
    aria-label={`Elapsed time: ${formatted}`}
    title="Time elapsed"
  >
    <Clock className="w-3 h-3 text-gray-400" aria-hidden="true" />
    {formatted}
  </div>
);

/** Question navigation dot grid */
const NavDots = ({ questions, answers, currentIdx, onNavigate }) => (
  <div
    className="flex flex-wrap gap-1.5"
    role="list"
    aria-label="Question navigation"
  >
    {questions.map((q, i) => {
      const isAnswered = answers?.some(
        (a) => a.questionId === q.questionId && a.answer?.trim()
      );
      const isCurrent = i === currentIdx;
      return (
        <button
          key={q.questionId}
          type="button"
          role="listitem"
          onClick={() => onNavigate(i)}
          aria-label={`Question ${i + 1}${isAnswered ? " — answered" : " — not answered"}${isCurrent ? " (current)" : ""}`}
          aria-current={isCurrent ? "step" : undefined}
          className={`w-7 h-7 rounded-full text-[11px] font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1 ${
            isCurrent
              ? "bg-indigo-600 text-white shadow-sm"
              : isAnswered
              ? "bg-green-500 text-white"
              : "bg-gray-200 text-gray-500 hover:bg-gray-300"
          }`}
        >
          {i + 1}
        </button>
      );
    })}
  </div>
);

// ─── Loading skeleton ─────────────────────────────────────────────────────────
const Skeleton = () => (
  <div className="min-h-screen bg-gray-50">
    <Navbar />
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-1/4" />
        <div className="h-2 bg-gray-200 rounded w-full" />
        <div className="h-64 bg-white rounded-2xl border border-gray-100" />
        <div className="h-44 bg-white rounded-2xl border border-gray-100" />
        <div className="h-10 bg-gray-100 rounded-xl w-full" />
      </div>
    </main>
  </div>
);

// ─── Main page ────────────────────────────────────────────────────────────────
const InterviewSessionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    currentSession,
    fetching,
    saving,
    completing,
    saveAnswer,
    updateProgress,
    completeSession,
    error,
    clearError,
  } = useInterviewStore();

  const { fetchSession } = useInterviewStore.getState();

  usePageTitle(
    currentSession?.targetRole
      ? `${currentSession.targetRole} — In Progress`
      : "Interview Session"
  );

  // ── Local state ───────────────────────────────────────────────────────────
  const [localAnswer, setLocalAnswer]   = useState("");
  const [lastSaved,   setLastSaved]     = useState(null);
  const [exitModal,   setExitModal]     = useState(false);   // exit confirm
  const [finishModal, setFinishModal]   = useState(false);   // finish confirm (partial)

  const lastSavedAnswerRef = useRef("");
  const autosaveRef        = useRef(null);
  const textareaRef        = useRef(null);

  // ── Timer ─────────────────────────────────────────────────────────────────
  const { formatted: elapsedFormatted } = useElapsedTimer(currentSession?.startedAt);

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (id) fetchSession(id);
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Session recovery: if session hasn't started yet, redirect to lobby ────
  useEffect(() => {
    if (!currentSession) return;
    if (currentSession.status === "draft") {
      navigate(`/interview/${id}`, { replace: true });
    }
    if (currentSession.status === "completed") {
      navigate(`/interview/${id}/complete`, { replace: true });
    }
    if (currentSession.status === "abandoned") {
      navigate(`/interview/${id}`, { replace: true });
    }
  }, [currentSession?.status, id, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync local answer when question changes ───────────────────────────────
  useEffect(() => {
    if (!currentSession) return;
    const a = currentSession.currentAnswer ?? "";
    setLocalAnswer(a);
    lastSavedAnswerRef.current = a;
    // Auto-focus textarea for keyboard flow
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, [currentSession?.currentQuestionIndex, currentSession?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Toast store errors ────────────────────────────────────────────────────
  useEffect(() => {
    if (error) { toast.error(error); clearError(); }
  }, [error, clearError]);

  // ── Core save ─────────────────────────────────────────────────────────────
  const persistAnswer = useCallback(async (answer) => {
    if (!currentSession?.currentQuestion) return false;
    if (answer === lastSavedAnswerRef.current) return true; // no-op

    const result = await saveAnswer(id, currentSession.currentQuestion.questionId, answer);
    if (result.success) {
      lastSavedAnswerRef.current = answer;
      setLastSaved(new Date());
      if (result.isCompleted) {
        toast.success("🎉 All questions answered!");
        navigate(`/interview/${id}/complete`);
      }
    }
    return result.success;
  }, [id, currentSession, saveAnswer, navigate]);

  // ── Autosave every 10 s ───────────────────────────────────────────────────
  useEffect(() => {
    autosaveRef.current = setInterval(() => { persistAnswer(localAnswer); }, AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(autosaveRef.current);
  }, [localAnswer, persistAnswer]);

  // ── beforeunload beacon ───────────────────────────────────────────────────
  useEffect(() => {
    const handle = () => {
      if (!currentSession?.currentQuestion) return;
      if (localAnswer === lastSavedAnswerRef.current) return;
      navigator.sendBeacon(
        `/api/interviews/${id}/save-answer`,
        new Blob(
          [JSON.stringify({ questionId: currentSession.currentQuestion.questionId, answer: localAnswer })],
          { type: "application/json" }
        )
      );
    };
    window.addEventListener("beforeunload", handle);
    return () => window.removeEventListener("beforeunload", handle);
  }, [id, currentSession, localAnswer]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      // Only fire when the target is NOT the textarea (let typing work freely)
      if (e.target === textareaRef.current) return;

      if (e.altKey && e.key === "ArrowRight") { e.preventDefault(); doNext(); }
      if (e.altKey && e.key === "ArrowLeft")  { e.preventDefault(); doPrev(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); doManualSave(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }); // re-registers when callbacks change — intentional

  // ── Navigation helpers ────────────────────────────────────────────────────
  const navigateTo = useCallback(async (targetIdx) => {
    if (!currentSession || targetIdx < 0 || targetIdx >= currentSession.questions.length) return;
    await persistAnswer(localAnswer);
    await updateProgress(id, targetIdx);
    fetchSession(id);
  }, [currentSession, localAnswer, persistAnswer, updateProgress, id, fetchSession]);

  const doPrev        = () => navigateTo((currentSession?.currentQuestionIndex ?? 0) - 1);
  const doNext        = () => navigateTo((currentSession?.currentQuestionIndex ?? 0) + 1);
  const doSkip        = () => navigateTo((currentSession?.currentQuestionIndex ?? 0) + 1);
  const doManualSave  = async () => {
    const ok = await persistAnswer(localAnswer);
    if (ok) toast.success("Answer saved.");
  };

  const doFinishInterview = async () => {
    setFinishModal(false);
    await persistAnswer(localAnswer);
    const result = await completeSession(id);
    if (result.success) {
      toast.success("Interview completed!");
      navigate(`/interview/${id}/complete`);
    }
  };

  const doExit = async () => {
    setExitModal(false);
    await persistAnswer(localAnswer);
    navigate(`/interview/${id}`);
  };

  // ── Guards ────────────────────────────────────────────────────────────────
  if (fetching && !currentSession) return <Skeleton />;

  if (!currentSession || !currentSession.questions?.length) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-16 text-center">
          <p className="text-gray-500 mb-4">Session not found or questions not generated.</p>
          <Link to="/dashboard" className="text-indigo-600 text-sm hover:underline">
            Back to Dashboard
          </Link>
        </main>
      </div>
    );
  }

  const s          = currentSession;
  const q          = s.currentQuestion;
  const idx        = s.currentQuestionIndex;
  const total      = s.questions.length;
  const isFirst    = idx === 0;
  const isLast     = idx === total - 1;
  const answers    = s.answers ?? [];
  const answeredCount = answers.filter((a) => a.answer?.trim()).length;
  const allAnswered   = answeredCount >= total;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-6">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
          <button
            type="button"
            onClick={() => setExitModal(true)}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors focus:outline-none focus:underline"
            aria-label="Exit interview session"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Exit
          </button>

          <div className="flex items-center gap-3 flex-wrap justify-end">
            <ElapsedClock formatted={elapsedFormatted} />
            <AutosaveIndicator lastSaved={lastSaved} saving={saving} />
            <ProgressRing progress={s.progress} />
          </div>
        </div>

        {/* ── Progress bar ── */}
        <div className="mb-5">
          <ProgressBar current={idx + 1} total={total} answeredCount={answeredCount} />
        </div>

        {/* ── Session recovery banner (visible on resume) ── */}
        {s.progress > 0 && answeredCount > 0 && idx > 0 && (
          <div
            className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2.5 mb-5 text-xs text-indigo-700"
            role="status"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-400 shrink-0" aria-hidden="true" />
            Session restored — you were on question {idx + 1}.
            {answeredCount > 0 && ` ${answeredCount} answer${answeredCount !== 1 ? "s" : ""} saved.`}
          </div>
        )}

        {/* ── Question card ── */}
        {q ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${TYPE_STYLES[q.type] ?? "bg-gray-100 text-gray-600"}`}
              >
                <Tag className="w-3 h-3" aria-hidden="true" />
                {q.type}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${DIFFICULTY_STYLES[q.difficulty] ?? "bg-gray-100 text-gray-600"}`}
              >
                <Zap className="w-3 h-3" aria-hidden="true" />
                {q.difficulty}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                {q.topic}
              </span>
            </div>

            {/* Number + question */}
            <p className="text-xs font-semibold text-indigo-500 mb-1.5">
              Question {idx + 1} of {total}
            </p>
            <h2 className="text-lg font-semibold text-gray-900 leading-relaxed">
              {q.question}
            </h2>

            {/* Expected skills */}
            {q.expectedSkills?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2" aria-label="Expected skills">
                {q.expectedSkills.map((skill) => (
                  <span
                    key={skill}
                    className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 text-xs font-medium border border-indigo-100"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}

            {/* Tips */}
            {q.tips && (
              <div className="mt-4 flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-xs text-amber-700 leading-relaxed">{q.tips}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm mb-4">
            No question loaded. Use the navigation below.
          </div>
        )}

        {/* ── Answer area ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
          <div className="flex items-center justify-between mb-3">
            <label
              htmlFor="answer-textarea"
              className="text-sm font-semibold text-gray-700"
            >
              Your Answer
            </label>
            <span
              className={`text-xs tabular-nums ${localAnswer.length > 4500 ? "text-red-500 font-semibold" : "text-gray-400"}`}
              aria-live="polite"
            >
              {localAnswer.length.toLocaleString()} / 5,000
            </span>
          </div>
          <textarea
            id="answer-textarea"
            ref={textareaRef}
            value={localAnswer}
            onChange={(e) => setLocalAnswer(e.target.value)}
            maxLength={5000}
            rows={9}
            placeholder="Type your answer here…&#10;&#10;Tip: Your progress is autosaved every 10 seconds."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors leading-relaxed"
            aria-label="Your answer to the current question"
            aria-describedby="answer-shortcuts"
          />
          <p
            id="answer-shortcuts"
            className="text-xs text-gray-400 mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5"
          >
            <span>Autosaves every 10s</span>
            <span aria-hidden="true">·</span>
            <span>
              <kbd className="font-mono bg-gray-100 px-1 rounded text-[10px]">Alt+→</kbd> next
              &nbsp;
              <kbd className="font-mono bg-gray-100 px-1 rounded text-[10px]">Alt+←</kbd> prev
              &nbsp;
              <kbd className="font-mono bg-gray-100 px-1 rounded text-[10px]">Ctrl+S</kbd> save
            </span>
          </p>
        </div>

        {/* ── Action buttons ── */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {/* Previous */}
          <Button
            variant="secondary"
            onClick={doPrev}
            disabled={isFirst || saving || completing || fetching}
            aria-label="Go to previous question (Alt+Left)"
            className="gap-1.5"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            Previous
          </Button>

          {/* Save */}
          <Button
            variant="secondary"
            onClick={doManualSave}
            loading={saving}
            aria-label="Save current answer (Ctrl+S)"
          >
            <Save className="w-4 h-4" aria-hidden="true" />
            Save
          </Button>

          {/* Skip — only when not last question */}
          {!isLast && (
            <Button
              variant="secondary"
              onClick={doSkip}
              disabled={saving || completing || fetching}
              aria-label="Skip this question"
            >
              <SkipForward className="w-4 h-4" aria-hidden="true" />
              Skip
            </Button>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Finish Interview (available from any question) */}
          {!allAnswered && (
            <Button
              variant="secondary"
              onClick={() => setFinishModal(true)}
              disabled={saving || completing}
              className="border-amber-300 text-amber-700 hover:bg-amber-50"
              aria-label="Finish interview early"
            >
              <Flag className="w-4 h-4" aria-hidden="true" />
              Finish
            </Button>
          )}

          {/* Next / Complete */}
          {isLast ? (
            <Button
              onClick={allAnswered ? doFinishInterview : () => setFinishModal(true)}
              loading={completing}
              disabled={saving}
              aria-label={allAnswered ? "Complete interview" : "Finish interview"}
            >
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              {allAnswered ? "Complete" : "Finish"}
            </Button>
          ) : (
            <Button
              onClick={doNext}
              disabled={saving || completing || fetching}
              aria-label="Next question (Alt+Right)"
            >
              Next
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Button>
          )}
        </div>

        {/* ── Bottom strip: nav dots + stats ── */}
        <div className="border-t border-gray-100 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <NavDots
            questions={s.questions}
            answers={answers}
            currentIdx={idx}
            onNavigate={navigateTo}
          />

          <div className="flex items-center gap-4 text-xs text-gray-400 shrink-0">
            <span>
              <span className="font-semibold text-gray-700">{answeredCount}</span>/{total} answered
            </span>
            <span>
              <span className="font-semibold text-gray-700">{total - answeredCount}</span> remaining
            </span>
          </div>
        </div>

      </main>

      {/* ── Exit confirmation modal ── */}
      <ConfirmModal
        isOpen={exitModal}
        title="Exit interview?"
        description="Your progress is saved. You can resume this interview at any time from the session details page."
        confirmLabel="Exit"
        onConfirm={doExit}
        onCancel={() => setExitModal(false)}
      />

      {/* ── Finish early confirmation modal ── */}
      <ConfirmModal
        isOpen={finishModal}
        title="Finish interview?"
        description={`You have answered ${answeredCount} of ${total} questions. Unanswered questions will be marked as skipped. This cannot be undone.`}
        confirmLabel="Finish Interview"
        onConfirm={doFinishInterview}
        onCancel={() => setFinishModal(false)}
        loading={completing}
      />
    </div>
  );
};

export default InterviewSessionPage;
