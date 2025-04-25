/**
 * Test script for TypeScript error management
 * 
 * This script tests the TypeScript error detection and analysis functionality.
 */

import * as tsErrorFinder from './utils/ts-error-finder';
import * as tsErrorStorage from './tsErrorStorage';
import * as openAI from './utils/openai-integration';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('Testing TypeScript error management system...');
  
  // Create some test files with TypeScript errors
  const testDir = './tmp/ts-error-test';
  
  try {
    // Create test directory if it doesn't exist
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    // Create a file with TypeScript errors
    const errorFile1 = path.join(testDir, 'error1.ts');
    fs.writeFileSync(errorFile1, `
// Type error: assigning a string to a number
const x: number = "hello";

// Undefined variable error
console.log(undefinedVariable);

// Function parameter type mismatch
function greet(name: string): string {
  return \`Hello, \${name}\`;
}
greet(42);

// Interface implementation error
interface Person {
  name: string;
  age: number;
}

// Missing property in object literal
const person: Person = {
  name: "John"
  // missing age property
};

// Null reference error
const nullObj: Person | null = null;
console.log(nullObj.name);
`);
    
    console.log(`Created test file: ${errorFile1}`);
    
    // Test scanning for errors
    console.log('Scanning for TypeScript errors...');
    const result = await tsErrorFinder.findErrorsInFile(errorFile1, {
      severity: 'high'
    });
    
    console.log(`Found ${result.errorCount} errors and ${result.warningCount} warnings`);
    console.log('Errors by file:', result.errorsByFile);
    console.log('Added errors:', result.addedErrors);
    
    // Test analyzing an error using OpenAI
    if (result.addedErrors.length > 0) {
      const errorId = result.addedErrors[0].id;
      console.log(`Analyzing error ${errorId} using OpenAI...`);
      
      const error = await tsErrorStorage.getTypescriptError(errorId);
      if (error) {
        try {
          const analysis = await openAI.analyzeError(error);
          console.log('Error analysis result:', analysis);
          
          // Update the error with the analysis results
          await tsErrorStorage.updateTypescriptError(errorId, {
            category: analysis.category,
            severity: analysis.severity,
            status: 'analyzed',
            metadata: {
              ...error.metadata,
              rootCause: analysis.rootCause,
              explanation: analysis.explanation,
              cascading: analysis.cascading,
              analyzedAt: new Date().toISOString()
            }
          });
          
          console.log('Error updated with analysis results');
          
          // Generate a fix for the error
          console.log(`Generating fix for error ${errorId}...`);
          const fixSuggestion = await openAI.generateErrorFix(error);
          
          console.log('Fix suggestion:', fixSuggestion);
          
          // Add the fix to the database
          const fix = await tsErrorStorage.addErrorFix({
            errorId: error.id,
            fixTitle: `AI-generated fix for ${error.errorCode}`,
            fixDescription: fixSuggestion.fixExplanation,
            fixCode: fixSuggestion.fixCode,
            originalCode: fixSuggestion.originalCode,
            fixScope: fixSuggestion.fixScope,
            fixType: 'semi-automatic',
            fixPriority: 5,
            successRate: fixSuggestion.confidence * 100
          });
          
          console.log('Fix added:', fix);
          
          // Apply the fix to the file
          if (fixSuggestion.fixScope === 'line') {
            // Get the file content
            const fileContent = fs.readFileSync(error.filePath, 'utf-8');
            const lines = fileContent.split('\n');
            
            // Replace the line
            lines[error.lineNumber - 1] = fixSuggestion.fixCode;
            
            // Write the file back
            fs.writeFileSync(
              path.join(testDir, 'fixed_error1.ts'),
              lines.join('\n')
            );
            
            console.log('Fix applied to file');
          }
        } catch (err) {
          console.error('Error during OpenAI analysis:', err);
        }
      }
    }
    
    // Test creating a project analysis
    console.log('Creating project analysis...');
    const analysisId = await tsErrorFinder.createProjectAnalysis(result);
    console.log(`Project analysis created with ID: ${analysisId}`);
    
    // Get the latest project analysis
    const analysis = await tsErrorStorage.getLatestProjectAnalysis();
    console.log('Latest project analysis:', analysis);
    
  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    // Clean up test files (uncomment if needed)
    // if (fs.existsSync(testDir)) {
    //   fs.rmSync(testDir, { recursive: true, force: true });
    //   console.log(`Removed test directory: ${testDir}`);
    // }
  }
}

// Run the test
main().catch(console.error);