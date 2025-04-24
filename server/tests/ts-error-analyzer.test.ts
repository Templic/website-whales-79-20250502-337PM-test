/**
 * TypeScript Error Analyzer Tests
 * 
 * This file contains tests for the TypeScript error analyzer utility.
 */

import {
  categorizeError,
  determineSeverity,
  extractRelatedTypes,
  analyzeTypeScriptErrors,
  ErrorCategory
} from '../utils/ts-error-analyzer';

/**
 * Test categorizeError function
 */
function testCategorizeError() {
  console.log('\n--- Testing categorizeError ---');
  
  const testCases = [
    {
      message: 'Type \'string\' is not assignable to type \'number\'',
      expectedCategory: 'TYPE_MISMATCH'
    },
    {
      message: 'Property \'name\' does not exist on type \'User\'',
      expectedCategory: 'MISSING_PROPERTY'
    },
    {
      message: 'Parameter \'event\' implicitly has an \'any\' type',
      expectedCategory: 'IMPLICIT_ANY'
    },
    {
      message: '\'user\' is declared but its value is never read',
      expectedCategory: 'UNUSED_VARIABLE'
    },
    {
      message: 'Object is possibly \'undefined\'',
      expectedCategory: 'NULL_UNDEFINED'
    },
    {
      message: 'Cannot find module \'./config\'',
      expectedCategory: 'MODULE_NOT_FOUND'
    },
    {
      message: 'Unexpected token. Expected \'}\'',
      expectedCategory: 'SYNTAX_ERROR'
    },
    {
      message: 'Type \'A\' incorrectly extends interface \'B\'',
      expectedCategory: 'INTERFACE_ERROR'
    },
    {
      message: 'Type argument expected',
      expectedCategory: 'TYPE_ARGUMENT'
    },
    {
      message: 'Type alias \'User\' circularly references itself',
      expectedCategory: 'CIRCULAR_REFERENCE'
    },
    {
      message: 'Some other random error',
      expectedCategory: 'OTHER'
    }
  ];
  
  for (const testCase of testCases) {
    const category = categorizeError(testCase.message);
    const passed = category === testCase.expectedCategory;
    
    console.log(`Category test "${testCase.message.slice(0, 30)}...": ${passed ? '✓' : '✗'}`);
    
    if (!passed) {
      console.log(`  Expected: ${testCase.expectedCategory}, Got: ${category}`);
    }
  }
  
  console.log('categorizeError test completed');
}

/**
 * Test determineSeverity function
 */
function testDetermineSeverity() {
  console.log('\n--- Testing determineSeverity ---');
  
  const testCases = [
    {
      category: 'SYNTAX_ERROR' as ErrorCategory,
      message: 'Unexpected token',
      expectedSeverity: 'critical'
    },
    {
      category: 'MODULE_NOT_FOUND' as ErrorCategory,
      message: 'Cannot find module',
      expectedSeverity: 'critical'
    },
    {
      category: 'TYPE_MISMATCH' as ErrorCategory,
      message: 'Object is possibly null',
      expectedSeverity: 'high'
    },
    {
      category: 'NULL_UNDEFINED' as ErrorCategory,
      message: 'Object is possibly undefined',
      expectedSeverity: 'high'
    },
    {
      category: 'TYPE_MISMATCH' as ErrorCategory,
      message: 'Type string is not assignable to number',
      expectedSeverity: 'medium'
    },
    {
      category: 'MISSING_PROPERTY' as ErrorCategory,
      message: 'Property does not exist',
      expectedSeverity: 'medium'
    },
    {
      category: 'IMPLICIT_ANY' as ErrorCategory,
      message: 'Implicitly has an any type',
      expectedSeverity: 'medium'
    },
    {
      category: 'UNUSED_VARIABLE' as ErrorCategory,
      message: 'Declared but never used',
      expectedSeverity: 'low'
    }
  ];
  
  for (const testCase of testCases) {
    const severity = determineSeverity(testCase.category, testCase.message);
    const passed = severity === testCase.expectedSeverity;
    
    console.log(`Severity test "${testCase.message}": ${passed ? '✓' : '✗'}`);
    
    if (!passed) {
      console.log(`  Expected: ${testCase.expectedSeverity}, Got: ${severity}`);
    }
  }
  
  console.log('determineSeverity test completed');
}

/**
 * Test extractRelatedTypes function
 */
function testExtractRelatedTypes() {
  console.log('\n--- Testing extractRelatedTypes ---');
  
  const testCases = [
    {
      message: 'Type \'string\' is not assignable to type \'number\'',
      expectedTypes: ['string', 'number']
    },
    {
      message: 'Property \'name\' does not exist on type \'User\'',
      expectedTypes: ['User']
    },
    {
      message: 'No type references here',
      expectedTypes: []
    }
  ];
  
  for (const testCase of testCases) {
    const types = extractRelatedTypes(testCase.message);
    const passed = JSON.stringify(types) === JSON.stringify(testCase.expectedTypes);
    
    console.log(`Extract types test "${testCase.message}": ${passed ? '✓' : '✗'}`);
    
    if (!passed) {
      console.log(`  Expected: ${JSON.stringify(testCase.expectedTypes)}, Got: ${JSON.stringify(types)}`);
    }
  }
  
  console.log('extractRelatedTypes test completed');
}

/**
 * Create sample TypeScript files with errors for testing
 */
async function createSampleFilesForTesting() {
  console.log('\n--- Creating sample files for testing ---');
  
  const fs = await import('fs');
  const path = await import('path');
  
  // Create a temporary directory for test files
  const testDir = path.join(process.cwd(), 'temp-test');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  // Create a file with TypeScript errors
  const fileContent = `
// File with various TypeScript errors
function greet(name) {
  console.log('Hello, ' + name);
  return 42;
}

const user = {
  firstName: 'John',
  lastName: 'Doe'
};

// Type mismatch error
const count: number = 'not a number';

// Missing property error
console.log(user.age.toString());

// Implicit any error
function processData(data) {
  return data.map(item => item.value);
}

// Unused variable error
const unused = 'This is not used';

// Null/undefined error
const nullable: string | null = null;
console.log(nullable.length);

export { greet };
`;
  
  const filePath = path.join(testDir, 'sample.ts');
  fs.writeFileSync(filePath, fileContent);
  
  console.log(`Sample file created at ${filePath}`);
  return testDir;
}

/**
 * Test analyzeTypeScriptErrors function
 */
async function testAnalyzeTypeScriptErrors() {
  console.log('\n--- Testing analyzeTypeScriptErrors ---');
  
  // Create sample files
  const testDir = await createSampleFilesForTesting();
  
  // We can't actually run the TypeScript compiler in this test,
  // but we can test the parsing and categorization logic
  
  console.log('Note: Full analyzer testing requires running against actual TypeScript files.');
  console.log('Skipping full analyzer test as it requires a TypeScript project setup.');
  
  // Clean up
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    // Remove the test file
    const filePath = path.join(testDir, 'sample.ts');
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Remove the test directory
    if (fs.existsSync(testDir)) {
      fs.rmdirSync(testDir);
    }
    
    console.log('Test files cleaned up');
  } catch (error) {
    console.error('Error cleaning up test files:', error);
  }
  
  console.log('analyzeTypeScriptErrors test completed');
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('=== Running TypeScript Error Analyzer Tests ===');
  
  testCategorizeError();
  testDetermineSeverity();
  testExtractRelatedTypes();
  await testAnalyzeTypeScriptErrors();
  
  console.log('\n=== All TypeScript Error Analyzer Tests Completed ===');
}

// Run tests
runTests().catch(error => {
  console.error('Test execution failed:', error);
});