import { FileText, FileType2, Calendar, HardDrive, ExternalLink, Clock } from "lucide-react";
import { formatFileSize, formatDate } from "../../lib/format";

/**
 * ResumeHistory
 *
 * Displays the last 5 resume uploads as a compact list.
 * Each entry shows file name, type badge, size, upload date, and a preview link.
 *
 * Props:
 *   history — array of ResumeHistory documents from the store
 */

const MIME_LABELS = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
};

const HistoryEntry = ({ entry, index }) => {
  const isPdf = entry.mimeType === "application/pdf";
  const typeLabel = MIME_LABELS[entry.mimeType] ?? "File";

  // Build an inline-viewable URL for PDFs (Cloudinary fl_attachment:false)
  const previewUrl =
    isPdf && entry.secureUrl
      ? entry.secureUrl.replace("/upload/", "/upload/fl_attachment:false/")
      : entry.secureUrl;

  return (
    <li className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
      {/* Version number */}
      <span className="shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-400 text-xs font-bold flex items-center justify-center">
        {index + 1}
      </span>

      {/* Icon */}
      <div
        className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
          isPdf ? "bg-red-50" : "bg-blue-50"
        }`}
        aria-hidden="true"
      >
        {isPdf ? (
          <FileText className="w-4 h-4 text-red-500" />
        ) : (
          <FileType2 className="w-4 h-4 text-blue-500" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
              isPdf ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
            }`}
          >
            {typeLabel}
          </span>
          <span
            className="text-sm font-medium text-gray-800 truncate"
            title={entry.originalFileName}
          >
            {entry.originalFileName}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 mt-0.5">
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Calendar className="w-3 h-3" aria-hidden="true" />
            {formatDate(entry.uploadedAt)}
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <HardDrive className="w-3 h-3" aria-hidden="true" />
            {formatFileSize(entry.fileSize)}
          </span>
        </div>
      </div>

      {/* Preview link */}
      {previewUrl && (
        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 p-1.5 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label={`Preview ${entry.originalFileName}`}
        >
          <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
        </a>
      )}
    </li>
  );
};

const ResumeHistory = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 text-gray-400" aria-hidden="true" />
          </div>
          <h2 className="text-sm font-semibold text-gray-800">Upload History</h2>
        </div>
        <p className="text-xs text-gray-400 italic">No upload history yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
          <Clock className="w-4 h-4 text-gray-500" aria-hidden="true" />
        </div>
        <h2 className="text-sm font-semibold text-gray-800">Upload History</h2>
        <span className="ml-1 text-xs font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
          Last {history.length}
        </span>
      </div>

      <ul className="mt-1" role="list" aria-label="Resume upload history">
        {history.map((entry, idx) => (
          <HistoryEntry key={entry._id} entry={entry} index={idx} />
        ))}
      </ul>
    </div>
  );
};

export default ResumeHistory;
