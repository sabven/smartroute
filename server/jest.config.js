module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'server-postgres-working.js',
    'src/**/*.js',
    '!src/index.js',
    '!**/node_modules/**'
  ],
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  verbose: true,
  detectOpenHandles: true,
  forceExit: true
};