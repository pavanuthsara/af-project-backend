const JwtService = require('../../infrastructure/security/JwtService');

const managerAuthMiddleware = (req, res, next) => {
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

  if (decoded.role !== 'manager') {
    return res.status(403).json({ error: 'Forbidden: Not a manager' });
  }

  req.user = decoded;
  next();
};

module.exports = managerAuthMiddleware;
