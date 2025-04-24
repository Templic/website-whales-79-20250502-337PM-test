/**
 * Comprehensive Server Syntax Error Fixer
 * 
 * This script automatically fixes multiple categories of TypeScript syntax errors 
 * in server files, including:
 * - Malformed import statements
 * - Incorrect arrow function syntax
 * - Trailing semicolons in arrays and objects
 * - Malformed conditional statements
 * - Incorrectly terminated array literals
 * - Object bracket mismatches
 * 
 * Usage: node fix-server-syntax-comprehensive.js
 */

const fs = require('fs');
const path = require('path');
const colors = require('colors');

// Log file for tracking changes
const LOG_FILE = 'server-syntax-comprehensive-fixes.log';

/**
 * Log a message to both console and log file
 */
function log(message, color = colors.reset) {
  const timestamp = new Date().toLocaleTimeString();
  const logMessage = `[${timestamp}] ${message}`;
  
  console.log(color(logMessage));
  fs.appendFileSync(LOG_FILE, logMessage + '\n');
}

/**
 * Create a backup of a file
 */
function backupFile(filePath) {
  const backupPath = `${filePath}.bak`;
  fs.copyFileSync(filePath, backupPath);
  log(`Created backup: ${backupPath}`);
}

/**
 * Find all TypeScript and JavaScript files in a directory recursively
 */
function findTsFiles(dir) {
  let results = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const itemPath = path.join(dir, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      results = results.concat(findTsFiles(itemPath));
    } else if (/\.(ts|js|tsx|jsx)$/.test(item)) {
      results.push(itemPath);
    }
  }
  
  return results;
}

/**
 * Fix syntax errors in a file
 */
function fixSyntaxErrors(filePath) {
  try {
    // Skip backup files
    if (filePath.endsWith('.bak')) {
      return false;
    }
    
    // Read file content
    const content = fs.readFileSync(filePath, 'utf8');
    log(`Reading ${filePath} (${content.length} bytes)`);
    
    // Apply fixes
    let fixedContent = content;
    
    // Fix 1: Import statements with colons
    fixedContent = fixedContent.replace(/import (.+) from: /g, 'import $1 from ');
    fixedContent = fixedContent.replace(/import: { (.+) } from: /g, 'import { $1 } from ');
    fixedContent = fixedContent.replace(/import \* as (.+) from: /g, 'import * as $1 from ');
    fixedContent = fixedContent.replace(/import: { \s*\n/g, 'import { \n');
    fixedContent = fixedContent.replace(/} from: /g, '} from ');
    fixedContent = fixedContent.replace(/import:\s*{/g, 'import {');
    
    // Fix 2: Arrow function with incorrect syntax
    fixedContent = fixedContent.replace(/\) => {/g, ') => {');
    fixedContent = fixedContent.replace(/\) =>{/g, ') => {');
    fixedContent = fixedContent.replace(/\)\s*=>\s*{/g, ') => {');
    fixedContent = fixedContent.replace(/if \(([^)]+)\) => {/g, 'if ($1) {');
    
    // Fix 3: Array with trailing semicolons
    fixedContent = fixedContent.replace(/(\[[^\]]*),(\s*\])/g, '$1$2');
    fixedContent = fixedContent.replace(/(\[[^\]]*);(\s*\])/g, '$1$2');
    fixedContent = fixedContent.replace(/(\[[^\];]*);([^\]]*\])/g, '$1,$2');
    
    // Fix 4: Objects with trailing semicolons before closing bracket
    fixedContent = fixedContent.replace(/(\{[^}]*);(\s*\})/g, '$1$2');
    
    // Fix 5: Conditional statements with trailing semicolon
    fixedContent = fixedContent.replace(/(\|\|)\s*;(\s*[\(a-zA-Z])/g, '$1$2');
    
    // Fix 6: Multiple semicolons
    fixedContent = fixedContent.replace(/;;/g, ';');
    
    // Fix 7: Extra semicolons in object properties
    fixedContent = fixedContent.replace(/([a-zA-Z0-9"'`])\s*:\s*([a-zA-Z0-9"'`{[])\s*;(\s*[a-zA-Z}])/g, '$1: $2,$3');
    
    // Fix 8: Incorrect array closing
    fixedContent = fixedContent.replace(/(\[[^\]]*[^,\s]);(\s*\])/g, '$1$2');
    
    // Fix 9: Function declarations with colons
    fixedContent = fixedContent.replace(/function: /g, 'function ');
    
    // Fix 10: Async function declarations with colons
    fixedContent = fixedContent.replace(/async: function/g, 'async function');
    fixedContent = fixedContent.replace(/async: \(/g, 'async (');
    
    // Fix 11: Malformed await
    fixedContent = fixedContent.replace(/await: /g, 'await ');
    
    // Fix 12: Incorrectly terminated array literals
    const arrayPattern = /(\[[^\[\]]*);([^\[\]]*\])/g;
    while (arrayPattern.test(fixedContent)) {
      fixedContent = fixedContent.replace(arrayPattern, '$1,$2');
    }
    
    // Fix 13: Fix string concatenation
    fixedContent = fixedContent.replace(/\+ = "/g, ' += "');
    fixedContent = fixedContent.replace(/\+ = '/g, " += '");
    
    // Check if any changes were made
    if (fixedContent !== content) {
      // Back up original file
      backupFile(filePath);
      
      // Write fixed content
      fs.writeFileSync(filePath, fixedContent);
      log(`Fixed and wrote ${filePath}`, colors.green);
      return true;
    } else {
      log(`No syntax errors found in ${filePath}`, colors.yellow);
      return false;
    }
  } catch (error) {
    log(`Error fixing ${filePath}: ${error.message}`, colors.red);
    return false;
  }
}

/**
 * Fix syntax errors in server directory
 */
function fixServerSyntaxErrors() {
  const serverDir = 'server';
  
  // Get all TypeScript files recursively
  const tsFiles = findTsFiles(serverDir);
  log(`Found ${tsFiles.length} TypeScript files in server directory`);
  
  // Initialize log file
  fs.writeFileSync(LOG_FILE, `Server Syntax Comprehensive Fixes - ${new Date().toISOString()}\n\n`);
  
  // Counter for fixed files
  let fixedCount = 0;
  
  // Fix each file
  for (const file of tsFiles) {
    const wasFixed = fixSyntaxErrors(file);
    if (wasFixed) {
      fixedCount++;
    }
  }
  
  log(`Fixed syntax errors in ${fixedCount} files`, colors.green);
}

/**
 * Main function
 */
function main() {
  log('Starting fix-server-syntax-comprehensive.js...', colors.cyan);
  
  try {
    fixServerSyntaxErrors();
    log('DONE! Successfully fixed server syntax errors', colors.green);
  } catch (error) {
    log(`ERROR: ${error.message}`, colors.red);
    console.error(error);
  }
}

// Run the main function
main();