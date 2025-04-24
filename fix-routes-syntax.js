/**
 * Fix Routes.ts Syntax Errors
 * 
 * This focused script specifically targets syntax errors in server/routes.ts
 * to ensure it can compile correctly.
 * 
 * Usage: node fix-routes-syntax.js
 */

const fs = require('fs');
const colors = require('colors');

// Path to routes.ts
const ROUTES_FILE = 'server/routes.ts';

/**
 * Log a message to console with timestamp
 */
function log(message, color = colors.reset) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(color(`[${timestamp}] ${message}`));
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
 * Fix routes.ts syntax errors
 */
function fixRoutesSyntax() {
  try {
    // Read the file
    const content = fs.readFileSync(ROUTES_FILE, 'utf8');
    log(`Read ${ROUTES_FILE} (${content.length} bytes)`);
    
    // Make targeted fixes
    let fixedContent = content;
    
    // Fix 1: Array with semicolons instead of commas
    fixedContent = fixedContent.replace(/('\/api\/stripe-webhook');(\s*\])/g, "$1$2");
    fixedContent = fixedContent.replace(/\/api\/stripe-webhook';/g, "/api/stripe-webhook'");
    
    // Fix 2: Arrow function in conditional
    fixedContent = fixedContent.replace(/if \(([^)]+)\) => {/g, 'if ($1) {');
    
    // Fix 3: Line 227 arrow function issue
    fixedContent = fixedContent.replace(/if \(fullUserRecord\) => {/g, 'if (fullUserRecord) {');
    
    // Fix 4: Line 233 conditional with semicolon
    fixedContent = fixedContent.replace(/(username === 'superadmin' && password === 'superadmin123') \|\| ;/g,
                               "(username === 'superadmin' && password === 'superadmin123') || ");
    
    // Fix 5: Object closing with semicolon in auth section
    fixedContent = fixedContent.replace(/(\s+cookieOptions: {\s+httpOnly: true,\s+secure: [^,]+,\s+sameSite: '[^']+'\s+};)/g,
                               (match) => match.replace('};', '}'));
    
    // Fix 6: Fix sameSite value with trailing semicolon
    fixedContent = fixedContent.replace(/sameSite: 'strict';/g, "sameSite: 'strict'");
    
    // Fix 7: Fix super_admin with trailing semicolon
    fixedContent = fixedContent.replace(/super_admin: users\.filter\(user => user\.role === 'super_admin'\)\.length;/g,
                               "super_admin: users.filter(user => user.role === 'super_admin').length");
    
    // Check if changes were made
    if (fixedContent !== content) {
      // Backup the original file
      backupFile(ROUTES_FILE);
      
      // Write the fixed content
      fs.writeFileSync(ROUTES_FILE, fixedContent);
      log(`Fixed and wrote ${ROUTES_FILE}`, colors.green);
      return true;
    } else {
      log('No syntax errors found to fix', colors.yellow);
      return false;
    }
  } catch (error) {
    log(`Error fixing routes: ${error.message}`, colors.red);
    console.error(error);
    return false;
  }
}

/**
 * Main function
 */
function main() {
  log('Starting fix-routes-syntax.js...', colors.cyan);
  
  try {
    const success = fixRoutesSyntax();
    if (success) {
      log('DONE! Successfully fixed routes.ts syntax errors', colors.green);
    } else {
      log('No changes were made to routes.ts', colors.yellow);
    }
  } catch (error) {
    log(`ERROR: ${error.message}`, colors.red);
    console.error(error);
  }
}

// Run the main function
main();