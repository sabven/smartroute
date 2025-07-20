// Test setup file
require('dotenv').config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.PORT = '9000';
process.env.DATABASE_URL = 'postgresql://ranjusaba@localhost:5432/smartroute_test';

// Increase timeout for database operations
jest.setTimeout(30000);