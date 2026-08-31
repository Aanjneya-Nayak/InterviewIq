import { Link } from "react-router-dom";
import { BrainCircuit, Home } from "lucide-react";

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 text-center px-4">
      {/* Brand mark */}
      <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xl mb-10">
        <BrainCircuit className="w-6 h-6" aria-hidden="true" />
        InterviewIQ
      </div>

      {/* Error */}
      <p className="text-8xl font-extrabold text-indigo-600 dark:text-indigo-400 leading-none mb-4" aria-hidden="true">
        404
      </p>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Page not found
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <Home className="w-4 h-4" aria-hidden="true" />
          Back to Home
        </Link>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 px-6 py-2.5 rounded-lg font-medium hover:border-indigo-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
