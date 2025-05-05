/**
 * TypeScript Errors API Test Script with Replit URL
 * 
 * This script tests the TypeScript Errors API endpoints using the actual
 * Replit workspace URL instead of localhost.
 */

import fetch from 'node-fetch';

// Use the actual Replit URL
const BASE_URL = 'https://8ed483e0-e2dc-4449-acfe-896222200adc-00-1js0bl54rwwna.janeway.replit.dev';

// Test endpoints
const TEST_ENDPOINT = `${BASE_URL}/api/admin/typescript-errors/test`;
const SCANS_ENDPOINT = `${BASE_URL}/api/admin/typescript-errors/scans`;

// Perform tests
async function runTests() {
  try {
    console.log('Testing TypeScript Errors API using Replit URL...\n');

    // Test the basic test endpoint
    console.log('1. Testing the /test endpoint:');
    const testResponse = await fetch(TEST_ENDPOINT);
    
    console.log(`Status: ${testResponse.status}`);
    
    if (!testResponse.ok) {
      console.log('Response:', await testResponse.text());
    } else {
      const testData = await testResponse.json();
      console.log('Response:', JSON.stringify(testData, null, 2));
    }
    
    // Test the scans POST endpoint
    console.log('\n2. Testing the POST /scans endpoint:');
    const createScanResponse = await fetch(SCANS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        aiEnabled: true
      })
    });
    
    console.log(`Status: ${createScanResponse.status}`);
    
    if (!createScanResponse.ok) {
      console.log('Response:', await createScanResponse.text());
    } else {
      const createScanData = await createScanResponse.json();
      console.log('Response:', JSON.stringify(createScanData, null, 2));
    }

    console.log('\nAll tests complete!');
  } catch (error) {
    console.error('Error running tests:', error.message);
  }
}

// Run the tests
runTests();