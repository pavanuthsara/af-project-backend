const User = require('../../../src/domain/entities/User');

describe('User Entity', () => {
  test('should create a user with all properties', () => {
    const user = new User('123', 'John Doe', 'john@example.com', 'hashedPassword');
    
    expect(user.id).toBe('123');
    expect(user.name).toBe('John Doe');
    expect(user.email).toBe('john@example.com');
    expect(user.passwordHash).toBe('hashedPassword');
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
      passwordHash: 'hashed123'
    };

    const user = new User(
      testData.id,
      testData.name,
      testData.email,
      testData.passwordHash
    );

    expect(user).toMatchObject(testData);
  });
});
