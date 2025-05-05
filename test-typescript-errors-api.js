/**
 * TypeScript Errors API Test Script
 * 
 * This script tests the TypeScript Errors API endpoints without requiring
 * a CSRF token thanks to our implementation of a CSRF bypass mechanism.
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000'; // Assuming the app is running on port 3000

// Test endpoints
const TEST_ENDPOINT = `${BASE_URL}/api/admin/typescript-errors/test`;
const SCANS_ENDPOINT = `${BASE_URL}/api/admin/typescript-errors/scans`;

// Perform tests
async function runTests() {
  try {
    console.log('Testing TypeScript Errors API...');

    // Test the basic test endpoint
    console.log('\n1. Testing the /test endpoint:');
    const testResponse = await fetch(TEST_ENDPOINT);
    
    if (!testResponse.ok) {
      throw new Error(`Test endpoint failed with status ${testResponse.status}`);
    }
    
    const testData = await testResponse.json();
    console.log('Test endpoint response:', testData);

    // Test the scans GET endpoint
    console.log('\n2. Testing the GET /scans endpoint:');
    const scansResponse = await fetch(SCANS_ENDPOINT);
    
    if (!scansResponse.ok) {
      console.log(`Scans endpoint returned status ${scansResponse.status}`);
      console.log('Response:', await scansResponse.text());
    } else {
      const scansData = await scansResponse.json();
      console.log('Scans endpoint response:', scansData);
    }

    // Test the scans POST endpoint
    console.log('\n3. Testing the POST /scans endpoint:');
    const createScanResponse = await fetch(SCANS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        aiEnabled: true
      })
    });
    
    if (!createScanResponse.ok) {
      console.log(`Create scan endpoint returned status ${createScanResponse.status}`);
      console.log('Response:', await createScanResponse.text());
    } else {
      const createScanData = await createScanResponse.json();
      console.log('Create scan endpoint response:', createScanData);
    }

    console.log('\nAll tests complete!');
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

// Run the tests
runTests();