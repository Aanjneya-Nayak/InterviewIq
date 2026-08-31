/**
 * StatsCard
 *
 * A single metric tile used in the Overview section.
 *
 * Props:
 *   icon       — Lucide icon component
 *   iconBg     — Tailwind bg class for the icon container (e.g. "bg-indigo-50")
 *   iconColor  — Tailwind text class for the icon (e.g. "text-indigo-600")
 *   label      — string label shown above the value
 *   value      — primary display value (string | number)
 *   sub        — optional secondary line below value
 */
const StatsCard = ({ icon: Icon, iconBg, iconColor, label, value, sub }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
    <div
      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}
      aria-hidden="true"
    >
      <Icon className={`w-5 h-5 ${iconColor}`} />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        {label}
      </p>
      <p className="text-2xl font-bold text-gray-900 mt-0.5 leading-tight">
        {value}
      </p>
      {sub && (
        <p className="text-xs text-gray-400 mt-0.5 leading-snug">{sub}</p>
      )}
    </div>
  </div>
);

export default StatsCard;
