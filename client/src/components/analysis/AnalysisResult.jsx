import {
  CheckCircle2,
  XCircle,
  Search,
  Lightbulb,
  FolderKanban,
  GraduationCap,
  Layout,
  SpellCheck,
  ListChecks,
  Zap,
} from "lucide-react";
import ScoreRing from "./ScoreRing";
import ScoreBar from "./ScoreBar";
import AccordionSection from "./AccordionSection";
import { formatDate } from "../../lib/format";

/**
 * AnalysisResult
 *
 * Renders all sections of a completed resume analysis.
 * Receives the full analysis document from the store — no API calls here.
 *
 * Sections:
 *   1. Score hero (two ScoreRings + two ScoreBars)
 *   2. Strengths
 *   3. Weaknesses
 *   4. Missing Keywords
 *   5. Recommended Skills
 *   6. Project Suggestions
 *   7. Experience Suggestions
 *   8. Education Suggestions
 *   9. Formatting Suggestions
 *  10. Grammar Suggestions
 *  11. Action Plan
 */

// ─── Priority badge colours ──────────────────────────────────────────────────
const PRIORITY_STYLE = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-green-100 text-green-700",
};

// ─── Generic bullet list ─────────────────────────────────────────────────────
const BulletList = ({ items, emptyText = "None identified." }) => {
  if (!items || items.length === 0) {
    return <p className="text-sm text-gray-400 italic mt-3">{emptyText}</p>;
  }
  return (
    <ul className="mt-3 space-y-2" role="list">
      {items.map((item, idx) => (
        <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-700">
          <span
            className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-400"
            aria-hidden="true"
          />
          {item}
        </li>
      ))}
    </ul>
  );
};

// ─── Tag-style pill list ─────────────────────────────────────────────────────
const TagList = ({ items, colorClass = "bg-indigo-50 text-indigo-700 ring-indigo-200", emptyText = "None identified." }) => {
  if (!items || items.length === 0) {
    return <p className="text-sm text-gray-400 italic mt-3">{emptyText}</p>;
  }
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {items.map((item, idx) => (
        <span
          key={idx}
          className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ring-1 ${colorClass}`}
        >
          {item}
        </span>
      ))}
    </div>
  );
};

// ─── Action Plan item ────────────────────────────────────────────────────────
const ActionPlanItem = ({ item, index }) => (
  <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
    <span className="shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs font-bold flex items-center justify-center mt-0.5">
      {index + 1}
    </span>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${
            PRIORITY_STYLE[item.priority] ?? "bg-gray-100 text-gray-600"
          }`}
        >
          {item.priority}
        </span>
        <p className="text-sm font-medium text-gray-800">{item.action}</p>
      </div>
      <p className="mt-1 text-xs text-gray-500 leading-relaxed">{item.rationale}</p>
    </div>
  </div>
);

// ─── Main component ──────────────────────────────────────────────────────────
const AnalysisResult = ({ analysis }) => {
  const {
    overallScore,
    atsScore,
    strengths,
    weaknesses,
    missingKeywords,
    recommendedSkills,
    projectSuggestions,
    experienceSuggestions,
    educationSuggestions,
    formattingSuggestions,
    grammarSuggestions,
    actionPlan,
    analysedAt,
  } = analysis;

  return (
    <div className="space-y-5">
      {/* ── Meta row ─────────────────────────────────────────────────── */}
      {analysedAt && (
        <p className="text-xs text-gray-400">
          Last analysed on{" "}
          <span className="font-medium text-gray-500">
            {formatDate(analysedAt)}
          </span>
        </p>
      )}

      {/* ── 1. Score hero ────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-800 mb-5">Scores</h2>

        {/* Rings */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex justify-center">
            <ScoreRing score={overallScore} label="Overall Score" size={128} />
          </div>
          <div className="flex justify-center">
            <ScoreRing score={atsScore} label="ATS Score" size={128} />
          </div>
        </div>

        {/* Bars */}
        <div className="space-y-4">
          <ScoreBar label="Overall Score" score={overallScore} />
          <ScoreBar label="ATS Score" score={atsScore} />
        </div>
      </div>

      {/* ── 2. Strengths ─────────────────────────────────────────────── */}
      <AccordionSection
        title="Strengths"
        icon={CheckCircle2}
        iconColor="text-green-600"
        iconBg="bg-green-50"
        badge={strengths?.length ?? 0}
        defaultOpen={true}
      >
        <BulletList items={strengths} emptyText="No strengths identified." />
      </AccordionSection>

      {/* ── 3. Weaknesses ────────────────────────────────────────────── */}
      <AccordionSection
        title="Weaknesses"
        icon={XCircle}
        iconColor="text-red-500"
        iconBg="bg-red-50"
        badge={weaknesses?.length ?? 0}
        defaultOpen={true}
      >
        <BulletList items={weaknesses} emptyText="No weaknesses identified." />
      </AccordionSection>

      {/* ── 4. Missing Keywords ──────────────────────────────────────── */}
      <AccordionSection
        title="Missing Keywords"
        icon={Search}
        iconColor="text-orange-500"
        iconBg="bg-orange-50"
        badge={missingKeywords?.length ?? 0}
      >
        <TagList
          items={missingKeywords}
          colorClass="bg-orange-50 text-orange-700 ring-orange-200"
          emptyText="No missing keywords found."
        />
      </AccordionSection>

      {/* ── 5. Recommended Skills ────────────────────────────────────── */}
      <AccordionSection
        title="Recommended Skills"
        icon={Lightbulb}
        iconColor="text-yellow-600"
        iconBg="bg-yellow-50"
        badge={recommendedSkills?.length ?? 0}
      >
        <TagList
          items={recommendedSkills}
          colorClass="bg-yellow-50 text-yellow-700 ring-yellow-200"
          emptyText="No additional skills recommended."
        />
      </AccordionSection>

      {/* ── 6. Project Suggestions ───────────────────────────────────── */}
      <AccordionSection
        title="Project Suggestions"
        icon={FolderKanban}
        iconColor="text-purple-600"
        iconBg="bg-purple-50"
        badge={projectSuggestions?.length ?? 0}
      >
        <BulletList items={projectSuggestions} emptyText="No project suggestions." />
      </AccordionSection>

      {/* ── 7. Experience Suggestions ────────────────────────────────── */}
      <AccordionSection
        title="Experience Suggestions"
        icon={Zap}
        iconColor="text-blue-600"
        iconBg="bg-blue-50"
        badge={experienceSuggestions?.length ?? 0}
      >
        <BulletList items={experienceSuggestions} emptyText="No experience suggestions." />
      </AccordionSection>

      {/* ── 8. Education Suggestions ─────────────────────────────────── */}
      <AccordionSection
        title="Education Suggestions"
        icon={GraduationCap}
        iconColor="text-teal-600"
        iconBg="bg-teal-50"
        badge={educationSuggestions?.length ?? 0}
      >
        <BulletList items={educationSuggestions} emptyText="No education suggestions." />
      </AccordionSection>

      {/* ── 9. Formatting Suggestions ────────────────────────────────── */}
      <AccordionSection
        title="Formatting Suggestions"
        icon={Layout}
        iconColor="text-indigo-600"
        iconBg="bg-indigo-50"
        badge={formattingSuggestions?.length ?? 0}
      >
        <BulletList items={formattingSuggestions} emptyText="No formatting suggestions." />
      </AccordionSection>

      {/* ── 10. Grammar Suggestions ──────────────────────────────────── */}
      <AccordionSection
        title="Grammar & Language"
        icon={SpellCheck}
        iconColor="text-rose-600"
        iconBg="bg-rose-50"
        badge={grammarSuggestions?.length ?? 0}
      >
        <BulletList items={grammarSuggestions} emptyText="No grammar issues found." />
      </AccordionSection>

      {/* ── 11. Action Plan ──────────────────────────────────────────── */}
      <AccordionSection
        title="Action Plan"
        icon={ListChecks}
        iconColor="text-indigo-600"
        iconBg="bg-indigo-50"
        badge={actionPlan?.length ?? 0}
        defaultOpen={true}
      >
        {!actionPlan || actionPlan.length === 0 ? (
          <p className="text-sm text-gray-400 italic mt-3">No action plan generated.</p>
        ) : (
          <div className="mt-3">
            {actionPlan.map((item, idx) => (
              <ActionPlanItem key={idx} item={item} index={idx} />
            ))}
          </div>
        )}
      </AccordionSection>
    </div>
  );
};

export default AnalysisResult;
