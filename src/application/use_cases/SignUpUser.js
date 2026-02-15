const User = require('../../domain/entities/User');

class SignUpUser {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(name, email, passwordHash) {
    // 1. Check if user exists
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // 2. Create new User Entity (ID is null for new users)
    const newUser = new User(null, name, email, passwordHash);

    // 3. Persist to DB
    return await this.userRepository.save(newUser);
  }
}

module.exports = SignUpUser;