class LoginUser {
  constructor(userRepository, passwordService, jwtService) {
    this.userRepository = userRepository;
    this.passwordService = passwordService;
    this.jwtService = jwtService;
  }

  async execute(email, password) {
    // 1. Find User
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // 2. Verify Password
    const isMatch = await this.passwordService.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    // 3. Generate Token with user role for authorization
    // Role is included so authorize middleware can check permissions
    const token = this.jwtService.generateToken({ 
      id: user.id, 
      email: user.email,
      role: user.role || 'user' // Include role for authorization
    });

    return { user, token };
  }
}

module.exports = LoginUser;