/**
 * Test script for directly testing the API validation features
 */
import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000';

async function testBasicValidation() {
  console.log('\n===== Testing Basic Validation =====');
  
  try {
    const response = await fetch(`${API_URL}/api/direct-validation/basic`);
    const contentType = response.headers.get('content-type');
    
    console.log(`Status: ${response.status}`);
    console.log(`Content-Type: ${contentType}`);
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      const text = await response.text();
      console.log('Response starts with:', text.substring(0, 100) + '...');
      console.log('This appears to be HTML rather than JSON. Your API endpoint might be caught by the Vite router.');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

async function testSecurityValidation() {
  console.log('\n===== Testing Security Validation =====');
  
  // Test with safe input
  try {
    const safeData = { query: 'normal user input' };
    const safeResponse = await fetch(`${API_URL}/api/direct-validation/security`, {
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
    const maliciousResponse = await fetch(`${API_URL}/api/direct-validation/security`, {
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

async function main() {
  console.log('Starting API Validation Test');
  await testBasicValidation();
  await testSecurityValidation();
  console.log('\nAPI Validation Test Complete');
}

main().catch(err => {
  console.error('Unhandled error:', err);
});