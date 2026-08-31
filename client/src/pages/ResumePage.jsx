import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { FileText, BrainCircuit } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import ResumeUpload from "../components/resume/ResumeUpload";
import ResumeCard from "../components/resume/ResumeCard";
import ResumeHistory from "../components/resume/ResumeHistory";
import useResumeStore from "../store/useResumeStore";
import usePageTitle from "../hooks/usePageTitle";

/**
 * ResumePage
 *
 * Layout (lg+): two-column — upload zone + resume card (left) | tips sidebar (right)
 * Layout (mobile): single column, stacked
 *
 * Data flow:
 *   1. On mount, fetchResume() → populates store.resume (or null).
 *   2. ResumeUpload calls store.uploadResume(file) → updates store on success.
 *   3. ResumeCard "Replace" button scrolls to the upload zone.
 *   4. ResumeCard "Delete" opens ConfirmModal → calls store.deleteResume() on confirm.
 *   5. All user feedback goes through react-hot-toast.
 *
 * Loading states are split:
 *   uploading — drives the upload zone progress bar and button spinner
 *   deleting  — drives the ResumeCard delete button spinner only
 */
const ResumePage = () => {
  usePageTitle("Resume");
  const {
    resume,
    history,
    fetching,
    uploading,
    deleting,
    uploadProgress,
    fetchResume,
    fetchHistory,
    uploadResume,
    deleteResume,
  } = useResumeStore();

  const uploadZoneRef = useRef(null);
  const [justUploaded, setJustUploaded] = useState(false);

  useEffect(() => {
    fetchResume();
    fetchHistory();
  }, [fetchResume, fetchHistory]);

  // ─── Handlers ──────────────────────────────────────────────────────────

  const handleUpload = async (file) => {
    const isReplacing = !!resume;
    const result = await uploadResume(file);

    if (result.success) {
      toast.success(
        isReplacing
          ? "Resume replaced successfully."
          : "Resume uploaded successfully."
      );
      setJustUploaded(true);
    } else {
      toast.error(result.message);
    }

    return result;
  };

  const handleDelete = async () => {
    const result = await deleteResume();
    if (result.success) {
      toast.success("Resume deleted.");
    } else {
      toast.error(result.message);
    }
  };

  const handleReplace = () => {
    uploadZoneRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  // ─── Loading skeleton (initial GET /resume) ───────────────────────────
  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <PageHeader />
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="animate-pulse h-56 bg-gray-200 rounded-xl" />
              <div className="animate-pulse h-20 bg-gray-200 rounded-xl" />
            </div>
            <div className="animate-pulse h-72 bg-gray-200 rounded-xl" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <PageHeader />

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* ── Left: upload zone + current resume card ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upload zone */}
            <section ref={uploadZoneRef} aria-label="Resume upload">
              <div className="mb-3">
                <h2 className="text-base font-semibold text-gray-800">
                  {resume ? "Replace Your Resume" : "Upload Your Resume"}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {resume
                    ? "Choose a new file below — your current resume will be replaced."
                    : "Upload a PDF or DOCX (max 5 MB) to get started."}
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <ResumeUpload
                  onUpload={handleUpload}
                  uploading={uploading}
                  uploadProgress={uploadProgress}
                  isReplacing={!!resume}
                />
              </div>
            </section>

            {/* Current resume card — shown only when a resume exists */}
            {resume && (
              <section aria-label="Current resume">
                <h2 className="text-base font-semibold text-gray-800 mb-3">
                  Current Resume
                </h2>
                <ResumeCard
                  resume={resume}
                  onDelete={handleDelete}
                  onReplace={handleReplace}
                  deleting={deleting}
                />
              </section>
            )}

            {/* Post-upload analyse CTA */}
            {justUploaded && resume && (
              <div className="flex items-start gap-4 bg-indigo-50 border border-indigo-200 rounded-xl px-5 py-4">
                <BrainCircuit
                  className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-indigo-800">
                    Ready to analyse <span className="font-bold">{resume.originalFileName}</span>
                  </p>
                  <p className="text-xs text-indigo-500 mt-0.5">
                    Your resume was uploaded. Run the AI analysis to get your score and action plan.
                  </p>
                </div>
                <Link
                  to="/analysis"
                  className="shrink-0 inline-flex items-center gap-1.5 text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
                >
                  <BrainCircuit className="w-3.5 h-3.5" aria-hidden="true" />
                  Analyse now
                </Link>
              </div>
            )}

            {/* Upload history */}
            <section aria-label="Upload history">
              <ResumeHistory history={history} />
            </section>
          </div>

          {/* ── Right: tips sidebar ── */}
          <aside className="lg:col-span-1" aria-label="Resume tips">
            <TipsCard />
          </aside>
        </div>
      </main>
    </div>
  );
};

// ─── Sub-components ─────────────────────────────────────────────────────────

const PageHeader = () => (
  <div>
    <h1 className="text-3xl font-bold text-gray-900">Resume</h1>
    <p className="text-gray-500 mt-1">
      Upload and manage your resume for AI-powered interview analysis.
    </p>
  </div>
);

const TIPS = [
  "Use a single-page resume for best results.",
  "Include measurable achievements where possible.",
  "Keep your work experience in reverse chronological order.",
  "Use standard section headings like Experience, Education, and Skills.",
  "Avoid tables, columns, and images — plain text parses more accurately.",
];

const TipsCard = () => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 lg:sticky lg:top-24">
    <div className="flex items-center gap-2 mb-4">
      <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
        <FileText className="w-4 h-4 text-indigo-600" aria-hidden="true" />
      </div>
      <h2 className="text-sm font-semibold text-gray-800">
        Tips for a great resume
      </h2>
    </div>

    <ul className="space-y-2.5" role="list">
      {TIPS.map((tip) => (
        <li key={tip} className="flex items-start gap-2">
          <span
            className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-400"
            aria-hidden="true"
          />
          <span className="text-xs text-gray-600 leading-relaxed">{tip}</span>
        </li>
      ))}
    </ul>

    <div className="mt-5 pt-4 border-t border-gray-100 space-y-1">
      <p className="text-xs text-gray-500">
        <span className="font-medium text-gray-700">Accepted formats:</span>{" "}
        PDF, DOCX
      </p>
      <p className="text-xs text-gray-500">
        <span className="font-medium text-gray-700">Max file size:</span> 5 MB
      </p>
    </div>
  </div>
);

export default ResumePage;
