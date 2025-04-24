/**
 * Fix Server DB.ts Syntax Errors
 * 
 * This script fixes the colon syntax errors in server/db.ts
 * which prevents the server from starting.
 * 
 * Usage: node fix-server-db.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Log a message to both console and log file
 */
function log(message) {
  const logMessage = `[${new Date().toLocaleTimeString()}] ${message}`;
  console.log(logMessage);
  
  // Also append to log file
  fs.appendFileSync('server-db-fixes.log', logMessage + '\n');
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
 * Fix the server/db.ts file
 */
function fixServerDbTs() {
  const filePath = path.join('server', 'db.ts');
  
  if (!fs.existsSync(filePath)) {
    log(`ERROR: ${filePath} does not exist!`);
    return;
  }
  
  // Create backup
  backupFile(filePath);
  
  // Read file content
  let content = fs.readFileSync(filePath, 'utf8');
  log(`Read ${filePath} (${content.length} bytes)`);
  
  // Fix all colons in imports
  content = content.replace(/import (.+) from: /g, 'import $1 from ');
  content = content.replace(/import: { (.+) } from: /g, 'import { $1 } from ');
  content = content.replace(/import \* as (.+) from: /g, 'import * as $1 from ');
  
  // Fix const declaration with colons
  content = content.replace(/const: { (.+) } = /g, 'const { $1 } = ');
  
  // Fix new statements with colons
  content = content.replace(/new: /g, 'new ');
  
  // Fix try statements with colons
  content = content.replace(/try: {/g, 'try {');
  
  // Fix function declarations with colons
  content = content.replace(/function: /g, 'function ');
  
  // Fix throw statements with colons
  content = content.replace(/throw new: /g, 'throw new ');
  
  // Write fixed content back to file
  fs.writeFileSync(filePath, content);
  log(`Fixed and wrote ${filePath}`);
  
  log(`Fixed syntax errors in ${filePath}`);
}

/**
 * Main function
 */
function main() {
  log('Starting fix-server-db.js...');
  
  try {
    fixServerDbTs();
    log('DONE! Successfully fixed server/db.ts');
  } catch (error) {
    log(`ERROR: ${error.message}`);
    console.error(error);
  }
}

// Run the main function
main();