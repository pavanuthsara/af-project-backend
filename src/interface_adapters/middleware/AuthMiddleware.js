const JwtService = require('../../infrastructure/security/JwtService');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  const jwtService = new JwtService();
  
  const decoded = jwtService.verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token.' });
  }

  // Attach user info to request so protected routes can use it
  req.user = decoded; 
  next();
};

module.exports = authMiddleware;