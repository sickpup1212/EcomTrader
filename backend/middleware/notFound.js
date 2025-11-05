/**
 * 404 Not Found Middleware
 * Pipeline Rivers - Handle requests to non-existent endpoints
 */

module.exports = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.path}`,
      details: {
        method: req.method,
        path: req.path
      }
    },
    meta: {
      timestamp: new Date().toISOString()
    }
  });
};
