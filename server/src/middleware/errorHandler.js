/**
 * Global error handler — must be the LAST middleware registered in app.js.
 * Normalizes all thrown errors into a consistent JSON response shape.
 * statusCode defaults to 500 if not set on the error object.
 */
const errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    // Stack trace is only surfaced in development to avoid leaking internals
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

export default errorHandler;
