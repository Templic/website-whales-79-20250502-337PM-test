/**
 * TypeScript Error Management API Test with CSRF Token
 * 
 * This script tests the TypeScript error management API endpoints
 * by properly handling CSRF tokens.
 */

import fetch from 'node-fetch';

// Configuration
const API_BASE = 'http://localhost:5000/api/admin/typescript-errors';
const CSRF_TOKEN_URL = 'http://localhost:5000/api/csrf-token';

// Store cookies between requests
let cookies = '';

/**
 * Get CSRF token for authenticated requests
 */
async function getCsrfToken() {
  console.log('Getting CSRF token...');
  const response = await fetch(CSRF_TOKEN_URL, {
    method: 'GET',
    headers: { Cookie: cookies }
  });
  
  // Extract cookies from response
  if (response.headers.get('set-cookie')) {
    const newCookies = response.headers.get('set-cookie');
    cookies = newCookies;
  }
  
  if (!response.ok) {
    throw new Error(`Failed to get CSRF token: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.token;
}

/**
 * Make an authenticated request with CSRF token
 */
async function makeRequestWithCsrf(url, method = 'GET', body = null) {
  // Get CSRF token
  const csrfToken = await getCsrfToken();
  
  // Make request with token
  const options = {
    method,
    headers: {
      'Cookie': cookies,
      'X-CSRF-Token': csrfToken,
      'Content-Type': 'application/json'
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(url, options);
  
  // Update cookies
  if (response.headers.get('set-cookie')) {
    const newCookies = response.headers.get('set-cookie');
    cookies = newCookies;
  }
  
  return response;
}

/**
 * Test the TypeScript errors API
 */
async function testTypescriptErrorsAPI() {
  console.log('Testing TypeScript Errors API with CSRF Token');
  console.log('-----------------------------------------');
  
  try {
    // 1. First test the simple test endpoint
    console.log('\n1. Testing simple test endpoint...');
    const testResponse = await makeRequestWithCsrf(`${API_BASE}/test`);
    
    if (!testResponse.ok) {
      throw new Error(`Test endpoint failed: ${testResponse.status} ${testResponse.statusText}`);
    }
    
    const testData = await testResponse.json();
    console.log('Test endpoint response:', testData);
    
    // 2. Create a new scan
    console.log('\n2. Creating a new scan...');
    const createResponse = await makeRequestWithCsrf(
      `${API_BASE}/scans`, 
      'POST', 
      { aiEnabled: true }
    );
    
    if (!createResponse.ok) {
      throw new Error(`Failed to create scan: ${createResponse.status} ${createResponse.statusText}`);
    }
    
    const createData = await createResponse.json();
    console.log('Scan created successfully:', createData);
    const scanId = createData.id;
    
    // 3. Wait for the scan to complete (just a quick check, not a full wait)
    console.log(`\n3. Checking scan ${scanId} status...`);
    const scanResponse = await makeRequestWithCsrf(`${API_BASE}/scans/${scanId}`);
    
    if (!scanResponse.ok) {
      throw new Error(`Failed to get scan details: ${scanResponse.status} ${scanResponse.statusText}`);
    }
    
    const scanDetails = await scanResponse.json();
    console.log(`Scan status: ${scanDetails.status}`);
    
    console.log('\nAll test requests completed successfully!');
    
  } catch (error) {
    console.error('Error testing TypeScript errors API:', error);
  }
}

// Run the test
testTypescriptErrorsAPI().catch(console.error);