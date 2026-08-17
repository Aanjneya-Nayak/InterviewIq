import { create } from "zustand";
import api from "../lib/axios";

/**
 * useInterviewStore — centralised interview session state.
 *
 * Loading flags are split by action so different UI elements can spin
 * independently without blocking each other.
 *
 *   creating   — POST /api/interviews
 *   fetching   — GET  /api/interviews[/:id]
 *   starting   — POST /api/interviews/:id/start
 *   saving     — POST /api/interviews/:id/save-answer
 *   completing — POST /api/interviews/:id/complete
 *   updating   — PATCH /api/interviews/:id
 *   deleting   — DELETE /api/interviews/:id
 */
const useInterviewStore = create((set, get) => ({
  sessions: [],
  currentSession: null,
  summary: null,
  fetching: false,
  creating: false,
  starting: false,
  saving: false,
  completing: false,
  updating: false,
  deleting: false,
  error: null,

  // ── Fetch all sessions ──────────────────────────────────────────────────
  fetchSessions: async () => {
    set({ fetching: true, error: null });
    try {
      const { data } = await api.get("/interviews");
      set({ sessions: data.sessions ?? [], fetching: false });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Could not load your interviews. Please try again.";
      set({ fetching: false, error: message });
    }
  },

  // ── Fetch single session ────────────────────────────────────────────────
  fetchSession: async (id) => {
    set({ fetching: true, error: null });
    try {
      // Use /current to get the convenience fields (currentQuestion + currentAnswer)
      const { data } = await api.get(`/interviews/${id}/current`);
      set({ currentSession: data.session, fetching: false });
      return { success: true, session: data.session };
    } catch (err) {
      const message =
        err.response?.data?.message || "Could not load the interview session.";
      set({ fetching: false, error: message });
      return { success: false, message };
    }
  },

  // ── Create session ──────────────────────────────────────────────────────
  createSession: async ({ interviewType, difficulty, targetRole, questionCount }) => {
    set({ creating: true, error: null });
    try {
      const { data } = await api.post("/interviews", {
        interviewType,
        difficulty,
        targetRole,
        questionCount: Number(questionCount),
      });
      set((state) => ({
        sessions: [data.session, ...state.sessions],
        currentSession: data.session,
        creating: false,
      }));
      return { success: true, session: data.session };
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to create interview session.";
      set({ creating: false, error: message });
      return { success: false, message };
    }
  },

  // ── Start session (generates questions via Gemini) ──────────────────────
  startSession: async (id) => {
    set({ starting: true, error: null });
    try {
      const { data } = await api.post(`/interviews/${id}/start`);
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s._id === id ? data.session : s
        ),
        currentSession: data.session,
        starting: false,
      }));
      return { success: true, session: data.session };
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Failed to generate questions. Please try again.";
      set({ starting: false, error: message });
      return { success: false, message };
    }
  },

  // ── Save an answer ──────────────────────────────────────────────────────
  saveAnswer: async (id, questionId, answer) => {
    set({ saving: true, error: null });
    try {
      const { data } = await api.post(`/interviews/${id}/save-answer`, {
        questionId,
        answer,
      });
      set((state) => ({
        currentSession: data.session,
        sessions: state.sessions.map((s) =>
          s._id === id ? data.session : s
        ),
        saving: false,
      }));
      return {
        success: true,
        progress: data.progress,
        isCompleted: data.isCompleted,
      };
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to save answer. Please try again.";
      set({ saving: false, error: message });
      return { success: false, message };
    }
  },

  // ── Update navigation cursor (debounced by the page component) ──────────
  updateProgress: async (id, currentQuestionIndex) => {
    // Fire-and-forget — no loading state needed for cursor updates
    try {
      await api.patch(`/interviews/${id}/progress`, { currentQuestionIndex });
      set((state) => ({
        currentSession: state.currentSession
          ? { ...state.currentSession, currentQuestionIndex }
          : state.currentSession,
      }));
    } catch {
      // Non-fatal — cursor will reconcile on next fetch
    }
  },

  // ── Update session status ───────────────────────────────────────────────
  updateStatus: async (id, status) => {
    set({ updating: true, error: null });
    try {
      const { data } = await api.patch(`/interviews/${id}`, { status });
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s._id === id ? data.session : s
        ),
        currentSession:
          state.currentSession?._id === id
            ? data.session
            : state.currentSession,
        updating: false,
      }));
      return { success: true, session: data.session };
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to update interview session.";
      set({ updating: false, error: message });
      return { success: false, message };
    }
  },

  // ── Delete session ──────────────────────────────────────────────────────
  deleteSession: async (id) => {
    set({ deleting: true, error: null });
    try {
      await api.delete(`/interviews/${id}`);
      set((state) => ({
        sessions: state.sessions.filter((s) => s._id !== id),
        currentSession:
          state.currentSession?._id === id ? null : state.currentSession,
        deleting: false,
      }));
      return { success: true };
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to delete interview session.";
      set({ deleting: false, error: message });
      return { success: false, message };
    }
  },

  // ── Utilities ───────────────────────────────────────────────────────────
  clearError: () => set({ error: null }),
  clearCurrentSession: () => set({ currentSession: null }),

  // ── Explicitly complete a session (partial or full) ─────────────────────
  completeSession: async (id) => {
    set({ completing: true, error: null });
    try {
      const { data } = await api.post(`/interviews/${id}/complete`);
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s._id === id ? data.session : s
        ),
        currentSession:
          state.currentSession?._id === id
            ? data.session
            : state.currentSession,
        completing: false,
      }));
      return { success: true, session: data.session };
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to complete the interview.";
      set({ completing: false, error: message });
      return { success: false, message };
    }
  },

  // ── Fetch summary stats for the completion page ──────────────────────────
  fetchSummary: async (id) => {
    set({ fetching: true, error: null });
    try {
      const { data } = await api.get(`/interviews/${id}/summary`);
      set({ summary: data.summary, fetching: false });
      return { success: true, summary: data.summary };
    } catch (err) {
      const message =
        err.response?.data?.message || "Could not load interview summary.";
      set({ fetching: false, error: message });
      return { success: false, message };
    }
  },

  clearSummary: () => set({ summary: null }),
}));

export default useInterviewStore;
