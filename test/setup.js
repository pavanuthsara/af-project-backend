// Global test setup
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing';

// Set longer timeout for integration tests (mongodb-memory-server needs time to download binaries on first run)
jest.setTimeout(60000);
