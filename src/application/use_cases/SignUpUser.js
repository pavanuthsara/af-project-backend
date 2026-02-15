const User = require('../../domain/entities/User');

class SignUpUser {
  constructor(userRepository, passwordService) { // <--- Added dependency
    this.userRepository = userRepository;
    this.passwordService = passwordService;
  }

  async execute(name, email, password) {
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash the password inside the Use Case
    const hashedPassword = await this.passwordService.hash(password);

    const newUser = new User(null, name, email, hashedPassword);
    return await this.userRepository.save(newUser);
  }
}

module.exports = SignUpUser;