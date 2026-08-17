import { Link } from "react-router-dom";

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-4">
      <h1 className="text-7xl font-extrabold text-indigo-600 mb-4">404</h1>
      <p className="text-xl text-gray-700 mb-2">Page not found</p>
      <p className="text-gray-500 mb-8">
        The page you're looking for doesn't exist or was moved.
      </p>
      <Link
        to="/"
        className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
      >
        Back to Home
      </Link>
    </div>
  );
};

export default NotFoundPage;
