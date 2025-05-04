/**
 * Direct Validation Test Script
 * 
 * This script tests the direct validation endpoints that have a completely
 * custom implementation and bypass all middleware and security layers.
 */

const axios = require('axios');

// Set up axios instance for local testing
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

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
    const response = await api({
      method,
      url: endpoint,
      data
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
  
  const validResult = await makeRequest('/direct-test/basic', 'POST', validData);
  printTestResult('Valid data passes validation', validResult.success && validResult.data.success);
  
  // Test invalid email
  const invalidEmailData = {
    name: 'Test User',
    email: 'invalid-email',
    message: 'This is a test message with sufficient length.'
  };
  
  const invalidEmailResult = await makeRequest('/direct-test/basic', 'POST', invalidEmailData);
  printTestResult('Invalid email is rejected', !invalidEmailResult.success || !invalidEmailResult.data.success);
  
  // Test short message
  const shortMessageData = {
    name: 'Test User',
    email: 'test@example.com',
    message: 'Too short'
  };
  
  const shortMessageResult = await makeRequest('/direct-test/basic', 'POST', shortMessageData);
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
  
  const safeResult = await makeRequest('/direct-test/ai-security', 'POST', safePayload);
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
  
  const suspiciousResult = await makeRequest('/direct-test/ai-security', 'POST', suspiciousPayload);
  printTestResult('Suspicious payload is detected', 
    suspiciousResult.success && suspiciousResult.data.success && !suspiciousResult.data.validation.passed);
}

// Test validation pipeline status
async function testValidationStatus() {
  printHeader('Validation Pipeline Status (Direct Test)');
  
  const statusResult = await makeRequest('/direct-test/status');
  printTestResult('Validation status endpoint works', 
    statusResult.success && statusResult.data.success);
}

// Run all tests
async function runTests() {
  printHeader('Direct Validation Test Suite');
  
  try {
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