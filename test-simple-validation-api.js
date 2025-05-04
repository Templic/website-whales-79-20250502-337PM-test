/**
 * Test script for the simple API validation server
 */
import fetch from 'node-fetch';

const API_URL = 'http://localhost:4000';

async function testBasicValidation() {
  console.log('\n===== Testing Basic Validation =====');
  
  // Test valid data
  try {
    const validData = {
      name: "John Doe",
      email: "john@example.com",
      age: 30
    };
    
    const validResponse = await fetch(`${API_URL}/api/validate/basic`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validData)
    });
    
    const validContentType = validResponse.headers.get('content-type');
    console.log(`Valid Data - Status: ${validResponse.status}`);
    console.log(`Valid Data - Content-Type: ${validContentType}`);
    
    if (validContentType && validContentType.includes('application/json')) {
      const data = await validResponse.json();
      console.log('Valid Data - Response:', JSON.stringify(data, null, 2));
    } else {
      const text = await validResponse.text();
      console.log('Valid Data - Response starts with:', text.substring(0, 100) + '...');
    }
  } catch (err) {
    console.error('Valid Data - Error:', err.message);
  }
  
  // Test invalid data
  try {
    const invalidData = {
      name: "J",
      email: "not-an-email",
      age: -5
    };
    
    const invalidResponse = await fetch(`${API_URL}/api/validate/basic`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidData)
    });
    
    const invalidContentType = invalidResponse.headers.get('content-type');
    console.log(`Invalid Data - Status: ${invalidResponse.status}`);
    console.log(`Invalid Data - Content-Type: ${invalidContentType}`);
    
    if (invalidContentType && invalidContentType.includes('application/json')) {
      const data = await invalidResponse.json();
      console.log('Invalid Data - Response:', JSON.stringify(data, null, 2));
    } else {
      const text = await invalidResponse.text();
      console.log('Invalid Data - Response starts with:', text.substring(0, 100) + '...');
    }
  } catch (err) {
    console.error('Invalid Data - Error:', err.message);
  }
}

async function testSecurityValidation() {
  console.log('\n===== Testing Security Validation =====');
  
  // Test with safe input
  try {
    const safeData = { query: 'normal user input' };
    const safeResponse = await fetch(`${API_URL}/api/validate/security`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(safeData)
    });
    
    const safeContentType = safeResponse.headers.get('content-type');
    console.log(`Safe Input - Status: ${safeResponse.status}`);
    console.log(`Safe Input - Content-Type: ${safeContentType}`);
    
    if (safeContentType && safeContentType.includes('application/json')) {
      const data = await safeResponse.json();
      console.log('Safe Input - Response:', JSON.stringify(data, null, 2));
    } else {
      const text = await safeResponse.text();
      console.log('Safe Input - Response starts with:', text.substring(0, 100) + '...');
    }
  } catch (err) {
    console.error('Safe Input - Error:', err.message);
  }
  
  // Test with malicious input (SQL injection)
  try {
    const maliciousData = { query: "' OR 1=1; DROP TABLE users; --" };
    const maliciousResponse = await fetch(`${API_URL}/api/validate/security`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(maliciousData)
    });
    
    const maliciousContentType = maliciousResponse.headers.get('content-type');
    console.log(`Malicious Input - Status: ${maliciousResponse.status}`);
    console.log(`Malicious Input - Content-Type: ${maliciousContentType}`);
    
    if (maliciousContentType && maliciousContentType.includes('application/json')) {
      const data = await maliciousResponse.json();
      console.log('Malicious Input - Response:', JSON.stringify(data, null, 2));
    } else {
      const text = await maliciousResponse.text();
      console.log('Malicious Input - Response starts with:', text.substring(0, 100) + '...');
    }
  } catch (err) {
    console.error('Malicious Input - Error:', err.message);
  }
}

async function testHealthCheck() {
  console.log('\n===== Testing Health Check =====');
  
  try {
    const response = await fetch(`${API_URL}/api/health`);
    const contentType = response.headers.get('content-type');
    
    console.log(`Status: ${response.status}`);
    console.log(`Content-Type: ${contentType}`);
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      const text = await response.text();
      console.log('Response starts with:', text.substring(0, 100) + '...');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

async function main() {
  console.log('Starting Simple API Validation Test');
  await testHealthCheck();
  await testBasicValidation();
  await testSecurityValidation();
  console.log('\nSimple API Validation Test Complete');
}

main().catch(err => {
  console.error('Unhandled error:', err);
});