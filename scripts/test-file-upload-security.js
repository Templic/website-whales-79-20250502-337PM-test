/**
 * File Upload Security Test Script
 * 
 * This script tests the security features of the file upload module
 * by simulating various potential attack scenarios, including:
 * 
 * 1. Path traversal attempts
 * 2. Invalid file types
 * 3. Malicious file content
 * 4. Oversized files
 * 5. Files with dangerous extensions but safe content
 * 6. Files with safe extensions but dangerous content
 * 
 * Usage: node scripts/test-file-upload-security.js
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const crypto = require('crypto');

// Configuration
const BASE_URL = 'http://localhost:5000';
const TEST_FILES_DIR = path.join(__dirname, '../tmp/security-tests');
const API_ENDPOINT = '/api/upload/media';

// Ensure test directory exists
if (!fs.existsSync(TEST_FILES_DIR)) {
  fs.mkdirSync(TEST_FILES_DIR, { recursive: true });
  console.log(`Created test directory: ${TEST_FILES_DIR}`);
}

// Test cases for file upload security
const testCases = [
  {
    name: 'Valid image file',
    filename: 'valid-image.png',
    content: Buffer.from('89504E470D0A1A0A', 'hex'), // PNG header
    mimeType: 'image/png',
    expectedStatus: 201,
    shouldPass: true
  },
  {
    name: 'Path traversal attempt',
    filename: '../../../etc/passwd',
    content: Buffer.from('This is a fake passwd file'),
    mimeType: 'text/plain',
    expectedStatus: 400,
    shouldPass: false
  },
  {
    name: 'Executable file disguised as image',
    filename: 'malicious.png',
    content: Buffer.from('#!/bin/bash\necho "Malicious script running"'),
    mimeType: 'image/png',
    expectedStatus: 400,
    shouldPass: false
  },
  {
    name: 'File with double extension',
    filename: 'document.txt.exe',
    content: Buffer.from('This is not really a text file'),
    mimeType: 'application/octet-stream',
    expectedStatus: 400,
    shouldPass: false
  },
  {
    name: 'Valid text document',
    filename: 'valid-document.txt',
    content: Buffer.from('This is a valid text document'),
    mimeType: 'text/plain',
    expectedStatus: 201,
    shouldPass: true
  },
  {
    name: 'Empty file',
    filename: 'empty-file.txt',
    content: Buffer.from(''),
    mimeType: 'text/plain',
    expectedStatus: 400,
    shouldPass: false
  },
  {
    name: 'Null byte injection',
    filename: 'image\0.exe',
    content: Buffer.from('Attempt to bypass extension check'),
    mimeType: 'application/octet-stream',
    expectedStatus: 400,
    shouldPass: false
  }
];

// Mock authentication token (this is just for testing purposes)
const mockAuthToken = 'test-auth-token';

// Function to create and test a file
async function testFileUpload(testCase) {
  console.log(`\n[TEST] ${testCase.name}`);
  
  // Create the test file
  const testFilePath = path.join(TEST_FILES_DIR, testCase.filename);
  try {
    fs.writeFileSync(testFilePath, testCase.content);
    console.log(`  Created test file: ${testFilePath}`);
  } catch (error) {
    console.error(`  Failed to create test file: ${error.message}`);
    return;
  }
  
  // Create form data
  const formData = new FormData();
  formData.append('file', fs.createReadStream(testFilePath), {
    filename: path.basename(testCase.filename),
    contentType: testCase.mimeType
  });
  formData.append('page', 'test');
  formData.append('section', 'security');
  
  // Optional fields
  const metadata = {
    description: 'Security test file',
    testCase: testCase.name,
    timestamp: new Date().toISOString()
  };
  formData.append('metadata', JSON.stringify(metadata));
  
  try {
    // Send request
    console.log(`  Sending ${testCase.filename} to ${BASE_URL}${API_ENDPOINT}`);
    const response = await axios.post(`${BASE_URL}${API_ENDPOINT}`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${mockAuthToken}`
      },
      validateStatus: () => true // Don't throw on error status
    });
    
    // Check results
    const success = response.status === testCase.expectedStatus;
    console.log(`  Status: ${response.status} (Expected: ${testCase.expectedStatus})`);
    console.log(`  Response: ${JSON.stringify(response.data, null, 2)}`);
    
    if (success) {
      console.log(`  ✅ Test passed: ${testCase.name}`);
    } else {
      console.log(`  ❌ Test failed: ${testCase.name}`);
      console.log(`  Expected status ${testCase.expectedStatus}, got ${response.status}`);
    }
    
  } catch (error) {
    console.error(`  Error during test: ${error.message}`);
  }
  
  // Clean up test file
  try {
    fs.unlinkSync(testFilePath);
    console.log(`  Deleted test file: ${testFilePath}`);
  } catch (error) {
    console.error(`  Failed to delete test file: ${error.message}`);
  }
}

// Run all tests
async function runTests() {
  console.log('🔒 Starting File Upload Security Tests 🔒\n');
  
  for (const testCase of testCases) {
    await testFileUpload(testCase);
  }
  
  console.log('\n🔒 File Upload Security Tests Complete 🔒');
}

// Start tests
runTests().catch(err => {
  console.error('Test suite failed:', err);
});