import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  BrainCircuit,
  BarChart2,
  MessageSquare,
  Clock,
  Plus,
  RefreshCw,
} from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Button from "../components/ui/Button";
import StatsCard from "../components/dashboard/StatsCard";
import ResumeScoreCard from "../components/dashboard/ResumeScoreCard";
import ActivityChart from "../components/dashboard/ActivityChart";
import RecentInterviews from "../components/dashboard/RecentInterviews";
import PracticeProgress from "../components/dashboard/PracticeProgress";
import DashboardSkeleton from "../components/dashboard/DashboardSkeleton";
import useAuthStore from "../store/useAuthStore";
import useResumeStore from "../store/useResumeStore";
import useDashboardStore from "../store/useDashboardStore";
import { formatDuration } from "../lib/format";
import usePageTitle from "../hooks/usePageTitle";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * True when all four API slices are still in their initial fetch.
 * Used to show the full-page skeleton on first load only.
 */
const isInitialLoad = (store) =>
  store.overviewFetching &&
  store.activityFetching &&
  store.recentFetching &&
  store.progressFetching &&
  store.overview === null &&
  store.activity.length === 0 &&
  store.recentInterviews.length === 0 &&
  store.progress === null;

// ─── Page ─────────────────────────────────────────────────────────────────────

const DashboardPage = () => {
  usePageTitle("Dashboard");
  const { user } = useAuthStore();
  const { resume, fetchResume } = useResumeStore();

  const store = useDashboardStore();
  const {
    overview,
    overviewFetching,
    overviewError,
    activity,
    activityRange,
    activityFetching,
    activityError,
    recentInterviews,
    recentFetching,
    recentError,
    progress,
    progressFetching,
    progressError,
    fetchAll,
    fetchOverview,
    fetchActivity,
    fetchRecentInterviews,
    fetchProgress,
  } = store;

  // ── Initial parallel fetch ───────────────────────────────────────────────
  useEffect(() => {
    fetchResume();
    fetchAll("7d");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Range change ─────────────────────────────────────────────────────────
  const handleRangeChange = (range) => {
    fetchActivity(range);
  };

  // ── Full-page skeleton on first load ─────────────────────────────────────
  if (isInitialLoad(store)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <DashboardSkeleton />
        </main>
      </div>
    );
  }

  const firstName = user?.name?.split(" ")[0] ?? "there";
  const hasResume = !!resume;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

        {/* ── 1. Welcome ─────────────────────────────────────────────────── */}
        <section aria-label="Welcome">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {firstName} 👋
              </h1>
              <p className="text-gray-500 mt-1 text-sm">
                {overview?.totalInterviews > 0
                  ? `You've completed ${overview.completedInterviews} of ${overview.totalInterviews} interview${overview.totalInterviews !== 1 ? "s" : ""}. Ready to keep going?`
                  : "Ready to practice? Start your first mock interview."}
              </p>
            </div>
            <Link to="/interview/setup">
              <Button className="shrink-0 gap-2">
                <Plus className="w-4 h-4" aria-hidden="true" />
                Start Interview
              </Button>
            </Link>
          </div>
        </section>

        {/* ── 2. Overview stats ──────────────────────────────────────────── */}
        <section aria-labelledby="overview-heading">
          <h2 id="overview-heading" className="sr-only">Overview Statistics</h2>

          {overviewError ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-8 flex flex-col items-center gap-3 text-center">
              <p className="text-sm text-gray-500">{overviewError}</p>
              <button
                type="button"
                onClick={fetchOverview}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700"
              >
                <RefreshCw className="w-3 h-3" aria-hidden="true" />
                Retry
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

              {/* Total Interviews */}
              {overviewFetching ? (
                [1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="animate-pulse bg-white rounded-2xl border border-gray-100 h-24"
                  />
                ))
              ) : (
                <>
                  <StatsCard
                    icon={BrainCircuit}
                    iconBg="bg-indigo-50"
                    iconColor="text-indigo-600"
                    label="Total Interviews"
                    value={overview?.totalInterviews ?? 0}
                    sub={
                      overview?.totalInterviews > 0
                        ? `${overview.completedInterviews} completed`
                        : "No interviews yet"
                    }
                  />
                  <StatsCard
                    icon={BarChart2}
                    iconBg="bg-green-50"
                    iconColor="text-green-600"
                    label="Completed"
                    value={overview?.completedInterviews ?? 0}
                    sub={
                      overview?.interviewCompletionRate > 0
                        ? `${overview.interviewCompletionRate}% completion rate`
                        : "—"
                    }
                  />
                  <StatsCard
                    icon={MessageSquare}
                    iconBg="bg-purple-50"
                    iconColor="text-purple-600"
                    label="Questions Answered"
                    value={overview?.totalQuestionsAnswered ?? 0}
                    sub={
                      overview?.totalQuestionsGenerated > 0
                        ? `of ${overview.totalQuestionsGenerated} generated`
                        : "—"
                    }
                  />
                  <StatsCard
                    icon={Clock}
                    iconBg="bg-amber-50"
                    iconColor="text-amber-600"
                    label="Practice Time"
                    value={
                      overview?.totalPracticeTime
                        ? formatDuration(overview.totalPracticeTime)
                        : "0s"
                    }
                    sub="total across all sessions"
                  />
                </>
              )}
            </div>
          )}
        </section>

        {/* ── 3. Resume scores + activity chart ──────────────────────────── */}
        <section
          className="grid grid-cols-1 lg:grid-cols-3 gap-5"
          aria-label="Resume scores and practice activity"
        >
          {/* Resume Score Card */}
          <div>
            {overviewFetching ? (
              <div className="animate-pulse bg-white rounded-2xl border border-gray-100 h-52" />
            ) : (
              <ResumeScoreCard
                resumeOverallScore={overview?.resumeOverallScore ?? null}
                atsScore={overview?.atsScore ?? null}
                hasResume={hasResume}
              />
            )}
          </div>

          {/* Activity Chart */}
          <div className="lg:col-span-2">
            <ActivityChart
              data={activity}
              range={activityRange}
              onRangeChange={handleRangeChange}
              loading={activityFetching}
              error={activityError}
              onRetry={() => fetchActivity(activityRange)}
            />
          </div>
        </section>

        {/* ── 4. Recent interviews + practice progress ───────────────────── */}
        <section
          className="grid grid-cols-1 lg:grid-cols-2 gap-5"
          aria-label="Recent interviews and practice progress"
        >
          <RecentInterviews
            interviews={recentInterviews}
            loading={recentFetching}
            error={recentError}
            onRetry={fetchRecentInterviews}
          />

          <PracticeProgress
            progress={progress}
            loading={progressFetching}
            error={progressError}
            onRetry={fetchProgress}
          />
        </section>

      </main>
    </div>
  );
};

export default DashboardPage;
