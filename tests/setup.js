// Test setup for Footer Migration tests
require('dotenv').config();

// Mock environment variables for testing
process.env.NEON_DATABASE_URL = process.env.NEON_DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db';
process.env.ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'test-admin-key-for-testing';

// Global test timeout
jest.setTimeout(30000);

// Mock Netlify Functions context
global.mockNetlifyContext = {
  callbackWaitsForEmptyEventLoop: false,
  functionName: 'test-function',
  functionVersion: '1.0.0',
  awsRequestId: 'test-request-id',
  memoryLimitInMB: 1024
};

// Mock Netlify event object
global.mockNetlifyEvent = (overrides = {}) => ({
  httpMethod: 'GET',
  path: '/test',
  queryStringParameters: null,
  headers: {
    'Content-Type': 'application/json'
  },
  body: null,
  isBase64Encoded: false,
  ...overrides
});

// Helper to create authenticated request
global.mockAuthenticatedEvent = (overrides = {}) => mockNetlifyEvent({
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': process.env.ADMIN_API_KEY,
    ...overrides.headers
  },
  ...overrides
});

// Test database connection helper
global.testDbConnection = async () => {
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.NEON_DATABASE_URL
  });
  
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch (error) {
    console.warn('Database connection failed in tests:', error.message);
    return false;
  } finally {
    await pool.end();
  }
};

// Mock console.log in tests to reduce noise
global.originalConsoleLog = console.log;
global.mockConsoleLog = () => {
  console.log = jest.fn();
};
global.restoreConsoleLog = () => {
  console.log = global.originalConsoleLog;
};