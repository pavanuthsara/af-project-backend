module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/'],
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  testMatch: ['**/test/**/*.test.js'],
  testTimeout: 120000, // 2 minutes for tests (mongodb-memory-server needs time on first run)
  maxWorkers: 1, // Run tests serially to avoid MongoDB connection issues
  verbose: true,
  forceExit: true, // Force Jest to exit after all tests complete
  detectOpenHandles: false
};
