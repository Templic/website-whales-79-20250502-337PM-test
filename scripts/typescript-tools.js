#!/usr/bin/env node

// TypeScript Tools - A suite of tools for TypeScript error detection and fixing
// This script provides standalone CLI functionality for the TypeScript error management system

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { program } = require('commander');

// Root directory of the project
const ROOT_DIR = path.resolve(__dirname, '..');

// Define the version
const VERSION = '1.0.0';

// Configure the CLI
program
  .name('typescript-tools')
  .description('TypeScript error management tools')
  .version(VERSION);

/**
 * Run the TypeScript compiler with --noEmit to find errors
 * @returns {Array} Array of TypeScript compiler errors
 */
function runTSC() {
  try {
    execSync('npx tsc --noEmit', { 
      cwd: ROOT_DIR,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    return []; // No errors if tsc exits successfully
  } catch (error) {
    // Parse the stderr output to get the errors
    const output = error.stderr.toString();
    const errors = parseTypeScriptErrors(output);
    return errors;
  }
}

/**
 * Parse the TypeScript compiler output to extract structured error information
 * @param {string} output - The raw output from the TypeScript compiler
 * @returns {Array} Array of structured error objects
 */
function parseTypeScriptErrors(output) {
  const errors = [];
  const errorLines = output.split('\n');
  
  let currentError = null;
  
  for (const line of errorLines) {
    // Match the file location line (e.g. "file.ts:10:5 - error TS2345: ...")
    const locationMatch = line.match(/^(.+\.[jt]sx?):(\d+):(\d+)(?:\s*-\s*)?(error|warning)\s*TS(\d+):\s*(.+)$/);
    
    if (locationMatch) {
      // If we have a previous error, push it to the array
      if (currentError) {
        errors.push(currentError);
      }
      
      // Create a new error object
      currentError = {
        filePath: path.relative(ROOT_DIR, locationMatch[1]),
        lineNumber: parseInt(locationMatch[2]),
        columnNumber: parseInt(locationMatch[3]),
        severity: locationMatch[4] === 'error' ? 'error' : 'warning',
        errorCode: `TS${locationMatch[5]}`,
        errorMessage: locationMatch[6],
        errorContext: '',
        category: categorizeError(`TS${locationMatch[5]}`),
        sourceCode: '',
        detectedAt: new Date(),
        occurrenceCount: 1,
        status: 'detected',
        metadata: {}
      };
      
      // Try to get the source code
      try {
        const fileContent = fs.readFileSync(path.join(ROOT_DIR, currentError.filePath), 'utf-8');
        const lines = fileContent.split('\n');
        
        // Get the line of code and surrounding context (3 lines before and after)
        const startLine = Math.max(0, currentError.lineNumber - 4);
        const endLine = Math.min(lines.length - 1, currentError.lineNumber + 2);
        
        // Extract the source code
        currentError.sourceCode = lines[currentError.lineNumber - 1].trim();
        
        // Extract context (with line numbers)
        const context = [];
        for (let i = startLine; i <= endLine; i++) {
          context.push(`${i + 1}: ${lines[i]}`);
        }
        currentError.errorContext = context.join('\n');
      } catch (err) {
        console.error(`Error reading file: ${currentError.filePath}`, err);
      }
    } else if (currentError && line.trim() !== '') {
      // Append non-empty lines to the error message
      currentError.errorMessage += ' ' + line.trim();
    }
  }
  
  // Add the last error if there is one
  if (currentError) {
    errors.push(currentError);
  }
  
  return errors;
}

/**
 * Categorize TypeScript errors based on their error code
 * @param {string} errorCode - The TypeScript error code
 * @returns {string} The category of the error
 */
function categorizeError(errorCode) {
  const errorCategories = {
    // Type errors
    'TS2322': 'type_mismatch',
    'TS2345': 'type_mismatch',
    'TS2339': 'property_access',
    'TS2307': 'import_error',
    'TS2304': 'undefined_symbol',
    'TS2531': 'null_undefined',
    'TS2532': 'null_undefined',
    'TS2533': 'null_undefined',
    'TS2366': 'function_error',
    'TS2349': 'function_error',
    'TS2554': 'function_error',
    'TS2769': 'function_error',
    'TS2739': 'property_access',
    'TS7006': 'implicit_any',
    'TS7031': 'binding_element',
    
    // Syntax errors
    'TS1005': 'syntax_error',
    'TS1109': 'syntax_error',
    'TS1128': 'syntax_error',
    'TS1131': 'syntax_error',
    'TS1434': 'syntax_error',
    
    // Config errors
    'TS18003': 'config_error',
    'TS5023': 'config_error',
    'TS5083': 'config_error',
    
    // Declaration errors
    'TS1195': 'declaration_error',
    'TS2414': 'declaration_error',
    'TS2451': 'declaration_error',
    'TS2693': 'declaration_error',
  };
  
  return errorCategories[errorCode] || 'other';
}

/**
 * Get file information for all TypeScript files in the project
 * @returns {Array} Array of file information objects
 */
function getAllTypeScriptFiles() {
  const result = [];
  const getFiles = (dir) => {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        // Recurse into subdirectories
        getFiles(filePath);
      } else if (/\.(ts|tsx)$/.test(file)) {
        // TypeScript file
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        
        result.push({
          filePath: path.relative(ROOT_DIR, filePath),
          fileType: path.extname(file).substring(1),
          fileSize: lines.length,
          lastModifiedAt: new Date(stat.mtime),
          errorCount: 0
        });
      }
    }
  };
  
  getFiles(ROOT_DIR);
  return result;
}

/**
 * Fix a TypeScript error based on its error code and pattern
 * @param {Object} error - The error object
 * @param {Object} fix - The fix to apply
 * @returns {boolean} True if the fix was applied successfully
 */
function fixTypeScriptError(error, fix) {
  try {
    // Read the file
    const filePath = path.join(ROOT_DIR, error.filePath);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // Apply the fix based on error type
    let fixedContent = content;
    let fixApplied = false;
    
    switch (error.category) {
      case 'import_error':
        // Add missing import
        if (fix && fix.fixCode && fix.fixCode.startsWith('import ')) {
          const importLines = lines.filter(line => line.trim().startsWith('import '));
          const lastImportIndex = importLines.length > 0 
            ? lines.indexOf(importLines[importLines.length - 1])
            : 0;
          
          lines.splice(lastImportIndex + 1, 0, fix.fixCode);
          fixedContent = lines.join('\n');
          fixApplied = true;
        }
        break;
        
      case 'property_access':
        // Add optional chaining
        if (error.errorCode === 'TS2339' && error.errorMessage.includes('does not exist on type')) {
          const line = lines[error.lineNumber - 1];
          const propertyMatch = error.errorMessage.match(/Property '([^']+)' does not exist/);
          
          if (propertyMatch && propertyMatch[1]) {
            const property = propertyMatch[1];
            const fixedLine = line.replace(
              new RegExp(`\\.${property}\\b`), 
              `?.${property}`
            );
            lines[error.lineNumber - 1] = fixedLine;
            fixedContent = lines.join('\n');
            fixApplied = true;
          }
        }
        break;
        
      case 'type_mismatch':
        // Apply type assertion
        if (fix && fix.fixCode) {
          lines[error.lineNumber - 1] = fix.fixCode;
          fixedContent = lines.join('\n');
          fixApplied = true;
        }
        break;
        
      case 'null_undefined':
        // Add null/undefined check
        if (error.errorCode === 'TS2531' || error.errorCode === 'TS2532') {
          const line = lines[error.lineNumber - 1];
          const variableMatch = line.match(/\b([a-zA-Z0-9_]+)\.\w+/);
          
          if (variableMatch && variableMatch[1]) {
            const variable = variableMatch[1];
            const indentation = line.match(/^\s*/)[0];
            
            // Add a null check before the line
            lines.splice(error.lineNumber - 1, 0, `${indentation}if (!${variable}) return;`);
            fixedContent = lines.join('\n');
            fixApplied = true;
          }
        }
        break;
        
      case 'implicit_any':
        // Add explicit type
        if (error.errorCode === 'TS7006') {
          const line = lines[error.lineNumber - 1];
          const paramMatch = line.match(/\b([a-zA-Z0-9_]+)(\)|\s*,|\s*\))/);
          
          if (paramMatch && paramMatch[1]) {
            const param = paramMatch[1];
            const fixedLine = line.replace(
              new RegExp(`\\b${param}\\b`),
              `${param}: any`
            );
            lines[error.lineNumber - 1] = fixedLine;
            fixedContent = lines.join('\n');
            fixApplied = true;
          }
        }
        break;
        
      default:
        // Apply custom fix if provided
        if (fix && fix.fixCode) {
          lines[error.lineNumber - 1] = fix.fixCode;
          fixedContent = lines.join('\n');
          fixApplied = true;
        }
        break;
    }
    
    // Write the fixed content back to the file
    if (fixApplied) {
      fs.writeFileSync(filePath, fixedContent);
      console.log(`Successfully fixed error in ${error.filePath}:${error.lineNumber}`);
      return true;
    }
    
    console.log(`No fix applied for error in ${error.filePath}:${error.lineNumber}`);
    return false;
  } catch (err) {
    console.error(`Error fixing TypeScript error:`, err);
    return false;
  }
}

// Command: analyze
// Run TypeScript compiler and analyze errors
program
  .command('analyze')
  .description('Analyze TypeScript errors in the project')
  .action(() => {
    console.log('Analyzing TypeScript errors...');
    
    try {
      // Run TypeScript compiler
      const errors = runTSC();
      
      // Get all TypeScript files
      const files = getAllTypeScriptFiles();
      
      // Count errors per file
      const errorsByFile = {};
      for (const error of errors) {
        errorsByFile[error.filePath] = (errorsByFile[error.filePath] || 0) + 1;
      }
      
      // Update file error counts
      for (const file of files) {
        file.errorCount = errorsByFile[file.filePath] || 0;
      }
      
      console.log(`\nAnalysis completed: Found ${errors.length} errors in ${Object.keys(errorsByFile).length} files.`);
      
      // Group errors by category
      const errorsByCategory = {};
      for (const error of errors) {
        errorsByCategory[error.category] = (errorsByCategory[error.category] || 0) + 1;
      }
      
      // Group errors by severity
      const errorsBySeverity = {};
      for (const error of errors) {
        errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1;
      }
      
      // Print summary
      console.log('\nError categories:');
      for (const [category, count] of Object.entries(errorsByCategory)) {
        console.log(`- ${category}: ${count}`);
      }
      
      console.log('\nError severity:');
      for (const [severity, count] of Object.entries(errorsBySeverity)) {
        console.log(`- ${severity}: ${count}`);
      }
      
      console.log('\nTop 5 files with most errors:');
      const topFiles = Object.entries(errorsByFile)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      
      for (const [file, count] of topFiles) {
        console.log(`- ${file}: ${count} errors`);
      }
      
      // Return result as JSON
      const result = {
        errors,
        files,
        errorsByCategory,
        errorsBySeverity,
        topFiles: topFiles.map(([file, count]) => ({ filePath: file, count }))
      };
      
      // Write result to file for later use
      fs.writeFileSync(
        path.join(ROOT_DIR, 'logs', 'typescript-analysis.json'),
        JSON.stringify(result, null, 2)
      );
      
      // // Print to stdout for capturing
      // process.stdout.write(JSON.stringify(result));
    } catch (error) {
      console.error('Error running analysis:', error);
      process.exit(1);
    }
  });

// Command: fix
// Fix a specific TypeScript error
program
  .command('fix')
  .description('Fix a specific TypeScript error')
  .requiredOption('--error-id <id>', 'The ID of the error to fix')
  .option('--fix-id <id>', 'The ID of the fix to apply')
  .action((options) => {
    console.log(`Fixing error #${options.errorId}...`);
    
    try {
      // Here we would normally fetch the error and fix from the database
      // For this example, we'll just simulate it
      
      const errorId = parseInt(options.errorId);
      const fixId = options.fixId ? parseInt(options.fixId) : undefined;
      
      // Simulate getting error data
      const errorData = {
        id: errorId,
        filePath: 'server/routes.ts',
        lineNumber: 58,
        columnNumber: 3,
        severity: 'error',
        errorCode: 'TS2339',
        errorMessage: "Property 'foo' does not exist on type 'Bar'",
        category: 'property_access',
        sourceCode: 'const value = obj.foo;',
        status: 'detected'
      };
      
      // Simulate getting fix data
      const fixData = fixId ? {
        id: fixId,
        patternId: 1,
        fixType: 'automatic',
        fixCode: 'const value = obj?.foo;',
        description: 'Add optional chaining to property access'
      } : null;
      
      // Apply the fix
      const success = fixTypeScriptError(errorData, fixData);
      
      if (success) {
        console.log(`Successfully fixed error #${errorId}`);
        process.exit(0);
      } else {
        console.error(`Failed to fix error #${errorId}`);
        process.exit(1);
      }
    } catch (error) {
      console.error('Error fixing TypeScript error:', error);
      process.exit(1);
    }
  });

// Command: scan
// Scan the project for TypeScript files
program
  .command('scan')
  .description('Scan the project for TypeScript files')
  .action(() => {
    console.log('Scanning project for TypeScript files...');
    
    try {
      const files = getAllTypeScriptFiles();
      
      console.log(`Found ${files.length} TypeScript files.`);
      
      // Group files by type
      const filesByType = {};
      for (const file of files) {
        filesByType[file.fileType] = (filesByType[file.fileType] || 0) + 1;
      }
      
      console.log('\nFiles by type:');
      for (const [type, count] of Object.entries(filesByType)) {
        console.log(`- ${type}: ${count}`);
      }
      
      // Return result as JSON
      const result = {
        files,
        filesByType,
        totalFiles: files.length
      };
      
      // Write result to file
      fs.writeFileSync(
        path.join(ROOT_DIR, 'logs', 'typescript-files.json'),
        JSON.stringify(result, null, 2)
      );
      
      // // Print to stdout for capturing
      // process.stdout.write(JSON.stringify(result));
    } catch (error) {
      console.error('Error scanning TypeScript files:', error);
      process.exit(1);
    }
  });

// Parse command-line arguments
program.parse(process.argv);

// If no command is provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}