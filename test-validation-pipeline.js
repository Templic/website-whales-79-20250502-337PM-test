/**
 * Validation Pipeline Test Script
 * 
 * This script demonstrates the use of the enhanced validation pipeline
 * with performance optimizations and AI-powered security analysis.
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000';
const TEST_AUTH_KEY = process.env.TEST_AUTH_SECRET || 'test-secret-key';

// Helper function to make API requests
async function makeRequest(endpoint, method = 'GET', data = null, options = {}) {
  try {
    const url = `${BASE_URL}${endpoint}`;
    const config = {
      method,
      url,
      headers: {
        'Content-Type': 'application/json',
        'X-Test-Auth': TEST_AUTH_KEY,
        ...options.headers
      },
      ...(data && { data })
    };

    console.log(`Making ${method} request to ${endpoint}`);
    const response = await axios(config);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error(`Error ${error.response.status}: ${JSON.stringify(error.response.data, null, 2)}`);
      return error.response.data;
    }
    console.error(`Request error: ${error.message}`);
    throw error;
  }
}

// Test schema validation
async function testSchemaValidation() {
  console.log('\n=== Testing Schema Validation ===');
  
  // Valid contact form data
  const validData = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    message: 'This is a test message that is long enough to pass validation.'
  };
  
  // Invalid contact form data
  const invalidData = {
    name: 'J', // Too short
    email: 'not-an-email',
    message: 'Short' // Too short
  };
  
  // Test valid data
  console.log('\nTesting valid contact form data:');
  const validResult = await makeRequest('/pipeline/contact', 'POST', validData);
  console.log('Valid result:', JSON.stringify(validResult, null, 2));
  
  // Test invalid data
  console.log('\nTesting invalid contact form data:');
  const invalidResult = await makeRequest('/pipeline/contact', 'POST', invalidData);
  console.log('Invalid result:', JSON.stringify(invalidResult, null, 2));
  
  // Test caching (should be faster the second time)
  console.log('\nTesting cache with valid data (should be faster):');
  console.time('cached-request');
  const cachedResult = await makeRequest('/pipeline/contact', 'POST', validData);
  console.timeEnd('cached-request');
  console.log('Cache hit:', cachedResult.validation.cacheHit);
}

// Test AI validation
async function testAIValidation() {
  console.log('\n=== Testing AI Validation ===');
  
  // Safe input data
  const safeData = {
    username: 'regular_user',
    action: 'view_profile',
    parameters: {
      profileId: 12345,
      section: 'public'
    }
  };
  
  // Potentially unsafe input data (for testing)
  const unsafeData = {
    username: 'admin; DROP TABLE users;--',
    action: 'execute_query',
    parameters: {
      sql: 'SELECT * FROM users WHERE 1=1',
      adminOverride: 'true'
    }
  };
  
  // Test safe data
  console.log('\nTesting safe input data:');
  const safeResult = await makeRequest('/pipeline/security', 'POST', safeData);
  console.log('Safe result:', JSON.stringify(safeResult, null, 2));
  
  // Test unsafe data
  console.log('\nTesting potentially unsafe input data:');
  const unsafeResult = await makeRequest('/pipeline/security', 'POST', unsafeData);
  console.log('Unsafe result:', JSON.stringify(unsafeResult, null, 2));
}

// Test database validation
async function testDatabaseValidation() {
  console.log('\n=== Testing Database Operation Validation ===');
  
  // Safe database operation
  const safeOperation = {
    operation: 'select',
    table: 'products',
    conditions: {
      category: 'electronics',
      price_min: 100,
      price_max: 500
    },
    limit: 10
  };
  
  // Potentially unsafe database operation (for testing)
  const unsafeOperation = {
    operation: 'raw_query',
    query: "SELECT * FROM users WHERE username LIKE '%admin%' OR 1=1;--'",
    parameters: {
      bypass_security: true
    }
  };
  
  // Test safe operation
  console.log('\nTesting safe database operation:');
  const safeResult = await makeRequest('/pipeline/db-operation', 'POST', safeOperation);
  console.log('Safe result:', JSON.stringify(safeResult, null, 2));
  
  // Test unsafe operation
  console.log('\nTesting potentially unsafe database operation:');
  const unsafeResult = await makeRequest('/pipeline/db-operation', 'POST', unsafeOperation);
  console.log('Unsafe result:', JSON.stringify(unsafeResult, null, 2));
}

// Test pipeline status and cache
async function testPipelineStatus() {
  console.log('\n=== Testing Pipeline Status and Cache ===');
  
  // Get pipeline status
  console.log('\nFetching pipeline status:');
  const statusResult = await makeRequest('/pipeline/status', 'GET');
  console.log('Status:', JSON.stringify(statusResult, null, 2));
  
  // Get cache stats
  console.log('\nFetching cache statistics:');
  const cacheResult = await makeRequest('/pipeline/cache', 'POST', { action: 'stats' });
  console.log('Cache stats:', JSON.stringify(cacheResult, null, 2));
  
  // Clear cache
  console.log('\nClearing validation cache:');
  const clearResult = await makeRequest('/pipeline/cache', 'POST', { action: 'clear' });
  console.log('Clear result:', JSON.stringify(clearResult, null, 2));
}

// Main function to run tests
async function runTests() {
  try {
    console.log('=== Validation Pipeline Test ===');
    console.log('Testing the enhanced validation pipeline with performance optimizations and AI security analysis.');
    
    // Run test suites
    await testSchemaValidation();
    await testAIValidation();
    await testDatabaseValidation();
    await testPipelineStatus();
    
    console.log('\n=== Test Completed Successfully ===');
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the tests
runTests();