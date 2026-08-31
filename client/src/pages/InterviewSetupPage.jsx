import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import {
  BrainCircuit,
  ChevronRight,
  Briefcase,
  Layers,
  BarChart2,
  Hash,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Button from "../components/ui/Button";
import useInterviewStore from "../store/useInterviewStore";
import useResumeStore from "../store/useResumeStore";
import useAnalysisStore from "../store/useAnalysisStore";
import usePageTitle from "../hooks/usePageTitle";

// ─── Configuration options (mirror server-side constants) ────────────────────

const INTERVIEW_TYPES = [
  {
    value: "technical",
    label: "Technical",
    description: "DSA, system design, coding concepts",
  },
  {
    value: "behavioral",
    label: "Behavioral",
    description: "Situational & competency-based questions",
  },
  {
    value: "hr",
    label: "HR",
    description: "Culture fit, salary, background questions",
  },
  {
    value: "mixed",
    label: "Mixed",
    description: "Combination of technical + behavioral",
  },
];

const DIFFICULTIES = [
  {
    value: "easy",
    label: "Easy",
    color: "text-green-600",
    border: "border-green-400",
    bg: "bg-green-50",
    selectedBg: "bg-green-100",
  },
  {
    value: "medium",
    label: "Medium",
    color: "text-amber-600",
    border: "border-amber-400",
    bg: "bg-amber-50",
    selectedBg: "bg-amber-100",
  },
  {
    value: "hard",
    label: "Hard",
    color: "text-red-600",
    border: "border-red-400",
    bg: "bg-red-50",
    selectedBg: "bg-red-100",
  },
];

const PRESET_ROLES = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "MERN Stack Developer",
  "Java Developer",
  "AI/ML Engineer",
];

const QUESTION_COUNTS = [5, 10, 15, 20];

// ─── Sub-components ───────────────────────────────────────────────────────────

/**
 * Section card wrapper keeps each config block visually grouped.
 */
const SectionCard = ({ icon: Icon, iconBg, iconColor, title, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
    <div className="flex items-center gap-3 mb-5">
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}
      >
        <Icon className={`w-4 h-4 ${iconColor}`} aria-hidden="true" />
      </div>
      <h2 className="text-base font-semibold text-gray-800">{title}</h2>
    </div>
    {children}
  </div>
);

/**
 * Pill-style selectable tile used for interview type and question count.
 */
const SelectTile = ({ label, description, selected, onClick, colorClass = "" }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${
      selected
        ? "border-indigo-500 bg-indigo-50"
        : "border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/40"
    }`}
    aria-pressed={selected}
  >
    <span className={`text-sm font-semibold ${selected ? "text-indigo-700" : `text-gray-800 ${colorClass}`}`}>
      {label}
    </span>
    {description && (
      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
        {description}
      </p>
    )}
  </button>
);

// ─── Prerequisite banner ─────────────────────────────────────────────────────

const PrerequisiteBanner = ({ resume, analysis }) => {
  const missing = [];
  if (!resume) missing.push("Upload a resume");
  else if (!resume.parsedText) missing.push("Re-upload resume (parsing failed)");
  if (!analysis) missing.push("Run a resume analysis");

  if (missing.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-6">
      <div className="flex items-start gap-3">
        <AlertCircle
          className="w-5 h-5 text-amber-500 shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <div className="flex-1">
          <p className="text-sm font-semibold text-amber-800">
            Complete these steps first:
          </p>
          <ul className="mt-2 space-y-1">
            {missing.map((item) => (
              <li key={item} className="text-xs text-amber-700 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <div className="flex gap-3 mt-3">
            {!resume && (
              <Link
                to="/resume"
                className="text-xs font-medium text-amber-700 underline hover:text-amber-900"
              >
                Go to Resume →
              </Link>
            )}
            {resume && !analysis && (
              <Link
                to="/analysis"
                className="text-xs font-medium text-amber-700 underline hover:text-amber-900"
              >
                Run Analysis →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────

const InterviewSetupPage = () => {
  usePageTitle("New Interview");
  const navigate = useNavigate();
  const { createSession, creating, error, clearError } = useInterviewStore();
  const { resume, fetchResume, fetching: resumeFetching } = useResumeStore();
  const {
    analysis,
    fetchAnalysis,
    fetching: analysisFetching,
  } = useAnalysisStore();

  // Fetch prerequisites on mount
  useEffect(() => {
    fetchResume();
    fetchAnalysis();
  }, [fetchResume, fetchAnalysis]);

  // Show store errors via toast
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const prerequisitesMet =
    resume && resume.parsedText && analysis;

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    mode: "onTouched",
    defaultValues: {
      interviewType: "",
      difficulty: "",
      targetRole: "",
      questionCount: "",
    },
  });

  const watchedType = watch("interviewType");
  const watchedDifficulty = watch("difficulty");
  const watchedCount = watch("questionCount");

  const onSubmit = async (formData) => {
    if (!prerequisitesMet) {
      toast.error("Please complete all prerequisites before starting.");
      return;
    }

    const result = await createSession(formData);

    if (result.success) {
      toast.success("Interview session created!");
      // Navigate to the interview page with the new session ID.
      // Phase 6 will handle question generation from here.
      navigate(`/interview/${result.session._id}`);
    }
    // Errors are surfaced via the `error` store field → toast in useEffect above
  };

  const loading = resumeFetching || analysisFetching;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* ── Header ── */}
        <div className="mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 text-indigo-600" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                New Interview
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Configure your session before we generate your questions.
              </p>
            </div>
          </div>
        </div>

        {/* ── Prerequisite check ── */}
        {!loading && (
          <PrerequisiteBanner resume={resume} analysis={analysis} />
        )}

        {/* ── Loading skeleton ── */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="animate-pulse bg-white rounded-2xl border border-gray-100 h-40"
              />
            ))}
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="space-y-6"
          >
            {/* ── Interview Type ── */}
            <SectionCard
              icon={Briefcase}
              iconBg="bg-indigo-50"
              iconColor="text-indigo-600"
              title="Interview Type"
            >
              <Controller
                name="interviewType"
                control={control}
                rules={{ required: "Please select an interview type" }}
                render={({ field }) => (
                  <div
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                    role="radiogroup"
                    aria-label="Interview type"
                  >
                    {INTERVIEW_TYPES.map((type) => (
                      <SelectTile
                        key={type.value}
                        label={type.label}
                        description={type.description}
                        selected={field.value === type.value}
                        onClick={() => field.onChange(type.value)}
                      />
                    ))}
                  </div>
                )}
              />
              {errors.interviewType && (
                <p role="alert" className="text-xs text-red-600 mt-2">
                  {errors.interviewType.message}
                </p>
              )}
            </SectionCard>

            {/* ── Difficulty ── */}
            <SectionCard
              icon={BarChart2}
              iconBg="bg-purple-50"
              iconColor="text-purple-600"
              title="Difficulty"
            >
              <Controller
                name="difficulty"
                control={control}
                rules={{ required: "Please select a difficulty level" }}
                render={({ field }) => (
                  <div
                    className="grid grid-cols-3 gap-3"
                    role="radiogroup"
                    aria-label="Difficulty"
                  >
                    {DIFFICULTIES.map((d) => (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => field.onChange(d.value)}
                        aria-pressed={field.value === d.value}
                        className={`py-3 rounded-xl border-2 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${
                          field.value === d.value
                            ? `${d.border} ${d.selectedBg} ${d.color}`
                            : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                )}
              />
              {errors.difficulty && (
                <p role="alert" className="text-xs text-red-600 mt-2">
                  {errors.difficulty.message}
                </p>
              )}
            </SectionCard>

            {/* ── Target Role ── */}
            <SectionCard
              icon={Layers}
              iconBg="bg-green-50"
              iconColor="text-green-600"
              title="Target Role"
            >
              {/* Preset chips */}
              <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Preset roles">
                {PRESET_ROLES.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setValue("targetRole", role, { shouldValidate: true })}
                    aria-pressed={watch("targetRole") === role}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${
                      watch("targetRole") === role
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-gray-200 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50/40"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>

              {/* Free-text input for custom roles */}
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="targetRole"
                  className="text-sm font-medium text-gray-700"
                >
                  Or type a custom role
                </label>
                <input
                  id="targetRole"
                  type="text"
                  placeholder="e.g. iOS Developer, DevOps Engineer…"
                  aria-invalid={!!errors.targetRole}
                  aria-describedby={errors.targetRole ? "targetRole-error" : undefined}
                  className={`w-full px-4 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.targetRole
                      ? "border-red-400 bg-red-50 text-red-900 placeholder-red-300"
                      : "border-gray-300 bg-white text-gray-900 placeholder-gray-400"
                  }`}
                  {...register("targetRole", {
                    required: "Target role is required",
                    minLength: {
                      value: 2,
                      message: "Role must be at least 2 characters",
                    },
                    maxLength: {
                      value: 100,
                      message: "Role cannot exceed 100 characters",
                    },
                  })}
                />
                {errors.targetRole && (
                  <p
                    id="targetRole-error"
                    role="alert"
                    className="text-xs text-red-600 mt-0.5"
                  >
                    {errors.targetRole.message}
                  </p>
                )}
              </div>
            </SectionCard>

            {/* ── Number of Questions ── */}
            <SectionCard
              icon={Hash}
              iconBg="bg-amber-50"
              iconColor="text-amber-600"
              title="Number of Questions"
            >
              <Controller
                name="questionCount"
                control={control}
                rules={{ required: "Please select the number of questions" }}
                render={({ field }) => (
                  <div
                    className="grid grid-cols-4 gap-3"
                    role="radiogroup"
                    aria-label="Number of questions"
                  >
                    {QUESTION_COUNTS.map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => field.onChange(count)}
                        aria-pressed={Number(field.value) === count}
                        className={`py-3 rounded-xl border-2 text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${
                          Number(field.value) === count
                            ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                            : "border-gray-200 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50/40"
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                )}
              />
              {errors.questionCount && (
                <p role="alert" className="text-xs text-red-600 mt-2">
                  {errors.questionCount.message}
                </p>
              )}

              {/* Summary preview */}
              {watchedType && watchedDifficulty && watchedCount && (
                <div className="mt-4 flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
                  <ChevronRight
                    className="w-4 h-4 text-indigo-400 shrink-0"
                    aria-hidden="true"
                  />
                  <p className="text-xs text-indigo-700">
                    <span className="font-semibold capitalize">{watchedCount} {watchedType}</span>{" "}
                    questions at{" "}
                    <span className="font-semibold capitalize">{watchedDifficulty}</span>{" "}
                    difficulty
                  </p>
                </div>
              )}
            </SectionCard>

            {/* ── Action Buttons ── */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={() => navigate("/dashboard")}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={creating}
                disabled={!prerequisitesMet}
                className="w-full sm:flex-1"
              >
                <BrainCircuit className="w-4 h-4" aria-hidden="true" />
                Start Interview
              </Button>
            </div>

            {!prerequisitesMet && !loading && (
              <p className="text-xs text-center text-gray-400">
                Complete the prerequisites above to enable this button.
              </p>
            )}
          </form>
        )}
      </main>
    </div>
  );
};

export default InterviewSetupPage;
