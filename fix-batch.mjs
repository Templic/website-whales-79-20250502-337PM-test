/**
 * Batch Fix for TypeScript Syntax Errors
 * 
 * This script directly edits server/routes.ts to fix common syntax errors
 * using simple string replacements.
 */

import fs from 'fs';

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

// Targeted direct string replacements
let fixedContent = content;

// Fix 1: Array with semicolons at line 119
fixedContent = fixedContent.replace("'/api/stripe-webhook';", "'/api/stripe-webhook'");

// Fix 2: Arrow function in conditional at line 227
fixedContent = fixedContent.replace("if (fullUserRecord) => {", "if (fullUserRecord) {");

// Fix 3: Line 233 conditional with semicolon
fixedContent = fixedContent.replace("(username === 'superadmin' && password === 'superadmin123') || ;", 
                              "(username === 'superadmin' && password === 'superadmin123') || ");

// Fix 4: Fix trailing semicolons in object properties
fixedContent = fixedContent.replace("sameSite: 'strict';", "sameSite: 'strict'");

// Fix 5: Fix trailing semicolons in other objects
fixedContent = fixedContent.replace("super_admin: users.filter(user => user.role === 'super_admin').length;", 
                              "super_admin: users.filter(user => user.role === 'super_admin').length");

// Fix 6: Fix async/await syntax
fixedContent = fixedContent.replace("await: verifyApiSecurity()", "await verifyApiSecurity()");

// Write the fixed content
fs.writeFileSync(ROUTES_FILE, fixedContent);
console.log(`Fixed and wrote ${ROUTES_FILE}`);

console.log('Batch fix complete!');