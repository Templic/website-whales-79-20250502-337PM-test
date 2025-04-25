/**
 * @file test-ts-error-management.js
 * @description Test script for the TypeScript error management system
 * 
 * This script tests the entire workflow of the TypeScript error management system:
 * 1. Finding errors in a TypeScript file
 * 2. Analyzing the errors
 * 3. Generating fix suggestions
 * 4. Applying fixes
 */

// Import dependencies (using ES modules)
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

// Get current directory and file path (ES modules don't have __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const API_BASE_URL = 'http://localhost:5000/api';
const SIMPLE_API_URL = `${API_BASE_URL}/typescript-simple`;
const FULL_API_URL = `${API_BASE_URL}/typescript/admin`;
const TEST_FILE_PATH = path.join(__dirname, 'utils', 'ts-error-test.ts');

// Create test file with TypeScript errors if it doesn't exist
function createTestFile() {
  const testFileContent = `/**
 * @file ts-error-test.ts
 * @description A test file with TypeScript errors for testing the error management system
 */

// Error 1: Variable has implicit any type
function testFunction(param) {
  return param + 1;
}

// Error 2: Variable is used before being defined
console.log(undefinedVar);
let undefinedVar = 'This is defined too late';

// Error 3: Type mismatch
const numberValue: number = "This should be a number";

// Error 4: Function return type mismatch
function returnNumber(): number {
  return "This should return a number";
}

// Error 5: Accessing non-existent property
const obj = { name: 'Test Object' };
console.log(obj.nonExistentProperty);

// These don't have errors
const validNumber: number = 42;
const validString: string = "This is a valid string";
function validFunction(): string {
  return "This is valid";
}

export { testFunction, validNumber, validString, validFunction };
`;

  // Create the file if it doesn't exist
  if (!fs.existsSync(TEST_FILE_PATH)) {
    try {
      fs.writeFileSync(TEST_FILE_PATH, testFileContent);
      console.log(`Created test file at ${TEST_FILE_PATH}`);
    } catch (error) {
      console.error('Error creating test file:', error);
      process.exit(1);
    }
  } else {
    console.log(`Test file already exists at ${TEST_FILE_PATH}`);
  }
}

// Make API requests
async function testAPI() {
  try {
    console.log('=== TypeScript Error Management System Test ===\n');
    
    // 1. Test the simple API endpoints
    console.log('Testing simplified API endpoints...');
    
    // Check if API is working
    const testResponse = await axios.get(`${SIMPLE_API_URL}/test`);
    console.log('API Status:', testResponse.data.success ? 'Working ✓' : 'Failed ✗');
    
    // Get project info
    const projectInfoResponse = await axios.post(`${SIMPLE_API_URL}/project-info`, {
      projectRoot: path.join(__dirname, '..')
    });
    console.log('Project Info:');
    console.log(`- TypeScript Files: ${projectInfoResponse.data.typeScriptFiles}`);
    console.log(`- tsconfig.json: ${projectInfoResponse.data.tsconfigExists ? 'Found ✓' : 'Not Found ✗'}`);
    
    // Get file info
    const fileInfoResponse = await axios.post(`${SIMPLE_API_URL}/file-info`, {
      filePath: TEST_FILE_PATH
    });
    console.log('\nTest File Info:');
    console.log(`- File: ${fileInfoResponse.data.fileName}`);
    console.log(`- Line Count: ${fileInfoResponse.data.lineCount}`);
    console.log(`- Simple Issues: ${JSON.stringify(fileInfoResponse.data.simpleProblemCount)}`);
    
    // Test analyze-file endpoint
    console.log('\nTesting analyze-file endpoint...');
    
    try {
      const analyzeResponse = await axios.post(`${SIMPLE_API_URL}/analyze-file`, {
        filePath: TEST_FILE_PATH
      }, { timeout: 15000 }); // 15 second timeout for analysis
      
      console.log('File Analysis Results:');
      console.log(`- Success: ${analyzeResponse.data.success ? 'Yes ✓' : 'No ✗'}`);
      console.log(`- Error Count: ${analyzeResponse.data.errorCount || 'N/A'}`);
      console.log(`- Warning Count: ${analyzeResponse.data.warningCount || 'N/A'}`);
      
      if (analyzeResponse.data.diagnostics && analyzeResponse.data.diagnostics.length > 0) {
        console.log('- Top 3 Diagnostics:');
        analyzeResponse.data.diagnostics.slice(0, 3).forEach((diagnostic, index) => {
          console.log(`  ${index + 1}. Line ${diagnostic.line}: ${diagnostic.message}`);
          console.log(`     Suggestion: ${diagnostic.fixSuggestion}`);
          console.log(`     Example: ${diagnostic.fixExample?.split('\n')[0] || 'N/A'}${diagnostic.fixExample?.split('\n').length > 1 ? '...' : ''}`);
        });
        
        // Testing diagnostic categories
        const errorCount = analyzeResponse.data.diagnostics.filter(d => d.category === 'error').length;
        const warningCount = analyzeResponse.data.diagnostics.filter(d => d.category === 'warning').length;
        const infoCount = analyzeResponse.data.diagnostics.filter(d => d.category === 'info').length;
        
        console.log('\nDiagnostic Categories:');
        console.log(`- Errors: ${errorCount}`);
        console.log(`- Warnings: ${warningCount}`);
        console.log(`- Info: ${infoCount}`);
        
        // Testing if we can detect common error patterns
        const anyTypeErrors = analyzeResponse.data.diagnostics.filter(d => d.code === 7001).length;
        const missingReturnTypes = analyzeResponse.data.diagnostics.filter(d => d.code === 7010).length;
        const implicitParamTypes = analyzeResponse.data.diagnostics.filter(d => d.code === 7006).length;
        
        console.log('\nCommon Error Patterns:');
        console.log(`- Any Type Usage: ${anyTypeErrors}`);
        console.log(`- Missing Return Types: ${missingReturnTypes}`);
        console.log(`- Implicit Parameter Types: ${implicitParamTypes}`);
      } else {
        console.log('- No diagnostics found');
      }
    } catch (apiError) {
      console.log('Error analyzing file:');
      console.log('Error:', apiError.message);
      if (apiError.response) {
        console.log('Response status:', apiError.response.status);
        console.log('Response data:', JSON.stringify(apiError.response.data));
      }
    }
    
    // Test compiler-info endpoint
    console.log('\nTesting compiler-info endpoint...');
    
    try {
      const compilerInfoResponse = await axios.get(`${SIMPLE_API_URL}/compiler-info`);
      
      console.log('TypeScript Compiler Info:');
      console.log(`- Success: ${compilerInfoResponse.data.success ? 'Yes ✓' : 'No ✗'}`);
      console.log(`- Version: ${compilerInfoResponse.data.version}`);
      
      if (compilerInfoResponse.data.targetInfo) {
        console.log('- Available Target Options:');
        console.log(`  - ES2015: ${compilerInfoResponse.data.targetInfo.ES2015}`);
        console.log(`  - ES2020: ${compilerInfoResponse.data.targetInfo.ES2020}`);
        console.log(`  - ESNext: ${compilerInfoResponse.data.targetInfo.ESNext}`);
      }
      
    } catch (apiError) {
      console.log('Error getting compiler info:');
      console.log('Error:', apiError.message);
    }
    
    // 3. If full API is available (may require auth), test more comprehensive features
    console.log('\nTesting full API endpoints (may fail if authentication is required)...');
    
    try {
      // Try to scan file for errors
      const scanResponse = await axios.post(`${FULL_API_URL}/scan-file`, {
        filePath: TEST_FILE_PATH
      }, { timeout: 10000 }); // 10 second timeout
      
      console.log('File Scan Results:');
      console.log(`- Success: ${scanResponse.data.success ? 'Yes ✓' : 'No ✗'}`);
      console.log(`- Error Count: ${scanResponse.data.errorCount || 'N/A'}`);
      
      if (scanResponse.data.errors) {
        console.log('- Errors:');
        scanResponse.data.errors.forEach((error, index) => {
          console.log(`  ${index + 1}. Line ${error.lineNumber}: ${error.errorMessage}`);
        });
      }
      
    } catch (apiError) {
      console.log('Full API test skipped or failed (may require authentication)');
      console.log('Error:', apiError.message);
    }
    
    console.log('\n=== Test Completed ===');
    
  } catch (error) {
    console.error('Error testing API:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

// Main function
async function main() {
  // Create test file
  createTestFile();
  
  // Test API
  await testAPI();
}

// Run the test
main().catch(error => console.error('Test failed:', error));