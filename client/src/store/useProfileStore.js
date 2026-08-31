import { create } from "zustand";
import api from "../lib/axios";

/**
 * useProfileStore
 *
 * Owns the profile fetch + update lifecycle separately from useAuthStore.
 * useAuthStore keeps the lightweight session user (name, email) used across
 * the entire app. This store manages the full profile load and edits, then
 * syncs the updated user back into useAuthStore so the Navbar reflects
 * name changes immediately without a page refresh.
 *
 * Loading flags:
 *   fetching — GET /api/users/profile on page mount
 *   saving   — PATCH /api/users/profile on form submit
 */
const useProfileStore = create((set) => ({
  profile: null,
  fetching: false,
  saving: false,
  fetchError: null,
  saveError: null,

  // ── Load full profile ──────────────────────────────────────────────────
  fetchProfile: async () => {
    set({ fetching: true, fetchError: null });
    try {
      const { data } = await api.get("/users/profile");
      set({ profile: data.user, fetching: false });
    } catch (err) {
      set({
        fetching: false,
        fetchError:
          err.response?.data?.message ||
          "Could not load your profile. Please try again.",
      });
    }
  },

  // ── Update name + targetRole ───────────────────────────────────────────
  // Returns { success, message?, validationErrors? } so the form can
  // surface field-level server errors via RHF setError().
  updateProfile: async (payload) => {
    set({ saving: true, saveError: null });
    try {
      const { data } = await api.patch("/users/profile", payload);
      set({ profile: data.user, saving: false });
      return { success: true, user: data.user };
    } catch (err) {
      set({ saving: false });

      // 422 validation errors — return them for field-level display
      if (err.response?.status === 422) {
        return {
          success: false,
          validationErrors: err.response.data.errors ?? [],
        };
      }

      const message =
        err.response?.data?.message || "Update failed. Please try again.";
      set({ saveError: message });
      return { success: false, message };
    }
  },

  clearSaveError: () => set({ saveError: null }),
}));

export default useProfileStore;
