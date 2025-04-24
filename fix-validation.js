/**
 * Fix Validation TS Syntax Errors
 * 
 * This script specifically fixes syntax errors in server/validation.ts.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import colors from 'colors';

// Create a log file
const logStream = fs.createWriteStream('validation-fixes.log', { flags: 'a' });

/**
 * Log a message to both console and log file
 */
function log(message, color = colors.reset) {
  const timestamp = new Date().toISOString();
  console.log(color(`[${timestamp}] ${message}`));
  logStream.write(`[${timestamp}] ${message}\n`);
}

/**
 * Create a backup of the file
 */
function backupFile(filePath) {
  const backupPath = `${filePath}.bak`;
  try {
    fs.copyFileSync(filePath, backupPath);
    log(`Created backup at ${backupPath}`, colors.green);
    return true;
  } catch (error) {
    log(`Error creating backup: ${error.message}`, colors.red);
    return false;
  }
}

/**
 * Fix validation.ts syntax errors
 */
function fixValidationSyntax() {
  // Get current file URL and convert to path
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const filePath = path.join(dirname(__dirname), 'server', 'validation.ts');
  
  if (!fs.existsSync(filePath)) {
    log(`File not found: ${filePath}`, colors.red);
    return;
  }
  
  // Create backup first
  if (!backupFile(filePath)) {
    return;
  }
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let replacementCount = 0;
    
    // Fix import statements with colons
    content = content.replace(/import: {([^}]+)} from: ['"]([^'"]+)['"]/g, (match, imports, module) => {
      replacementCount++;
      return `import {${imports}} from '${module}'`;
    });
    
    // Fix semicolons that are incorrectly used in chains
    content = content.replace(/;(\s+)\.([a-zA-Z]+)/g, (match, space, method) => {
      replacementCount++;
      return `${space}.${method}`;
    });
    
    // Fix "new: Error" patterns
    content = content.replace(/throw new: Error\(([^)]+)\)/g, (match, message) => {
      replacementCount++;
      return `throw new Error(${message})`;
    });
    
    // Fix "between: x, and: y" patterns in withMessage
    content = content.replace(/between: (\d+), and: (\d+)/g, (match, min, max) => {
      replacementCount++;
      return `between ${min} and ${max}`;
    });
    
    // Fix "at, least: x" patterns in withMessage
    content = content.replace(/at, least: (\d+)/g, (match, num) => {
      replacementCount++;
      return `at least ${num}`;
    });
    
    // Fix "greater, than: x" patterns in withMessage
    content = content.replace(/greater, than: (\d+)/g, (match, num) => {
      replacementCount++;
      return `greater than ${num}`;
    });
    
    // Fix "must not, exceed: x" patterns in withMessage
    content = content.replace(/must not, exceed: (\d+)/g, (match, num) => {
      replacementCount++;
      return `must not exceed ${num}`;
    });
    
    // Fix "line: x" patterns in withMessage
    content = content.replace(/line: (\d+)/g, (match, num) => {
      replacementCount++;
      return `line ${num}`;
    });
    
    // Fix "Date must be a valid, ISO: 8601 date" patterns
    content = content.replace(/valid, ISO: 8601/g, (match) => {
      replacementCount++;
      return `valid ISO 8601`;
    });
    
    // Fix "param(x);" patterns with semicolons instead of chaining
    content = content.replace(/param\(([^)]+)\);/g, (match, paramName) => {
      replacementCount++;
      return `param(${paramName})`;
    });
    
    // Fix "query('x').optional();" patterns with semicolons instead of chaining
    content = content.replace(/query\(([^)]+)\)\.optional\(\);/g, (match, paramName) => {
      replacementCount++;
      return `query(${paramName}).optional()`;
    });
    
    fs.writeFileSync(filePath, content);
    log(`Fixed ${replacementCount} syntax errors in ${filePath}`, colors.green);
    
  } catch (error) {
    log(`Error fixing syntax: ${error.message}`, colors.red);
  }
}

// Run the fix
fixValidationSyntax();
log('Validation syntax fix completed.', colors.green);