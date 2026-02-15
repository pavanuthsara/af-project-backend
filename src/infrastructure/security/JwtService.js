const jwt = require('jsonwebtoken');

class JwtService {
  constructor() {
    this.secret = process.env.JWT_SECRET || 'supersecretkey';
    this.expiresIn = '1h';
  }

  generateToken(payload) {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn });
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, this.secret);
    } catch (error) {
      return null;
    }
  }
}

module.exports = JwtService;