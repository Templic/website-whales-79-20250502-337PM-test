/**
 * Fix Parameter Errors
 * 
 * This script fixes malformed parameter syntaxes in function declarations,
 * particularly the props$2 pattern that appears in some components.
 * 
 * Usage: node fix-parameter-errors.js
 */

import fs from 'fs';
import path from 'path';

// Configuration
const ROOT_DIR = '.';
const BACKUP_DIR = './ts-fixes-backup';
const CLIENT_SRC_DIR = path.join(ROOT_DIR, 'client', 'src');
const EXCLUDED_DIRS = ['node_modules', '.git', 'dist', 'build', '.config', '.cache', '.vscode', BACKUP_DIR];
const LOG_FILE = 'parameter-error-fixes.log';

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log(`Created backup directory: ${BACKUP_DIR}`);
}

// Initialize log file
fs.writeFileSync(LOG_FILE, `Parameter Error Fixes - ${new Date().toISOString()}\n\n`);

/**
 * Log a message to both console and log file
 */
function log(message) {
  console.log(message);
  fs.appendFileSync(LOG_FILE, message + '\n');
}

/**
 * Find all TypeScript files in a directory recursively
 */
function findTypeScriptFiles(dir) {
  const result = [];
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    // Skip hidden files and directories
    if (file.startsWith('.') || EXCLUDED_DIRS.includes(file)) {
      continue;
    }
    
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      result.push(...findTypeScriptFiles(filePath));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      result.push(filePath);
    }
  }
  
  return result;
}

/**
 * Create a backup of a file
 */
function backupFile(filePath) {
  const backupPath = path.join(BACKUP_DIR, filePath.replace(/\//g, '_').replace(/\\/g, '_'));
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(filePath, backupPath);
    log(`Backed up: ${filePath} to ${backupPath}`);
  }
}

/**
 * Fix parameter errors in a file
 */
function fixParameterErrors(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Pattern 1: function name(props$2 { ... }
    const pattern1 = /function\s+(\w+)\s*\(\s*(\w+)\$2\s*(?!\:)/g;
    
    // Pattern 2: const Component = ({ prop1$2, prop2$2 }) => { ... }
    const pattern2 = /(\w+)\$2(\s*,|\s*\})/g;
    
    // Pattern 3: (props$2) => { ... }
    const pattern3 = /\(\s*(\w+)\$2\s*\)\s*=>/g;
    
    // Check if any pattern matches
    if (pattern1.test(content) || pattern2.test(content) || pattern3.test(content)) {
      // Create backup
      backupFile(filePath);
      
      // Fix the patterns
      let newContent = content;
      
      // Fix pattern 1
      newContent = newContent.replace(pattern1, 'function $1($2: any) {');
      
      // Fix pattern 2
      newContent = newContent.replace(pattern2, '$1: any$2');
      
      // Fix pattern 3
      newContent = newContent.replace(pattern3, '($1: any) =>');
      
      // Write the fixed content
      fs.writeFileSync(filePath, newContent, 'utf8');
      log(`Fixed parameter errors in: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    log(`Error processing ${filePath}: ${error.message}`);
    return false;
  }
}

/**
 * Main function
 */
function main() {
  log('Starting parameter error fixes...');
  
  // Find all TypeScript files
  const tsFiles = findTypeScriptFiles(CLIENT_SRC_DIR);
  log(`Found ${tsFiles.length} TypeScript files to process`);
  
  let fixedCount = 0;
  let orderConfirmationFixed = false;
  
  // Process all files
  for (const file of tsFiles) {
    if (fixParameterErrors(file)) {
      fixedCount++;
      
      // Check if we fixed the OrderConfirmationPage
      if (file.includes('OrderConfirmationPage.tsx')) {
        orderConfirmationFixed = true;
      }
    }
  }
  
  // Special check for OrderConfirmationPage.tsx
  if (!orderConfirmationFixed) {
    const orderConfirmationPath = path.join(CLIENT_SRC_DIR, 'pages', 'shop', 'OrderConfirmationPage.tsx');
    if (fs.existsSync(orderConfirmationPath)) {
      log(`Specifically checking OrderConfirmationPage.tsx...`);
      if (fixParameterErrors(orderConfirmationPath)) {
        fixedCount++;
        log(`Fixed OrderConfirmationPage.tsx`);
      } else {
        log(`No errors found in OrderConfirmationPage.tsx or fix failed`);
      }
    } else {
      log(`Could not find OrderConfirmationPage.tsx at expected path`);
    }
  }
  
  log(`\nComplete! Fixed parameter errors in ${fixedCount} files`);
}

// Run the main function
main();