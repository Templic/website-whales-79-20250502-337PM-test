/**
 * API Validation Test Script
 * 
 * This script tests the API validation endpoints with various tests
 * to verify that the API validation feature is working correctly.
 */

import fetch from 'node-fetch';
import FormData from 'form-data';

// Base URL for the API (server is running on port 5000)
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
 * Test the validation rules endpoint
 */
async function testValidationRules() {
  console.log('\n==== Testing Validation Rules Endpoint ====');
  
  const result = await makeRequest('/api/validation-test/rules');
  
  console.log('Result:', JSON.stringify(result, null, 2));
  return result;
}

/**
 * Test the mappings endpoint 
 */
async function testValidationMappings() {
  console.log('\n==== Testing Validation Mappings Endpoint ====');
  
  const result = await makeRequest('/api/validation-test/mappings');
  
  console.log('Result:', JSON.stringify(result, null, 2));
  return result;
}

/**
 * Test the security test endpoint
 */
async function testSecurityValidation() {
  console.log('\n==== Testing Security Validation Endpoint ====');
  
  // Test with a safe payload
  const safeResult = await makeRequest('/api/validation-test/security-test', {
    method: 'POST',
    body: JSON.stringify({
      query: 'How is the weather today?',
      userId: '1234'
    })
  });
  
  console.log('Safe Query Result:', JSON.stringify(safeResult, null, 2));
  
  // Test with a suspicious payload (SQL injection attempt)
  const suspiciousResult = await makeRequest('/api/validation-test/security-test', {
    method: 'POST',
    body: JSON.stringify({
      query: 'SELECT * FROM users; DROP TABLE users;',
      userId: '1234; DROP TABLE users;',
      adminOverride: 'true'
    })
  });
  
  console.log('Suspicious Query Result:', JSON.stringify(suspiciousResult, null, 2));
  
  return { safeResult, suspiciousResult };
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
  
  // Test validation rules
  await testValidationRules();
  
  // Test validation mappings
  await testValidationMappings();
  
  // Test security validation
  await testSecurityValidation();
  
  console.log('\nAll tests completed!');
}

// Run all tests when this script is executed directly
runAllTests().catch(error => {
  console.error('Test suite error:', error);
});