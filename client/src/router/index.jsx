import { createBrowserRouter } from "react-router-dom";

import ProtectedRoute from "../components/guards/ProtectedRoute";
import PublicRoute from "../components/guards/PublicRoute";

import LandingPage from "../pages/LandingPage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import DashboardPage from "../pages/DashboardPage";
import ResumePage from "../pages/ResumePage";
import AnalysisPage from "../pages/AnalysisPage";
import InterviewSetupPage from "../pages/InterviewSetupPage";
import InterviewPage from "../pages/InterviewPage";
import InterviewSessionPage from "../pages/InterviewSessionPage";
import InterviewCompletePage from "../pages/InterviewCompletePage";
import ReportsPage from "../pages/ReportsPage";
import ProfilePage from "../pages/ProfilePage";
import NotFoundPage from "../pages/NotFoundPage";
import InterviewHistoryPage from "../pages/InterviewHistoryPage";

/**
 * Route architecture:
 *
 * Public routes  — accessible to everyone (landing, 404)
 * PublicRoute    — only for unauthenticated users; redirects to /dashboard if logged in
 * ProtectedRoute — only for authenticated users; redirects to /login if not
 *
 * Both guards handle the `authLoading` state to prevent flash-redirects on refresh.
 */
const router = createBrowserRouter([
  // ─── Always public ────────────────────────────────────────────────────
  { path: "/", element: <LandingPage /> },
  { path: "*", element: <NotFoundPage /> },

  // ─── Guest only (redirect to /dashboard if already logged in) ─────────
  {
    element: <PublicRoute />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
    ],
  },

  // ─── Authenticated only (redirect to /login if not logged in) ─────────
  {
    element: <ProtectedRoute />,
    children: [
      { path: "/dashboard", element: <DashboardPage /> },
      { path: "/resume", element: <ResumePage /> },
      { path: "/analysis", element: <AnalysisPage /> },
      { path: "/interview", element: <InterviewSetupPage /> },
      { path: "/interview/setup", element: <InterviewSetupPage /> },
      { path: "/interview/:id", element: <InterviewPage /> },
      { path: "/interview/:id/session", element: <InterviewSessionPage /> },
      { path: "/interview/:id/complete", element: <InterviewCompletePage /> },
      { path: "/interviews", element: <InterviewHistoryPage /> },
      { path: "/reports", element: <ReportsPage /> },
      { path: "/profile", element: <ProfilePage /> },
    ],
  },
]);

export default router;
