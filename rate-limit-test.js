/**
 * Rate Limiting Test Script
 * 
 * This script tests the rate limiting functionality by sending multiple
 * requests to the rate limiting test endpoints.
 */

import fetch from 'node-fetch';

// Configuration
const BASE_URL = 'http://localhost:5000';
const ENDPOINT_BASIC = '/rate-limit-test/basic';
const ENDPOINT_HIGH_COST = '/rate-limit-test/high-cost';
const ENDPOINT_STATS = '/rate-limit-test/stats';
const ENDPOINT_SIM_FAILURE = '/rate-limit-test/simulate-security-failure';
const ENDPOINT_SIM_SUCCESS = '/rate-limit-test/simulate-security-success';

// Request function with timeout and error handling
async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      timeout: 5000,
      credentials: 'include',  // This ensures cookies are sent with each request
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    // Look for and log rate limit headers
    const rateLimit = response.headers.get('x-ratelimit-limit');
    const rateRemaining = response.headers.get('x-ratelimit-remaining');
    const rateReset = response.headers.get('x-ratelimit-reset');
    
    if (rateLimit) {
      console.log(`Rate limit headers: ${rateRemaining}/${rateLimit} tokens remaining, reset in ${rateReset}s`);
    }
    
    const contentType = response.headers.get('content-type') || '';
    let data;
    
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // Handle HTML or text responses
      const textData = await response.text();
      // Return just a snippet of the HTML to avoid flooding the console
      const snippet = textData.substring(0, 150) + '...';
      data = { text: snippet };
    }
    
    return {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data
    };
  } catch (error) {
    console.error(`Error making request to ${url}:`, error.message);
    return {
      error: error.message
    };
  }
}

// Get a CSRF token first
async function getCsrfToken() {
  try {
    const response = await fetch(`${BASE_URL}/api/csrf-token`, {
      credentials: 'include'  // This ensures cookies are sent and received
    });
    
    // Extract cookies from response headers
    const cookies = response.headers.get('set-cookie');
    if (cookies) {
      console.log('Received cookies:', cookies);
    }
    
    const data = await response.json();
    return data.csrfToken;
  } catch (error) {
    console.error('Error getting CSRF token:', error.message);
    return null;
  }
}

// Run basic test (multiple requests to basic endpoint)
async function runBasicTest(count = 10) {
  console.log(`\n=== Running Basic Test (${count} requests) ===`);
  
  const results = [];
  for (let i = 0; i < count; i++) {
    console.log(`Making request ${i + 1}/${count}...`);
    const result = await makeRequest(`${BASE_URL}${ENDPOINT_BASIC}`);
    results.push(result);
    
    // Log rate limit headers if available
    if (result.headers) {
      const limit = result.headers['x-ratelimit-limit'];
      const remaining = result.headers['x-ratelimit-remaining'];
      const reset = result.headers['x-ratelimit-reset'];
      
      if (limit && remaining) {
        console.log(`Rate limit: ${remaining}/${limit} remaining, reset in ${reset || 'unknown'}`);
      }
    }
    
    // Short delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}

// Run high-cost test
async function runHighCostTest(count = 5) {
  console.log(`\n=== Running High-Cost Test (${count} requests) ===`);
  
  const results = [];
  for (let i = 0; i < count; i++) {
    console.log(`Making request ${i + 1}/${count}...`);
    const result = await makeRequest(`${BASE_URL}${ENDPOINT_HIGH_COST}`);
    results.push(result);
    
    // Log rate limit headers if available
    if (result.headers) {
      const limit = result.headers['x-ratelimit-limit'];
      const remaining = result.headers['x-ratelimit-remaining'];
      const reset = result.headers['x-ratelimit-reset'];
      
      if (limit && remaining) {
        console.log(`Rate limit: ${remaining}/${limit} remaining, reset in ${reset || 'unknown'}`);
      }
    }
    
    // Short delay between requests
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  return results;
}

// Test getting rate limit stats
async function getStats() {
  console.log('\n=== Getting Rate Limit Stats ===');
  const result = await makeRequest(`${BASE_URL}${ENDPOINT_STATS}`);
  console.log(JSON.stringify(result.data, null, 2));
  return result;
}

// Test simulating security failure
async function simulateSecurityFailure() {
  console.log('\n=== Simulating Security Failure ===');
  const result = await makeRequest(`${BASE_URL}${ENDPOINT_SIM_FAILURE}`);
  console.log(JSON.stringify(result.data, null, 2));
  return result;
}

// Test simulating security success
async function simulateSecuritySuccess() {
  console.log('\n=== Simulating Security Success ===');
  const result = await makeRequest(`${BASE_URL}${ENDPOINT_SIM_SUCCESS}`);
  console.log(JSON.stringify(result.data, null, 2));
  return result;
}

// Run an exhaustion test to see if we can trigger rate limiting
async function runExhaustionTest(count = 50) {
  console.log(`\n=== Running Exhaustion Test (${count} requests) ===`);
  
  const results = [];
  let limitTriggered = false;
  
  for (let i = 0; i < count; i++) {
    process.stdout.write(`Making request ${i + 1}/${count}... `);
    const result = await makeRequest(`${BASE_URL}${ENDPOINT_BASIC}`);
    results.push(result);
    
    // Check if rate limiting was triggered
    if (result.status === 429) {
      console.log('RATE LIMITED!');
      limitTriggered = true;
      break;
    } else {
      console.log('OK');
    }
    
    // No delay between requests to try to trigger rate limiting
  }
  
  console.log(`Exhaustion test ${limitTriggered ? 'successfully triggered' : 'did not trigger'} rate limiting`);
  return results;
}

// Run comparative test (basic vs high-cost)
async function runComparativeTest() {
  console.log('\n=== Running Comparative Test ===');
  
  // Get stats before
  console.log('Getting stats before test...');
  await getStats();
  
  // Run basic requests
  console.log('Running 5 basic requests...');
  await runBasicTest(5);
  
  // Check stats after basic
  console.log('Getting stats after basic requests...');
  await getStats();
  
  // Run high-cost requests
  console.log('Running 5 high-cost requests...');
  await runHighCostTest(5);
  
  // Check stats after high-cost
  console.log('Getting stats after high-cost requests...');
  await getStats();
  
  return true;
}

// Helper to make a request with CSRF tokens
async function makeRequestWithCsrf(url, csrfToken, options = {}) {
  return makeRequest(url, {
    ...options,
    headers: {
      ...options.headers,
      'X-CSRF-Token': csrfToken,
      'X-XSRF-Token': csrfToken
    }
  });
}

// Main function
async function main() {
  console.log('Starting rate limiting test script...');
  
  console.log('Checking if we need to get a CSRF token...');
  const csrfToken = await getCsrfToken();
  console.log(csrfToken ? `CSRF token acquired: ${csrfToken.substring(0, 10)}...` : 'No CSRF token available');
  
  // We'll modify our request functions to include the CSRF token
  const runTestWithToken = async (testFn, ...args) => {
    // Override the makeRequest function temporarily
    const originalMakeRequest = makeRequest;
    
    try {
      // Replace the makeRequest with one that includes CSRF tokens
      global.makeRequest = (url, options = {}) => {
        return originalMakeRequest(url, {
          ...options,
          headers: {
            ...options.headers,
            'X-CSRF-Token': csrfToken,
            'X-XSRF-Token': csrfToken
          }
        });
      };
      
      // Run the test function
      return await testFn(...args);
    } finally {
      // Restore the original function
      global.makeRequest = originalMakeRequest;
    }
  };
  
  // Run stats test first to see initial state
  console.log('\n=== Running tests with CSRF token ===');
  await runTestWithToken(getStats);
  
  // Run basic test
  await runTestWithToken(runBasicTest, 3);
  
  // Run high-cost test
  await runTestWithToken(runHighCostTest, 2);
  
  // Simulate security failure and check impact
  await runTestWithToken(simulateSecurityFailure);
  await runTestWithToken(getStats);
  
  // Simulate security success and check impact
  await runTestWithToken(simulateSecuritySuccess);
  await runTestWithToken(getStats);
  
  // Run exhaustion test
  await runTestWithToken(runExhaustionTest, 20);
  
  // Run comparative test
  await runTestWithToken(runComparativeTest);
  
  console.log('\nTests completed!');
}

// Run the main function
main().catch(error => {
  console.error('Error in test script:', error);
});