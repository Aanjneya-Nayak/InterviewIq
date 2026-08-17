import { useState } from "react";
import {
  FileText,
  FileType2,
  ExternalLink,
  Trash2,
  Calendar,
  HardDrive,
  CheckCircle2,
} from "lucide-react";
import Button from "../ui/Button";
import ConfirmModal from "../ui/ConfirmModal";
import { formatFileSize, formatDate } from "../../lib/format";

/**
 * ResumeCard
 *
 * Displays metadata for the currently uploaded resume and exposes three actions:
 *
 *   Preview  — opens the Cloudinary secureUrl in a new tab
 *   Replace  — signals the parent to scroll to the upload zone
 *   Delete   — opens a ConfirmModal; calls onDelete only after user confirms
 *
 * Props:
 *   resume    — MongoDB Resume document from the store
 *   onDelete  — async () => void; called after the user confirms deletion
 *   onReplace — () => void; scrolls to upload zone
 *   deleting  — boolean; shows spinner on Delete while the API call is in flight
 */

const MIME_LABELS = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "DOCX",
};

const ResumeCard = ({ resume, onDelete, onReplace, deleting = false }) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const isPdf = resume.mimeType === "application/pdf";
  const typeLabel = MIME_LABELS[resume.mimeType] ?? "File";

  const handleDeleteClick = () => setShowConfirm(true);

  const handleConfirmDelete = async () => {
    await onDelete();
    setShowConfirm(false);
  };

  const handleCancelDelete = () => {
    if (!deleting) setShowConfirm(false);
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Status bar */}
        <div className="flex items-center gap-2 px-5 py-2.5 bg-green-50 border-b border-green-100">
          <CheckCircle2
            className="w-3.5 h-3.5 text-green-600 shrink-0"
            aria-hidden="true"
          />
          <span className="text-xs font-medium text-green-700">
            Resume on file — ready for AI analysis
          </span>
        </div>

        {/* Main content */}
        <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          {/* File type icon */}
          <div
            className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
              isPdf ? "bg-red-50" : "bg-blue-50"
            }`}
            aria-hidden="true"
          >
            {isPdf ? (
              <FileText className="w-6 h-6 text-red-500" />
            ) : (
              <FileType2 className="w-6 h-6 text-blue-500" />
            )}
          </div>

          {/* File info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  isPdf
                    ? "bg-red-100 text-red-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {typeLabel}
              </span>
              <span
                className="text-sm font-semibold text-gray-900 truncate"
                title={resume.originalFileName}
              >
                {resume.originalFileName}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                Uploaded {formatDate(resume.uploadedAt ?? resume.createdAt)}
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <HardDrive className="w-3.5 h-3.5" aria-hidden="true" />
                {formatFileSize(resume.fileSize)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {resume.secureUrl && (
              <a
                href={
                  resume.mimeType === "application/pdf"
                    ? resume.secureUrl.replace(
                        "/upload/",
                        "/upload/fl_attachment:false/"
                      )
                    : resume.secureUrl
                }
                target="_blank"
                rel="noopener noreferrer"
                className="
                  inline-flex items-center gap-1.5 text-sm font-medium
                  text-indigo-600 hover:text-indigo-700
                  border border-indigo-200 hover:border-indigo-400
                  bg-indigo-50 hover:bg-indigo-100
                  px-3 py-1.5 rounded-lg transition-colors
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1
                "
                aria-label={`Preview ${resume.originalFileName} (opens in new tab)`}
              >
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                Preview
              </a>
            )}

            {onReplace && (
              <Button
                variant="secondary"
                onClick={onReplace}
                disabled={deleting}
                className="px-3 py-1.5 text-sm"
                aria-label="Replace resume with a new file"
              >
                Replace
              </Button>
            )}

            <Button
              variant="danger"
              onClick={handleDeleteClick}
              loading={deleting}
              disabled={deleting}
              className="px-3 py-1.5 text-sm"
              aria-label={`Delete ${resume.originalFileName}`}
            >
              {!deleting && (
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              Delete
            </Button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        title="Delete resume?"
        description={`"${resume.originalFileName}" will be permanently removed from storage. This cannot be undone.`}
        confirmLabel="Yes, delete"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        loading={deleting}
      />
    </>
  );
};

export default ResumeCard;
