/**
 * Reusable controlled form input.
 * Accepts a React Hook Form `register` result via spread so it stays
 * compatible with RHF's ref forwarding without any extra wiring.
 *
 * Accessibility:
 * - `id` is derived from `name` so the label's `htmlFor` always matches.
 * - `aria-describedby` points to the error message element when present.
 * - `aria-invalid` signals to assistive technology that the field has an error.
 */
const FormInput = ({
  label,
  name,
  type = "text",
  placeholder,
  error,
  registration, // spread of register(name, rules) from React Hook Form
  autoComplete,
}) => {
  const inputId = `field-${name}`;
  const errorId = `${inputId}-error`;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={inputId}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className={`w-full px-4 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 ${
          error
            ? "border-red-400 bg-red-50 text-red-900 placeholder-red-300"
            : "border-gray-300 bg-white text-gray-900 placeholder-gray-400"
        }`}
        {...registration}
      />
      {error && (
        <p id={errorId} role="alert" className="text-xs text-red-600 mt-0.5">
          {error.message}
        </p>
      )}
    </div>
  );
};

export default FormInput;
