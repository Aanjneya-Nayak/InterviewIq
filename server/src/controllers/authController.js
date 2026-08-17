import User from "../models/User.js";
import { generateToken } from "../utils/jwt.js";
import { setAuthCookie, clearAuthCookie } from "../utils/cookie.js";

/**
 * Controllers are intentionally thin — they orchestrate, not implement.
 * Business logic (password hashing, token generation) lives in the model
 * and utility layers respectively.
 */

/**
 * POST /api/auth/register
 * Creates a new user, issues a JWT, sets an httpOnly cookie.
 * Returns 201 with the sanitised user object (no password).
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check for duplicate email before attempting to save.
    // This gives a cleaner error than catching the Mongoose duplicate key error.
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const error = new Error(
        "An account with this email address already exists."
      );
      error.statusCode = 409;
      return next(error);
    }

    // Password is hashed by the pre-save hook on the User model.
    const user = await User.create({ name, email, password });

    const token = generateToken(user._id);
    setAuthCookie(res, token);

    res.status(201).json({
      success: true,
      message: "Account created successfully.",
      user,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 * Validates credentials, issues a JWT, sets an httpOnly cookie.
 * A deliberately vague error message ("Invalid credentials") prevents
 * user enumeration — the client can't tell if email or password was wrong.
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // .select("+password") is required because the field has select: false on the schema.
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      const error = new Error("Invalid credentials.");
      error.statusCode = 401;
      return next(error);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const error = new Error("Invalid credentials.");
      error.statusCode = 401;
      return next(error);
    }

    const token = generateToken(user._id);
    setAuthCookie(res, token);

    // Strip the password from the response even though toJSON already does it —
    // being explicit here makes the intent obvious to future readers.
    user.password = undefined;

    res.status(200).json({
      success: true,
      message: "Logged in successfully.",
      user,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/logout
 * Clears the auth cookie. No server-side state to clean up (stateless JWT).
 * Returns 200 even if no cookie existed — logout should always succeed from the client's perspective.
 */
export const logout = async (req, res) => {
  clearAuthCookie(res);
  res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
};

/**
 * GET /api/auth/me
 * Returns the current authenticated user.
 * The `protect` middleware has already verified the token and attached req.user.
 */
export const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
};
