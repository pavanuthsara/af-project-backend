const LoginUser = require('../../application/use_cases/LoginUser');
const MongoUserRepository = require('../repositories/MongoUserRepository');
const PasswordService = require('../../infrastructure/security/PasswordService');
const JwtService = require('../../infrastructure/security/JwtService');

class LoginController {
  async handle(req, res) {
    try {
      const { email, password } = req.body;

      // Dependency Injection (Wiring)
      const userRepository = new MongoUserRepository();
      const passwordService = new PasswordService();
      const jwtService = new JwtService();
      
      const loginUseCase = new LoginUser(userRepository, passwordService, jwtService);

      const { user, token } = await loginUseCase.execute(email, password);

      return res.status(200).json({
        message: 'Login successful',
        token,
        user: { id: user.id, name: user.name, email: user.email }
      });

    } catch (error) {
      return res.status(401).json({ error: error.message });
    }
  }
}

module.exports = LoginController;