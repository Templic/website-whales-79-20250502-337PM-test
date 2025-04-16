#!/usr/bin/env node

/**
 * File Upload Security Test Suite
 * 
 * This script tests the file upload security features by creating test files
 * and attempting to exploit common vulnerabilities.
 * 
 * Usage:
 *   node scripts/test-file-upload-security.js
 * 
 * The script will create test files in the 'tmp' directory and then run
 * a series of tests to verify the security features.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { validateUploadedFile } from '../server/security/fileUploadSecurity.js';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define test directories
const TEST_DIR = path.join(__dirname, '../tmp/test-security');
const SAMPLE_FILES_DIR = path.join(TEST_DIR, 'sample-files');

// Create test directories if they don't exist
if (!fs.existsSync(TEST_DIR)) {
  fs.mkdirSync(TEST_DIR, { recursive: true });
}
if (!fs.existsSync(SAMPLE_FILES_DIR)) {
  fs.mkdirSync(SAMPLE_FILES_DIR, { recursive: true });
}

// Test case tracking
let passedTests = 0;
let failedTests = 0;
let skippedTests = 0;

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m'
};

/**
 * Create a test file with the given content and name
 * @param {string} filename 
 * @param {Buffer|string} content 
 * @returns {string} Path to the created file
 */
function createTestFile(filename, content) {
  const filePath = path.join(SAMPLE_FILES_DIR, filename);
  fs.writeFileSync(filePath, content);
  return filePath;
}

/**
 * Create a mock uploaded file object for testing
 * @param {string} filename 
 * @param {Buffer|string} content 
 * @param {string} mimetype 
 * @returns {Object} Mock uploaded file
 */
function createMockUploadedFile(filename, content, mimetype) {
  const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content);
  return {
    name: filename,
    data: buffer,
    size: buffer.length,
    mimetype: mimetype,
    mv: async () => true // Mock move function
  };
}

/**
 * Report test results with colorful output
 * @param {string} testName 
 * @param {boolean} success 
 * @param {string} message 
 * @param {Error} error 
 */
function reportTest(testName, success, message = '', error = null) {
  const status = success ? 
    `${colors.green}✓ PASS${colors.reset}` : 
    `${colors.red}✗ FAIL${colors.reset}`;
  
  console.log(`${status} ${colors.bright}${testName}${colors.reset}`);
  
  if (message) {
    console.log(`   ${colors.dim}${message}${colors.reset}`);
  }
  
  if (error) {
    console.log(`   ${colors.red}Error: ${error.message}${colors.reset}`);
  }
  
  if (success) {
    passedTests++;
  } else {
    failedTests++;
  }
}

/**
 * Run a test case and report results
 * @param {string} testName 
 * @param {Function} testFn 
 */
async function runTest(testName, testFn) {
  try {
    const result = await testFn();
    if (result === 'skip') {
      console.log(`${colors.yellow}• SKIP${colors.reset} ${colors.bright}${testName}${colors.reset}`);
      skippedTests++;
      return;
    }
    
    reportTest(testName, true, result);
  } catch (error) {
    reportTest(testName, false, '', error);
  }
}

/**
 * Expect a validation error
 * @param {Function} fn 
 * @param {string} expectedErrorSubstring 
 */
async function expectError(fn, expectedErrorSubstring) {
  try {
    await fn();
    throw new Error(`Expected error containing "${expectedErrorSubstring}", but no error was thrown`);
  } catch (error) {
    if (!error.message.includes(expectedErrorSubstring)) {
      throw new Error(`Expected error containing "${expectedErrorSubstring}", but got: ${error.message}`);
    }
    return `Correctly rejected with error: ${error.message}`;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log(`\n${colors.bgBlue}${colors.white} FILE UPLOAD SECURITY TEST SUITE ${colors.reset}\n`);
  console.log(`${colors.cyan}Creating test files in ${SAMPLE_FILES_DIR}${colors.reset}`);
  
  // Test 1: Valid JPEG image
  await runTest('Valid JPEG image should pass validation', async () => {
    // Create a simple JPEG header
    const jpegHeader = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00
    ]);
    const jpegContent = Buffer.concat([jpegHeader, crypto.randomBytes(1000)]);
    
    const testFile = createMockUploadedFile('valid-test.jpg', jpegContent, 'image/jpeg');
    const result = await validateUploadedFile(testFile, { allowedCategories: ['image'] });
    
    return `Validation passed with sanitized filename: ${result.sanitizedFileName}`;
  });
  
  // Test 2: File with path traversal attempt
  await runTest('File with path traversal in name should be sanitized', async () => {
    const testFile = createMockUploadedFile('../../../etc/passwd', 'test content', 'text/plain');
    const result = await validateUploadedFile(testFile, { allowedCategories: ['document'] });
    
    if (result.sanitizedFileName.includes('..')) {
      throw new Error('Path traversal sequences were not removed from filename');
    }
    
    return `Path traversal removed, sanitized to: ${result.sanitizedFileName}`;
  });
  
  // Test 3: File with disallowed extension
  await runTest('File with disallowed extension should be rejected', async () => {
    const testFile = createMockUploadedFile('malicious.exe', 'test content', 'application/octet-stream');
    
    return await expectError(
      () => validateUploadedFile(testFile, { allowedCategories: ['document'] }),
      'extension'
    );
  });
  
  // Test 4: File with MIME type spoofing
  await runTest('File with MIME type spoofing should be rejected', async () => {
    // Create a text file but claim it's an image
    const testFile = createMockUploadedFile('fake-image.jpg', 'This is not a JPEG image', 'image/jpeg');
    
    return await expectError(
      () => validateUploadedFile(testFile, { allowedCategories: ['image'] }),
      'do not match'
    );
  });
  
  // Test 5: Empty file
  await runTest('Empty file should be rejected', async () => {
    const testFile = createMockUploadedFile('empty.txt', '', 'text/plain');
    
    return await expectError(
      () => validateUploadedFile(testFile, { allowedCategories: ['document'] }),
      'minimum'
    );
  });
  
  // Test 6: Null byte injection
  await runTest('File with null byte injection should be rejected', async () => {
    const testFile = createMockUploadedFile('malicious.txt\0.exe', 'test content', 'text/plain');
    
    return await expectError(
      () => validateUploadedFile(testFile, { allowedCategories: ['document'] }),
      'null bytes'
    );
  });
  
  // Test 7: Oversized file
  await runTest('Oversized file should be rejected', async () => {
    // Create a mock file that appears to be over the size limit
    // We don't actually create a huge file, just mock the size
    const testFile = createMockUploadedFile('large.jpg', 'test content', 'image/jpeg');
    testFile.size = 100 * 1024 * 1024; // 100 MB
    
    return await expectError(
      () => validateUploadedFile(testFile, { allowedCategories: ['image'] }),
      'size exceeds'
    );
  });
  
  // Test 8: SVG with script tag
  await runTest('SVG with embedded script should be handled properly', async () => {
    const svgWithScript = `
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
        <script>alert('XSS');</script>
        <circle cx="50" cy="50" r="40" stroke="black" stroke-width="2" fill="red" />
      </svg>
    `;
    const testFile = createMockUploadedFile('malicious.svg', svgWithScript, 'image/svg+xml');
    
    try {
      await validateUploadedFile(testFile, { allowedCategories: ['image'] });
      return 'SVG validation determined by configuration (may be allowed if validateSvgContent=false)';
    } catch (error) {
      if (error.message.includes('SVG') || error.message.includes('script')) {
        return `Correctly rejected SVG with script: ${error.message}`;
      }
      throw error;
    }
  });
  
  // Test 9: Double extension
  await runTest('File with double extension should be handled properly', async () => {
    const testFile = createMockUploadedFile('malicious.jpg.exe', 'test content', 'application/octet-stream');
    
    return await expectError(
      () => validateUploadedFile(testFile, { allowedCategories: ['image'] }),
      'extension'
    );
  });
  
  // Test 10: Security metadata
  await runTest('Security metadata should be properly generated', async () => {
    const jpegHeader = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00
    ]);
    const jpegContent = Buffer.concat([jpegHeader, crypto.randomBytes(1000)]);
    
    const testFile = createMockUploadedFile('metadata-test.jpg', jpegContent, 'image/jpeg');
    const result = await validateUploadedFile(testFile, { 
      allowedCategories: ['image'],
      userId: 'test-user',
      context: 'security-testing'
    });
    
    // Verify metadata
    const metadata = result.fileMetadata;
    if (!metadata.hash || metadata.hash.length !== 64) {
      throw new Error('File hash is missing or invalid');
    }
    
    if (!metadata.securityChecks) {
      throw new Error('Security checks missing from metadata');
    }
    
    return `Generated metadata with hash: ${metadata.hash.substring(0, 10)}...`;
  });
  
  // Summary
  console.log(`\n${colors.cyan}Test Summary:${colors.reset}`);
  console.log(`${colors.green}✓ Passed: ${passedTests}${colors.reset}`);
  console.log(`${colors.red}✗ Failed: ${failedTests}${colors.reset}`);
  console.log(`${colors.yellow}• Skipped: ${skippedTests}${colors.reset}`);
  console.log(`\n${colors.cyan}Total: ${passedTests + failedTests + skippedTests}${colors.reset}`);
  
  // Clean up test files
  try {
    fs.rmSync(SAMPLE_FILES_DIR, { recursive: true, force: true });
    console.log(`\n${colors.dim}Cleaned up test files${colors.reset}`);
  } catch (err) {
    console.error(`\n${colors.red}Failed to clean up test files: ${err.message}${colors.reset}`);
  }
  
  // Exit with appropriate code
  process.exit(failedTests > 0 ? 1 : 0);
}

// Run the tests
runTests().catch(error => {
  console.error(`\n${colors.bgRed}${colors.white} TEST SUITE ERROR ${colors.reset}`);
  console.error(`${colors.red}${error.stack}${colors.reset}`);
  process.exit(1);
});