/**
 * Fix 'const:' Syntax Errors in Storage.ts
 * 
 * This script corrects erroneous 'const:' declarations in storage.ts
 * by removing the colon.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import colors from 'colors';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup log file
const LOG_FILE = 'const-colons-fixes.log';
fs.writeFileSync(LOG_FILE, '# const: Fixes Log\n\n', 'utf8');

/**
 * Log a message to both console and log file
 */
function log(message, color = colors.reset) {
  console.log(color(message));
  fs.appendFileSync(LOG_FILE, message + '\n', 'utf8');
}

/**
 * Create a backup of a file
 */
function backupFile(filePath) {
  const backupDir = path.join(__dirname, 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  const backupPath = path.join(
    backupDir, 
    `${path.basename(filePath)}.${Date.now()}.bak`
  );
  
  fs.copyFileSync(filePath, backupPath);
  log(`Created backup: ${backupPath}`, colors.yellow);
}

/**
 * Fix 'const:' errors in server/storage.ts
 */
function fixConstColons() {
  const filePath = path.join(__dirname, 'server', 'storage.ts');
  log(`\nProcessing: ${filePath}`, colors.cyan);
  
  // Create backup
  backupFile(filePath);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Replace all 'const:' with 'const '
    const pattern = /const:(\s+)/g;
    content = content.replace(pattern, 'const$1');
    
    // Count replacements
    const replacements = (originalContent.match(pattern) || []).length;
    
    // Replace all 'new:' with 'new '
    const newPattern = /new:(\s+)/g;
    content = content.replace(newPattern, 'new$1');
    
    // Count new replacements
    const newReplacements = (originalContent.match(newPattern) || []).length;
    
    // Save the file
    fs.writeFileSync(filePath, content, 'utf8');
    
    // Log results
    log(`✅ Fixed ${replacements} 'const:' errors and ${newReplacements} 'new:' errors in ${filePath}`, colors.green);
  } catch (error) {
    log(`❌ Error processing ${filePath}: ${error.message}`, colors.red);
  }
}

/**
 * Fix 'type ' missing colons
 */
function fixMissingTypeColons() {
  const filePath = path.join(__dirname, 'server', 'storage.ts');
  log(`\nProcessing missing type colons: ${filePath}`, colors.cyan);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Fix missing colons after 'type'
    // This pattern matches a line with 'type ' followed by word characters but no colon
    const pattern = /(\s+type\s+)(\w+)(?!\s*:)/g;
    content = content.replace(pattern, '$1$2:');
    
    // Count replacements
    const replacements = content !== originalContent ? 
      (originalContent.match(pattern) || []).length : 0;
    
    // Save the file if changes were made
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      log(`✅ Fixed ${replacements} missing type colons in ${filePath}`, colors.green);
    } else {
      log(`No missing type colons found in ${filePath}`, colors.yellow);
    }
  } catch (error) {
    log(`❌ Error fixing type colons in ${filePath}: ${error.message}`, colors.red);
  }
}

/**
 * Fix arrow function syntax errors
 */
function fixArrowFunctionErrors() {
  const filePath = path.join(__dirname, 'server', 'storage.ts');
  log(`\nProcessing arrow function errors: ${filePath}`, colors.cyan);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace incorrect 'if (existingUsage) => {' with 'if (existingUsage) {'
    const arrowPattern = /if\s*\(([^)]+)\)\s*=>\s*\{/g;
    const fixedContent = content.replace(arrowPattern, 'if ($1) {');
    
    // Count replacements
    const replacements = (content.match(arrowPattern) || []).length;
    
    // Save the file if changes were made
    if (fixedContent !== content) {
      fs.writeFileSync(filePath, fixedContent, 'utf8');
      log(`✅ Fixed ${replacements} arrow function errors in ${filePath}`, colors.green);
    } else {
      log(`No arrow function errors found in ${filePath}`, colors.yellow);
    }
  } catch (error) {
    log(`❌ Error fixing arrow functions in ${filePath}: ${error.message}`, colors.red);
  }
}

/**
 * Fix semicolons after SELECT ... FROM ... WHERE ...
 */
function fixSemicolonsInQueries() {
  const filePath = path.join(__dirname, 'server', 'storage.ts');
  log(`\nProcessing semicolons in database queries: ${filePath}`, colors.cyan);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace semicolons between WHERE and ORDER BY/GROUP BY
    const pattern = /\.where\([^;)]+\);(\s+)\.(?:orderBy|groupBy)/g;
    const fixedContent = content.replace(pattern, '.where($&$1).');
    
    // Count replacements
    const replacements = (content.match(pattern) || []).length;
    
    // Save the file if changes were made
    if (fixedContent !== content) {
      fs.writeFileSync(filePath, fixedContent, 'utf8');
      log(`✅ Fixed ${replacements} semicolon errors in queries in ${filePath}`, colors.green);
    } else {
      // Try a more direct approach if the first pattern didn't match
      const directPattern = /\.where\(.*\);(\s+)\.orderBy/g;
      const directFix = content.replace(directPattern, (match) => {
        return match.replace(';', '');
      });
      
      if (directFix !== content) {
        fs.writeFileSync(filePath, directFix, 'utf8');
        const directReplacements = (content.match(directPattern) || []).length;
        log(`✅ Fixed ${directReplacements} direct semicolon errors in ${filePath}`, colors.green);
      } else {
        log(`No semicolon errors found in queries in ${filePath}`, colors.yellow);
      }
    }
  } catch (error) {
    log(`❌ Error fixing semicolons in ${filePath}: ${error.message}`, colors.red);
  }
}

/**
 * Main function
 */
function main() {
  log('🔧 Starting to fix const colon syntax errors...', colors.blue);
  
  // Fix const: errors
  fixConstColons();
  
  // Fix missing type colons
  fixMissingTypeColons();
  
  // Fix arrow function errors
  fixArrowFunctionErrors();
  
  // Fix semicolons in SQL queries
  fixSemicolonsInQueries();
  
  log('\n✅ All fixes applied!', colors.green);
}

// Run the script
main();