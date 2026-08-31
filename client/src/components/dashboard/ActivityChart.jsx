import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { RefreshCw } from "lucide-react";

/**
 * ActivityChart
 *
 * Recharts AreaChart displaying practice activity over a chosen time window.
 * Metrics shown: Interviews Completed + Questions Answered.
 * Practice time (seconds) is intentionally omitted from the primary chart to
 * keep it readable — it lives in the stats cards.
 *
 * Props:
 *   data        — array of { date, interviewsCompleted, questionsAnswered }
 *   range       — "7d" | "30d" | "90d"
 *   onRangeChange — (range: string) => void
 *   loading     — boolean
 *   error       — string | null
 *   onRetry     — () => void
 */

const RANGES = [
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
  { label: "90 days", value: "90d" },
];

// Format "2026-08-24" → "Aug 24" for the X axis
const formatAxisDate = (dateStr) => {
  const d = new Date(dateStr + "T00:00:00Z");
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
};

// Custom tooltip for the chart
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-xs">
      <p className="font-semibold text-gray-700 mb-1.5">{formatAxisDate(label)}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }} className="leading-relaxed">
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

const ActivityChart = ({ data, range, onRangeChange, loading, error, onRetry }) => {
  const hasData = data.some(
    (d) => d.interviewsCompleted > 0 || d.questionsAnswered > 0
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <h3 className="text-sm font-semibold text-gray-700">Practice Activity</h3>

        {/* Range selector */}
        <div
          className="flex items-center rounded-lg border border-gray-200 overflow-hidden self-start sm:self-auto"
          role="group"
          aria-label="Activity time range"
        >
          {RANGES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => onRangeChange(r.value)}
              aria-pressed={range === r.value}
              className={`px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 ${
                range === r.value
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <p className="text-sm text-gray-500">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            <RefreshCw className="w-3 h-3" aria-hidden="true" />
            Retry
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {!error && loading && (
        <div
          className="h-48 bg-gray-100 rounded-xl animate-pulse"
          aria-busy="true"
          aria-label="Loading chart"
        />
      )}

      {/* Empty state — loaded but all-zero data */}
      {!error && !loading && !hasData && (
        <div className="h-48 flex flex-col items-center justify-center gap-2 text-center">
          <p className="text-sm font-medium text-gray-500">No activity yet</p>
          <p className="text-xs text-gray-400">
            Complete an interview to see your practice data here.
          </p>
        </div>
      )}

      {/* Chart */}
      {!error && !loading && hasData && (
        <div aria-label={`Activity chart for the last ${range}`}>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart
              data={data}
              margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorAnswered" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />

              <XAxis
                dataKey="date"
                tickFormatter={formatAxisDate}
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                // Reduce tick density for larger ranges
                interval={range === "7d" ? 0 : range === "30d" ? 4 : 13}
              />

              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip content={<CustomTooltip />} />

              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }}
              />

              <Area
                type="monotone"
                dataKey="interviewsCompleted"
                name="Interviews Completed"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#colorCompleted)"
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Area
                type="monotone"
                dataKey="questionsAnswered"
                name="Questions Answered"
                stroke="#22c55e"
                strokeWidth={2}
                fill="url(#colorAnswered)"
                dot={false}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default ActivityChart;
