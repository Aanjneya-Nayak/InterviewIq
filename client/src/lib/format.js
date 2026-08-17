/**
 * Shared formatting utilities.
 *
 * Pure functions — no side effects, no imports.
 * Import only what you need; tree-shaking will drop the rest.
 */

/**
 * Format a byte count into a human-readable string.
 * @param {number} bytes
 * @returns {string}  e.g. "512 B", "1.5 KB", "3.20 MB"
 */
export const formatFileSize = (bytes) => {
  if (bytes < 1_024) return `${bytes} B`;
  if (bytes < 1_024 * 1_024) return `${(bytes / 1_024).toFixed(1)} KB`;
  return `${(bytes / (1_024 * 1_024)).toFixed(2)} MB`;
};

/**
 * Format an ISO date string into a short localised date.
 * @param {string} iso
 * @returns {string}  e.g. "Jul 26, 2026"
 */
export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

/**
 * Format a duration in seconds into "Xm Ys" or "Xs".
 * @param {number} seconds
 * @returns {string}  e.g. "12m 34s", "45s"
 */
export const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return "0s";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
};
