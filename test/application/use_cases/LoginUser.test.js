const LoginUser = require('../../../src/application/use_cases/LoginUser');
const User = require('../../../src/domain/entities/User');

describe('LoginUser Use Case', () => {
  let loginUser;
  let mockUserRepository;
  let mockPasswordService;
  let mockJwtService;

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: jest.fn()
    };

    mockPasswordService = {
      compare: jest.fn()
    };

    mockJwtService = {
      generateToken: jest.fn()
    };

    loginUser = new LoginUser(mockUserRepository, mockPasswordService, mockJwtService);
  });

  test('should successfully login with valid credentials', async () => {
    const email = 'john@example.com';
    const password = 'password123';
    const user = new User('123', 'John Doe', email, 'hashedPassword');
    const token = 'jwt-token-123';

    mockUserRepository.findByEmail.mockResolvedValue(user);
    mockPasswordService.compare.mockResolvedValue(true);
    mockJwtService.generateToken.mockReturnValue(token);

    const result = await loginUser.execute(email, password);

    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
    expect(mockPasswordService.compare).toHaveBeenCalledWith(password, user.passwordHash);
    expect(mockJwtService.generateToken).toHaveBeenCalledWith({ id: user.id, email: user.email });
    expect(result.user).toBe(user);
    expect(result.token).toBe(token);
  });

  test('should throw error if user not found', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);

    await expect(
      loginUser.execute('nonexistent@example.com', 'password123')
    ).rejects.toThrow('Invalid credentials');

    expect(mockPasswordService.compare).not.toHaveBeenCalled();
    expect(mockJwtService.generateToken).not.toHaveBeenCalled();
  });

  test('should throw error if password is incorrect', async () => {
    const user = new User('123', 'John Doe', 'john@example.com', 'hashedPassword');
    
    mockUserRepository.findByEmail.mockResolvedValue(user);
    mockPasswordService.compare.mockResolvedValue(false);

    await expect(
      loginUser.execute('john@example.com', 'wrongPassword')
    ).rejects.toThrow('Invalid credentials');

    expect(mockJwtService.generateToken).not.toHaveBeenCalled();
  });

  test('should include user id and email in token payload', async () => {
    const user = new User('user-456', 'Jane Doe', 'jane@example.com', 'hashedPassword');
    
    mockUserRepository.findByEmail.mockResolvedValue(user);
    mockPasswordService.compare.mockResolvedValue(true);
    mockJwtService.generateToken.mockReturnValue('token');

    await loginUser.execute('jane@example.com', 'password123');

    expect(mockJwtService.generateToken).toHaveBeenCalledWith({
      id: 'user-456',
      email: 'jane@example.com'
    });
  });

  test('should return both user and token', async () => {
    const user = new User('123', 'John Doe', 'john@example.com', 'hashedPassword');
    const token = 'jwt-token-abc';
    
    mockUserRepository.findByEmail.mockResolvedValue(user);
    mockPasswordService.compare.mockResolvedValue(true);
    mockJwtService.generateToken.mockReturnValue(token);

    const result = await loginUser.execute('john@example.com', 'password123');

    expect(result).toEqual({
      user: user,
      token: token
    });
  });

  test('should propagate repository errors', async () => {
    mockUserRepository.findByEmail.mockRejectedValue(new Error('Database connection failed'));

    await expect(
      loginUser.execute('john@example.com', 'password123')
    ).rejects.toThrow('Database connection failed');
  });

  test('should propagate password comparison errors', async () => {
    const user = new User('123', 'John Doe', 'john@example.com', 'hashedPassword');
    
    mockUserRepository.findByEmail.mockResolvedValue(user);
    mockPasswordService.compare.mockRejectedValue(new Error('Comparison failed'));

    await expect(
      loginUser.execute('john@example.com', 'password123')
    ).rejects.toThrow('Comparison failed');
  });
});
