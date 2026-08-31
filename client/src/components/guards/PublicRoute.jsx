import { Navigate, Outlet } from "react-router-dom";
import useAuthStore from "../../store/useAuthStore";

/**
 * Renders child routes only when the user is NOT authenticated.
 * Authenticated users visiting /login or /register are redirected to /dashboard.
 *
 * Same authLoading guard as ProtectedRoute to prevent a flash redirect
 * before the session check resolves.
 */
const PublicRoute = () => {
  const { isAuthenticated, authLoading } = useAuthStore();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" aria-label="Loading" />
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
};

export default PublicRoute;
