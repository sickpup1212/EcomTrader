/**
 * Session Handler Middleware
 * Pipeline Rivers - Manage session-based cart and wishlist
 * 
 * Creates a simple session ID for tracking anonymous users
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Generate or retrieve session ID from cookie/header
 */
module.exports = (req, res, next) => {
  // Check for session ID in header or cookie
  let sessionId = req.headers['x-session-id'] || req.cookies?.sessionId;
  
  // Generate new session ID if none exists
  if (!sessionId) {
    sessionId = uuidv4();
  }
  
  // Attach session ID to request
  req.sessionId = sessionId;
  
  // Send session ID back in response header
  res.setHeader('X-Session-Id', sessionId);
  
  next();
};
