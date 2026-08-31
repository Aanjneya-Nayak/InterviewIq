import { forwardRef } from "react";
import { Loader2 } from "lucide-react";

/**
 * Button
 *
 * Reusable button with built-in loading state and dark-mode support.
 * Supports ref-forwarding for focus management (e.g. ConfirmModal).
 *
 * Variants:
 *   primary   — indigo fill (works on both themes)
 *   secondary — white/border on light; dark surface on dark
 *   danger    — red fill (works on both themes)
 */
const Button = forwardRef(function Button(
  {
    children,
    loading = false,
    disabled = false,
    type = "button",
    variant = "primary",
    className = "",
    ...props
  },
  ref
) {
  const base =
    "inline-flex items-center justify-center gap-2 font-medium text-sm rounded-lg px-5 py-2.5 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-60 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500",
    secondary:
      "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-400 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700 dark:focus:ring-gray-600",
    danger:
      "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          <span>Please wait…</span>
        </>
      ) : (
        children
      )}
    </button>
  );
});

export default Button;
