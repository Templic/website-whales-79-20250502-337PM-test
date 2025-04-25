/**
 * @file test-api.js
 * @description Test script for the TypeScript error management API
 */

import fs from 'fs';
import path from 'path';
import http from 'http';

// Configuration
const API_HOST = 'localhost';
const API_PORT = 5000;
const API_BASE_PATH = '/api/typescript/public';

// Helper function to make API requests
function makeRequest(endpoint, method, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: `${API_BASE_PATH}${endpoint}`,
      method: method || 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    console.log(`Making ${method} request to ${options.path}`);
    
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          console.log(`Response received with status code: ${res.statusCode}`);
          const jsonResponse = JSON.parse(responseData);
          resolve({ statusCode: res.statusCode, data: jsonResponse });
        } catch (error) {
          resolve({ statusCode: res.statusCode, data: responseData });
        }
      });
    });
    
    req.on('error', (error) => {
      console.error(`Request error: ${error.message}`);
      reject(error);
    });
    
    if (data) {
      console.log(`Request payload: ${JSON.stringify(data)}`);
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test the TypeScript error management API
async function testApi() {
  try {
    console.log('=== TypeScript Error Management API Test ===\n');
    
    // Test 1: Getting project status (simple validation check)
    console.log('1. Testing server status...');
    const statusResponse = await makeRequest('/status', 'POST', {
      projectRoot: process.cwd()
    });
    
    console.log(`Status Code: ${statusResponse.statusCode}`);
    console.log('Response:', JSON.stringify(statusResponse.data, null, 2));
    
    console.log('\n=== API Test Complete ===');
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

// Run the test
testApi().catch(console.error);