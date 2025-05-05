/**
 * TypeScript Errors API Test Script - Direct Method
 * 
 * This script tests the TypeScript Errors API endpoints by directly
 * importing and calling the router functions, bypassing the need for
 * network requests.
 */

import express from 'express';
import typescriptErrorsRouter from './server/routes/admin/typescript-errors.js';

// Create a mock Express app
const app = express();

// Use the router
app.use('/api/admin/typescript-errors', typescriptErrorsRouter);

// Log all routes
console.log('\nAvailable Routes:');
// Mock request and response objects
class MockResponse {
  constructor() {
    this.statusCode = 200;
    this.data = null;
  }
  
  status(code) {
    this.statusCode = code;
    return this;
  }
  
  json(data) {
    this.data = data;
    console.log(`Response (${this.statusCode}):`, JSON.stringify(data, null, 2));
    return this;
  }
}

// Test the test endpoint
console.log('\n1. Testing the /test endpoint:');
const mockReq1 = { 
  params: {},
  query: {},
  __skipCSRF: true
};
const mockRes1 = new MockResponse();

// Find the route handler for the test endpoint
const stack = typescriptErrorsRouter.stack;
let testHandler = null;

for (const layer of stack) {
  if (layer.route && layer.route.path === '/test') {
    testHandler = layer.route.stack[0].handle;
    break;
  }
}

if (testHandler) {
  console.log('Found test endpoint handler, executing...');
  testHandler(mockReq1, mockRes1);
} else {
  console.log('Test endpoint handler not found');
}

console.log('\nAll tests complete!');