/**
 * UploadProgress
 *
 * Displays a labelled progress bar driven by a 0–100 percentage value.
 * Shown only while an upload is in flight (parent conditionally renders it).
 *
 * Accessibility:
 *   - role="progressbar" with aria-valuenow / aria-valuemin / aria-valuemax
 *     so screen readers announce the current upload percentage.
 */
const UploadProgress = ({ progress = 0 }) => {
  return (
    <div className="w-full space-y-1.5" aria-label="Upload progress">
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium text-gray-600">Uploading…</span>
        <span className="text-xs font-medium text-indigo-600">
          {progress}%
        </span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-2 bg-indigo-600 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default UploadProgress;
