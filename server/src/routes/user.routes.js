import { Router } from "express";
import { getProfile, updateProfile } from "../controllers/user.controller.js";
import {
  validateUpdateProfile,
  handleValidationErrors,
} from "../validators/user.validator.js";
import protect from "../middleware/protect.js";

const router = Router();

/**
 * All user profile routes require authentication.
 * protect is applied at the router level.
 */
router.use(protect);

/**
 * GET /api/users/profile
 * Returns the authenticated user's profile fields.
 * No body — req.user is already attached by protect.
 */
router.get("/profile", getProfile);

/**
 * PATCH /api/users/profile
 * Updates name and/or targetRole.
 * Email cannot be changed through this endpoint.
 */
router.patch(
  "/profile",
  ...validateUpdateProfile,
  handleValidationErrors,
  updateProfile
);

export default router;
