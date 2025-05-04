/**
 * Test script to verify authentication only
 * No OpenAI API calls to save time
 */

import axios from 'axios';

async function getAuthToken() {
  try {
    const apiUrl = 'http://localhost:5000';
    console.log(`Getting auth token from ${apiUrl}/api/csrf-token`);
    
    // First get a CSRF token
    const csrfResponse = await axios.get(`${apiUrl}/api/csrf-token`);
    const csrfToken = csrfResponse.data.csrfToken;
    
    console.log(`Got CSRF token: ${csrfToken.substring(0, 10)}...`);
    
    // Use the CSRF token and test auth for authenticated requests
    const headers = {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
      'X-Test-Auth': 'test-security-analysis-secret-key'
    };
    
    return { csrfToken, headers };
  } catch (error) {
    console.error('Error getting auth token:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response:', error.response.data);
    } else {
      console.error(error.message);
    }
    throw error;
  }
}

async function testSecuredEndpoint() {
  try {
    const apiUrl = 'http://localhost:5000';
    console.log(`Testing secured endpoint on ${apiUrl}...\n`);
    
    // Get authentication token
    const auth = await getAuthToken();
    console.log('Successfully obtained auth token, testing secured endpoint...');
    
    // Make the request to the secured endpoint
    const response = await axios.post(
      `${apiUrl}/api/openai/security-analysis`, 
      {
        content: 'console.log("Hello world");',
        contentType: 'code',
        context: 'Just a simple test to check authentication bypass'
      },
      { 
        headers: auth.headers,
        withCredentials: true
      }
    );
    
    console.log('Successfully accessed secured endpoint!');
    console.log(`Status: ${response.status}`);
    console.log('Response exists:', response.data ? 'Yes' : 'No');
    
  } catch (error) {
    console.error('Error accessing secured endpoint:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response:', error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

// Run the test
testSecuredEndpoint();