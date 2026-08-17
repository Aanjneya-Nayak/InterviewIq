import { useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";
import Button from "./Button";

/**
 * ConfirmModal
 *
 * A focused confirmation dialog for destructive actions.
 *
 * Accessibility:
 *   - role="dialog" + aria-modal="true" + aria-labelledby / aria-describedby
 *   - Focus is trapped inside: Tab cycles between Cancel and Confirm only.
 *   - Escape key dismisses the modal (calls onCancel).
 *   - Confirm button receives focus on open so keyboard users can act immediately.
 *   - Backdrop click calls onCancel.
 *
 * Props:
 *   isOpen      — boolean; controls visibility
 *   title       — string; dialog heading
 *   description — string; body copy
 *   confirmLabel — string; label for the destructive button (default "Delete")
 *   onConfirm   — async () => void; called when user confirms
 *   onCancel    — () => void; called on backdrop click, Escape, or Cancel button
 *   loading     — boolean; shows spinner on the confirm button while action is in flight
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
  const cancelRef = useRef(null);

  // Focus the confirm button when the modal opens
  useEffect(() => {
    if (isOpen) {
      // Small delay lets the CSS transition paint before stealing focus
      const id = setTimeout(() => confirmRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }
  }, [isOpen]);

  // Dismiss on Escape; trap Tab/Shift+Tab inside the two action buttons
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onCancel();
        return;
      }

      if (e.key === "Tab") {
        // Only two focusable elements: cancel and confirm
        const focusable = [cancelRef.current, confirmRef.current].filter(
          Boolean
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    // Backdrop
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dimmed overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby={description ? "confirm-modal-desc" : undefined}
        className="
          relative z-10 w-full max-w-md bg-white rounded-2xl shadow-xl
          border border-gray-200 p-6 flex flex-col gap-5
        "
      >
        {/* Close × */}
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>

        {/* Icon + heading */}
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle
              className="w-5 h-5 text-red-600"
              aria-hidden="true"
            />
          </div>
          <div className="pt-0.5">
            <h2
              id="confirm-modal-title"
              className="text-base font-semibold text-gray-900"
            >
              {title}
            </h2>
            {description && (
              <p
                id="confirm-modal-desc"
                className="mt-1 text-sm text-gray-500 leading-relaxed"
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
