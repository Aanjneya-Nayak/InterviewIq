import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { BrainCircuit } from "lucide-react";
import useAuthStore from "../store/useAuthStore";
import FormInput from "../components/ui/FormInput";
import Button from "../components/ui/Button";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm({ mode: "onTouched" });

  const onSubmit = async ({ email, password }) => {
    const result = await login(email, password);

    if (result.success) {
      toast.success("Welcome back!");
      navigate("/dashboard");
    } else {
      // Surface the API error under the password field for security —
      // we don't tell the user which field was wrong (user enumeration prevention).
      setError("password", { type: "server", message: result.message });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center justify-center gap-2 mb-8 text-indigo-600 dark:text-indigo-400 font-bold text-xl"
        >
          <BrainCircuit className="w-6 h-6" aria-hidden="true" />
          InterviewIQ
        </Link>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Welcome back
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Sign in to your InterviewIQ account
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="flex flex-col gap-4"
          >
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
              placeholder="••••••••"
              autoComplete="current-password"
              error={errors.password}
              registration={register("password", {
                required: "Password is required",
              })}
            />

            <Button type="submit" loading={loading} className="w-full mt-2">
              Sign in
            </Button>
          </form>

          <p className="text-sm text-center text-gray-500 dark:text-gray-400 mt-6">
            Don&apos;t have an account?{" "}
            <Link
              to="/register"
              className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
