module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'server/functions/**/*.js',
    '!server/functions/**/*.test.js',
    '!server/functions/**/*.spec.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 30000,
  verbose: true,
  projects: [
    {
      displayName: 'contract',
      testMatch: ['<rootDir>/tests/contract/**/*.js'],
      testEnvironment: 'node'
    },
    {
      displayName: 'integration', 
      testMatch: ['<rootDir>/tests/integration/**/*.js'],
      testEnvironment: 'node'
    }
  ]
};