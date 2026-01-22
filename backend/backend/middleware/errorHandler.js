/**
 * Centralized error handling middleware
 * Catches all errors from routes and controllers
 * 
 * Must be added LAST in middleware chain:
 * app.use(errorHandler);
 */
function errorHandler(err, req, res, next) {
  // Extract error details
  const statusCode = err.statusCode || 500;
  const errorCode = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'An unexpected error occurred';
  const details = err.details || {};

  // Log error (helpful for debugging in production)
  console.error(`\n❌ Error [${statusCode}]:`, {
    code: errorCode,
    message,
    path: req.path,
    method: req.method,
    details
  });

  // Send consistent error response to client
  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      ...(process.env.NODE_ENV === 'development' && { details }) // Only show details in dev
    }
  });
}

module.exports = { errorHandler };
