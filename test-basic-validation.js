/**
 * Basic Validation Test Script
 * 
 * This script tests the basic validation functionality without CSRF protection.
 * It's designed for development and testing purposes only.
 * 
 * Usage: node test-basic-validation.js
 */

import fetch from 'node-fetch';
const BASE_URL = 'http://localhost:5000';

// ANSI color codes for prettier console output
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

// Test helper function
async function makeRequest(endpoint, method = 'GET', data = null) {
  try {
    const url = `${BASE_URL}${endpoint}`;
    
    // First, get a CSRF token if we're not using a bypass endpoint
    let csrfToken;
    if (!endpoint.includes('/api/no-csrf/')) {
      try {
        const tokenResponse = await fetch(`${BASE_URL}/api/csrf-token`);
        const tokenData = await tokenResponse.json();
        csrfToken = tokenData.token;
      } catch (err) {
        console.warn('Failed to get CSRF token:', err.message);
      }
    }
    
    const requestOptions = {
      method,
      headers: {
        'Content-Type': 'application/json',
        // Add explicit CSRF bypass headers for no-csrf endpoints
        ...(endpoint.includes('/api/no-csrf/') && {
          'X-CSRF-Bypass': 'testing',
          'X-CSRF-Token': 'test-bypass-token'
        }),
        // Otherwise use the actual CSRF token if available
        ...(!endpoint.includes('/api/no-csrf/') && csrfToken && {
          'X-CSRF-Token': csrfToken
        })
      },
      ...(data && { body: JSON.stringify(data) })
    };
    
    const response = await fetch(url, requestOptions);
    
    // Try to parse as JSON
    let responseData;
    try {
      responseData = await response.json();
    } catch (err) {
      responseData = { text: await response.text() };
    }
    
    return {
      status: response.status,
      data: responseData
    };
  } catch (error) {
    console.error('Request failed:', error);
    return {
      error: error.message
    };
  }
}

// Print test result
function printResult(testName, success, data) {
  console.log('\n' + COLORS.bright + (success ? COLORS.green : COLORS.red) + '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' + COLORS.reset);
  console.log((success ? COLORS.green + '✓ ' : COLORS.red + '✗ ') + COLORS.bright + testName + COLORS.reset);
  console.log((success ? COLORS.green : COLORS.red) + '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' + COLORS.reset);
  
  if (data) {
    console.log(COLORS.cyan + 'Response:' + COLORS.reset);
    console.log(JSON.stringify(data, null, 2));
  }
}

// Test that schema validation is working correctly
async function testSchemaValidation() {
  console.log(COLORS.magenta + '\n[TEST] Basic schema validation (No CSRF protection)' + COLORS.reset);
  
  // Test 1: Valid data should pass validation
  const validData = {
    name: "John Doe",
    email: "john.doe@example.com",
    message: "This is a test message that meets the validation requirements."
  };
  
  const validResponse = await makeRequest('/api/no-csrf/validation-test/basic', 'POST', validData);
  printResult(
    'Valid data passes validation', 
    validResponse.status === 200 && validResponse.data.success, 
    validResponse.data
  );
  
  // Test 2: Invalid email format should fail
  const invalidEmailData = {
    name: "John Doe",
    email: "not-an-email",
    message: "This is a test message with an invalid email format."
  };
  
  const invalidEmailResponse = await makeRequest('/api/no-csrf/validation-test/basic', 'POST', invalidEmailData);
  printResult(
    'Invalid email is rejected',
    invalidEmailResponse.status !== 200 || !invalidEmailResponse.data.success,
    invalidEmailResponse.data
  );
  
  // Test 3: Too short message should fail
  const shortMessageData = {
    name: "John Doe",
    email: "john.doe@example.com",
    message: "Too short"
  };
  
  const shortMessageResponse = await makeRequest('/api/no-csrf/validation-test/basic', 'POST', shortMessageData);
  printResult(
    'Short message is rejected',
    shortMessageResponse.status !== 200 || !shortMessageResponse.data.success,
    shortMessageResponse.data
  );
}

// Test AI-powered security validation
async function testAIValidation() {
  console.log(COLORS.magenta + '\n[TEST] AI security validation (No CSRF protection)' + COLORS.reset);
  
  // Test 1: Safe payload
  const safePayload = {
    query: "product search",
    filters: {
      category: "electronics",
      priceRange: { min: 100, max: 500 }
    },
    sort: "price_asc" 
  };
  
  const safeResponse = await makeRequest('/api/no-csrf/validation-test/ai-security', 'POST', safePayload);
  printResult(
    'Safe payload passes AI validation', 
    safeResponse.status === 200 && safeResponse.data.success, 
    safeResponse.data
  );
  
  // Test 2: Suspicious payload with potential SQL injection
  const suspiciousPayload = {
    query: "' OR 1=1; --",
    userId: "admin' OR '1'='1",
    action: "SELECT * FROM users;"
  };
  
  const suspiciousResponse = await makeRequest('/api/no-csrf/validation-test/ai-security', 'POST', suspiciousPayload);
  
  // For suspicious content, we expect either a rejection or warnings
  const hasWarnings = suspiciousResponse.data.validation && 
                    Array.isArray(suspiciousResponse.data.validation.warnings) && 
                    suspiciousResponse.data.validation.warnings.length > 0;
                    
  const lowScore = suspiciousResponse.data.validation && 
                  suspiciousResponse.data.validation.securityScore < 0.8;
                  
  printResult(
    'Suspicious payload is detected', 
    suspiciousResponse.status !== 200 || hasWarnings || lowScore, 
    suspiciousResponse.data
  );
}

// Run all tests
async function runTests() {
  console.log(COLORS.bright + COLORS.cyan + '\n╔═════════════════════════════════════════════════════════════╗');
  console.log('║ Basic Validation Test Suite (No CSRF)                    ║');
  console.log('╚═════════════════════════════════════════════════════════════╝\n' + COLORS.reset);
  
  try {
    await testSchemaValidation();
    await testAIValidation();
    
    console.log(COLORS.bright + COLORS.green + '\n╔═════════════════════════════════════════════════════════════╗');
    console.log('║ Test suite completed                                     ║');
    console.log('╚═════════════════════════════════════════════════════════════╝\n' + COLORS.reset);
  } catch (error) {
    console.error(COLORS.red + 'Test suite error:', error, COLORS.reset);
  }
}

// Execute all tests
runTests();