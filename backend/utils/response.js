/**
 * Response Utilities
 * Pipeline Rivers - Consistent response formatting
 * 
 * Every response flows through the same channel
 */

/**
 * Success response
 */
function success(res, data, message = null, statusCode = 200) {
  const response = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString()
    }
  };

  if (message) {
    response.message = message;
  }

  return res.status(statusCode).json(response);
}

/**
 * Created response (201)
 */
function created(res, data, message = 'Resource created successfully') {
  return success(res, data, message, 201);
}

/**
 * Error response
 */
function error(res, code, message, statusCode = 400, details = {}) {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details
    },
    meta: {
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Not found response (404)
 */
function notFound(res, resource = 'Resource') {
  return error(res, 'NOT_FOUND', `${resource} not found`, 404);
}

/**
 * Validation error response (400)
 */
function validationError(res, details) {
  return error(res, 'VALIDATION_ERROR', 'Validation failed', 400, details);
}

/**
 * Paginated response
 */
function paginated(res, data, pagination, message = null) {
  const response = {
    success: true,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      pages: Math.ceil(pagination.total / pagination.limit),
      hasNext: pagination.page < Math.ceil(pagination.total / pagination.limit),
      hasPrev: pagination.page > 1
    },
    meta: {
      timestamp: new Date().toISOString()
    }
  };

  if (message) {
    response.message = message;
  }

  return res.status(200).json(response);
}

module.exports = {
  success,
  created,
  error,
  notFound,
  validationError,
  paginated
};
