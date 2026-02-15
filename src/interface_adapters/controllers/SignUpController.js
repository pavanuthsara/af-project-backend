const SignUpUser = require('../../application/use_cases/SignUpUser');
const MongoUserRepository = require('../repositories/MongoUserRepository');

class SignUpController {
  async handle(req, res) {
    try {
      const { name, email, password } = req.body;

      // Dependency Injection
      const userRepository = new MongoUserRepository();
      const signUpUseCase = new SignUpUser(userRepository);

      const user = await signUpUseCase.execute(name, email, password);

      // Simple response (you can add a serializer here if you want)
      return res.status(201).json({
        id: user.id,
        name: user.name,
        email: user.email
      });

    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
}

module.exports = SignUpController;