/**
 * Authorization Middleware
 * Restricts access to routes based on user roles.
 * Must be used after the authMiddleware (which attaches req.user)
 */

/**
 * Creates a middleware function that checks if the user has the required role
 * @param {...string} roles - Roles that are allowed to access the route
 * @returns {Function} Express middleware function
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    // Check if user exists on request (set by authMiddleware)
    if (!req.user) {
      const error = new Error('Authentication required');
      error.statusCode = 401;
      return next(error);
    }
    
    // Check if user's role is in the allowed roles array
    if (!roles.includes(req.user.role)) {
      const error = new Error('Access denied. Insufficient permissions.');
      error.statusCode = 403;
      return next(error);
    }
    
    // User has the required role, proceed to next middleware/handler
    next();
  };
};

module.exports = authorize;