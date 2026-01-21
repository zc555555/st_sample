//jest.config.js
module.exports = {
  testTimeout: 20000,
  globalSetup: "./__tests__/setup/setup.js",
  globalTeardown: "./__tests__/setup/teardown.js",
  modulePathIgnorePatterns: ["./__tests__/setup/*", "./__tests__/performance/*"],
  coverageDirectory: 'reports/lo3/coverage',
  collectCoverageFrom: [
    'middleware/**/*.js',
    'endpoints/**/*.js',
    'models/**/*.js',
    '!**/node_modules/**',
    '!**/__tests__/**',
    '!**/coverage/**'
  ],
  coverageReporters: ['text', 'lcov', 'html', 'json-summary']
};