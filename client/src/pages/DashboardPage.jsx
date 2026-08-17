import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  BarChart2,
  BrainCircuit,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import Navbar from "../components/layout/Navbar";
import useAuthStore from "../store/useAuthStore";
import useResumeStore from "../store/useResumeStore";
import useAnalysisStore from "../store/useAnalysisStore";
import { formatDate } from "../lib/format";

/**
 * DashboardPage
 *
 * Shows real data pulled from the resume and analysis stores:
 *   - Resume status (uploaded / not uploaded)
 *   - Overall score + ATS score from the latest analysis
 *   - Last analysed date
 *   - Quick action cards linking to Resume and Analysis pages
 */

// ─── Score colour helper ─────────────────────────────────────────────────────
const scoreColor = (score) => {
  if (score >= 75) return "text-green-600";
  if (score >= 50) return "text-amber-500";
  return "text-red-500";
};

const scoreBg = (score) => {
  if (score >= 75) return "bg-green-50 border-green-200";
  if (score >= 50) return "bg-amber-50 border-amber-200";
  return "bg-red-50 border-red-200";
};

// ─── Stat card ───────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, colorClass = "text-gray-800", bgClass = "" }) => (
  <div className={`bg-white rounded-xl shadow-sm border p-6 flex flex-col gap-1 ${bgClass || "border-gray-100"}`}>
    <span className="text-sm text-gray-500">{label}</span>
    <span className={`text-3xl font-bold ${colorClass}`}>{value}</span>
    {sub && <span className="text-xs text-gray-400 mt-0.5">{sub}</span>}
  </div>
);

// ─── Quick action card ───────────────────────────────────────────────────────
const ActionCard = ({ to, icon: Icon, iconBg, iconColor, title, description, cta }) => (
  <Link
    to={to}
    className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-start gap-4 hover:border-indigo-200 hover:shadow-md transition-all group focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
  >
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
      <Icon className={`w-5 h-5 ${iconColor}`} aria-hidden="true" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-gray-800">{title}</p>
      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>
      <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 mt-2 group-hover:gap-2 transition-all">
        {cta}
        <ArrowRight className="w-3 h-3" aria-hidden="true" />
      </span>
    </div>
  </Link>
);

// ─── Page ────────────────────────────────────────────────────────────────────
const DashboardPage = () => {
  const { user } = useAuthStore();
  const { resume, fetching: resumeFetching, fetchResume } = useResumeStore();
  const { analysis, fetching: analysisFetching, fetchAnalysis } = useAnalysisStore();

  useEffect(() => {
    fetchResume();
    fetchAnalysis();
  }, [fetchResume, fetchAnalysis]);

  const loading = resumeFetching || analysisFetching;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* ── Header ── */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(" ")[0] ?? "there"} 👋
          </h1>
          <p className="text-gray-500 mt-1">
            Here&apos;s an overview of your resume and analysis progress.
          </p>
        </div>

        {/* ── Stat cards ── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-white rounded-xl border border-gray-100 p-6 h-28" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Resume status */}
            <StatCard
              label="Resume"
              value={resume ? "Uploaded" : "Not uploaded"}
              sub={resume ? `Updated ${formatDate(resume.uploadedAt ?? resume.createdAt)}` : "No resume on file"}
              colorClass={resume ? "text-green-600" : "text-gray-400"}
              bgClass={resume ? "bg-green-50 border-green-100" : ""}
            />

            {/* Overall score */}
            <StatCard
              label="Overall Score"
              value={analysis ? `${analysis.overallScore}/100` : "—"}
              sub={analysis ? `Last analysed ${formatDate(analysis.analysedAt)}` : "Run analysis to see your score"}
              colorClass={analysis ? scoreColor(analysis.overallScore) : "text-gray-300"}
              bgClass={analysis ? scoreBg(analysis.overallScore) : ""}
            />

            {/* ATS score */}
            <StatCard
              label="ATS Score"
              value={analysis ? `${analysis.atsScore}/100` : "—"}
              sub={analysis ? "ATS keyword compatibility" : "Run analysis to see ATS score"}
              colorClass={analysis ? scoreColor(analysis.atsScore) : "text-gray-300"}
              bgClass={analysis ? scoreBg(analysis.atsScore) : ""}
            />
          </div>
        )}

        {/* ── Status banner ── */}
        {!loading && (
          <div className="mb-8">
            {!resume && (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800">No resume uploaded yet</p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    Upload a PDF or DOCX to unlock AI-powered analysis.
                  </p>
                </div>
                <Link
                  to="/resume"
                  className="shrink-0 text-xs font-medium text-amber-700 underline hover:text-amber-900"
                >
                  Upload now
                </Link>
              </div>
            )}

            {resume && !analysis && (
              <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-200 rounded-xl px-5 py-4">
                <BrainCircuit className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" aria-hidden="true" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-indigo-800">Resume ready — run your first analysis</p>
                  <p className="text-xs text-indigo-500 mt-0.5">
                    Get your overall score, ATS compatibility rating, and a prioritised action plan.
                  </p>
                </div>
                <Link
                  to="/analysis"
                  className="shrink-0 text-xs font-medium text-indigo-700 underline hover:text-indigo-900"
                >
                  Analyse now
                </Link>
              </div>
            )}

            {resume && analysis && (
              <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-4">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" aria-hidden="true" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800">
                    Looking good — your resume scored {analysis.overallScore}/100
                  </p>
                  <p className="text-xs text-green-600 mt-0.5">
                    {analysis.actionPlan?.length > 0
                      ? `${analysis.actionPlan.length} action items waiting for you.`
                      : "Check the Analysis page for detailed feedback."}
                  </p>
                </div>
                <Link
                  to="/analysis"
                  className="shrink-0 text-xs font-medium text-green-700 underline hover:text-green-900"
                >
                  View report
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ── Quick actions ── */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ActionCard
              to="/resume"
              icon={FileText}
              iconBg="bg-indigo-50"
              iconColor="text-indigo-600"
              title="Manage Resume"
              description="Upload, replace, or preview your current resume file."
              cta="Go to Resume"
            />
            <ActionCard
              to="/analysis"
              icon={BrainCircuit}
              iconBg="bg-purple-50"
              iconColor="text-purple-600"
              title="AI Analysis"
              description="Get Gemini-powered feedback on scores, keywords, and improvements."
              cta="View Analysis"
            />
            <ActionCard
              to="/interview/setup"
              icon={TrendingUp}
              iconBg="bg-green-50"
              iconColor="text-green-600"
              title="Mock Interview"
              description={
                analysis
                  ? "Start a new AI-powered interview tailored to your resume."
                  : "Run analysis first, then start a mock interview."
              }
              cta="Start Interview"
            />
          </div>
        </div>

      </main>
    </div>
  );
};

export default DashboardPage;
