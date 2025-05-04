/**
 * Direct Validation Test Script
 * 
 * This script tests the direct validation endpoints that have a completely
 * custom implementation and bypass all middleware and security layers.
 */

import axios from 'axios';

// Set up axios instance for local testing
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
  withCredentials: true
});

// Function to get the CSRF token
async function getCsrfToken() {
  try {
    const response = await axios.get('http://localhost:5000/api/csrf-token');
    const token = response.data.csrfToken;
    
    // Update the default headers with the token
    api.defaults.headers['X-CSRF-Token'] = token;
    
    console.log(`Retrieved CSRF token: ${token}`);
    return token;
  } catch (error) {
    console.error('Failed to get CSRF token:', error.message);
    return null;
  }
}

// Test formatting helpers
function printHeader(text) {
  console.log('\n╔═════════════════════════════════════════════════════════════╗');
  console.log(`║ ${text.padEnd(56, ' ')} ║`);
  console.log('╚═════════════════════════════════════════════════════════════╝\n');
}

function printTestResult(title, success) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`${success ? '✓' : '✗'} ${title}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

async function makeRequest(endpoint, method = 'GET', data = null) {
  try {
    // Add CSRF token to the data if it's a POST request
    let requestData = data;
    if (method !== 'GET' && data !== null && api.defaults.headers['X-CSRF-Token']) {
      requestData = { ...data, _csrf: api.defaults.headers['X-CSRF-Token'] };
    }
    
    const response = await api({
      method,
      url: endpoint,
      data: requestData
    });
    
    console.log('Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    return {
      status: response.status,
      data: response.data,
      success: true
    };
  } catch (error) {
    console.log('Response:');
    if (error.response) {
      console.log(JSON.stringify(error.response.data, null, 2));
      return {
        status: error.response.status,
        data: error.response.data,
        success: false
      };
    } else {
      console.log(error.message);
      return {
        status: 500,
        data: { error: error.message },
        success: false
      };
    }
  }
}

// Test basic schema validation
async function testBasicSchemaValidation() {
  printHeader('Basic Schema Validation (Direct Test)');
  
  // Test valid data
  const validData = {
    name: 'Test User',
    email: 'test@example.com',
    message: 'This is a test message with sufficient length.'
  };
  
  const validResult = await makeRequest('/no-security/basic', 'POST', validData);
  printTestResult('Valid data passes validation', validResult.success && validResult.data.success);
  
  // Test invalid email
  const invalidEmailData = {
    name: 'Test User',
    email: 'invalid-email',
    message: 'This is a test message with sufficient length.'
  };
  
  const invalidEmailResult = await makeRequest('/no-security/basic', 'POST', invalidEmailData);
  printTestResult('Invalid email is rejected', !invalidEmailResult.success || !invalidEmailResult.data.success);
  
  // Test short message
  const shortMessageData = {
    name: 'Test User',
    email: 'test@example.com',
    message: 'Too short'
  };
  
  const shortMessageResult = await makeRequest('/no-security/basic', 'POST', shortMessageData);
  printTestResult('Short message is rejected', !shortMessageResult.success || !shortMessageResult.data.success);
}

// Test AI security validation
async function testAISecurityValidation() {
  printHeader('AI Security Validation (Direct Test)');
  
  // Test safe payload
  const safePayload = {
    query: 'normal search query',
    filters: {
      category: 'books',
      priceRange: {
        min: 10,
        max: 50
      }
    },
    sort: 'price_asc'
  };
  
  const safeResult = await makeRequest('/no-security/ai-security', 'POST', safePayload);
  printTestResult('Safe payload passes AI validation', 
    safeResult.success && safeResult.data.success && safeResult.data.validation.passed);
  
  // Test suspicious payload
  const suspiciousPayload = {
    query: 'SELECT * FROM users',
    filters: {
      category: 'DROP TABLE customers;',
      priceRange: {
        min: 10,
        max: 50
      }
    },
    sort: '1=1; --'
  };
  
  const suspiciousResult = await makeRequest('/no-security/ai-security', 'POST', suspiciousPayload);
  printTestResult('Suspicious payload is detected', 
    suspiciousResult.success && suspiciousResult.data.success && !suspiciousResult.data.validation.passed);
}

// Test validation pipeline status
async function testValidationStatus() {
  printHeader('Validation Pipeline Status (Direct Test)');
  
  const statusResult = await makeRequest('/no-security/status');
  printTestResult('Validation status endpoint works', 
    statusResult.success && statusResult.data.success);
}

// Run all tests
async function runTests() {
  printHeader('Direct Validation Test Suite');
  
  try {
    // First, get a CSRF token
    console.log('Fetching CSRF token...');
    const token = await getCsrfToken();
    
    if (!token) {
      console.error('Failed to get CSRF token. Tests may fail due to CSRF protection.');
    } else {
      console.log('Successfully obtained CSRF token, proceeding with tests.');
    }
    
    // Add token to request data as well
    await testBasicSchemaValidation();
    await testAISecurityValidation();
    await testValidationStatus();
    
    printHeader('Test suite completed');
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

// Execute tests
runTests();