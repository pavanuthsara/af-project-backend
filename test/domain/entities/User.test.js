const User = require('../../../src/domain/entities/User');

describe('User Entity', () => {
  test('should create a user with all properties', () => {
    const user = new User('123', 'John Doe', 'john@example.com', 'hashedPassword', 'admin');
    
    expect(user.id).toBe('123');
    expect(user.name).toBe('John Doe');
    expect(user.email).toBe('john@example.com');
    expect(user.passwordHash).toBe('hashedPassword');
    expect(user.role).toBe('admin');
  });

  test('should allow null id for new users', () => {
    const user = new User(null, 'Jane Doe', 'jane@example.com', 'hashedPassword');
    
    expect(user.id).toBeNull();
    expect(user.name).toBe('Jane Doe');
  });

  test('should store all properties correctly', () => {
    const testData = {
      id: 'user-456',
      name: 'Test User',
      email: 'test@test.com',
      passwordHash: 'hashed123',
      role: 'user'
    };

    const user = new User(
      testData.id,
      testData.name,
      testData.email,
      testData.passwordHash,
      testData.role
    );

    expect(user).toMatchObject(testData);
  });

  test('should default to "user" role if not provided', () => {
    const user = new User('123', 'John Doe', 'john@example.com', 'hashedPassword');
    expect(user.role).toBe('user');
  });

  test('should create a user with a specific role', () => {
    const user = new User('123', 'Admin User', 'admin@example.com', 'hashedPassword', 'admin');
    expect(user.role).toBe('admin');
  });
});
