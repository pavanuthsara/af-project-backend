const JwtService = require('../../../src/infrastructure/security/JwtService');

describe('JwtService', () => {
  let jwtService;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret-key';
    jwtService = new JwtService();
  });

  test('should generate a valid token', () => {
    const payload = { id: '123', email: 'test@example.com' };
    const token = jwtService.generateToken(payload);
    
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3); // JWT format: header.payload.signature
  });

  test('should verify a valid token', () => {
    const payload = { id: '123', email: 'test@example.com' };
    const token = jwtService.generateToken(payload);
    
    const decoded = jwtService.verifyToken(token);
    
    expect(decoded).toBeDefined();
    expect(decoded.id).toBe('123');
    expect(decoded.email).toBe('test@example.com');
  });

  test('should return null for invalid token', () => {
    const invalidToken = 'invalid.token.here';
    const decoded = jwtService.verifyToken(invalidToken);
    
    expect(decoded).toBeNull();
  });

  test('should return null for malformed token', () => {
    const malformedToken = 'not-a-jwt-token';
    const decoded = jwtService.verifyToken(malformedToken);
    
    expect(decoded).toBeNull();
  });

  test('should return null for expired token', async () => {
    // Create a service with very short expiration
    jwtService.expiresIn = '1ms';
    const payload = { id: '123', email: 'test@example.com' };
    const token = jwtService.generateToken(payload);
    
    // Wait for token to expire
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const decoded = jwtService.verifyToken(token);
    expect(decoded).toBeNull();
  });

  test('should include expiration in token', () => {
    const payload = { id: '123', email: 'test@example.com' };
    const token = jwtService.generateToken(payload);
    const decoded = jwtService.verifyToken(token);
    
    expect(decoded.exp).toBeDefined();
    expect(decoded.iat).toBeDefined();
    expect(decoded.exp).toBeGreaterThan(decoded.iat);
  });

  test('should handle tokens with different secrets', () => {
    const payload = { id: '123', email: 'test@example.com' };
    const token = jwtService.generateToken(payload);
    
    // Create a new service with different secret
    const jwtService2 = new JwtService();
    jwtService2.secret = 'different-secret';
    
    const decoded = jwtService2.verifyToken(token);
    expect(decoded).toBeNull();
  });

  test('should generate different tokens for same payload at different times', async () => {
    const payload = { id: '123', email: 'test@example.com' };
    
    const token1 = jwtService.generateToken(payload);
    
    // Wait a bit to ensure different iat timestamps
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const token2 = jwtService.generateToken(payload);
    
    // Tokens should be different due to different iat (issued at) timestamps
    expect(token1).not.toBe(token2);
    
    // But both should be valid
    expect(jwtService.verifyToken(token1)).toBeDefined();
    expect(jwtService.verifyToken(token2)).toBeDefined();
  });
});
