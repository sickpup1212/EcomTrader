/**
 * Error Handler Middleware
 * Pipeline Rivers - Graceful error flow management
 *
 * When pressure builds up, release it gracefully
 */

/**
 * Custom error class for application errors
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'APP_ERROR', details = {}) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = this.constructor.name;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error for express-validator failures
 */
class ValidationError extends AppError {
  constructor(message, details = {}) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

/**
 * Not found error
 */
class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

/**
 * Conflict error
 */
class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
  }
}

/**
 * Unauthorized error
 */
class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

/**
 * Forbidden error
 */
class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

/**
 * Database error handler
 */
function handleDatabaseError(err) {
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return new ConflictError('Resource already exists');
  }

  if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    return new ValidationError('Invalid reference to related resource');
  }

  if (err.code === 'SQLITE_CONSTRAINT_NOTNULL') {
    return new ValidationError('Required field is missing');
  }

  return new AppError('Database operation failed', 500, 'DATABASE_ERROR');
}

/**
 * Main error handler middleware
 */
module.exports = (err, req, res, next) => {
  let error = err;

  // Handle specific error types
  if (err.name === 'ValidationError' && !error.statusCode) {
    error = new ValidationError('Request validation failed', err.details);
  }

  if (err.name === 'CastError') {
    error = new ValidationError('Invalid data format');
  }

  if (err.name === 'JsonWebTokenError') {
    error = new UnauthorizedError('Invalid authentication token');
  }

  if (err.name === 'TokenExpiredError') {
    error = new UnauthorizedError('Authentication token expired');
  }

  // Handle database errors
  if (err.code && err.code.startsWith('SQLITE_')) {
    error = handleDatabaseError(err);
  }

  // Log error with context
  console.error(`[ERROR] ${error.code || 'UNKNOWN'}: ${error.message}`);
  console.error(`[ERROR] Request ID: ${req.id || 'unknown'}`);
  console.error(`[ERROR] Method: ${req.method} | URL: ${req.originalUrl}`);
  console.error(`[ERROR] IP: ${req.ip} | User-Agent: ${req.get('User-Agent')}`);

  // Log stack trace in development
  if (process.env.NODE_ENV === 'development') {
    console.error(error.stack);
  }

  // Build error response
  const errorResponse = {
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message || 'An unexpected error occurred',
      details: error.details || {}
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: req.id || 'unknown',
      path: req.originalUrl
    }
  };

  // Include additional debug info in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = error.stack;
    errorResponse.debug = {
      body: req.body,
      query: req.query,
      params: req.params
    };
  }

  // Determine status code
  const statusCode = error.statusCode || error.status || 500;

  // Send error response
  res.status(statusCode).json(errorResponse);
};

// Export error classes for use in controllers
module.exports.AppError = AppError;
module.exports.ValidationError = ValidationError;
module.exports.NotFoundError = NotFoundError;
module.exports.ConflictError = ConflictError;
module.exports.UnauthorizedError = UnauthorizedError;
module.exports.ForbiddenError = ForbiddenError;
