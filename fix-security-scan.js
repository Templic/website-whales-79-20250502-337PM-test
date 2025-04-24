/**
 * Fix Security Scan.ts Syntax Errors
 * 
 * This script fixes the colon syntax errors in server/securityScan.ts
 * which prevents the server from starting.
 * 
 * Usage: node fix-security-scan.js
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
  fs.appendFileSync('security-scan-fixes.log', logMessage + '\n');
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
 * Fix the server/securityScan.ts file
 */
function fixSecurityScanTs() {
  const filePath = path.join('server', 'securityScan.ts');
  
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
  
  // Fix interface declarations with colons
  content = content.replace(/interface (.+): {/g, 'interface $1 {');
  
  // Fix function declarations with colons
  content = content.replace(/function: /g, 'function ');
  
  // Fix "return:" statements with colons
  content = content.replace(/return: /g, 'return ');
  
  // Fix "await:" statements with colons
  content = content.replace(/await: /g, 'await ');
  
  // Fix "try:" statements with colons
  content = content.replace(/try: {/g, 'try {');
  
  // Fix "else:" with colons
  content = content.replace(/} else: {/g, '} else {');
  
  // Fix "new:" with colons
  content = content.replace(/new: Date/g, 'new Date');
  
  // Fix comparison operators
  content = content.replace(/= == /g, ' === ');
  
  // Fix arrow functions
  content = content.replace(/(.+) = > /g, '$1 => ');
  
  // Fix trailing semi-colons
  content = content.replace(/;(\s*\))/g, '$1');
  content = content.replace(/;(\s*\.)/g, '$1');
  
  // Fix interface property definitions with comma separators
  content = content.replace(/;,/g, ';');
  
  // Fix "as:" with colons
  content = content.replace(/as: /g, 'as ');
  
  // Fix "const: [name, version]" destructuring
  content = content.replace(/const: \[/g, 'const [');
  
  // Fix "number:" with colons
  content = content.replace(/number: {/g, 'number {');
  
  // Write fixed content back to file
  fs.writeFileSync(filePath, content);
  log(`Fixed and wrote ${filePath}`);
  
  log(`Fixed syntax errors in ${filePath}`);
}

/**
 * Main function
 */
function main() {
  log('Starting fix-security-scan.js...');
  
  try {
    fixSecurityScanTs();
    log('DONE! Successfully fixed server/securityScan.ts');
  } catch (error) {
    log(`ERROR: ${error.message}`);
    console.error(error);
  }
}

// Run the main function
main();