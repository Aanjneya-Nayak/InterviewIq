import User from "../models/User.js";

/**
 * user.controller.js
 *
 * Thin orchestration layer for user profile endpoints.
 * All DB work is done inline here (no separate service needed — the logic
 * is a single findById / save, not a multi-step pipeline).
 *
 * Ownership is guaranteed by the `protect` middleware:
 *   - req.user is always the authenticated user.
 *   - Every operation reads/writes only req.user._id.
 *   - No userId param is accepted from the request.
 */

/**
 * GET /api/users/profile
 *
 * Returns the authenticated user's profile.
 * `protect` already fetched and attached req.user — no extra DB query needed.
 *
 * Fields returned: _id, name, email, targetRole, avatar, createdAt, updatedAt
 * Fields never returned: password (select: false on schema + toJSON strip)
 */
export const getProfile = (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
};

/**
 * PATCH /api/users/profile
 *
 * Updates name and/or targetRole for the authenticated user.
 * Email updates are intentionally not supported (would require
 * re-verification flow not in scope for this phase).
 *
 * 200 — updated user object
 * 422 — validation failed (handled by validateUpdateProfile middleware)
 */
export const updateProfile = async (req, res, next) => {
  try {
    const { name, targetRole } = req.body;

    // Fetch a fresh copy so the save hook has the full document
    const user = await User.findById(req.user._id);
    if (!user) {
      const err = new Error("User not found.");
      err.statusCode = 404;
      return next(err);
    }

    // Only update fields that were explicitly sent
    user.name = name.trim();

    // targetRole: allow clearing by sending null or empty string
    if (targetRole !== undefined) {
      user.targetRole =
        typeof targetRole === "string" && targetRole.trim().length > 0
          ? targetRole.trim()
          : null;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user,
    });
  } catch (err) {
    next(err);
  }
};
