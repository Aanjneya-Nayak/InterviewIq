/**
 * ScoreBar
 *
 * Horizontal progress bar with a label and numeric value.
 * Used for any supplementary score display inside the results.
 *
 * Props:
 *   label  — string
 *   score  — integer 0-100
 *   color  — Tailwind bg class (default indigo)
 */
const ScoreBar = ({ label, score = 0, colorClass = "bg-indigo-500" }) => {
  const displayColor =
    score >= 75
      ? "bg-green-500"
      : score >= 50
        ? "bg-amber-500"
        : "bg-red-500";

  const finalColor = colorClass === "bg-indigo-500" ? displayColor : colorClass;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-bold text-gray-900">{score}/100</span>
      </div>
      <div
        className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${score} out of 100`}
      >
        <div
          className={`h-2.5 rounded-full transition-all duration-700 ease-out ${finalColor}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
};

export default ScoreBar;
