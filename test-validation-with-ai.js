/**
 * Test script for API validation with AI security analysis
 * 
 * This script tests the integration between the validation engine and
 * the AI-powered security analysis service.
 */

const axios = require('axios');
const crypto = require('crypto');

// Configuration
const API_URL = 'http://localhost:3000';  // Adjust to your server URL
const TEST_AUTH_KEY = 'test-security-analysis-secret-key';
const TIMEOUT = 30000; // 30 seconds timeout for tests

/**
 * Get a CSRF token for API requests
 */
async function getCsrfToken() {
  try {
    const response = await axios.get(`${API_URL}/api/csrf-token`);
    return response.data.token;
  } catch (error) {
    console.error('Error getting CSRF token:', error.message);
    throw error;
  }
}

/**
 * Test validation with AI security analysis
 */
async function testValidationWithAI() {
  try {
    console.log('Testing validation with AI security analysis...');
    
    // Get CSRF token
    const csrfToken = await getCsrfToken();
    console.log(`Got CSRF token: ${csrfToken.substring(0, 10)}...`);
    
    // Safe payload - should pass validation
    const safePayload = {
      username: "test_user",
      email: "user@example.com",
      action: "update_profile",
      preferences: {
        theme: "dark",
        notifications: true
      }
    };
    
    // Request with safe payload
    console.log(`\nTesting with safe payload...`);
    const safeResponse = await axios.post(
      `${API_URL}/api/validation/test-ai`,
      safePayload,
      {
        headers: {
          'X-CSRF-Token': csrfToken,
          'Content-Type': 'application/json',
          'X-Test-Auth': TEST_AUTH_KEY
        },
        timeout: TIMEOUT
      }
    );
    
    console.log('Safe payload validation result:');
    console.log(`Status: ${safeResponse.status}`);
    console.log(safeResponse.data);
    
    // Malicious payload - should fail validation
    const maliciousPayload = {
      username: "admin'; DROP TABLE users; --",
      email: "<script>alert('XSS')</script>",
      action: "exec_command",
      command: "rm -rf /",
      password: "password123"
    };
    
    // Request with malicious payload
    console.log(`\nTesting with potentially malicious payload...`);
    try {
      const maliciousResponse = await axios.post(
        `${API_URL}/api/validation/test-ai`,
        maliciousPayload,
        {
          headers: {
            'X-CSRF-Token': csrfToken,
            'Content-Type': 'application/json',
            'X-Test-Auth': TEST_AUTH_KEY
          },
          timeout: TIMEOUT
        }
      );
      
      console.log('Malicious payload validation result (should not succeed):');
      console.log(`Status: ${maliciousResponse.status}`);
      console.log(maliciousResponse.data);
    } catch (error) {
      if (error.response) {
        console.log('Malicious payload validation failed as expected:');
        console.log(`Status: ${error.response.status}`);
        console.log(error.response.data);
      } else {
        console.error('Unexpected error with malicious payload:', error.message);
      }
    }
    
  } catch (error) {
    console.error('Test error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testValidationWithAI();