const SignUpUser = require('../../application/use_cases/SignUpUser');
const MongoUserRepository = require('../repositories/MongoUserRepository');
const PasswordService = require('../../infrastructure/security/PasswordService');

class RegisterAdminController {
  async handle(req, res) {
    try {
      const { name, email, password } = req.body;

      const userRepository = new MongoUserRepository();
      const passwordService = new PasswordService();

      const signUpUseCase = new SignUpUser(userRepository, passwordService);

      const user = await signUpUseCase.execute(name, email, password, 'admin');

      return res.status(201).json({
        message: 'Admin registered successfully',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });

    } catch (error) {
      console.log(error); // Helpful for debugging
      return res.status(400).json({ error: error.message });
    }
  }
}

module.exports = RegisterAdminController;
