/**
 * API Security Testing Script
 * 
 * This script tests the API security features implemented in the application.
 * It checks authentication, authorization, rate limiting, and input validation.
 */

const axios = require('axios');
const colors = require('colors');

// Configuration
const config = {
  baseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
  adminCredentials: {
    username: 'admin',
    password: 'admin123'
  },
  userCredentials: {
    username: 'user',
    password: 'user123'
  },
  testEndpoints: [
    { path: '/api/health', method: 'GET', requiresAuth: false },
    { path: '/api/secure/status', method: 'GET', requiresAuth: false },
    { path: '/api/secure/profile', method: 'GET', requiresAuth: true },
    { path: '/api/secure/users', method: 'GET', requiresAuth: true, requiredRole: 'admin' }
  ]
};

// Results tracking
const results = {
  passCount: 0,
  failCount: 0,
  warningCount: 0
};

// Test report
const testReport = [];

// Helper function to log test results
function logTest(name, status, details = '') {
  let statusText;
  
  switch (status) {
    case 'pass':
      statusText = colors.green('PASS');
      results.passCount++;
      break;
    case 'fail':
      statusText = colors.red('FAIL');
      results.failCount++;
      break;
    case 'warn':
      statusText = colors.yellow('WARN');
      results.warningCount++;
      break;
    default:
      statusText = colors.blue('INFO');
  }
  
  console.log(`[${statusText}] ${name}`);
  
  if (details) {
    console.log('       ' + details);
  }
  
  testReport.push({
    name,
    status,
    details
  });
}

// Helper function to get auth token
async function getAuthToken(credentials) {
  try {
    const response = await axios.post(`${config.baseUrl}/api/jwt/login`, credentials);
    
    if (response.data && response.data.token) {
      return response.data.token;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting auth token:', error.message);
    return null;
  }
}

// Test API authentication
async function testAuthentication() {
  console.log('\n--- Testing API Authentication ---');
  
  // Test with valid credentials
  try {
    const adminToken = await getAuthToken(config.adminCredentials);
    
    if (adminToken) {
      logTest('Authentication with valid admin credentials', 'pass', 'Successfully obtained token');
    } else {
      logTest('Authentication with valid admin credentials', 'fail', 'Failed to obtain token');
    }
    
    // Test protected endpoint with valid token
    try {
      const response = await axios.get(`${config.baseUrl}/api/secure/profile`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      
      if (response.status === 200) {
        logTest('Access protected endpoint with valid token', 'pass', 'Successfully accessed protected endpoint');
      } else {
        logTest('Access protected endpoint with valid token', 'fail', `Unexpected status code: ${response.status}`);
      }
    } catch (error) {
      logTest('Access protected endpoint with valid token', 'fail', `Error: ${error.message}`);
    }
    
    // Test with invalid token
    try {
      await axios.get(`${config.baseUrl}/api/secure/profile`, {
        headers: {
          'Authorization': 'Bearer invalid.token.here'
        }
      });
      
      logTest('Reject invalid token', 'fail', 'Invalid token was accepted');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        logTest('Reject invalid token', 'pass', 'Invalid token was correctly rejected');
      } else {
        logTest('Reject invalid token', 'fail', `Unexpected error: ${error.message}`);
      }
    }
    
    // Test with missing token
    try {
      await axios.get(`${config.baseUrl}/api/secure/profile`);
      
      logTest('Reject missing token', 'fail', 'Request without token was accepted');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        logTest('Reject missing token', 'pass', 'Request without token was correctly rejected');
      } else {
        logTest('Reject missing token', 'fail', `Unexpected error: ${error.message}`);
      }
    }
    
    return adminToken;
  } catch (error) {
    logTest('Authentication with valid credentials', 'fail', `Error: ${error.message}`);
    return null;
  }
}

// Test API authorization
async function testAuthorization(adminToken) {
  console.log('\n--- Testing API Authorization ---');
  
  if (!adminToken) {
    logTest('Authorization tests', 'fail', 'Could not obtain admin token to test authorization');
    return;
  }
  
  // Test admin-only endpoint with admin token
  try {
    const response = await axios.get(`${config.baseUrl}/api/secure/users`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    if (response.status === 200) {
      logTest('Access admin endpoint with admin token', 'pass', 'Successfully accessed admin endpoint');
    } else {
      logTest('Access admin endpoint with admin token', 'fail', `Unexpected status code: ${response.status}`);
    }
  } catch (error) {
    logTest('Access admin endpoint with admin token', 'fail', `Error: ${error.message}`);
  }
  
  // Test with regular user token on admin endpoint
  try {
    const userToken = await getAuthToken(config.userCredentials);
    
    if (!userToken) {
      logTest('Authorization with user token', 'fail', 'Could not obtain user token');
      return;
    }
    
    try {
      await axios.get(`${config.baseUrl}/api/secure/users`, {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });
      
      logTest('Reject user access to admin endpoint', 'fail', 'User was allowed to access admin endpoint');
    } catch (error) {
      if (error.response && error.response.status === 403) {
        logTest('Reject user access to admin endpoint', 'pass', 'User was correctly denied access to admin endpoint');
      } else {
        logTest('Reject user access to admin endpoint', 'fail', `Unexpected error: ${error.message}`);
      }
    }
  } catch (error) {
    logTest('Authorization with user token', 'fail', `Error: ${error.message}`);
  }
}

// Test API rate limiting
async function testRateLimiting() {
  console.log('\n--- Testing API Rate Limiting ---');
  
  const endpoint = '/api/secure/status';
  const requestCount = 60; // Attempt to trigger rate limiting
  const results = [];
  
  console.log(`Making ${requestCount} requests to ${endpoint} to test rate limiting...`);
  
  // Make multiple requests to trigger rate limiting
  for (let i = 0; i < requestCount; i++) {
    try {
      const response = await axios.get(`${config.baseUrl}${endpoint}`);
      results.push(response.status);
    } catch (error) {
      if (error.response) {
        results.push(error.response.status);
      } else {
        results.push('error');
      }
    }
  }
  
  // Check if rate limiting was triggered (429 status code)
  const rateLimitedRequests = results.filter(status => status === 429).length;
  
  if (rateLimitedRequests > 0) {
    logTest('Rate limiting implementation', 'pass', `Rate limiting correctly triggered for ${rateLimitedRequests} requests`);
  } else {
    logTest('Rate limiting implementation', 'warn', 'Rate limiting was not triggered. May need to adjust test parameters or check rate limit configuration.');
  }
}

// Test API input validation
async function testInputValidation(adminToken) {
  console.log('\n--- Testing API Input Validation ---');
  
  if (!adminToken) {
    logTest('Input validation tests', 'fail', 'Could not obtain admin token to test input validation');
    return;
  }
  
  // Test with valid input
  try {
    const validUser = {
      username: 'testuser' + Math.floor(Math.random() * 10000),
      email: 'testuser@example.com',
      password: 'password123'
    };
    
    const response = await axios.post(`${config.baseUrl}/api/secure/users`, validUser, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    if (response.status === 201) {
      logTest('Valid input acceptance', 'pass', 'Valid input was correctly accepted');
    } else {
      logTest('Valid input acceptance', 'warn', `Unexpected status code: ${response.status}`);
    }
  } catch (error) {
    logTest('Valid input acceptance', 'fail', `Error: ${error.message}`);
  }
  
  // Test with invalid input (missing required field)
  try {
    const invalidUser = {
      // Missing username
      email: 'invalid@example.com',
      password: 'password123'
    };
    
    await axios.post(`${config.baseUrl}/api/secure/users`, invalidUser, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    logTest('Invalid input rejection (missing field)', 'fail', 'Invalid input was accepted');
  } catch (error) {
    if (error.response && error.response.status === 400) {
      logTest('Invalid input rejection (missing field)', 'pass', 'Invalid input was correctly rejected');
    } else {
      logTest('Invalid input rejection (missing field)', 'fail', `Unexpected error: ${error.message}`);
    }
  }
  
  // Test with invalid input (invalid email format)
  try {
    const invalidUser = {
      username: 'testuser' + Math.floor(Math.random() * 10000),
      email: 'not-an-email',
      password: 'password123'
    };
    
    await axios.post(`${config.baseUrl}/api/secure/users`, invalidUser, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    logTest('Invalid input rejection (invalid format)', 'fail', 'Invalid input was accepted');
  } catch (error) {
    if (error.response && error.response.status === 400) {
      logTest('Invalid input rejection (invalid format)', 'pass', 'Invalid input was correctly rejected');
    } else {
      logTest('Invalid input rejection (invalid format)', 'fail', `Unexpected error: ${error.message}`);
    }
  }
}

// Run all tests
async function runTests() {
  console.log(colors.cyan('\n=== API Security Test Suite ==='));
  console.log(colors.cyan(`Base URL: ${config.baseUrl}`));
  console.log(colors.cyan('==============================\n'));
  
  const startTime = new Date();
  
  // Run authentication tests
  const adminToken = await testAuthentication();
  
  // Run authorization tests
  await testAuthorization(adminToken);
  
  // Run rate limiting tests
  await testRateLimiting();
  
  // Run input validation tests
  await testInputValidation(adminToken);
  
  const endTime = new Date();
  const duration = (endTime - startTime) / 1000;
  
  // Print summary
  console.log(colors.cyan('\n=== Test Summary ==='));
  console.log(`Total Tests: ${results.passCount + results.failCount + results.warningCount}`);
  console.log(colors.green(`Passed: ${results.passCount}`));
  console.log(colors.red(`Failed: ${results.failCount}`));
  console.log(colors.yellow(`Warnings: ${results.warningCount}`));
  console.log(`Duration: ${duration.toFixed(2)} seconds`);
  
  const successRate = Math.round((results.passCount / (results.passCount + results.failCount + results.warningCount)) * 100);
  console.log(`Success Rate: ${successRate}%`);
  
  // Exit with appropriate code
  if (results.failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

// Start tests
runTests().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
});