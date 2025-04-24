/**
 * Fix Type Guards
 * 
 * This script fixes syntax errors in the typeGuards.ts file,
 * specifically addressing malformed type predicate syntax.
 * 
 * Usage: node fix-type-guards.js
 */

import fs from 'fs';
import path from 'path';

// Configuration
const ROOT_DIR = '.';
const CLIENT_SRC_DIR = path.join(ROOT_DIR, 'client', 'src');
const TYPE_GUARDS_PATH = path.join(CLIENT_SRC_DIR, 'utils', 'typeGuards.ts');
const BACKUP_DIR = './ts-fixes-backup';
const LOG_FILE = 'type-guards-fixes.log';

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log(`Created backup directory: ${BACKUP_DIR}`);
}

// Initialize log file
fs.writeFileSync(LOG_FILE, `Type Guards Fixes - ${new Date().toISOString()}\n\n`);

/**
 * Log a message to both console and log file
 */
function log(message) {
  console.log(message);
  fs.appendFileSync(LOG_FILE, message + '\n');
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
 * Fix type guard syntax in the file
 */
function fixTypeGuards() {
  if (!fs.existsSync(TYPE_GUARDS_PATH)) {
    log(`Error: Could not find typeGuards.ts at ${TYPE_GUARDS_PATH}`);
    return false;
  }
  
  try {
    // Read the file
    const content = fs.readFileSync(TYPE_GUARDS_PATH, 'utf8');
    
    // Create backup
    backupFile(TYPE_GUARDS_PATH);
    
    // Fix 1: Fix malformed type predicate syntax in function parameters
    // Pattern: function isXxx(value$2: value is Type {
    // Corrected: function isXxx(value: any): value is Type {
    let newContent = content.replace(
      /function\s+(\w+)\s*\(value\$2:\s*value\s+is\s+(\w+)\s*\{/g,
      'function $1(value: any): value is $2 {'
    );
    
    // Fix 2: Fix malformed type guard syntax in the isArrayOf function
    newContent = newContent.replace(
      /function\s+isArrayOf<T>\s*\(value,\s*itemGuard:\s*\(item\)\s*=>\s*item\s+is\s+T\):\s*value\s+is\s+T\[\]\s*\{/g,
      'function isArrayOf<T>(value: any, itemGuard: (item: any) => item is T): value is T[] {'
    );
    
    // Write the fixed content
    fs.writeFileSync(TYPE_GUARDS_PATH, newContent, 'utf8');
    log(`Fixed typeGuards.ts at: ${TYPE_GUARDS_PATH}`);
    return true;
  } catch (error) {
    log(`Error fixing typeGuards.ts: ${error.message}`);
    return false;
  }
}

/**
 * Main function
 */
function main() {
  log('Starting type guards fixes...');
  
  if (fixTypeGuards()) {
    log('Successfully fixed type guards in typeGuards.ts');
  } else {
    log('Failed to fix type guards in typeGuards.ts');
  }
}

// Run the main function
main();