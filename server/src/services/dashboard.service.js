import mongoose from "mongoose";
import InterviewSession from "../models/InterviewSession.js";
import ResumeAnalysis from "../models/ResumeAnalysis.js";

/**
 * dashboard.service.js — Phase 8.1: Dashboard Analytics
 *
 * All metrics are derived entirely from real documents already in the database.
 * No fake scores, no placeholder values.
 *
 * Units:
 *   - totalPracticeTime is returned in SECONDS.
 *     The field maps directly to InterviewSession.totalDuration (seconds).
 *     Formatting (e.g. "14m 30s") is the frontend's responsibility.
 *
 * Practice day definition:
 *   A calendar day on which the user had at least one InterviewSession that
 *   contains at least one non-empty saved answer.
 *   Sessions that were created but never answered (draft or empty in_progress)
 *   do not count as practice days.
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns a UTC Date at midnight (00:00:00.000Z) for the given date.
 * Used to bucket activity by calendar day.
 *
 * @param {Date} date
 * @returns {Date}
 */
const toMidnightUTC = (date) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

/**
 * Parses the validated range string ("7d" | "30d" | "90d") into a Date
 * representing the start of that window (from now).
 *
 * @param {string} range
 * @returns {Date}
 */
const rangeToStartDate = (range) => {
  const days = parseInt(range, 10); // "7d" → 7, "30d" → 30, "90d" → 90
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - days);
  start.setUTCHours(0, 0, 0, 0);
  return start;
};

// ─── Overview ─────────────────────────────────────────────────────────────────

/**
 * GET /api/dashboard/overview
 *
 * Aggregates session-level statistics for the authenticated user.
 * Falls through gracefully when no sessions or no analysis exist.
 *
 * @param {string} userId - MongoDB ObjectId string
 * @returns {Promise<object>}
 */
export const getOverview = async (userId) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // ── Single aggregation pipeline — avoids N+1 queries ────────────────────
  const [agg] = await InterviewSession.aggregate([
    { $match: { user: userObjectId } },
    {
      $group: {
        _id: null,
        totalInterviews: { $sum: 1 },

        completedInterviews: {
          $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
        },
        inProgressInterviews: {
          $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] },
        },
        abandonedInterviews: {
          $sum: { $cond: [{ $eq: ["$status", "abandoned"] }, 1, 0] },
        },

        // Sum questionCount from every session (questions generated)
        totalQuestionsGenerated: { $sum: "$questionCount" },

        // answeredQuestions is stored at completion; for in_progress sessions
        // we compute it from the answers array inline via $filter + $size
        totalQuestionsAnswered: {
          $sum: {
            $cond: [
              // For completed sessions, use the stored field (reliable)
              { $eq: ["$status", "completed"] },
              { $ifNull: ["$answeredQuestions", 0] },
              // For in_progress / other: count non-empty answer strings live
              {
                $size: {
                  $filter: {
                    input: { $ifNull: ["$answers", []] },
                    as: "a",
                    cond: { $gt: [{ $strLenCP: { $ifNull: ["$$a.answer", ""] } }, 0] },
                  },
                },
              },
            ],
          },
        },

        // skippedQuestions is stored at completion; for in_progress sessions
        // there are no officially "skipped" questions yet — they are unanswered.
        totalQuestionsSkipped: {
          $sum: {
            $cond: [
              { $eq: ["$status", "completed"] },
              { $ifNull: ["$skippedQuestions", 0] },
              0, // in_progress sessions have no skipped count yet
            ],
          },
        },

        // Sum of totalDuration (seconds) for sessions that recorded it
        totalPracticeTime: {
          $sum: { $ifNull: ["$totalDuration", 0] },
        },
      },
    },
  ]);

  // ── Build overview object — handle zero-session case ─────────────────────
  const totalInterviews = agg?.totalInterviews ?? 0;
  const completedInterviews = agg?.completedInterviews ?? 0;

  const overview = {
    totalInterviews,
    completedInterviews,
    inProgressInterviews: agg?.inProgressInterviews ?? 0,
    abandonedInterviews: agg?.abandonedInterviews ?? 0,
    totalQuestionsGenerated: agg?.totalQuestionsGenerated ?? 0,
    totalQuestionsAnswered: agg?.totalQuestionsAnswered ?? 0,
    totalQuestionsSkipped: agg?.totalQuestionsSkipped ?? 0,
    interviewCompletionRate:
      totalInterviews > 0
        ? parseFloat(((completedInterviews / totalInterviews) * 100).toFixed(1))
        : 0,
    // totalPracticeTime in SECONDS — see module docblock for unit note
    totalPracticeTime: agg?.totalPracticeTime ?? 0,
    // Resume scores — null when no analysis exists
    resumeOverallScore: null,
    atsScore: null,
  };

  // ── Resume scores — single lean query, select only needed fields ──────────
  const analysis = await ResumeAnalysis.findOne(
    { user: userObjectId },
    { overallScore: 1, atsScore: 1 }
  ).lean();

  if (analysis) {
    overview.resumeOverallScore = analysis.overallScore;
    overview.atsScore = analysis.atsScore;
  }

  return overview;
};

// ─── Activity ─────────────────────────────────────────────────────────────────

/**
 * GET /api/dashboard/activity
 *
 * Returns per-day practice activity for the given range.
 * Every day in the range is present in the output — days with no activity
 * have zero values (so the frontend can render a complete chart).
 *
 * @param {string} userId
 * @param {string} range  - "7d" | "30d" | "90d"
 * @returns {Promise<object[]>}
 */
export const getActivity = async (userId, range = "7d") => {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const startDate = rangeToStartDate(range);
  const endDate = new Date(); // now

  // ── Aggregate by calendar day ──────────────────────────────────────────
  const rows = await InterviewSession.aggregate([
    {
      $match: {
        user: userObjectId,
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $addFields: {
        // Truncate createdAt to midnight UTC for bucketing
        dayBucket: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "UTC" },
        },
        // Count non-empty answers in this session
        sessionAnsweredCount: {
          $size: {
            $filter: {
              input: { $ifNull: ["$answers", []] },
              as: "a",
              cond: { $gt: [{ $strLenCP: { $ifNull: ["$$a.answer", ""] } }, 0] },
            },
          },
        },
      },
    },
    {
      $group: {
        _id: "$dayBucket",
        interviewsCreated: { $sum: 1 },
        interviewsCompleted: {
          $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
        },
        questionsAnswered: { $sum: "$sessionAnsweredCount" },
        practiceTime: { $sum: { $ifNull: ["$totalDuration", 0] } },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // ── Build a map for O(1) lookup when filling the calendar ─────────────
  const rowMap = new Map(rows.map((r) => [r._id, r]));

  // ── Generate every day in the range (inclusive) ───────────────────────
  const days = parseInt(range, 10);
  const result = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    d.setUTCHours(0, 0, 0, 0);
    const dateStr = d.toISOString().slice(0, 10); // "YYYY-MM-DD"

    const row = rowMap.get(dateStr);
    result.push({
      date: dateStr,
      interviewsCreated: row?.interviewsCreated ?? 0,
      interviewsCompleted: row?.interviewsCompleted ?? 0,
      questionsAnswered: row?.questionsAnswered ?? 0,
      practiceTime: row?.practiceTime ?? 0, // seconds
    });
  }

  return result;
};

// ─── Recent Interviews ────────────────────────────────────────────────────────

/**
 * GET /api/dashboard/recent-interviews
 *
 * Returns the 5 most recently created sessions for the user.
 * Only fields needed by the dashboard card are selected.
 *
 * @param {string} userId
 * @returns {Promise<object[]>}
 */
export const getRecentInterviews = async (userId) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const sessions = await InterviewSession.find(
    { user: userObjectId },
    {
      _id: 1,
      interviewType: 1,
      difficulty: 1,
      targetRole: 1,
      status: 1,
      questionCount: 1,
      currentQuestionIndex: 1,
      createdAt: 1,
      completedAt: 1,
      totalDuration: 1,
    }
  )
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  // Rename _id → id for cleaner frontend consumption
  return sessions.map(({ _id, ...rest }) => ({ id: _id, ...rest }));
};

// ─── Progress / Streaks ───────────────────────────────────────────────────────

/**
 * GET /api/dashboard/progress
 *
 * Computes streak and progress statistics from actual interview activity.
 *
 * PRACTICE DAY DEFINITION:
 *   A calendar day (UTC) on which the user has at least one completed
 *   InterviewSession OR at least one InterviewSession with at least one
 *   non-empty saved answer (in_progress sessions that were partially answered).
 *   Sessions in "draft" or "abandoned" with zero answers are excluded.
 *
 * STREAK DEFINITION:
 *   Current streak = the number of consecutive calendar days ending today (or
 *   yesterday) that are practice days.
 *   If today is not yet a practice day but yesterday was, the streak is counted
 *   from yesterday backwards so the streak is not broken until tomorrow.
 *
 * @param {string} userId
 * @returns {Promise<object>}
 */
export const getProgress = async (userId) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const now = new Date();

  // ── Fetch all sessions that qualify as practice activity ───────────────
  // A session qualifies if:
  //   (a) status = "completed", OR
  //   (b) has at least one non-empty answer (partial practice counted)
  // We use a lean projection — only timestamps and answers array needed.
  const sessions = await InterviewSession.find(
    { user: userObjectId },
    {
      status: 1,
      answers: 1,
      completedAt: 1,
      createdAt: 1,
    }
  ).lean();

  // ── Determine which sessions count as "practice" ───────────────────────
  const practiceSessions = sessions.filter((s) => {
    if (s.status === "completed") return true;
    const hasAnswer = (s.answers ?? []).some(
      (a) => (a.answer ?? "").trim().length > 0
    );
    return hasAnswer;
  });

  // ── Build a Set of UTC date strings ("YYYY-MM-DD") for practice days ───
  const practiceDaySet = new Set(
    practiceSessions.map((s) => {
      // Use completedAt if available, otherwise fall back to createdAt
      const eventDate = s.completedAt ?? s.createdAt;
      return toMidnightUTC(eventDate).toISOString().slice(0, 10);
    })
  );

  const practiceDays = practiceDaySet.size;
  const sortedDays = [...practiceDaySet].sort(); // ascending "YYYY-MM-DD"

  // ── Current & longest streak ───────────────────────────────────────────
  const todayStr = toMidnightUTC(now).toISOString().slice(0, 10);
  const yesterdayDate = new Date(now);
  yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
  const yesterdayStr = toMidnightUTC(yesterdayDate).toISOString().slice(0, 10);

  // Walk backwards from today (or yesterday) to compute current streak
  let currentStreak = 0;
  {
    // Start from today; if today has no practice, check yesterday
    let cursor = new Date(now);
    cursor.setUTCHours(0, 0, 0, 0);

    const todayHasPractice = practiceDaySet.has(todayStr);
    const yesterdayHasPractice = practiceDaySet.has(yesterdayStr);

    // If neither today nor yesterday has practice, streak is 0
    if (!todayHasPractice && !yesterdayHasPractice) {
      currentStreak = 0;
    } else {
      // Start walking back from today if today has practice, else from yesterday
      if (!todayHasPractice) {
        cursor.setUTCDate(cursor.getUTCDate() - 1);
      }

      while (true) {
        const curStr = cursor.toISOString().slice(0, 10);
        if (!practiceDaySet.has(curStr)) break;
        currentStreak++;
        cursor.setUTCDate(cursor.getUTCDate() - 1);
      }
    }
  }

  // Compute longest streak across all practice days
  let longestStreak = 0;
  if (sortedDays.length > 0) {
    let streak = 1;
    longestStreak = 1;
    for (let i = 1; i < sortedDays.length; i++) {
      const prev = new Date(sortedDays[i - 1] + "T00:00:00Z");
      const curr = new Date(sortedDays[i] + "T00:00:00Z");
      const diffDays = (curr - prev) / (1000 * 60 * 60 * 24);
      if (diffDays === 1) {
        streak++;
        longestStreak = Math.max(longestStreak, streak);
      } else {
        streak = 1;
      }
    }
  }

  // ── Active days in the last 30 days ───────────────────────────────────
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);
  thirtyDaysAgo.setUTCHours(0, 0, 0, 0);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().slice(0, 10);

  const activeDays = sortedDays.filter((d) => d >= thirtyDaysAgoStr).length;

  // ── Interviews this week (Mon–Sun of current UTC week) ─────────────────
  const weekStart = new Date(now);
  const dayOfWeek = weekStart.getUTCDay(); // 0 = Sun, 1 = Mon ...
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  weekStart.setUTCDate(weekStart.getUTCDate() - daysFromMonday);
  weekStart.setUTCHours(0, 0, 0, 0);

  // ── Interviews this month (1st of current UTC month) ───────────────────
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  );

  // Count completed sessions within each window using the sessions array
  const completedSessions = sessions.filter((s) => s.status === "completed");

  const interviewsThisWeek = completedSessions.filter(
    (s) => s.completedAt && new Date(s.completedAt) >= weekStart
  ).length;

  const interviewsThisMonth = completedSessions.filter(
    (s) => s.completedAt && new Date(s.completedAt) >= monthStart
  ).length;

  return {
    currentStreak,
    longestStreak,
    activeDays,        // distinct practice days in last 30 days
    practiceDays,      // all-time distinct practice days
    interviewsThisWeek,
    interviewsThisMonth,
  };
};
