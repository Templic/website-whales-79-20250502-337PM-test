/**
 * Simple API Validation Test
 * 
 * This script tests the validation API endpoints without browser dependencies
 */

import http from 'http';

// Configuration
const API_URL = 'http://localhost:4000';

console.log('Starting Simple API Validation Test\n');

// Function to make an HTTP request
function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      method: method
    };
    
    const req = http.request(url, options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: responseData
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.setHeader('Content-Type', 'application/json');
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test health check endpoint
async function testHealthCheck() {
  console.log('\n===== Testing Health Check =====');
  
  try {
    const response = await makeRequest(`${API_URL}/api/health`);
    console.log(`Status: ${response.status}`);
    console.log(`Content-Type: ${response.headers['content-type']}`);
    console.log(`Response: ${response.data}`);
  } catch (error) {
    console.error('Error testing health check:', error.message);
  }
}

// Test basic validation endpoint
async function testBasicValidation() {
  console.log('\n===== Testing Basic Validation =====');
  
  // Test with valid data
  try {
    const validData = {
      name: 'John Doe',
      email: 'john@example.com',
      age: 30
    };
    
    const response = await makeRequest(`${API_URL}/api/validate/basic`, 'POST', validData);
    console.log(`Valid Data - Status: ${response.status}`);
    console.log(`Valid Data - Content-Type: ${response.headers['content-type']}`);
    console.log(`Valid Data - Response: ${response.data}`);
  } catch (error) {
    console.error('Error testing basic validation with valid data:', error.message);
  }
  
  // Test with invalid data
  try {
    const invalidData = {
      name: 'J',
      email: 'not-an-email',
      age: -5
    };
    
    const response = await makeRequest(`${API_URL}/api/validate/basic`, 'POST', invalidData);
    console.log(`Invalid Data - Status: ${response.status}`);
    console.log(`Invalid Data - Content-Type: ${response.headers['content-type']}`);
    console.log(`Invalid Data - Response: ${response.data}`);
  } catch (error) {
    console.error('Error testing basic validation with invalid data:', error.message);
  }
}

// Test security validation endpoint
async function testSecurityValidation() {
  console.log('\n===== Testing Security Validation =====');
  
  // Test with safe input
  try {
    const safeData = {
      query: 'normal user input'
    };
    
    const response = await makeRequest(`${API_URL}/api/validate/security`, 'POST', safeData);
    console.log(`Safe Input - Status: ${response.status}`);
    console.log(`Safe Input - Content-Type: ${response.headers['content-type']}`);
    console.log(`Safe Input - Response: ${response.data}`);
  } catch (error) {
    console.error('Error testing security validation with safe input:', error.message);
  }
  
  // Test with malicious input
  try {
    const maliciousData = {
      query: "' OR 1=1; DROP TABLE users; --"
    };
    
    const response = await makeRequest(`${API_URL}/api/validate/security`, 'POST', maliciousData);
    console.log(`Malicious Input - Status: ${response.status}`);
    console.log(`Malicious Input - Content-Type: ${response.headers['content-type']}`);
    console.log(`Malicious Input - Response: ${response.data}`);
  } catch (error) {
    console.error('Error testing security validation with malicious input:', error.message);
  }
}

// Run all tests
async function runTests() {
  await testHealthCheck();
  await testBasicValidation();
  await testSecurityValidation();
  
  console.log('\nSimple API Validation Test Complete');
}

// Start tests
runTests();