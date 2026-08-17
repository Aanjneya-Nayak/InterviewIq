import { Router } from "express";

const router = Router();

/**
 * GET /api/health
 * Lightweight liveness probe used by load balancers, uptime monitors, and CI pipelines.
 * Should never require authentication.
 */
router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "InterviewIQ API Running",
  });
});

export default router;
