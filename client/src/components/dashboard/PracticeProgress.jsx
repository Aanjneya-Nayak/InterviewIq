import { Flame, TrendingUp, Calendar, CheckCircle2, RefreshCw } from "lucide-react";

/**
 * PracticeProgress
 *
 * Displays streak and activity statistics derived from real interview data.
 * No fake scores — all values come from GET /api/dashboard/progress.
 *
 * Practice day definition (shown as tooltip):
 *   A day on which at least one interview was answered (completed or partially answered).
 *
 * Props:
 *   progress — object from the API or null
 *   loading  — boolean
 *   error    — string | null
 *   onRetry  — () => void
 */

const StatTile = ({ icon: Icon, iconBg, iconColor, value, label, tooltip }) => (
  <div
    className="flex flex-col items-center gap-1.5 p-4 rounded-xl bg-gray-50 border border-gray-100"
    title={tooltip}
    aria-label={`${label}: ${value}${tooltip ? ". " + tooltip : ""}`}
  >
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
      <Icon className={`w-4.5 h-4.5 ${iconColor}`} style={{ width: 18, height: 18 }} aria-hidden="true" />
    </div>
    <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
    <p className="text-xs text-gray-500 text-center leading-tight">{label}</p>
  </div>
);

const PracticeProgress = ({ progress, loading, error, onRetry }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Practice Progress</h3>

      {/* Error */}
      {error && (
        <div className="flex flex-col items-center py-8 gap-3 text-center">
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
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 animate-pulse" aria-busy="true">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl" />
          ))}
        </div>
      )}

      {/* Stats grid */}
      {!error && !loading && progress && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatTile
              icon={Flame}
              iconBg="bg-orange-50"
              iconColor="text-orange-500"
              value={progress.currentStreak}
              label="Current Streak"
              tooltip="Consecutive days with at least one practice session containing an answer."
            />
            <StatTile
              icon={TrendingUp}
              iconBg="bg-indigo-50"
              iconColor="text-indigo-600"
              value={progress.longestStreak}
              label="Longest Streak"
              tooltip="Your all-time longest run of consecutive practice days."
            />
            <StatTile
              icon={Calendar}
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
              value={progress.activeDays}
              label="Active Days (30d)"
              tooltip="Distinct practice days in the last 30 days."
            />
            <StatTile
              icon={Calendar}
              iconBg="bg-teal-50"
              iconColor="text-teal-600"
              value={progress.practiceDays}
              label="Total Practice Days"
              tooltip="All-time distinct days with at least one answered interview."
            />
            <StatTile
              icon={CheckCircle2}
              iconBg="bg-green-50"
              iconColor="text-green-600"
              value={progress.interviewsThisWeek}
              label="This Week"
              tooltip="Completed interviews in the current calendar week (Mon–Sun UTC)."
            />
            <StatTile
              icon={CheckCircle2}
              iconBg="bg-purple-50"
              iconColor="text-purple-600"
              value={progress.interviewsThisMonth}
              label="This Month"
              tooltip="Completed interviews in the current calendar month."
            />
          </div>

          {/* Streak note */}
          <p className="text-[10px] text-gray-400 mt-3 leading-relaxed">
            A <span className="font-medium">practice day</span> is any day where
            you answered at least one question in a session.
          </p>
        </>
      )}

      {/* Empty state: loaded but all zeros — new user */}
      {!error && !loading && progress &&
        progress.practiceDays === 0 && (
          <div className="mt-3 flex items-start gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
            <Flame className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-xs text-indigo-700">
              Complete your first interview to start building your streak!
            </p>
          </div>
        )}
    </div>
  );
};

export default PracticeProgress;
