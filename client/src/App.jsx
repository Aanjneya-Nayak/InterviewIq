import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import router from "./router";
import useAuthStore from "./store/useAuthStore";
import useThemeStore from "./store/useThemeStore";

/**
 * App.jsx — root component.
 *
 * Responsibilities:
 *   1. Kick off the initial auth check (GET /api/auth/me) so route guards
 *      know whether to redirect before rendering any page.
 *   2. Subscribe to useThemeStore so the MQL system-preference listener
 *      is alive from the very first render. The store itself is a singleton
 *      and the inline script in index.html already applied the correct class
 *      to <html> before React mounted, so there is no theme flash.
 *   3. Render the Toaster with styles that adapt to the active theme.
 */
const App = () => {
  const fetchCurrentUser = useAuthStore((s) => s.fetchCurrentUser);
  const isDark = useThemeStore((s) => s.isDark);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  return (
    <>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            fontSize: "14px",
            background: isDark ? "#1f2937" : "#ffffff",
            color:      isDark ? "#f9fafb" : "#111827",
            border:     isDark ? "1px solid #374151" : "1px solid #e5e7eb",
            boxShadow:  isDark
              ? "0 4px 12px rgba(0,0,0,0.5)"
              : "0 4px 12px rgba(0,0,0,0.1)",
          },
          success: {
            iconTheme: {
              primary: "#6366f1",
              secondary: isDark ? "#1f2937" : "#ffffff",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: isDark ? "#1f2937" : "#ffffff",
            },
          },
        }}
      />
    </>
  );
};

export default App;
