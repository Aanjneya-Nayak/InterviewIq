import rateLimit from "express-rate-limit";

/**
 * Global rate limiter — prevents brute-force and DoS attacks.
 * 100 requests per 15-minute window per IP is a common production baseline.
 * Fine-grained limiters (e.g., stricter limits on /auth routes) can be added per-router in future phases.
 */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});

export default limiter;
