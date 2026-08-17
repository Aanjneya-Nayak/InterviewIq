import { create } from "zustand";
import api from "../lib/axios";

/**
 * Centralised authentication state and actions.
 *
 * All API calls go through the shared Axios instance which already has
 * `withCredentials: true`, so cookies are sent/received automatically.
 *
 * The `loading` flag is used in the UI to show spinners and disable buttons.
 * Separate `authLoading` (initial session check) vs `loading` (form submission)
 * prevents the UI from flashing the login page on a page refresh.
 */
const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  loading: false, // Form / action loading
  authLoading: true, // Initial session check on mount — true until resolved

  // ─── Registration ────────────────────────────────────────────────────
  register: async (name, email, password) => {
    set({ loading: true });
    try {
      const { data } = await api.post("/auth/register", {
        name,
        email,
        password,
      });
      set({ user: data.user, isAuthenticated: true, loading: false });
      return { success: true };
    } catch (err) {
      set({ loading: false });
      const message =
        err.response?.data?.message || "Registration failed. Please try again.";
      return { success: false, message };
    }
  },

  // ─── Login ───────────────────────────────────────────────────────────
  login: async (email, password) => {
    set({ loading: true });
    try {
      const { data } = await api.post("/auth/login", { email, password });
      set({ user: data.user, isAuthenticated: true, loading: false });
      return { success: true };
    } catch (err) {
      set({ loading: false });
      const message =
        err.response?.data?.message || "Login failed. Please try again.";
      return { success: false, message };
    }
  },

  // ─── Logout ──────────────────────────────────────────────────────────
  logout: async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Even if the server call fails, clear local state.
      // The cookie will expire naturally.
    } finally {
      set({ user: null, isAuthenticated: false });
    }
  },

  // ─── Fetch current user (on page load / refresh) ─────────────────────
  fetchCurrentUser: async () => {
    set({ authLoading: true });
    try {
      const { data } = await api.get("/auth/me");
      set({ user: data.user, isAuthenticated: true, authLoading: false });
    } catch {
      // 401 is expected when not logged in — not an error worth logging
      set({ user: null, isAuthenticated: false, authLoading: false });
    }
  },
}));

export default useAuthStore;
