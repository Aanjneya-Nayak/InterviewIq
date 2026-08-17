import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { BrainCircuit } from "lucide-react";
import useAuthStore from "../store/useAuthStore";
import FormInput from "../components/ui/FormInput";
import Button from "../components/ui/Button";

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register: registerUser, loading } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
  } = useForm({ mode: "onTouched" });

  // Watch password to validate confirm password
  const password = watch("password");

  const onSubmit = async ({ name, email, password }) => {
    const result = await registerUser(name, email, password);

    if (result.success) {
      toast.success("Account created! Welcome to InterviewIQ.");
      navigate("/dashboard");
    } else {
      // Map duplicate email error to the email field
      if (result.message?.toLowerCase().includes("email")) {
        setError("email", { type: "server", message: result.message });
      } else {
        setError("name", { type: "server", message: result.message });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center justify-center gap-2 mb-8 text-indigo-600 font-bold text-xl"
        >
          <BrainCircuit className="w-6 h-6" />
          InterviewIQ
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Create an account
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Start your AI-powered interview prep today
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="flex flex-col gap-4"
          >
            <FormInput
              label="Full name"
              name="name"
              type="text"
              placeholder="Jane Smith"
              autoComplete="name"
              error={errors.name}
              registration={register("name", {
                required: "Name is required",
                minLength: {
                  value: 2,
                  message: "Name must be at least 2 characters",
                },
                maxLength: {
                  value: 50,
                  message: "Name cannot exceed 50 characters",
                },
              })}
            />

            <FormInput
              label="Email address"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              error={errors.email}
              registration={register("email", {
                required: "Email is required",
                pattern: {
                  value: /^\S+@\S+\.\S+$/,
                  message: "Please enter a valid email address",
                },
              })}
            />

            <FormInput
              label="Password"
              name="password"
              type="password"
              placeholder="Min. 8 characters"
              autoComplete="new-password"
              error={errors.password}
              registration={register("password", {
                required: "Password is required",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters",
                },
                validate: {
                  hasUpper: (v) =>
                    /[A-Z]/.test(v) ||
                    "Must contain at least one uppercase letter",
                  hasLower: (v) =>
                    /[a-z]/.test(v) ||
                    "Must contain at least one lowercase letter",
                  hasNumber: (v) =>
                    /[0-9]/.test(v) || "Must contain at least one number",
                },
              })}
            />

            <FormInput
              label="Confirm password"
              name="confirmPassword"
              type="password"
              placeholder="Repeat your password"
              autoComplete="new-password"
              error={errors.confirmPassword}
              registration={register("confirmPassword", {
                required: "Please confirm your password",
                validate: (v) => v === password || "Passwords do not match",
              })}
            />

            <Button type="submit" loading={loading} className="w-full mt-2">
              Create account
            </Button>
          </form>

          <p className="text-sm text-center text-gray-500 mt-6">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-indigo-600 font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
