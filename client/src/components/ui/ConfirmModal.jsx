import { useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";
import Button from "./Button";

/**
 * ConfirmModal
 *
 * Accessible confirmation dialog for destructive actions.
 * Supports light and dark themes.
 *
 * Accessibility:
 *   - role="dialog" + aria-modal + aria-labelledby / aria-describedby
 *   - Focus trapped between Cancel and Confirm buttons.
 *   - Escape key dismisses (calls onCancel).
 *   - Confirm button auto-focused on open.
 *   - Backdrop click dismisses.
 */
const ConfirmModal = ({
  isOpen,
  title = "Are you sure?",
  description,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
  loading = false,
}) => {
  const confirmRef = useRef(null);
  const cancelRef  = useRef(null);

  // Focus confirm button when modal opens
  useEffect(() => {
    if (isOpen) {
      const id = setTimeout(() => confirmRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }
  }, [isOpen]);

  // Escape to dismiss + Tab trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") { onCancel(); return; }

      if (e.key === "Tab") {
        const focusable = [cancelRef.current, confirmRef.current].filter(Boolean);
        const first = focusable[0];
        const last  = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
        } else {
          if (document.activeElement === last)  { e.preventDefault(); first?.focus(); }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby={description ? "confirm-modal-desc" : undefined}
        className="relative z-10 w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-5"
      >
        {/* Close × */}
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>

        {/* Icon + heading */}
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" aria-hidden="true" />
          </div>
          <div className="pt-0.5">
            <h2
              id="confirm-modal-title"
              className="text-base font-semibold text-gray-900 dark:text-white"
            >
              {title}
            </h2>
            {description && (
              <p
                id="confirm-modal-desc"
                className="mt-1 text-sm text-gray-500 dark:text-gray-400 leading-relaxed"
              >
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            ref={cancelRef}
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2"
          >
            Cancel
          </Button>
          <Button
            ref={confirmRef}
            type="button"
            variant="danger"
            onClick={onConfirm}
            loading={loading}
            className="px-4 py-2"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
