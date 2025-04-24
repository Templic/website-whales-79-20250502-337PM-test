/**
 * Advanced Fix for Duplicate React Imports
 * 
 * This script specifically addresses the problem of having both 
 * 'import React from "react"' and 'import * as React from "react"'
 * in the same file, causing TypeScript errors.
 * 
 * Usage: node fix-duplicate-react-imports-advanced.js
 */

import fs from 'fs';
import path from 'path';

// Configuration
const ROOT_DIR = '.';
const CLIENT_SRC_DIR = path.join(ROOT_DIR, 'client', 'src');
const BACKUP_DIR = './ts-fixes-backup';
const LOG_FILE = 'duplicate-react-import-advanced-fixes.log';

// Patterns to match
const FIRST_IMPORT_PATTERN = /import\s+React\s+from\s+["']react["'];?/;
const SECOND_IMPORT_PATTERN = /import\s+\*\s+as\s+React\s+from\s+["']react["'];?/;

// Initialize log file
fs.writeFileSync(LOG_FILE, `Duplicate React Import Advanced Fixes - ${new Date().toISOString()}\n\n`);

/**
 * Log message both to console and log file
 */
function log(message) {
  console.log(message);
  fs.appendFileSync(LOG_FILE, message + '\n');
}

/**
 * Recursively find all TypeScript files in a directory
 */
function findTypeScriptFiles(dir) {
  let results = [];
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and hidden directories
      if (file !== 'node_modules' && !file.startsWith('.')) {
        results = results.concat(findTypeScriptFiles(filePath));
      }
    } else if (
      file.endsWith('.tsx') || 
      file.endsWith('.ts')
    ) {
      results.push(filePath);
    }
  }
  
  return results;
}

/**
 * Create a backup of a file
 */
function backupFile(filePath) {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  
  const backupPath = path.join(BACKUP_DIR, filePath.replace(/\//g, '_').replace(/\\/g, '_'));
  
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(filePath, backupPath);
    log(`Backed up: ${filePath} to ${backupPath}`);
  }
}

/**
 * Fix duplicate React imports in a file
 */
function fixDuplicateReactImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    const hasFirstImport = FIRST_IMPORT_PATTERN.test(content);
    const hasSecondImport = SECOND_IMPORT_PATTERN.test(content);
    
    // If both imports exist, we need to fix it
    if (hasFirstImport && hasSecondImport) {
      backupFile(filePath);
      
      // Remove the first import and keep the second one (import * as React)
      const newContent = content.replace(FIRST_IMPORT_PATTERN, '');
      
      fs.writeFileSync(filePath, newContent, 'utf8');
      log(`Fixed duplicate React imports in: ${filePath}`);
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
  log('Starting advanced duplicate React import fixes...');
  
  // Find all TypeScript files
  const files = findTypeScriptFiles(CLIENT_SRC_DIR);
  log(`Found ${files.length} TypeScript files to process`);
  
  let fixedFiles = 0;
  
  // Process each file
  for (const file of files) {
    if (fixDuplicateReactImports(file)) {
      fixedFiles++;
    }
  }
  
  log(`\nComplete! Fixed advanced duplicate React imports in ${fixedFiles} files`);
}

// Run the main function
main();