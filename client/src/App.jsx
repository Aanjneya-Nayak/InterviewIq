import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import router from "./router";
import useAuthStore from "./store/useAuthStore";

/**
 * App.jsx wires the router, global providers, and the initial auth check.
 *
 * `fetchCurrentUser` runs once on mount — it hits GET /api/auth/me to rehydrate
 * the auth state from the existing httpOnly cookie after a page refresh.
 * Until it resolves, `authLoading` is true, so the route guards show a spinner
 * instead of incorrectly redirecting to /login.
 */
const App = () => {
  const fetchCurrentUser = useAuthStore((s) => s.fetchCurrentUser);

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
          style: { fontSize: "14px" },
        }}
      />
    </>
  );
};

export default App;
