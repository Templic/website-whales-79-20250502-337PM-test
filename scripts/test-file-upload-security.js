#!/usr/bin/env node

/**
 * File Upload Security Test Suite
 * 
 * This script tests the security features of the file upload system by attempting
 * various attack vectors and verifying that the security controls work as expected.
 * 
 * Usage:
 *   node scripts/test-file-upload-security.js
 * 
 * The script will generate test files and attempt to upload them to test endpoints.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import { execSync } from 'child_process';
import crypto from 'crypto';
import axios from 'axios';
import FormData from 'form-data';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m'
};

// Configuration
const config = {
  baseUrl: 'http://localhost:3000',
  uploadEndpoint: '/api/upload',
  testFilesDir: './tmp/test-files',
  maxTimeoutMs: 30000, // 30 seconds
  verbose: true
};

// Test results tracking
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0
};

/**
 * Create test directory if it doesn't exist
 */
function ensureTestDirectory() {
  if (!fs.existsSync(config.testFilesDir)) {
    fs.mkdirSync(config.testFilesDir, { recursive: true });
    console.log(`${colors.yellow}Created test directory: ${config.testFilesDir}${colors.reset}`);
  }
}

/**
 * Generate a random string
 * @param {number} length Length of the string
 * @returns {string} Random string
 */
function randomString(length = 10) {
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
}

/**
 * Create a test file with the given content and extension
 * @param {string} content Content to write to the file
 * @param {string} extension File extension (without dot)
 * @returns {string} Path to the created file
 */
function createTestFile(content, extension) {
  const fileName = `test-${randomString(8)}.${extension}`;
  const filePath = path.join(config.testFilesDir, fileName);
  
  fs.writeFileSync(filePath, content);
  return filePath;
}

/**
 * Create a test image file
 * @param {string} extension File extension (without dot)
 * @returns {string} Path to the created file
 */
function createTestImage(extension = 'png') {
  const filePath = path.join(config.testFilesDir, `test-image-${randomString(8)}.${extension}`);
  
  // Create a small PNG image (1x1 transparent pixel)
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
    0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
  ]);
  
  fs.writeFileSync(filePath, pngHeader);
  return filePath;
}

/**
 * Create a test file with malicious content
 * @param {string} extension File extension (without dot)
 * @returns {string} Path to the created file
 */
function createMaliciousFile(extension) {
  const fileName = `malicious-${randomString(8)}.${extension}`;
  const filePath = path.join(config.testFilesDir, fileName);
  
  // Create a "malicious" file (simulated malware signature)
  const maliciousContent = `
X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*
<?php echo "Malicious PHP code"; ?>
<script>alert('XSS Attack');</script>
function() { rm -rf / }
  `;
  
  fs.writeFileSync(filePath, maliciousContent);
  return filePath;
}

/**
 * Create a test file with spoofed MIME type
 * @param {string} declaredExtension File extension to declare (without dot)
 * @param {string} actualContent Content to write to the file
 * @returns {string} Path to the created file
 */
function createSpoofedFile(declaredExtension, actualContent) {
  const fileName = `spoof-${randomString(8)}.${declaredExtension}`;
  const filePath = path.join(config.testFilesDir, fileName);
  
  fs.writeFileSync(filePath, actualContent);
  return filePath;
}

/**
 * Create a test file attempting path traversal
 * @returns {string} Path to the created file
 */
function createPathTraversalFile() {
  // Use various path traversal techniques in filename
  const traversalPatterns = [
    '../../../etc/passwd',
    '..%2F..%2F..%2Fetc%2Fpasswd',
    '....//....//etc/passwd',
    '..\\..\\windows\\system32\\config\\SAM',
    '%2e%2e%2fetc%2fpasswd',
    '..%c0%af..%c0%af..%c0%afetc%c0%afpasswd',
    '..%252f..%252f..%252fetc%252fpasswd',
    'file.txt/../../etc/passwd',
    '%00../../etc/passwd',
    '../../../etc/passwd%00.png'
  ];
  
  const pattern = traversalPatterns[Math.floor(Math.random() * traversalPatterns.length)];
  const fileName = `${pattern}-${randomString(4)}.txt`;
  const filePath = path.join(config.testFilesDir, 'traversal-test.txt');
  
  fs.writeFileSync(filePath, 'Path traversal test content');
  
  // Return both the actual path and the malicious filename to use
  return { 
    path: filePath,
    maliciousName: fileName
  };
}

/**
 * Create a test file with null byte injection
 * @returns {string} Path to the created file
 */
function createNullByteFile() {
  const fileName = `nullbyte-${randomString(8)}.txt%00.jpg`;
  const filePath = path.join(config.testFilesDir, 'nullbyte-test.txt');
  
  fs.writeFileSync(filePath, 'Null byte injection test content');
  
  return { 
    path: filePath,
    maliciousName: fileName
  };
}

/**
 * Create a test file that's extremely large
 * @param {number} sizeMB Size in megabytes
 * @returns {string} Path to the created file
 */
function createLargeFile(sizeMB = 20) {
  const fileName = `large-${randomString(8)}.dat`;
  const filePath = path.join(config.testFilesDir, fileName);
  
  // Create a file of specified size
  const sizeBytes = sizeMB * 1024 * 1024;
  const chunkSize = 1024 * 1024; // 1MB chunks
  
  const fd = fs.openSync(filePath, 'w');
  const buffer = Buffer.alloc(chunkSize, 'A');
  
  const chunks = Math.floor(sizeBytes / chunkSize);
  for (let i = 0; i < chunks; i++) {
    fs.writeSync(fd, buffer, 0, buffer.length);
  }
  
  // Write any remainder
  const remainder = sizeBytes % chunkSize;
  if (remainder > 0) {
    fs.writeSync(fd, buffer, 0, remainder);
  }
  
  fs.closeSync(fd);
  return filePath;
}

/**
 * Run a single test case
 * @param {string} testName Name of the test
 * @param {Function} testFn Test function
 */
async function runTest(testName, testFn) {
  results.total++;
  
  console.log(`\n${colors.bright}Running test: ${testName}${colors.reset}`);
  
  try {
    const result = await Promise.race([
      testFn(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Test timed out')), config.maxTimeoutMs)
      )
    ]);
    
    if (result.success) {
      results.passed++;
      console.log(`${colors.green}✓ PASS: ${testName}${colors.reset}`);
      if (result.message && config.verbose) {
        console.log(`  ${result.message}`);
      }
    } else {
      results.failed++;
      console.log(`${colors.red}✗ FAIL: ${testName}${colors.reset}`);
      if (result.message) {
        console.log(`  ${result.message}`);
      }
      if (result.error) {
        console.log(`  ${colors.red}Error: ${result.error}${colors.reset}`);
      }
    }
  } catch (error) {
    results.failed++;
    console.log(`${colors.red}✗ ERROR: ${testName}${colors.reset}`);
    console.log(`  ${colors.red}${error.message}${colors.reset}`);
    if (config.verbose && error.stack) {
      console.log(`  ${colors.dim}${error.stack}${colors.reset}`);
    }
  }
}

/**
 * Attempt to upload a file to the test endpoint
 * @param {string} filePath Path to the file to upload
 * @param {Object} options Upload options
 * @returns {Promise<Object>} Upload result
 */
async function uploadFile(filePath, options = {}) {
  const { 
    fieldName = 'file',
    fileName = path.basename(filePath),
    contentType,
    expectSuccess = true
  } = options;
  
  const form = new FormData();
  
  // Read the file
  const fileContent = fs.readFileSync(filePath);
  
  // Add the file to the form
  form.append(fieldName, fileContent, {
    filename: fileName,
    contentType
  });
  
  try {
    const response = await axios.post(
      `${config.baseUrl}${config.uploadEndpoint}`,
      form,
      {
        headers: {
          ...form.getHeaders(),
        },
        validateStatus: () => true // Don't throw on error status codes
      }
    );
    
    const isSuccess = response.status >= 200 && response.status < 300;
    
    if (config.verbose) {
      console.log(`  Status: ${response.status}`);
      console.log(`  Response: ${JSON.stringify(response.data, null, 2)}`);
    }
    
    if (expectSuccess && isSuccess) {
      return {
        success: true,
        message: `File uploaded successfully: ${fileName}`,
        response: response.data
      };
    } else if (!expectSuccess && !isSuccess) {
      return {
        success: true,
        message: `File was correctly rejected: ${fileName}`,
        response: response.data
      };
    } else if (expectSuccess && !isSuccess) {
      return {
        success: false,
        message: `File should have been accepted but was rejected: ${fileName}`,
        error: response.data.error || 'Unknown error',
        response: response.data
      };
    } else {
      return {
        success: false,
        message: `File should have been rejected but was accepted: ${fileName}`,
        response: response.data
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Error uploading file: ${fileName}`,
      error: error.message
    };
  }
}

/**
 * Define test cases
 */
const testCases = [
  {
    name: 'Valid Image Upload (PNG)',
    run: async () => {
      const filePath = createTestImage('png');
      return await uploadFile(filePath, { expectSuccess: true });
    }
  },
  {
    name: 'Valid Text File Upload',
    run: async () => {
      const filePath = createTestFile('This is a valid text file content.', 'txt');
      return await uploadFile(filePath, { expectSuccess: true });
    }
  },
  {
    name: 'Invalid File Type Rejection',
    run: async () => {
      const filePath = createTestFile('<?php phpinfo(); ?>', 'php');
      return await uploadFile(filePath, { expectSuccess: false });
    }
  },
  {
    name: 'MIME Type Spoofing Detection',
    run: async () => {
      // Create a PHP file disguised as a JPEG
      const phpCode = '<?php system($_GET["cmd"]); ?>';
      const filePath = createSpoofedFile('jpg', phpCode);
      return await uploadFile(filePath, { 
        contentType: 'image/jpeg',
        expectSuccess: false
      });
    }
  },
  {
    name: 'Malicious Content Detection',
    run: async () => {
      const filePath = createMaliciousFile('docx');
      return await uploadFile(filePath, { expectSuccess: false });
    }
  },
  {
    name: 'Path Traversal Prevention',
    run: async () => {
      const { path: filePath, maliciousName } = createPathTraversalFile();
      return await uploadFile(filePath, {
        fileName: maliciousName,
        expectSuccess: false
      });
    }
  },
  {
    name: 'Null Byte Injection Prevention',
    run: async () => {
      const { path: filePath, maliciousName } = createNullByteFile();
      return await uploadFile(filePath, {
        fileName: maliciousName,
        expectSuccess: false
      });
    }
  },
  {
    name: 'Large File Size Limit',
    run: async () => {
      const filePath = createLargeFile(30); // 30MB
      return await uploadFile(filePath, { expectSuccess: false });
    }
  },
  {
    name: 'Empty File Detection',
    run: async () => {
      const filePath = createTestFile('', 'txt');
      return await uploadFile(filePath, { expectSuccess: false });
    }
  },
  {
    name: 'Multiple Extension Detection',
    run: async () => {
      const filePath = createTestFile('Hello world', 'txt');
      return await uploadFile(filePath, {
        fileName: 'test.php.jpg',
        expectSuccess: false
      });
    }
  }
];

/**
 * Run all tests
 */
async function runAllTests() {
  console.log(`\n${colors.bgBlue}${colors.white} FILE UPLOAD SECURITY TEST SUITE ${colors.reset}\n`);
  console.log(`${colors.cyan}Testing file upload security features...${colors.reset}\n`);
  
  ensureTestDirectory();
  
  // Check if server is running
  try {
    await axios.get(config.baseUrl);
  } catch (error) {
    console.error(`${colors.red}Error: Server not running at ${config.baseUrl}${colors.reset}`);
    console.error(`${colors.yellow}Please start the server before running this test suite.${colors.reset}`);
    process.exit(1);
  }
  
  for (const testCase of testCases) {
    await runTest(testCase.name, testCase.run);
  }
  
  // Print summary
  console.log(`\n${colors.cyan}Test Summary:${colors.reset}`);
  console.log(`${colors.green}✓ Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}✗ Failed: ${results.failed}${colors.reset}`);
  console.log(`${colors.yellow}- Skipped: ${results.skipped}${colors.reset}`);
  console.log(`${colors.cyan}Total: ${results.total}${colors.reset}`);
  
  // Calculate percentage
  const passPercentage = Math.round((results.passed / results.total) * 100);
  
  if (passPercentage === 100) {
    console.log(`\n${colors.bgGreen}${colors.white} All tests passed! ${passPercentage}% success rate ${colors.reset}`);
  } else if (passPercentage >= 80) {
    console.log(`\n${colors.bgYellow}${colors.black} ${passPercentage}% of tests passed ${colors.reset}`);
  } else {
    console.log(`\n${colors.bgRed}${colors.white} Only ${passPercentage}% of tests passed ${colors.reset}`);
  }
  
  // Cleanup
  console.log(`\n${colors.yellow}Cleaning up test files...${colors.reset}`);
  try {
    fs.rmSync(config.testFilesDir, { recursive: true, force: true });
    console.log(`${colors.green}Test files removed.${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Error removing test files: ${error.message}${colors.reset}`);
  }
  
  return results.failed === 0;
}

// Run the test suite
runAllTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error(`${colors.bgRed}${colors.white} TEST SUITE ERROR ${colors.reset}`);
  console.error(`${colors.red}${error.stack}${colors.reset}`);
  process.exit(1);
});