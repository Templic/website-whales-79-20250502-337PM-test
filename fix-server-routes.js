/**
 * Fix Server Routes.ts Syntax Errors
 * 
 * This script fixes the colon syntax errors in server/routes.ts
 * which prevents the server from starting.
 * 
 * Usage: node fix-server-routes.js
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
  fs.appendFileSync('server-routes-fixes.log', logMessage + '\n');
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
 * Fix the server/routes.ts file
 */
function fixServerRoutesTs() {
  const filePath = path.join('server', 'routes.ts');
  
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
  content = content.replace(/import: { \s*\n/g, 'import { \n');
  content = content.replace(/} from: /g, '} from ');
  content = content.replace(/import:\s*{/g, 'import {');
  
  // Fix function declarations with colons
  content = content.replace(/function: /g, 'function ');
  
  // Fix const/let declarations with colons
  content = content.replace(/const: { (.+) } = /g, 'const { $1 } = ');
  content = content.replace(/const: { (.+) }/g, 'const { $1 }');
  
  // Fix new Date statements with colons
  content = content.replace(/new: Date/g, 'new Date');
  
  // Fix try statements with colons
  content = content.replace(/try: {/g, 'try {');
  
  // Fix else statements with colons
  content = content.replace(/} else: {/g, '} else {');
  
  // Fix arrow functions with double equals and semicolons
  content = content.replace(/= == /g, ' === ');
  content = content.replace(/;(\s*\))/g, '$1');
  content = content.replace(/;(\s*\.)/g, '$1');
  
  // Fix arrow functions with colons
  content = content.replace(/(.+) = > /g, '$1 => ');
  
  // Fix chained statements
  content = content.replace(/;\s*\)/g, ')');
  content = content.replace(/;\s*\./g, '.');
  
  // Fix all routes with colon
  content = content.replace(/\/api\/webhooks';/g, '/api/webhooks\'');
  
  // Write fixed content back to file
  fs.writeFileSync(filePath, content);
  log(`Fixed and wrote ${filePath}`);
  
  log(`Fixed syntax errors in ${filePath}`);
}

/**
 * Main function
 */
function main() {
  log('Starting fix-server-routes.js...');
  
  try {
    fixServerRoutesTs();
    log('DONE! Successfully fixed server/routes.ts');
  } catch (error) {
    log(`ERROR: ${error.message}`);
    console.error(error);
  }
}

// Run the main function
main();