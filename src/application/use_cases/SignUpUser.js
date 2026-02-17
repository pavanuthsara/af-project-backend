const User = require('../../domain/entities/User');

class SignUpUser {
  constructor(userRepository, passwordService) {
    this.userRepository = userRepository;
    this.passwordService = passwordService;
  }

  async execute(name, email, password, role) {
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await this.passwordService.hash(password);

    const newUser = new User(null, name, email, hashedPassword, role);
    return await this.userRepository.save(newUser);
  }
}

module.exports = SignUpUser;