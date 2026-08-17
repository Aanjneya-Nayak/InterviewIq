import { verifyToken } from "../utils/jwt.js";
import User from "../models/User.js";

/**
 * Route guard middleware.
 *
 * Token lookup priority:
 *   1. HTTP-Only cookie named "token" (primary — web clients)
 *   2. Authorization: Bearer header (secondary — API clients / mobile)
 *
 * On success: attaches `req.user` (without password) and calls next().
 * On failure: passes a structured error to the global error handler.
 */
const protect = async (req, res, next) => {
  try {
    let token = req.cookies?.token;

    // Fallback: Bearer token in Authorization header
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }
    }

    if (!token) {
      const error = new Error("Not authenticated. Please log in.");
      error.statusCode = 401;
      return next(error);
    }

    const decoded = verifyToken(token);

    // Fetch user to ensure it still exists (handles deleted accounts)
    const user = await User.findById(decoded.id);
    if (!user) {
      const error = new Error("User belonging to this token no longer exists.");
      error.statusCode = 401;
      return next(error);
    }

    req.user = user;
    next();
  } catch (err) {
    // Map JWT library errors to consistent HTTP responses
    if (err.name === "TokenExpiredError") {
      const error = new Error("Your session has expired. Please log in again.");
      error.statusCode = 401;
      return next(error);
    }
    if (err.name === "JsonWebTokenError") {
      const error = new Error("Invalid token. Please log in again.");
      error.statusCode = 401;
      return next(error);
    }
    next(err);
  }
};

export default protect;
