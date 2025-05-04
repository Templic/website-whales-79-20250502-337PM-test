/**
 * Rate Limiting Direct Test Script
 * 
 * This script tests the rate limiting functionality through a dedicated bypass endpoint
 * that we'll add to the server for testing purposes.
 */

// We'll use the built-in http module to avoid node-fetch CSRF issues
import http from 'http';
import https from 'https';
import { URL } from 'url';

// Configuration
const BASE_URL = 'http://localhost:5000';
const NO_CSRF_ENDPOINT = '/no-csrf/rate-limit-test';

// Function to make a request using the built-in http module
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    // Parse the URL to determine if we need http or https
    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === 'https:';
    const requester = isHttps ? https : http;
    
    // Set default options
    const requestOptions = {
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: options.timeout || 5000
    };
    
    // Create the request
    const req = requester.request(url, requestOptions, (res) => {
      let data = '';
      
      // Log rate limit headers if present
      const rateLimit = res.headers['x-ratelimit-limit'];
      const rateRemaining = res.headers['x-ratelimit-remaining'];
      const rateReset = res.headers['x-ratelimit-reset'];
      
      if (rateLimit) {
        console.log(`Rate limit headers: ${rateRemaining}/${rateLimit} tokens remaining, reset in ${rateReset}s`);
      }
      
      // Collect the response data
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      // Process the complete response
      res.on('end', () => {
        let parsedData;
        try {
          // Try to parse as JSON
          parsedData = JSON.parse(data);
        } catch (e) {
          // If not JSON, return as text with a snippet
          parsedData = { text: data.substring(0, 150) + (data.length > 150 ? '...' : '') };
        }
        
        resolve({
          status: res.statusCode,
          statusText: res.statusMessage,
          headers: res.headers,
          data: parsedData
        });
      });
    });
    
    // Handle request errors
    req.on('error', (error) => {
      reject(error);
    });
    
    // Handle timeout
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timeout after ${requestOptions.timeout}ms`));
    });
    
    // End the request (send it)
    req.end();
  });
}

// Function to run a basic rate limit test
async function runBasicTest(count = 10) {
  console.log(`\n=== Running Basic Test (${count} requests) ===`);
  
  const results = [];
  for (let i = 0; i < count; i++) {
    console.log(`Making request ${i + 1}/${count}...`);
    try {
      const result = await makeRequest(`${BASE_URL}${NO_CSRF_ENDPOINT}/basic`);
      results.push(result);
      console.log(`Status: ${result.status} ${result.statusText}`);
      console.log(`Response:`, result.data);
    } catch (error) {
      console.error(`Error:`, error.message);
      results.push({ error: error.message });
    }
    
    // Short delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}

// Function to run a high-cost rate limit test
async function runHighCostTest(count = 5) {
  console.log(`\n=== Running High-Cost Test (${count} requests) ===`);
  
  const results = [];
  for (let i = 0; i < count; i++) {
    console.log(`Making request ${i + 1}/${count}...`);
    try {
      const result = await makeRequest(`${BASE_URL}${NO_CSRF_ENDPOINT}/high-cost`);
      results.push(result);
      console.log(`Status: ${result.status} ${result.statusText}`);
      console.log(`Response:`, result.data);
    } catch (error) {
      console.error(`Error:`, error.message);
      results.push({ error: error.message });
    }
    
    // Short delay between requests
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  return results;
}

// Function to run rate limit stats test
async function getStats() {
  console.log('\n=== Getting Rate Limit Stats ===');
  
  try {
    const result = await makeRequest(`${BASE_URL}${NO_CSRF_ENDPOINT}/stats`);
    console.log(`Status: ${result.status} ${result.statusText}`);
    console.log(`Response:`, result.data);
    return result;
  } catch (error) {
    console.error(`Error:`, error.message);
    return { error: error.message };
  }
}

// Function to simulate security failure
async function simulateSecurityFailure() {
  console.log('\n=== Simulating Security Failure ===');
  
  try {
    const result = await makeRequest(`${BASE_URL}${NO_CSRF_ENDPOINT}/simulate-security-failure`);
    console.log(`Status: ${result.status} ${result.statusText}`);
    console.log(`Response:`, result.data);
    return result;
  } catch (error) {
    console.error(`Error:`, error.message);
    return { error: error.message };
  }
}

// Function to simulate security success
async function simulateSecuritySuccess() {
  console.log('\n=== Simulating Security Success ===');
  
  try {
    const result = await makeRequest(`${BASE_URL}${NO_CSRF_ENDPOINT}/simulate-security-success`);
    console.log(`Status: ${result.status} ${result.statusText}`);
    console.log(`Response:`, result.data);
    return result;
  } catch (error) {
    console.error(`Error:`, error.message);
    return { error: error.message };
  }
}

// Function to run an exhaustion test 
async function runExhaustionTest(count = 50) {
  console.log(`\n=== Running Exhaustion Test (${count} requests) ===`);
  
  const results = [];
  let limitTriggered = false;
  
  for (let i = 0; i < count; i++) {
    process.stdout.write(`Making request ${i + 1}/${count}... `);
    
    try {
      const result = await makeRequest(`${BASE_URL}${NO_CSRF_ENDPOINT}/basic`);
      results.push(result);
      
      // Check if rate limiting was triggered
      if (result.status === 429) {
        console.log('RATE LIMITED!');
        limitTriggered = true;
        break;
      } else {
        console.log('OK');
      }
    } catch (error) {
      console.error(`Error:`, error.message);
      results.push({ error: error.message });
      // Don't break the loop on error
    }
    
    // No delay between requests to try to trigger rate limiting
  }
  
  console.log(`Exhaustion test ${limitTriggered ? 'successfully triggered' : 'did not trigger'} rate limiting`);
  return results;
}

// Main function
async function main() {
  console.log('Starting rate limiting direct test script...');
  
  console.log('Note: This script bypasses CSRF protection by using dedicated testing endpoints.');
  
  // Get initial stats
  await getStats();
  
  // Run basic test
  await runBasicTest(5);
  
  // Check stats
  await getStats();
  
  // Run high-cost test
  await runHighCostTest(3);
  
  // Check stats
  await getStats();
  
  // Simulate security failure
  await simulateSecurityFailure();
  
  // Check stats
  await getStats();
  
  // Simulate security success
  await simulateSecuritySuccess();
  
  // Check stats
  await getStats();
  
  // Run exhaustion test
  await runExhaustionTest(30);
  
  console.log('\nTests completed!');
}

// Run the main function
main().catch(error => {
  console.error('Error in test script:', error);
});