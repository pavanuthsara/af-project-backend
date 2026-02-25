
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
