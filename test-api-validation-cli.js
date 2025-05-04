/**
 * API Validation CLI Test Tool
 * 
 * This tool directly tests the API validation functionality from the command line,
 * bypassing browser security constraints.
 * 
 * Usage: node test-api-validation-cli.js
 */

import axios from 'axios';
import util from 'util';
import chalk from 'chalk';

// Base URL for API requests
const baseUrl = 'http://localhost:5000';

// Set up axios instance with common configuration
const api = axios.create({
  baseURL: baseUrl,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Helper to format responses for display
 */
function formatResponse(response) {
  return util.inspect(response.data, { colors: true, depth: 6, compact: false });
}

/**
 * Helper to log section headers
 */
function logSection(title) {
  console.log('\n' + chalk.bgBlue.white(' ' + title + ' ') + '\n');
}

/**
 * Get CSRF token for authenticated requests
 */
async function getCsrfToken() {
  try {
    logSection('Getting CSRF Token');
    const response = await api.get('/api/csrf-token');
    console.log(chalk.green('CSRF token obtained'));
    console.log('Token snippet:', response.data.csrfToken.substring(0, 8) + '...');
    return response.data.csrfToken;
  } catch (error) {
    console.error(chalk.red('Error getting CSRF token:'), error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return null;
  }
}

/**
 * Test validation rules endpoint
 */
async function testValidationRules(csrfToken) {
  try {
    logSection('Testing Validation Rules Endpoint');
    const response = await api.get('/api/validation-test/rules', {
      headers: { 'X-CSRF-Token': csrfToken }
    });
    console.log(chalk.green('Rules endpoint response:'));
    console.log(formatResponse(response));
    return true;
  } catch (error) {
    console.error(chalk.red('Error testing validation rules:'), error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

/**
 * Test validation mappings endpoint
 */
async function testValidationMappings(csrfToken) {
  try {
    logSection('Testing Validation Mappings Endpoint');
    const response = await api.get('/api/validation-test/mappings', {
      headers: { 'X-CSRF-Token': csrfToken }
    });
    console.log(chalk.green('Mappings endpoint response:'));
    console.log(formatResponse(response));
    return true;
  } catch (error) {
    console.error(chalk.red('Error testing validation mappings:'), error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

/**
 * Test no-security status endpoint
 */
async function testNoSecurityStatus(csrfToken) {
  try {
    logSection('Testing No-Security Status Endpoint');
    const response = await api.get('/api/no-security/status', {
      headers: { 'X-CSRF-Token': csrfToken }
    });
    console.log(chalk.green('No-Security Status endpoint response:'));
    console.log(formatResponse(response));
    return true;
  } catch (error) {
    console.error(chalk.red('Error testing no-security status:'), error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

/**
 * Test validation bypass status endpoint
 */
async function testValidationBypassStatus(csrfToken) {
  try {
    logSection('Testing Validation Bypass Status Endpoint');
    const response = await api.get('/api/validation-bypass/status', {
      headers: { 'X-CSRF-Token': csrfToken }
    });
    console.log(chalk.green('Validation Bypass Status endpoint response:'));
    console.log(formatResponse(response));
    return true;
  } catch (error) {
    console.error(chalk.red('Error testing validation bypass status:'), error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

/**
 * Test validation bypass rules endpoint
 */
async function testValidationBypassRules(csrfToken) {
  try {
    logSection('Testing Validation Bypass Rules Endpoint');
    const response = await api.get('/api/validation-bypass/rules', {
      headers: { 'X-CSRF-Token': csrfToken }
    });
    console.log(chalk.green('Validation Bypass Rules endpoint response:'));
    console.log(formatResponse(response));
    return true;
  } catch (error) {
    console.error(chalk.red('Error testing validation bypass rules:'), error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

/**
 * Test safe security validation
 */
async function testSafeSecurityValidation(csrfToken) {
  try {
    logSection('Testing Safe Security Validation');
    const payload = {
      query: 'How is the weather today?',
      userId: '1234'
    };
    const response = await api.post('/api/validation-bypass/security', payload, {
      headers: { 'X-CSRF-Token': csrfToken }
    });
    console.log(chalk.green('Safe security validation response:'));
    console.log(formatResponse(response));
    return true;
  } catch (error) {
    console.error(chalk.red('Error testing safe security validation:'), error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

/**
 * Test suspicious security validation
 */
async function testSuspiciousSecurityValidation(csrfToken) {
  try {
    logSection('Testing Suspicious Security Validation');
    const payload = {
      query: 'SELECT * FROM users; DROP TABLE users;',
      userId: '1234; DROP TABLE users;',
      adminOverride: 'true'
    };
    const response = await api.post('/api/validation-bypass/security', payload, {
      headers: { 'X-CSRF-Token': csrfToken }
    });
    console.log(chalk.green('Suspicious security validation response:'));
    console.log(formatResponse(response));
    return true;
  } catch (error) {
    console.error(chalk.red('Error testing suspicious security validation:'), error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

/**
 * Test no-CSRF basic endpoint
 */
async function testNoCsrfBasic(csrfToken) {
  try {
    logSection('Testing No-CSRF Basic Endpoint');
    const payload = {
      name: 'John Doe',
      email: 'john@example.com',
      message: 'This is a test message for validation'
    };
    const response = await api.post('/api/no-csrf/basic', payload, {
      headers: { 'X-CSRF-Token': csrfToken }
    });
    console.log(chalk.green('No-CSRF basic endpoint response:'));
    console.log(formatResponse(response));
    return true;
  } catch (error) {
    console.error(chalk.red('Error testing no-CSRF basic endpoint:'), error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

/**
 * Test direct API endpoint that doesn't require authentication
 */
async function testDirectApiEndpoint() {
  try {
    logSection('Testing Direct API Endpoint (No Auth)');
    const response = await api.get('/api/test/validation-status');
    console.log(chalk.green('Direct API endpoint response:'));
    console.log(formatResponse(response));
    return true;
  } catch (error) {
    console.error(chalk.red('Error testing direct API endpoint:'), error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

/**
 * Main function to run all tests
 */
async function runAllTests() {
  console.log(chalk.bold.blue('\n=== API VALIDATION TEST TOOL ===\n'));
  
  // Direct test that doesn't require authentication
  await testDirectApiEndpoint();
  
  // Get CSRF token for authenticated tests
  const csrfToken = await getCsrfToken();
  if (!csrfToken) {
    console.error(chalk.red('Cannot proceed without CSRF token'));
    return;
  }
  
  // Run test suite
  const results = {
    validationRules: await testValidationRules(csrfToken),
    validationMappings: await testValidationMappings(csrfToken),
    noSecurityStatus: await testNoSecurityStatus(csrfToken),
    validationBypassStatus: await testValidationBypassStatus(csrfToken),
    validationBypassRules: await testValidationBypassRules(csrfToken),
    safeSecurityValidation: await testSafeSecurityValidation(csrfToken),
    suspiciousSecurityValidation: await testSuspiciousSecurityValidation(csrfToken),
    noCsrfBasic: await testNoCsrfBasic(csrfToken)
  };
  
  // Print summary
  logSection('Test Results Summary');
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  
  console.log(chalk.bold(`${passedTests} of ${totalTests} tests passed`));
  console.log('');
  
  for (const [test, passed] of Object.entries(results)) {
    const status = passed 
      ? chalk.green('✓ PASSED') 
      : chalk.red('✗ FAILED');
    console.log(`${status} - ${test}`);
  }
  
  console.log('\n' + chalk.bold.blue('Test tool execution complete') + '\n');
}

// Run all tests
runAllTests();