import { Router } from "express";
import {
  register,
  login,
  logout,
  getMe,
} from "../controllers/authController.js";
import {
  validateRegister,
  validateLogin,
  handleValidationErrors,
} from "../validators/authValidator.js";
import protect from "../middleware/protect.js";

const router = Router();

/**
 * Each route composes middlewares as a pipeline:
 *   validate input → handle validation errors → controller
 *
 * Keeping validation and controller separate means the controller
 * can assume the request is already well-formed.
 */

router.post("/register", ...validateRegister, handleValidationErrors, register);
router.post("/login", ...validateLogin, handleValidationErrors, login);
router.post("/logout", logout);
router.get("/me", protect, getMe);

export default router;
