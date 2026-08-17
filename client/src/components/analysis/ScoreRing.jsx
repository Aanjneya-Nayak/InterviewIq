/**
 * ScoreRing
 *
 * SVG circular progress ring that fills based on a 0-100 score.
 * Colour shifts from red → amber → green as the score increases.
 *
 * Props:
 *   score   — integer 0-100
 *   label   — text shown below the number  (e.g. "Overall Score")
 *   size    — diameter in px (default 120)
 */
const ScoreRing = ({ score = 0, label = "", size = 120 }) => {
  const strokeWidth = 9;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 75
      ? "#22c55e" // green-500
      : score >= 50
        ? "#f59e0b" // amber-500
        : "#ef4444"; // red-500

  const trackColor = "#e5e7eb"; // gray-200

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-label={`${label}: ${score} out of 100`}
        role="img"
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress arc — rotated so it starts at 12 o'clock */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
        {/* Score number */}
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          fontSize={size * 0.22}
          fontWeight="700"
          fill={color}
        >
          {score}
        </text>
      </svg>
      <span className="text-xs font-medium text-gray-500 text-center leading-tight">
        {label}
      </span>
    </div>
  );
};

export default ScoreRing;
