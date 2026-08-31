import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { User, Briefcase } from "lucide-react";
import FormInput from "../ui/FormInput";
import Button from "../ui/Button";

/**
 * ProfileForm
 *
 * Controlled form for editing name and targetRole.
 * Email is displayed read-only — changes require a dedicated verification
 * flow not in scope for this phase.
 *
 * Props:
 *   profile     — current user object { name, email, targetRole }
 *   onSubmit    — async ({ name, targetRole }) => { success, validationErrors? }
 *   saving      — boolean — drives the submit button loading state
 */
const ProfileForm = ({ profile, onSubmit, saving }) => {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm({
    mode: "onTouched",
    defaultValues: {
      name: profile?.name ?? "",
      targetRole: profile?.targetRole ?? "",
    },
  });

  // Sync form defaults whenever profile data loads/changes
  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name ?? "",
        targetRole: profile.targetRole ?? "",
      });
    }
  }, [profile, reset]);

  const handleFormSubmit = async (values) => {
    const result = await onSubmit({
      name: values.name.trim(),
      targetRole: values.targetRole?.trim() || null,
    });

    if (!result.success && result.validationErrors?.length) {
      // Map server field errors back into the form
      result.validationErrors.forEach(({ field, message }) => {
        setError(field, { type: "server", message });
      });
    }

    // On success, reset dirty state so the save button re-disables
    if (result.success) {
      reset({
        name: values.name.trim(),
        targetRole: values.targetRole?.trim() || "",
      });
    }
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      noValidate
      className="space-y-5"
      aria-label="Edit profile"
    >
      {/* Name */}
      <FormInput
        label="Full name"
        name="name"
        type="text"
        placeholder="Jane Smith"
        autoComplete="name"
        error={errors.name}
        registration={register("name", {
          required: "Name is required",
          minLength: { value: 2, message: "Name must be at least 2 characters" },
          maxLength: { value: 50, message: "Name cannot exceed 50 characters" },
        })}
      />

      {/* Email — read-only */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="field-email-readonly"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Email address
        </label>
        <div className="relative">
          <input
            id="field-email-readonly"
            type="email"
            value={profile?.email ?? ""}
            readOnly
            disabled
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 text-sm cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400"
            aria-label="Email address — cannot be changed"
          />
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          Email cannot be changed from this page.
        </p>
      </div>

      {/* Target Role */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="field-targetRole"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Target role
          <span className="ml-1 text-xs font-normal text-gray-400">(optional)</span>
        </label>
        <div className="relative">
          <Briefcase
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            aria-hidden="true"
          />
          <input
            id="field-targetRole"
            type="text"
            placeholder="e.g. Senior Software Engineer"
            autoComplete="organization-title"
            aria-invalid={!!errors.targetRole}
            aria-describedby={errors.targetRole ? "field-targetRole-error" : undefined}
            className={`w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm transition-colors
              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0
              dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500
              ${
                errors.targetRole
                  ? "border-red-400 bg-red-50 text-red-900 placeholder-red-300"
                  : "border-gray-300 bg-white text-gray-900 placeholder-gray-400"
              }`}
            {...register("targetRole", {
              maxLength: {
                value: 100,
                message: "Target role cannot exceed 100 characters",
              },
            })}
          />
        </div>
        {errors.targetRole && (
          <p id="field-targetRole-error" role="alert" className="text-xs text-red-600 mt-0.5">
            {errors.targetRole.message}
          </p>
        )}
      </div>

      {/* Submit */}
      <div className="pt-1">
        <Button
          type="submit"
          loading={saving}
          disabled={!isDirty || saving}
          className="w-full sm:w-auto gap-2"
        >
          <User className="w-4 h-4" aria-hidden="true" />
          {saving ? "Saving…" : "Save changes"}
        </Button>
        {!isDirty && !saving && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            No changes to save.
          </p>
        )}
      </div>
    </form>
  );
};

export default ProfileForm;
