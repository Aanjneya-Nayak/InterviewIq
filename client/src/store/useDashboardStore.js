import { create } from "zustand";
import api from "../lib/axios";

/**
 * useDashboardStore — Phase 8.2
 *
 * Holds all four dashboard API responses in one place.
 * Each slice has its own fetching/error flags so sections can load
 * independently and show per-section error/retry states.
 */
const useDashboardStore = create((set) => ({
  // ── Overview ──────────────────────────────────────────────────────────
  overview: null,
  overviewFetching: false,
  overviewError: null,

  // ── Activity ──────────────────────────────────────────────────────────
  activity: [],
  activityRange: "7d",
  activityFetching: false,
  activityError: null,

  // ── Recent interviews ─────────────────────────────────────────────────
  recentInterviews: [],
  recentFetching: false,
  recentError: null,

  // ── Progress ──────────────────────────────────────────────────────────
  progress: null,
  progressFetching: false,
  progressError: null,

  // ── Actions ───────────────────────────────────────────────────────────

  fetchOverview: async () => {
    set({ overviewFetching: true, overviewError: null });
    try {
      const { data } = await api.get("/dashboard/overview");
      set({ overview: data.overview, overviewFetching: false });
    } catch (err) {
      set({
        overviewFetching: false,
        overviewError:
          err.response?.data?.message ||
          "Could not load overview. Please try again.",
      });
    }
  },

  fetchActivity: async (range = "7d") => {
    set({ activityFetching: true, activityError: null, activityRange: range });
    try {
      const { data } = await api.get(`/dashboard/activity?range=${range}`);
      set({ activity: data.activity ?? [], activityFetching: false });
    } catch (err) {
      set({
        activityFetching: false,
        activityError:
          err.response?.data?.message ||
          "Could not load activity data. Please try again.",
      });
    }
  },

  fetchRecentInterviews: async () => {
    set({ recentFetching: true, recentError: null });
    try {
      const { data } = await api.get("/dashboard/recent-interviews");
      set({ recentInterviews: data.interviews ?? [], recentFetching: false });
    } catch (err) {
      set({
        recentFetching: false,
        recentError:
          err.response?.data?.message ||
          "Could not load recent interviews. Please try again.",
      });
    }
  },

  fetchProgress: async () => {
    set({ progressFetching: true, progressError: null });
    try {
      const { data } = await api.get("/dashboard/progress");
      set({ progress: data.progress, progressFetching: false });
    } catch (err) {
      set({
        progressFetching: false,
        progressError:
          err.response?.data?.message ||
          "Could not load progress data. Please try again.",
      });
    }
  },

  // Fetch all four endpoints in parallel
  fetchAll: async (range = "7d") => {
    set({
      overviewFetching: true,
      activityFetching: true,
      recentFetching: true,
      progressFetching: true,
      overviewError: null,
      activityError: null,
      recentError: null,
      progressError: null,
      activityRange: range,
    });

    const [overviewRes, activityRes, recentRes, progressRes] =
      await Promise.allSettled([
        api.get("/dashboard/overview"),
        api.get(`/dashboard/activity?range=${range}`),
        api.get("/dashboard/recent-interviews"),
        api.get("/dashboard/progress"),
      ]);

    set({
      overview:
        overviewRes.status === "fulfilled"
          ? overviewRes.value.data.overview
          : null,
      overviewFetching: false,
      overviewError:
        overviewRes.status === "rejected"
          ? overviewRes.reason?.response?.data?.message || "Failed to load overview."
          : null,

      activity:
        activityRes.status === "fulfilled"
          ? activityRes.value.data.activity ?? []
          : [],
      activityFetching: false,
      activityError:
        activityRes.status === "rejected"
          ? activityRes.reason?.response?.data?.message || "Failed to load activity."
          : null,

      recentInterviews:
        recentRes.status === "fulfilled"
          ? recentRes.value.data.interviews ?? []
          : [],
      recentFetching: false,
      recentError:
        recentRes.status === "rejected"
          ? recentRes.reason?.response?.data?.message || "Failed to load recent interviews."
          : null,

      progress:
        progressRes.status === "fulfilled"
          ? progressRes.value.data.progress
          : null,
      progressFetching: false,
      progressError:
        progressRes.status === "rejected"
          ? progressRes.reason?.response?.data?.message || "Failed to load progress."
          : null,
    });
  },
}));

export default useDashboardStore;
