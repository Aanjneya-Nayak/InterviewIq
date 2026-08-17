import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

/**
 * Generate a signed JWT containing the user's id as the payload.
 * Only the id is embedded — sensitive fields never go in the token.
 */
export const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Verify a JWT and return the decoded payload.
 * Throws a JsonWebTokenError or TokenExpiredError on failure —
 * the auth middleware catches and normalises these.
 */
export const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};
