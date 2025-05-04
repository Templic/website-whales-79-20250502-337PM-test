/**
 * Validation Pipeline Test Script
 * 
 * This script tests the enhanced validation pipeline with its three-phase
 * validation approach, caching, and AI security analysis.
 * 
 * Usage: node test-validation-pipeline.js
 */

const fetch = require('node-fetch');
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
async function makeRequest(endpoint, method = 'GET', data = null, options = {}) {
  try {
    const url = `${BASE_URL}${endpoint}`;
    
    const requestOptions = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...(data && { body: JSON.stringify(data) })
    };
    
    const response = await fetch(url, requestOptions);
    const responseData = await response.json();
    
    return {
      status: response.status,
      data: responseData,
      headers: response.headers
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

// Test standard schema validation with contact form
async function testSchemaValidation() {
  console.log(COLORS.magenta + '\n[TEST] Schema validation with contact form' + COLORS.reset);
  
  // Test 1: Valid contact form submission
  const validContact = {
    name: "John Doe",
    email: "john.doe@example.com",
    message: "This is a test message that meets the validation requirements."
  };
  
  const validResponse = await makeRequest('/api/pipeline/contact', 'POST', validContact);
  printResult('Valid contact form submission', validResponse.status === 200 && validResponse.data.success, validResponse.data);
  
  // Test 2: Invalid contact form submission (email format)
  const invalidEmailContact = {
    name: "John Doe",
    email: "not-an-email",
    message: "This is a test message but the email is invalid."
  };
  
  const invalidEmailResponse = await makeRequest('/api/pipeline/contact', 'POST', invalidEmailContact);
  // For invalid data we expect an error response, not a success
  printResult('Invalid email detection', invalidEmailResponse.status !== 200, invalidEmailResponse.data);
  
  // Test 3: Invalid contact form submission (message too short)
  const shortMessageContact = {
    name: "John Doe",
    email: "john.doe@example.com",
    message: "Too short"
  };
  
  const shortMessageResponse = await makeRequest('/api/pipeline/contact', 'POST', shortMessageContact);
  // For invalid data we expect an error response, not a success
  printResult('Short message detection', shortMessageResponse.status !== 200, shortMessageResponse.data);
  
  // Test 4: Caching check (same valid submission again should hit cache)
  console.log(COLORS.yellow + '\nTesting cache functionality with identical submission...' + COLORS.reset);
  const cachedResponse = await makeRequest('/api/pipeline/contact', 'POST', validContact);
  const cacheHit = cachedResponse.data.validation && cachedResponse.data.validation.cacheHit === true;
  printResult('Cache hit for identical submission', cacheHit, cachedResponse.data);
}

// Test AI-powered security validation
async function testAIValidation() {
  console.log(COLORS.magenta + '\n[TEST] AI-powered security validation' + COLORS.reset);
  
  // Test 1: Safe payload
  const safePayload = {
    query: "product search",
    filters: {
      category: "electronics",
      priceRange: { min: 100, max: 500 }
    },
    sort: "price_asc" 
  };
  
  const safeResponse = await makeRequest('/api/pipeline/security', 'POST', safePayload);
  printResult('Safe payload validation', safeResponse.status === 200 && safeResponse.data.success, safeResponse.data);
  
  // Test 2: Suspicious payload with potential SQL injection
  const suspiciousPayload = {
    query: "' OR 1=1; --",
    userId: "admin' OR '1'='1",
    action: "SELECT * FROM users;"
  };
  
  const suspiciousResponse = await makeRequest('/api/pipeline/security', 'POST', suspiciousPayload);
  // For suspicious content, we expect either a rejection or warnings
  const hasWarnings = suspiciousResponse.data.validation && 
                     Array.isArray(suspiciousResponse.data.validation.warnings) && 
                     suspiciousResponse.data.validation.warnings.length > 0;
                     
  const lowScore = suspiciousResponse.data.validation && 
                   suspiciousResponse.data.validation.securityScore < 0.8;
                   
  printResult('Suspicious payload detection', 
             suspiciousResponse.status !== 200 || hasWarnings || lowScore, 
             suspiciousResponse.data);
}

// Test database operation validation
async function testDatabaseValidation() {
  console.log(COLORS.magenta + '\n[TEST] Database operation validation' + COLORS.reset);
  
  // Test 1: Safe database operation
  const safeDbOperation = {
    type: "select",
    table: "products",
    fields: ["id", "name", "price"],
    filters: { category: "electronics" },
    limit: 10
  };
  
  const safeDbResponse = await makeRequest('/api/pipeline/db-operation', 'POST', safeDbOperation);
  printResult('Safe database operation', safeDbResponse.status === 200 && safeDbResponse.data.success, safeDbResponse.data);
  
  // Test 2: Suspicious database operation with potential SQL injection
  const suspiciousDbOperation = {
    type: "select",
    table: "users; DROP TABLE passwords;--",
    raw: "SELECT * FROM users WHERE id = 1 OR 1=1;",
    fields: ["*"],
    asAdmin: true
  };
  
  const suspiciousDbResponse = await makeRequest('/api/pipeline/db-operation', 'POST', suspiciousDbOperation);
  // For suspicious DB operations, we expect rejection
  printResult('Suspicious database operation detection', 
              suspiciousDbResponse.status !== 200 || !suspiciousDbResponse.data.success, 
              suspiciousDbResponse.data);
}

// Test pipeline status endpoint
async function testPipelineStatus() {
  console.log(COLORS.magenta + '\n[TEST] Pipeline status endpoint' + COLORS.reset);
  
  try {
    // Get a login token first
    const loginResponse = await makeRequest('/api/login', 'POST', {
      username: "admin",
      password: "admin123"
    });
    
    if (!loginResponse.data || !loginResponse.data.id) {
      console.log(COLORS.red + 'Failed to login - cannot test authenticated pipeline status endpoint' + COLORS.reset);
      return;
    }
    
    // Attempt to get pipeline status
    const statusResponse = await makeRequest('/api/pipeline/status', 'GET', null, {
      headers: {
        // Normally we'd use a proper auth token, but for this test
        // the session is maintained through cookies automatically
      }
    });
    
    printResult('Pipeline status check', 
                statusResponse.status === 200 && statusResponse.data.success && statusResponse.data.status, 
                statusResponse.data);
    
    // Attempt to clear cache
    const cacheResponse = await makeRequest('/api/pipeline/cache', 'POST', {
      action: 'clear'
    });
    
    printResult('Cache management - clear cache', 
                cacheResponse.status === 200 && cacheResponse.data.success, 
                cacheResponse.data);
    
    // Get cache stats
    const statsResponse = await makeRequest('/api/pipeline/cache', 'POST', {
      action: 'stats'
    });
    
    printResult('Cache management - stats', 
                statsResponse.status === 200 && statsResponse.data.success, 
                statsResponse.data);
  } catch (error) {
    console.error('Status test error:', error);
    printResult('Pipeline status check', false, { error: error.message });
  }
}

// Run all tests
async function runTests() {
  console.log(COLORS.bright + COLORS.cyan + '\n╔═════════════════════════════════════════════════════════════╗');
  console.log('║ Enhanced Validation Pipeline Test Suite                    ║');
  console.log('╚═════════════════════════════════════════════════════════════╝\n' + COLORS.reset);
  
  try {
    await testSchemaValidation();
    await testAIValidation();
    await testDatabaseValidation();
    await testPipelineStatus();
    
    console.log(COLORS.bright + COLORS.green + '\n╔═════════════════════════════════════════════════════════════╗');
    console.log('║ Test suite completed                                     ║');
    console.log('╚═════════════════════════════════════════════════════════════╝\n' + COLORS.reset);
  } catch (error) {
    console.error(COLORS.red + 'Test suite error:', error, COLORS.reset);
  }
}

// Execute all tests
runTests();