/**
 * FormInput
 *
 * Reusable controlled form input — compatible with React Hook Form's
 * `register()` spread pattern.
 *
 * Accessibility:
 * - id derived from name so label htmlFor always matches.
 * - aria-describedby → error element when present.
 * - aria-invalid signals errors to assistive technology.
 * - Supports light and dark themes via Tailwind dark: variants.
 */
const FormInput = ({
  label,
  name,
  type = "text",
  placeholder,
  error,
  registration,
  autoComplete,
}) => {
  const inputId = `field-${name}`;
  const errorId = `${inputId}-error`;

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
      </label>
      <input
        id={inputId}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className={`w-full px-4 py-2.5 rounded-lg border text-sm transition-colors
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0
          ${
            error
              ? "border-red-400 bg-red-50 text-red-900 placeholder-red-300 dark:bg-red-950 dark:border-red-600 dark:text-red-200 dark:placeholder-red-600"
              : "border-gray-300 bg-white text-gray-900 placeholder-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500"
          }`}
        {...registration}
      />
      {error && (
        <p id={errorId} role="alert" className="text-xs text-red-600 dark:text-red-400 mt-0.5">
          {error.message}
        </p>
      )}
    </div>
  );
};

export default FormInput;
