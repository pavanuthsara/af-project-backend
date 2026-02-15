const SignUpUser = require('../../application/use_cases/SignUpUser');
const MongoUserRepository = require('../repositories/MongoUserRepository');
// 1. Import the service
const PasswordService = require('../../infrastructure/security/PasswordService'); 

class SignUpController {
  async handle(req, res) {
    try {
      const { name, email, password } = req.body;

      // 2. Instantiate the dependencies
      const userRepository = new MongoUserRepository();
      const passwordService = new PasswordService(); // <--- CREATE THIS

      // 3. INJECT IT into the Use Case
      // The order must match your SignUpUser constructor: (repo, passwordService)
      const signUpUseCase = new SignUpUser(userRepository, passwordService); 

      const user = await signUpUseCase.execute(name, email, password);

      return res.status(201).json({
        id: user.id,
        name: user.name,
        email: user.email
      });

    } catch (error) {
      console.log(error); // Helpful for debugging
      return res.status(400).json({ error: error.message });
    }
  }
}

module.exports = SignUpController;