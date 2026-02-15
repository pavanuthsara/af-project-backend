# Test Suite

This directory contains comprehensive test files for the authentication system.

## Structure

```
test/
├── setup.js                     # Global test configuration
├── domain/
│   └── entities/
│       └── User.test.js        # User entity unit tests
├── application/
│   └── use_cases/
│       ├── SignUpUser.test.js  # SignUp use case unit tests
│       └── LoginUser.test.js   # Login use case unit tests
├── infrastructure/
│   └── security/
│       ├── PasswordService.test.js  # Password hashing tests
│       └── JwtService.test.js       # JWT token tests
└── integration/
    └── auth.test.js            # End-to-end API tests
```

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode (useful during development)
pnpm test:watch

# Run specific test file
pnpm test User.test.js

# Run tests with verbose output
pnpm test -- --verbose

# Run only integration tests
pnpm test integration

# Run only unit tests
pnpm test -- --testPathIgnorePatterns=integration
```

## Test Coverage

The test suite provides comprehensive coverage of:

### Unit Tests (Domain Layer)
- ✅ User entity creation and properties
- ✅ Handling null IDs for new users
- ✅ Property validation

### Unit Tests (Infrastructure Layer)
- ✅ Password hashing with bcrypt
- ✅ Password verification (correct/incorrect)
- ✅ Unique salt generation for each hash
- ✅ JWT token generation
- ✅ JWT token verification
- ✅ Expired token handling
- ✅ Invalid token rejection

### Unit Tests (Application Layer)
- ✅ SignUp use case - successful registration
- ✅ SignUp use case - duplicate user prevention
- ✅ SignUp use case - password hashing
- ✅ Login use case - successful authentication
- ✅ Login use case - invalid credentials
- ✅ Login use case - token generation
- ✅ Error propagation and handling

### Integration Tests
- ✅ POST /signup - successful registration
- ✅ POST /signup - duplicate email handling
- ✅ POST /signup - missing fields validation
- ✅ POST /login - successful authentication
- ✅ POST /login - invalid credentials
- ✅ GET /profile - protected route access
- ✅ Authentication middleware - token validation
- ✅ End-to-end user journeys

## Test Technologies

- **Jest** - Testing framework with built-in mocking and assertions
- **Supertest** - HTTP assertions for API endpoint testing
- **mongodb-memory-server** - In-memory MongoDB for integration tests (no external DB required)

## Writing New Tests

When adding new tests, follow these patterns:

### Unit Tests
```javascript
describe('ComponentName', () => {
  let component;
  let mockDependency;

  beforeEach(() => {
    mockDependency = { method: jest.fn() };
    component = new Component(mockDependency);
  });

  test('should do something', async () => {
    // Arrange
    mockDependency.method.mockResolvedValue('result');
    
    // Act
    const result = await component.execute();
    
    // Assert
    expect(result).toBe('result');
    expect(mockDependency.method).toHaveBeenCalled();
  });
});
```

### Integration Tests
```javascript
describe('API Endpoint', () => {
  test('should handle request', async () => {
    const response = await request(app)
      .post('/endpoint')
      .send({ data: 'value' })
      .expect(200);

    expect(response.body).toHaveProperty('expectedField');
  });
});
```

## Continuous Integration

These tests are designed to run in CI/CD pipelines without requiring external services thanks to mongodb-memory-server.