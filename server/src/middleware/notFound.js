/**
 * 404 catch-all middleware.
 * Registered after all valid routes so any unmatched request falls through here.
 * Forwards a structured error to the global error handler.
 */
const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

export default notFound;
