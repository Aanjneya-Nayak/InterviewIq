import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";

import limiter from "./middleware/rateLimiter.js";
import notFound from "./middleware/notFound.js";
import errorHandler from "./middleware/errorHandler.js";
import healthRoutes from "./routes/healthRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import resumeRoutes from "./routes/resumeRoutes.js";
import interviewRoutes from "./routes/interview.routes.js";

const app = express();

// ─── Security ────────────────────────────────────────────────────────────────
// Helmet sets a suite of security-related HTTP headers in one call.
app.use(helmet());

// CORS is configured via env so origins can change per environment without code changes.
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true, // Required for cookie-based sessions (future auth phase)
  })
);

// ─── Request Parsing ─────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" })); // Limit body size to mitigate payload attacks
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// ─── Logging ─────────────────────────────────────────────────────────────────
// 'dev' format in development, 'combined' (Apache-style) in production for log aggregators
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// ─── Rate Limiting ───────────────────────────────────────────────────────────
app.use("/api", limiter);

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/interviews", interviewRoutes);

// ─── Error Handling ──────────────────────────────────────────────────────────
// notFound must come after all valid routes; errorHandler must be last.
app.use(notFound);
app.use(errorHandler);

export default app;
