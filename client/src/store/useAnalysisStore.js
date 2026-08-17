import { create } from "zustand";
import api from "../lib/axios";

const useAnalysisStore = create((set) => ({
  analysis: null,
  currentResume: null, // the user's live resume — used to detect stale analysis
  fetching: false,
  analyzing: false,
  error: null,

  // ── Load the last stored analysis + current resume in parallel ──────────
  fetchAnalysis: async () => {
    set({ fetching: true, error: null });
    try {
      const [analysisRes, resumeRes] = await Promise.all([
        api.get("/resume/analysis"),
        api.get("/resume"),
      ]);
      set({
        analysis: analysisRes.data.analysis ?? null,
        currentResume: resumeRes.data.resume ?? null,
        fetching: false,
      });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Could not load your analysis. Please try again.";
      set({ fetching: false, error: message });
    }
  },

  // ── Trigger a new AI analysis ───────────────────────────────────────────
  runAnalysis: async () => {
    set({ analyzing: true, error: null });
    try {
      const { data } = await api.post("/resume/analyze");
      // Also refresh the current resume so staleness check resets
      const resumeRes = await api.get("/resume");
      set({
        analysis: data.analysis,
        currentResume: resumeRes.data.resume ?? null,
        analyzing: false,
      });
      return { success: true };
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Analysis failed. Please try again in a moment.";
      set({ analyzing: false, error: message });
      return { success: false, message };
    }
  },

  // ── Clear error state ───────────────────────────────────────────────────
  clearError: () => set({ error: null }),
}));

export default useAnalysisStore;
