/**
 * Batch Fix for TypeScript Syntax Errors
 * 
 * This script directly edits server/routes.ts to fix common syntax errors
 * using simple string replacements.
 */

const fs = require('fs');

// File paths
const ROUTES_FILE = 'server/routes.ts';

console.log('Starting batch fix...');

// Back up the file
const backupPath = `${ROUTES_FILE}.bak`;
fs.copyFileSync(ROUTES_FILE, backupPath);
console.log(`Created backup: ${backupPath}`);

// Read the file
let content = fs.readFileSync(ROUTES_FILE, 'utf8');
console.log(`Read ${ROUTES_FILE} (${content.length} bytes)`);

// Fixes to apply
const fixes = [
  // Fix 1: Array with semicolons at line 119
  ['/api/stripe-webhook\';', "/api/stripe-webhook'"],
  
  // Fix 2: Arrow function in conditional at line 227
  ['if (fullUserRecord) => {', 'if (fullUserRecord) {'],
  
  // Fix 3: Line 233 conditional with semicolon
  [') || ;', ') || '],
  
  // Fix 4: Object closing with semicolon in auth section
  ['sameSite: \'strict\';', "sameSite: 'strict'"],
  
  // Fix 5: Fix super_admin with trailing semicolon
  ['super_admin\').length;', "super_admin').length"],
  
  // Fix 6: Fix colon in async api call
  ['await: verifyApiSecurity', 'await verifyApiSecurity'],
  
  // Fix 7: Fix cookie options
  ['cookieOptions: {', 'cookieOptions: {'],
  ['};', '}'],
  
  // Fix 8: Fix other arrow functions
  ['=> {', '=> {']
];

// Apply all fixes
let fixedContent = content;
for (const [target, replacement] of fixes) {
  fixedContent = fixedContent.replace(new RegExp(target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement);
}

// Write the fixed content
fs.writeFileSync(ROUTES_FILE, fixedContent);
console.log(`Fixed and wrote ${ROUTES_FILE}`);

console.log('Batch fix complete!');