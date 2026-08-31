/**
 * DashboardSkeleton
 *
 * Full-page animated loading skeleton shown while the initial
 * dashboard data fetch is in flight.
 */
const DashboardSkeleton = () => (
  <div className="animate-pulse space-y-6" aria-busy="true" aria-label="Loading dashboard">
    {/* Welcome + CTA */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="space-y-2">
        <div className="h-7 bg-gray-200 rounded w-56" />
        <div className="h-4 bg-gray-100 rounded w-40" />
      </div>
      <div className="h-9 bg-gray-200 rounded-lg w-40 shrink-0" />
    </div>

    {/* Stats row: 4 cards */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-24" />
      ))}
    </div>

    {/* Middle row: resume scores + activity */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="bg-white rounded-2xl border border-gray-100 h-52" />
      <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 h-52" />
    </div>

    {/* Bottom row: recent interviews + progress */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="bg-white rounded-2xl border border-gray-100 h-64" />
      <div className="bg-white rounded-2xl border border-gray-100 h-64" />
    </div>
  </div>
);

export default DashboardSkeleton;
