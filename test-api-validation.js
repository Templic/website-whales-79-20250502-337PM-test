/**
 * API Validation Test Script
 * 
 * This script tests the API validation endpoints with various CSRF bypass mechanisms
 * to determine which approach works best.
 */

const fetch = require('node-fetch');
const FormData = require('form-data');

// Base URL for the API (assumes server is running)
const BASE_URL = 'http://localhost:5000';

/**
 * Helper function to make an API request
 */
async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  console.log(`Making request to ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    console.error(`Error making request to ${url}:`, error.message);
    return { error: error.message };
  }
}

/**
 * Get a CSRF token from the server
 */
async function getCsrfToken() {
  const response = await fetch(`${BASE_URL}/api/csrf-token`);
  const data = await response.json();
  return data.csrfToken;
}

/**
 * Test the direct API endpoint (the most basic one)
 */
async function testDirectEndpoint() {
  console.log('\n==== Testing Direct API Endpoint ====');
  
  const result = await makeRequest('/api/test/basic-validation', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Test User',
      email: 'test@example.com',
      message: 'This is a test message that should pass validation.'
    })
  });
  
  console.log('Result:', JSON.stringify(result, null, 2));
  return result;
}

/**
 * Test the no-CSRF routes
 */
async function testNoCsrfRoutes() {
  console.log('\n==== Testing No-CSRF Routes ====');
  
  const result = await makeRequest('/api/no-csrf/basic', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Test User',
      email: 'test@example.com',
      message: 'This is a test message that should pass validation.'
    })
  });
  
  console.log('Result:', JSON.stringify(result, null, 2));
  return result;
}

/**
 * Test the AI security validation endpoint
 */
async function testAiSecurityEndpoint() {
  console.log('\n==== Testing AI Security Endpoint ====');
  
  // Test with a safe query
  const safeResult = await makeRequest('/api/test/ai-security', {
    method: 'POST',
    body: JSON.stringify({
      query: 'What is the weather today?'
    })
  });
  
  console.log('Safe Query Result:', JSON.stringify(safeResult, null, 2));
  
  // Test with a suspicious query (SQL injection attempt)
  const suspiciousResult = await makeRequest('/api/test/ai-security', {
    method: 'POST',
    body: JSON.stringify({
      query: 'SELECT * FROM users; DROP TABLE users;'
    })
  });
  
  console.log('Suspicious Query Result:', JSON.stringify(suspiciousResult, null, 2));
  
  return { safeResult, suspiciousResult };
}

/**
 * Test the validation status endpoint
 */
async function testValidationStatus() {
  console.log('\n==== Testing Validation Status Endpoint ====');
  
  const result = await makeRequest('/api/test/validation-status');
  
  console.log('Result:', JSON.stringify(result, null, 2));
  return result;
}

/**
 * Test the enhanced validation pipeline
 */
async function testValidationPipeline() {
  console.log('\n==== Testing Enhanced Validation Pipeline ====');
  
  const result = await makeRequest('/api/pipeline/contact', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Pipeline Test User',
      email: 'pipeline-test@example.com',
      message: 'This message should be validated through the pipeline.'
    })
  });
  
  console.log('Result:', JSON.stringify(result, null, 2));
  return result;
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('Starting API validation tests...');
  
  // Try to get a CSRF token
  try {
    const csrfToken = await getCsrfToken();
    console.log('Got CSRF token:', csrfToken);
  } catch (error) {
    console.warn('Could not get CSRF token:', error.message);
  }
  
  // Test direct endpoint
  await testDirectEndpoint();
  
  // Test no-CSRF routes
  await testNoCsrfRoutes();
  
  // Test AI security endpoint
  await testAiSecurityEndpoint();
  
  // Test validation status endpoint
  await testValidationStatus();
  
  // Test validation pipeline
  await testValidationPipeline();
  
  console.log('\nAll tests completed!');
}

// Run all tests when script is executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Test suite error:', error);
  });
}