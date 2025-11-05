/**
 * Request Validation Middleware
 * Pipeline Rivers - Ensure clean data flows through the system
 */

const { validationResult } = require('express-validator');

/**
 * Validate request and return errors if validation fails
 */
module.exports = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: errors.array().map(err => ({
          field: err.path || err.param,
          message: err.msg,
          value: err.value
        }))
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  }
  
  next();
};
