const PasswordService = require('../../../src/infrastructure/security/PasswordService');

describe('PasswordService', () => {
  let passwordService;

  beforeEach(() => {
    passwordService = new PasswordService();
  });

  test('should hash a password', async () => {
    const password = 'mySecretPassword123';
    const hashedPassword = await passwordService.hash(password);
    
    expect(hashedPassword).toBeDefined();
    expect(hashedPassword).not.toBe(password);
    expect(hashedPassword.length).toBeGreaterThan(0);
  });

  test('should verify correct password', async () => {
    const password = 'mySecretPassword123';
    const hashedPassword = await passwordService.hash(password);
    
    const isMatch = await passwordService.compare(password, hashedPassword);
    expect(isMatch).toBe(true);
  });

  test('should reject incorrect password', async () => {
    const password = 'mySecretPassword123';
    const wrongPassword = 'wrongPassword';
    const hashedPassword = await passwordService.hash(password);
    
    const isMatch = await passwordService.compare(wrongPassword, hashedPassword);
    expect(isMatch).toBe(false);
  });

  test('should generate different hashes for same password', async () => {
    const password = 'mySecretPassword123';
    const hash1 = await passwordService.hash(password);
    const hash2 = await passwordService.hash(password);
    
    expect(hash1).not.toBe(hash2);
    
    // But both should still verify the same password
    expect(await passwordService.compare(password, hash1)).toBe(true);
    expect(await passwordService.compare(password, hash2)).toBe(true);
  });

  test('should handle empty string password', async () => {
    const password = '';
    const hashedPassword = await passwordService.hash(password);
    
    expect(hashedPassword).toBeDefined();
    expect(await passwordService.compare('', hashedPassword)).toBe(true);
    expect(await passwordService.compare('notEmpty', hashedPassword)).toBe(false);
  });
});
