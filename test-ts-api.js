/**
 * Simple TypeScript Errors API Test Script
 * 
 * This script directly calls the TypeScript Errors API endpoints 
 * using the local workflow server.
 */

import express from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const PORT = 3000; // Default port for the application in workflow

// Make requests to the running server via curl
async function testEndpoints() {
  try {
    console.log('Testing TypeScript Errors API...\n');
    
    // Test the test endpoint
    console.log('1. Testing the /test endpoint:');
    const testResult = await execAsync(`curl -s http://localhost:${PORT}/api/admin/typescript-errors/test`);
    console.log(testResult.stdout);
    console.log('');
    
    // Test creating a new scan
    console.log('2. Testing POST /scans endpoint:');
    const createScanResult = await execAsync(`curl -s -X POST http://localhost:${PORT}/api/admin/typescript-errors/scans -H "Content-Type: application/json" -d '{"aiEnabled":true}'`);
    console.log(createScanResult.stdout);
    
    console.log('\nAll tests complete!');
  } catch (error) {
    console.error('Error running tests:', error.message);
    if (error.stderr) {
      console.error('Error output:', error.stderr);
    }
    
    // Try a simple curl to check if the server is running
    try {
      console.log('\nChecking if server is accessible:');
      const checkResult = await execAsync('curl -s http://localhost:3000');
      console.log('Server is running, received response');
    } catch (e) {
      console.error('Server not accessible on port 3000');
    }
  }
}

// Run the tests
testEndpoints();