import { useCallback, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { UploadCloud, FileText, X } from "lucide-react";
import Button from "../ui/Button";
import UploadProgress from "./UploadProgress";
import { formatFileSize } from "../../lib/format";

/**
 * ResumeUpload
 *
 * Drag-and-drop + file browse upload zone.
 *
 * Validation (client-side, mirrors server rules exactly):
 *   - Accepted MIME types: application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document
 *   - Maximum size: 5 MB
 *
 * Props:
 *   onUpload       — async (file: File) => { success, message }
 *   uploading      — boolean; disables the form while upload is in flight
 *   uploadProgress — 0–100 number; shown in the UploadProgress bar
 *   isReplacing    — boolean; changes copy + button label to "Replace Resume"
 */

const ACCEPTED_MIME = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

const ResumeUpload = ({
  onUpload,
  uploading = false,
  uploadProgress = 0,
  isReplacing = false,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const {
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm();

  // ─── File validation ────────────────────────────────────────────────
  const validateAndSet = useCallback(
    (file) => {
      if (!file) return;

      if (!ACCEPTED_MIME.has(file.type)) {
        setError("file", {
          type: "manual",
          message: "Only PDF and DOCX files are accepted.",
        });
        setSelectedFile(null);
        return;
      }

      if (file.size > MAX_BYTES) {
        setError("file", {
          type: "manual",
          message: "File is too large. Maximum allowed size is 5 MB.",
        });
        setSelectedFile(null);
        return;
      }

      clearErrors("file");
      setSelectedFile(file);
    },
    [setError, clearErrors]
  );

  // ─── Drag handlers ───────────────────────────────────────────────────
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      validateAndSet(file);
    },
    [validateAndSet]
  );

  // ─── Browse handler ──────────────────────────────────────────────────
  const handleFileChange = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      validateAndSet(file);
      // Reset input so selecting the same file again triggers onChange
      e.target.value = "";
    },
    [validateAndSet]
  );

  // ─── Clear selection ─────────────────────────────────────────────────
  const handleClear = () => {
    setSelectedFile(null);
    clearErrors("file");
  };

  // ─── Submit ──────────────────────────────────────────────────────────
  const onSubmit = async () => {
    if (!selectedFile) {
      setError("file", {
        type: "manual",
        message: "Please select a file before uploading.",
      });
      return;
    }

    const result = await onUpload(selectedFile);

    if (result.success) {
      setSelectedFile(null);
    } else {
      setError("file", { type: "server", message: result.message });
    }
  };

  // ─── Helpers ─────────────────────────────────────────────────────────
  const fileTypeLabel =
    selectedFile?.type === "application/pdf" ? "PDF" : "DOCX";

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="File upload drop zone. Click or drag and drop a PDF or DOCX file here."
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !uploading) {
            fileInputRef.current?.click();
          }
        }}
        className={`
          relative w-full rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer
          flex flex-col items-center justify-center gap-3 px-6 py-10 text-center
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
          ${uploading ? "cursor-not-allowed opacity-60" : ""}
          ${
            dragOver
              ? "border-indigo-500 bg-indigo-50"
              : errors.file
                ? "border-red-400 bg-red-50"
                : "border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50"
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="sr-only"
          onChange={handleFileChange}
          disabled={uploading}
          aria-hidden="true"
          tabIndex={-1}
        />

        {/* Icon */}
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center ${
            dragOver ? "bg-indigo-100" : "bg-white border border-gray-200"
          }`}
          aria-hidden="true"
        >
          <UploadCloud
            className={`w-6 h-6 ${dragOver ? "text-indigo-600" : "text-gray-400"}`}
          />
        </div>

        {/* Text */}
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-700">
            {dragOver ? "Drop your file here" : "Drag & drop your resume here"}
          </p>
          <p className="text-xs text-gray-500">
            or{" "}
            <span className="text-indigo-600 font-medium underline underline-offset-2">
              browse to choose a file
            </span>
          </p>
          <p className="text-xs text-gray-400 pt-1">PDF or DOCX · max 5 MB</p>
        </div>
      </div>

      {/* Validation error */}
      {errors.file && (
        <p
          role="alert"
          className="mt-2 text-xs text-red-600 flex items-center gap-1"
        >
          {errors.file.message}
        </p>
      )}

      {/* Selected file preview */}
      {selectedFile && !uploading && (
        <div className="mt-3 flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-3">
          <FileText
            className="w-5 h-5 text-indigo-500 shrink-0"
            aria-hidden="true"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">
              {selectedFile.name}
            </p>
            <p className="text-xs text-gray-500">
              {fileTypeLabel} · {formatFileSize(selectedFile.size)}
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className="shrink-0 p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
            aria-label="Remove selected file"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Progress bar — shown only while uploading */}
      {uploading && (
        <div className="mt-4">
          <UploadProgress progress={uploadProgress} />
        </div>
      )}

      {/* Upload button */}
      <Button
        type="submit"
        loading={uploading}
        disabled={uploading || !selectedFile}
        className="w-full mt-4"
      >
        <UploadCloud className="w-4 h-4" aria-hidden="true" />
        {isReplacing ? "Replace Resume" : "Upload Resume"}
      </Button>
    </form>
  );
};

export default ResumeUpload;
