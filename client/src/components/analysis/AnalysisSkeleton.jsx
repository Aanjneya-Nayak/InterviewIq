/**
 * AnalysisSkeleton
 *
 * Pulse-animated placeholder shown while the page loads a stored analysis
 * or while the AI analysis is running.
 *
 * Props:
 *   analyzing — boolean; when true, shows a "Analysing…" label instead of
 *               generic loading, and adds an extra header label.
 */
const AnalysisSkeleton = ({ analyzing = false }) => {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading analysis">
      {/* Top banner when AI is running */}
      {analyzing && (
        <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-xl px-5 py-4">
          <div className="w-5 h-5 rounded-full bg-indigo-200 shrink-0" />
          <div className="space-y-1.5 flex-1">
            <div className="h-3.5 bg-indigo-200 rounded w-48" />
            <div className="h-3 bg-indigo-100 rounded w-72" />
          </div>
        </div>
      )}

      {/* Score cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-center gap-4"
          >
            <div className="w-28 h-28 rounded-full bg-gray-200" />
            <div className="h-3 bg-gray-200 rounded w-24" />
          </div>
        ))}
      </div>

      {/* Inline score bars */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        {[80, 60, 45].map((w) => (
          <div key={w} className="space-y-1.5">
            <div className="flex justify-between">
              <div className="h-3 bg-gray-200 rounded w-28" />
              <div className="h-3 bg-gray-200 rounded w-10" />
            </div>
            <div className="h-2.5 bg-gray-200 rounded-full" style={{ width: `${w}%` }} />
          </div>
        ))}
      </div>

      {/* Accordion placeholders */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-200 shrink-0" />
            <div className="h-3.5 bg-gray-200 rounded w-40" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default AnalysisSkeleton;
