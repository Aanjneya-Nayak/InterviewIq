import { Navigate, Outlet } from "react-router-dom";
import useAuthStore from "../../store/useAuthStore";

/**
 * Renders child routes only when the user is authenticated.
 * Unauthenticated users are redirected to /login.
 *
 * `authLoading` is true during the initial /api/auth/me check on mount.
 * We render nothing (or a spinner) instead of immediately redirecting,
 * which prevents authenticated users from being bounced to /login on a hard refresh.
 */
const ProtectedRoute = () => {
  const { isAuthenticated, authLoading } = useAuthStore();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
