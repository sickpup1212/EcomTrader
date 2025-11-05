/**
 * Request Logger Middleware
 * Pipeline Rivers - Flow monitoring and analytics
 *
 * Every request is tracked like water flowing through a system
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Enhanced request logger with performance tracking
 */
function requestLogger(req, res, next) {
  // Generate unique request ID
  req.id = uuidv4().split('-')[0];

  // Record start time
  const startTime = Date.now();

  // Log request details
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - Request ID: ${req.id}`);

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - startTime;
    const status = res.statusCode;

    // Log completion
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${status} - ${duration}ms - Request ID: ${req.id}`);

    // Log slow requests
    if (duration > 1000) {
      console.warn(`[SLOW REQUEST] ${req.method} ${req.originalUrl} - ${duration}ms - Request ID: ${req.id}`);
    }

    // Log errors
    if (status >= 400) {
      console.error(`[ERROR] ${req.method} ${req.originalUrl} - ${status} - Request ID: ${req.id}`, data);
    }

    return originalJson.call(this, data);
  };

  next();
}

/**
 * API request logger specifically for API endpoints
 */
function apiLogger(req, res, next) {
  // Only log API routes
  if (!req.originalUrl.startsWith('/api/')) {
    return next();
  }

  console.log(`[API] ${req.method} ${req.originalUrl} - Request ID: ${req.id}`);
  next();
}

/**
 * Error logger with context
 */
function errorLogger(err, req, res, next) {
  console.error(`[ERROR] Request ID: ${req.id}`);
  console.error(`[ERROR] ${req.method} ${req.originalUrl}`);
  console.error(`[ERROR] ${err.name}: ${err.message}`);

  // Log stack trace in development
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Log user context if available
  if (req.user) {
    console.error(`[ERROR] User: ${req.user.id || 'unknown'}`);
  }

  // Log request body for debugging (sanitized)
  if (req.body && Object.keys(req.body).length > 0) {
    const sanitizedBody = { ...req.body };
    // Remove sensitive fields
    delete sanitizedBody.password;
    delete sanitizedBody.token;
    delete sanitizedBody.apiKey;
    console.error(`[ERROR] Body:`, sanitizedBody);
  }

  next(err);
}

/**
 * Performance monitor middleware
 */
function performanceMonitor(req, res, next) {
  const startTime = process.hrtime.bigint();

  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

    // Log performance metrics
    if (duration > 500) { // Log if over 500ms
      console.warn(`[PERFORMANCE] ${req.method} ${req.originalUrl} - ${duration.toFixed(2)}ms - Request ID: ${req.id}`);
    }

    // Store performance data for analytics (could be sent to monitoring service)
    req.performance = {
      duration,
      timestamp: new Date().toISOString(),
      endpoint: req.originalUrl,
      method: req.method,
      statusCode: res.statusCode
    };
  });

  next();
}

/**
 * Security logger for suspicious activities
 */
function securityLogger(req, res, next) {
  const suspiciousPatterns = [
    /\.\./,           // Directory traversal
    /<script/i,       // XSS attempts
    /union.*select/i, // SQL injection
    /javascript:/i    // JS protocol
  ];

  // Check URL for suspicious patterns
  const url = req.originalUrl;
  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(url));

  if (isSuspicious) {
    console.warn(`[SECURITY] Suspicious request detected - Request ID: ${req.id}`);
    console.warn(`[SECURITY] IP: ${req.ip}`);
    console.warn(`[SECURITY] User-Agent: ${req.get('User-Agent')}`);
    console.warn(`[SECURITY] URL: ${url}`);
  }

  // Check for suspicious headers
  const userAgent = req.get('User-Agent') || '';
  if (userAgent.includes('sqlmap') || userAgent.includes('nikto') || userAgent.includes('nmap')) {
    console.warn(`[SECURITY] Security scanner detected - Request ID: ${req.id}`);
    console.warn(`[SECURITY] IP: ${req.ip}`);
    console.warn(`[SECURITY] User-Agent: ${userAgent}`);
  }

  next();
}

module.exports = {
  requestLogger,
  apiLogger,
  errorLogger,
  performanceMonitor,
  securityLogger
};