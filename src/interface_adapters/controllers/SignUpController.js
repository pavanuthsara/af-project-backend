const SignUpUser = require('../../application/use_cases/SignUpUser');
const MongoUserRepository = require('../repositories/MongoUserRepository');
const PasswordService = require('../../infrastructure/security/PasswordService');
const JwtService = require('../../infrastructure/security/JwtService');

class SignUpController {
  async handle(req, res) {
    try {
      const { name, email, password } = req.body;

      const userRepository = new MongoUserRepository();
      const passwordService = new PasswordService();
      const jwtService = new JwtService();

      const signUpUseCase = new SignUpUser(userRepository, passwordService);

      const user = await signUpUseCase.execute(name, email, password);

      const token = jwtService.generateToken({ id: user.id, email: user.email });

      return res.status(201).json({
        message: 'User registered and logged in successfully',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      });

    } catch (error) {
      console.log(error); // Helpful for debugging
      return res.status(400).json({ error: error.message });
    }
  }
}

module.exports = SignUpController;