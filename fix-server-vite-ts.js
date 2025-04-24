/**
 * Fix Server Vite.ts Syntax Errors
 * 
 * This script fixes the colon syntax errors in server/vite.ts
 * which prevents the server from starting.
 * 
 * Usage: node fix-server-vite-ts.js
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
function log(message, color = '') {
  const logMessage = `[${new Date().toLocaleTimeString()}] ${message}`;
  console.log(logMessage);
  
  // Also append to log file
  fs.appendFileSync('server-vite-fixes.log', logMessage + '\n');
}

/**
 * Create a backup of the file
 */
function backupFile(filePath) {
  const backupPath = `${filePath}.bak`;
  fs.copyFileSync(filePath, backupPath);
  log(`Created backup: ${backupPath}`);
}

/**
 * Fix the server/vite.ts file
 */
function fixServerViteTs() {
  const filePath = path.join('server', 'vite.ts');
  
  if (!fs.existsSync(filePath)) {
    log(`ERROR: ${filePath} does not exist!`);
    return;
  }
  
  // Create backup
  backupFile(filePath);
  
  // Read file content
  let content = fs.readFileSync(filePath, 'utf8');
  log(`Read ${filePath} (${content.length} bytes)`);
  
  // Fix import statements with colons
  content = content.replace(/import (.+) from: "/g, 'import $1 from "');
  
  // Fix import statements with colons (variant)
  content = content.replace(/import: { (.+) } from: "/g, 'import { $1 } from "');
  
  // Fix function declarations with colons
  content = content.replace(/function: /g, 'function ');
  
  // Fix new statements with colons
  content = content.replace(/new: /g, 'new ');
  
  // Fix await statements with colons
  content = content.replace(/await: /g, 'await ');
  
  // Fix try statements with colons
  content = content.replace(/try: {/g, 'try {');

  // Fix semicolon errors on lines 55 and 61
  content = content.replace(/"index.html",;/g, '"index.html"');
  content = content.replace(/`src="\/src\/main.tsx"`,;/g, '`src="/src/main.tsx"`');
  
  // Fix missing comma in template replacement
  content = content.replace(/`src="\/src\/main.tsx"`\s+`src="\/src\/main.tsx\?v=/g, '`src="/src/main.tsx"`,\n        `src="/src/main.tsx?v=');

  // Fix throw new statements with colons
  content = content.replace(/throw new: Error/g, 'throw new Error');
  
  // Write fixed content back to file
  fs.writeFileSync(filePath, content);
  log(`Fixed and wrote ${filePath}`);
  
  // Count how many replacements were made
  const colonCount = (content.match(/: "/g) || []).length;
  log(`Fixed syntax errors in ${filePath}`);
}

/**
 * Main function
 */
function main() {
  log('Starting fix-server-vite-ts.js...');
  
  try {
    fixServerViteTs();
    log('DONE! Successfully fixed server/vite.ts');
  } catch (error) {
    log(`ERROR: ${error.message}`);
    console.error(error);
  }
}

// Run the main function
main();