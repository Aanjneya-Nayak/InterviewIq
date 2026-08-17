import { create } from "zustand";
import api from "../lib/axios";

/** Delay (ms) to hold the progress bar at 100% before resetting, for visual feedback. */
const PROGRESS_RESET_DELAY_MS = 800;

/**
 * Centralised resume state and actions.
 *
 * Loading states are intentionally split:
 *   uploading      — true only during upload/replace; drives the upload zone spinner + progress bar
 *   deleting       — true only during delete;         drives the ResumeCard delete button spinner
 *   fetching       — true during the initial GET on mount; drives the page skeleton
 *
 * Keeping them separate means the card's Delete button and the Upload button
 * never share a loading flag, so one action never blocks the other's UI.
 *
 * uploadProgress resets to 0 with a short delay after reaching 100 so the
 * progress bar animates to completion before disappearing.
 */
const useResumeStore = create((set) => ({
  resume: null,
  history: [],
  fetching: false,
  uploading: false,
  deleting: false,
  uploadProgress: 0,

  // ─── Fetch existing resume on page mount ─────────────────────────────
  fetchResume: async () => {
    set({ fetching: true });
    try {
      const { data } = await api.get("/resume");
      set({ resume: data.resume, fetching: false });
    } catch {
      set({ fetching: false });
    }
  },

  // ─── Fetch upload history (last 5) ───────────────────────────────────
  fetchHistory: async () => {
    try {
      const { data } = await api.get("/resume/history");
      set({ history: data.history ?? [] });
    } catch {
      // non-fatal — history is supplementary
    }
  },

  // ─── Upload (first time) or replace (subsequent) ─────────────────────
  uploadResume: async (file) => {
    set({ uploading: true, uploadProgress: 0 });
    try {
      const formData = new FormData();
      formData.append("resume", file);

      // Decide endpoint based on whether a resume already exists.
      const { resume } = useResumeStore.getState();
      const endpoint = resume ? "/resume/replace" : "/resume/upload";
      const method = resume ? "put" : "post";

      const { data } = await api[method](endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (event) => {
          if (event.total) {
            const pct = Math.round((event.loaded * 100) / event.total);
            set({ uploadProgress: pct });
          }
        },
      });

      // Let the bar reach 100 visually before resetting it
      set({ resume: data.resume, uploading: false, uploadProgress: 100 });
      setTimeout(() => set({ uploadProgress: 0 }), PROGRESS_RESET_DELAY_MS);

      // Refresh history so the new entry appears immediately
      try {
        const { data: h } = await api.get("/resume/history");
        set({ history: h.history ?? [] });
      } catch { /* non-fatal */ }

      return { success: true, message: data.message };
    } catch (err) {
      set({ uploading: false, uploadProgress: 0 });
      const message =
        err.response?.data?.message || "Upload failed. Please try again.";
      return { success: false, message };
    }
  },

  // ─── Delete ──────────────────────────────────────────────────────────
  deleteResume: async () => {
    set({ deleting: true });
    try {
      await api.delete("/resume");
      set({ resume: null, deleting: false, uploadProgress: 0 });
      return { success: true };
    } catch (err) {
      set({ deleting: false });
      const message =
        err.response?.data?.message || "Delete failed. Please try again.";
      return { success: false, message };
    }
  },
}));

export default useResumeStore;
