import { useState } from "react";
import { ChevronDown } from "lucide-react";

/**
 * AccordionSection
 *
 * Collapsible panel for grouping related suggestions.
 * Animates open/close via max-height transition.
 *
 * Props:
 *   title       — string heading
 *   icon        — Lucide icon component
 *   iconColor   — Tailwind text color class for the icon (e.g. "text-indigo-600")
 *   iconBg      — Tailwind bg class for icon wrapper (e.g. "bg-indigo-50")
 *   badge       — optional count shown next to the title
 *   defaultOpen — boolean, expand on first render (default false)
 *   children    — panel content
 */
const AccordionSection = ({
  title,
  icon: Icon,
  iconColor = "text-indigo-600",
  iconBg = "bg-indigo-50",
  badge,
  defaultOpen = false,
  children,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const id = `accordion-${title.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls={id}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
      >
        <div className="flex items-center gap-3">
          {Icon && (
            <span
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}
              aria-hidden="true"
            >
              <Icon className={`w-4 h-4 ${iconColor}`} />
            </span>
          )}
          <span className="text-sm font-semibold text-gray-800">{title}</span>
          {badge !== undefined && badge !== null && (
            <span className="ml-1 text-xs font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      <div
        id={id}
        className={`transition-all duration-200 ease-in-out ${
          open ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        } overflow-hidden`}
      >
        <div className="px-5 pb-5 pt-1 border-t border-gray-100">{children}</div>
      </div>
    </div>
  );
};

export default AccordionSection;
