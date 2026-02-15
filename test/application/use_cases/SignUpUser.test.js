const SignUpUser = require('../../../src/application/use_cases/SignUpUser');
const User = require('../../../src/domain/entities/User');

describe('SignUpUser Use Case', () => {
  let signUpUser;
  let mockUserRepository;
  let mockPasswordService;

  beforeEach(() => {
    // Create mock dependencies
    mockUserRepository = {
      findByEmail: jest.fn(),
      save: jest.fn()
    };

    mockPasswordService = {
      hash: jest.fn()
    };

    signUpUser = new SignUpUser(mockUserRepository, mockPasswordService);
  });

  test('should successfully register a new user', async () => {
    const name = 'John Doe';
    const email = 'john@example.com';
    const password = 'password123';
    const hashedPassword = 'hashedPassword123';

    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockPasswordService.hash.mockResolvedValue(hashedPassword);
    mockUserRepository.save.mockResolvedValue(
      new User('123', name, email, hashedPassword)
    );

    const result = await signUpUser.execute(name, email, password);

    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
    expect(mockPasswordService.hash).toHaveBeenCalledWith(password);
    expect(mockUserRepository.save).toHaveBeenCalled();
    expect(result.name).toBe(name);
    expect(result.email).toBe(email);
  });

  test('should throw error if user already exists', async () => {
    const email = 'existing@example.com';
    mockUserRepository.findByEmail.mockResolvedValue(
      new User('123', 'Existing User', email, 'hashedPassword')
    );

    await expect(
      signUpUser.execute('John', email, 'password123')
    ).rejects.toThrow('User already exists');

    expect(mockPasswordService.hash).not.toHaveBeenCalled();
    expect(mockUserRepository.save).not.toHaveBeenCalled();
  });

  test('should hash password before saving', async () => {
    const password = 'myPassword';
    const hashedPassword = 'hashedMyPassword';

    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockPasswordService.hash.mockResolvedValue(hashedPassword);
    mockUserRepository.save.mockImplementation(user => {
      expect(user.passwordHash).toBe(hashedPassword);
      return Promise.resolve(user);
    });

    await signUpUser.execute('John', 'john@example.com', password);

    expect(mockPasswordService.hash).toHaveBeenCalledWith(password);
  });

  test('should create user with null id', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockPasswordService.hash.mockResolvedValue('hashedPassword');
    
    let savedUser;
    mockUserRepository.save.mockImplementation(user => {
      savedUser = user;
      return Promise.resolve(new User('generated-id', user.name, user.email, user.passwordHash));
    });

    await signUpUser.execute('John', 'john@example.com', 'password123');

    expect(savedUser.id).toBeNull();
  });

  test('should propagate repository errors', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockPasswordService.hash.mockResolvedValue('hashedPassword');
    mockUserRepository.save.mockRejectedValue(new Error('Database error'));

    await expect(
      signUpUser.execute('John', 'john@example.com', 'password123')
    ).rejects.toThrow('Database error');
  });

  test('should propagate password hashing errors', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockPasswordService.hash.mockRejectedValue(new Error('Hashing failed'));

    await expect(
      signUpUser.execute('John', 'john@example.com', 'password123')
    ).rejects.toThrow('Hashing failed');

    expect(mockUserRepository.save).not.toHaveBeenCalled();
  });
});
