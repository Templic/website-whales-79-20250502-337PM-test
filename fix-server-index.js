/**
 * Fix Server Index.ts File
 * 
 * This script fixes the syntax errors in the server/index.ts file,
 * particularly removing incorrect colons in imports and function declarations.
 * 
 * Usage: node fix-server-index.js
 */

import fs from 'fs';
import path from 'path';

// Configuration
const SERVER_INDEX_PATH = path.join('.', 'server', 'index.ts');
const BACKUP_PATH = path.join('.', 'ts-fixes-backup', 'server-index.ts');

// Ensure backup directory exists
const backupDir = path.dirname(BACKUP_PATH);
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
  console.log(`Created backup directory: ${backupDir}`);
}

// Create backup of the original file
if (fs.existsSync(SERVER_INDEX_PATH)) {
  fs.copyFileSync(SERVER_INDEX_PATH, BACKUP_PATH);
  console.log(`Backed up: ${SERVER_INDEX_PATH} to ${BACKUP_PATH}`);
}

// Read the file
const content = fs.readFileSync(SERVER_INDEX_PATH, 'utf8');

// Fix the remaining colons
let fixedContent = content
  // Fix import statements
  .replace(/import\s+(\{[\s\w,]+\})\s+from:\s+(['"].*?['"])/g, 'import $1 from $2')
  .replace(/import\s+(\w+)\s+from:\s+(['"].*?['"])/g, 'import $1 from $2')
  .replace(/import:\s+(\{[\s\w,]+\})\s+from:\s+(['"].*?['"])/g, 'import $1 from $2')
  .replace(/import\s+(\{[\s\w,]+\})\s+from\s+(['"].*?['"])/g, 'import $1 from $2')
  
  // Fix async function declarations
  .replace(/async\s+function:\s+(\w+)/g, 'async function $1')
  .replace(/function:\s+(\w+)/g, 'function $1')
  
  // Fix object properties
  .replace(/(\w+):\s+\{/g, '$1: {')
  
  // Fix else: blocks
  .replace(/\}\s+else:\s+\{/g, '} else {')
  
  // Fix date creation
  .replace(/new:\s+Date\(\)/g, 'new Date()')
  
  // Fix await statements
  .replace(/await:\s+/g, 'await ')
  
  // Fix try: blocks
  .replace(/try:\s+\{/g, 'try {')
  
  // Fix catch blocks
  .replace(/catch\s+\((\w+):\s+(\w+)\)/g, 'catch ($1: $2)');

// Write the fixed content
fs.writeFileSync(SERVER_INDEX_PATH, fixedContent);
console.log(`Successfully fixed server/index.ts file.`);