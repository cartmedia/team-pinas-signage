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
      displayName: 'unit-tests',
      testMatch: ['<rootDir>/tests/unit/**/*.test.js'],
      testEnvironment: 'jsdom'
    },
    {
      displayName: 'contract-api',
      testMatch: ['<rootDir>/tests/contract/footer/test_footer_*.test.js'],
      testEnvironment: 'node'
    },
    {
      displayName: 'contract-dom',
      testMatch: ['<rootDir>/tests/contract/footer/test_css_*.test.js', '<rootDir>/tests/contract/footer/test_animation_*.test.js'],
      testEnvironment: 'jsdom'
    },
    {
      displayName: 'contract-separator',
      testMatch: ['<rootDir>/tests/contract/test_separator_*.test.js'],
      testEnvironment: 'jsdom'
    },
    {
      displayName: 'integration', 
      testMatch: ['<rootDir>/tests/integration/**/*.js'],
      testEnvironment: 'jsdom'
    }
  ]
};