/**
 * Fix Server-Side Syntax Errors
 * 
 * This script automatically fixes common syntax errors in server-side files,
 * such as missing commas, semicolons, colons, arrows, and bracket issues.
 * 
 * Usage: node fix-server-syntax-errors.js
 */

import fs from 'fs';
import path from 'path';
import colors from 'colors';

// Configuration
const ROOT_DIR = '.';
const SERVER_DIR = path.join(ROOT_DIR, 'server');
const BACKUP_DIR = './ts-fixes-backup/server-syntax';
const LOG_FILE = 'server-syntax-fixes.log';

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log(`Created backup directory: ${BACKUP_DIR}`);
}

// Initialize log file
fs.writeFileSync(LOG_FILE, `Server Syntax Error Fixes - ${new Date().toISOString()}\n\n`);

/**
 * Log a message to both console and log file
 */
function log(message, color = colors.reset) {
  console.log(color(message));
  fs.appendFileSync(LOG_FILE, message + '\n');
}

/**
 * Create a backup of a file
 */
function backupFile(filePath) {
  const filename = path.basename(filePath);
  const backupPath = path.join(BACKUP_DIR, filename);
  
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(filePath, backupPath);
    log(`Backed up: ${filePath} to ${backupPath}`);
  }
}

/**
 * Find all TypeScript files in a directory recursively
 */
function findTypeScriptFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      files.push(...findTypeScriptFiles(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * Fix syntax errors in a file
 */
function fixSyntaxErrors(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let updatedContent = content;
    let fixCount = 0;
    
    // Common syntax error patterns and their fixes
    const patterns = [
      // Fix missing commas
      { pattern: /(\w+)\s*\n\s*(\w+):\s*([^,;\n]+)(?!\s*[,;])/g, replacement: '$1,\n  $2: $3' },
      
      // Fix missing semicolons at the end of lines
      { pattern: /(\w+)\s*=\s*([^;{]+)(?!\s*[;{])\s*\n/g, replacement: '$1 = $2;\n' },
      
      // Fix missing colons in object properties
      { pattern: /(\s*)(\w+)\s+(\{|\[|"|'|`|\d+|\w+\()/g, replacement: '$1$2: $3' },
      
      // Fix arrow function syntax
      { pattern: /(\(\w+(?:,\s*\w+)*\))\s*(\{)/g, replacement: '$1 => $2' },
      
      // Fix missing commas in function arguments
      { pattern: /\(([^)]*\w+)\s+(\w+:[^,)]+)\)/g, replacement: '($1, $2)' },
      
      // Fix malformed object literals
      { pattern: /\{([^{}]*)\n\s*\}/g, replacement: (match, p1) => {
        // Add missing commas to object literal properties
        return '{' + p1.replace(/(\w+:[^,\n]+)\n\s*(?=\w+:)/g, '$1,\n  ') + '\n}';
      }},
      
      // Fix malformed TypeScript type declarations
      { pattern: /<T\$2,\s*R\$2>/g, replacement: '<T = any, R = any>' },
      
      // Fix malformed function declarations
      { pattern: /function\s+(\w+)\s*\(\s*(\w+)\$2\s*:\s*([^)]+)\)\s*\{/g, replacement: 'function $1($2: $3) {' },
      
      // Fix malformed class method declarations
      { pattern: /(\w+)\s*\(\s*(\w+)\$2\s*:\s*([^)]+)\)\s*\{/g, replacement: '$1($2: $3) {' },
      
      // Fix malformed interface declarations
      { pattern: /interface\s+(\w+)\s*\{\s*\n\s*(\w+)\$2\s*:\s*([^;\n]+)/g, replacement: 'interface $1 {\n  $2: $3' },
    ];
    
    for (const { pattern, replacement } of patterns) {
      const newContent = updatedContent.replace(pattern, replacement);
      if (newContent !== updatedContent) {
        fixCount += (updatedContent.match(pattern) || []).length;
        updatedContent = newContent;
      }
    }
    
    // Fix specific files with known errors
    if (filePath.includes('drizzleSecurity.ts')) {
      // Fix drizzleSecurity.ts specific issues
      updatedContent = fixDrizzleSecurity(updatedContent);
      fixCount++;
    } else if (filePath.includes('apiSecurity.ts')) {
      // Fix apiSecurity.ts specific issues
      updatedContent = fixApiSecurity(updatedContent);
      fixCount++;
    } else if (filePath.includes('SecurityHelpers.ts')) {
      // Fix SecurityHelpers.ts specific issues
      updatedContent = fixSecurityHelpers(updatedContent);
      fixCount++;
    }
    
    if (fixCount > 0) {
      backupFile(filePath);
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      log(`Fixed ${fixCount} syntax errors in: ${filePath}`, colors.green);
      return fixCount;
    }
    
    return 0;
  } catch (error) {
    log(`Error processing file ${filePath}: ${error.message}`, colors.red);
    return 0;
  }
}

/**
 * Fix drizzleSecurity.ts specific issues
 */
function fixDrizzleSecurity(content) {
  let updatedContent = content;
  
  // Fix parameter definitions with missing commas
  updatedContent = updatedContent.replace(
    /(\w+): (string|number|boolean|any|object)(?!\s*[,)])(\s+\w+)/g,
    '$1: $2,$3'
  );
  
  // Fix arrow function syntax
  updatedContent = updatedContent.replace(
    /(\w+)\s*\(([^)]+)\)\s*\{/g,
    '$1: ($2) => {'
  );
  
  // Fix declaration or statement expected errors
  updatedContent = updatedContent.replace(
    /}\s*(?![\n{};])/g,
    '};\n'
  );
  
  return updatedContent;
}

/**
 * Fix apiSecurity.ts specific issues
 */
function fixApiSecurity(content) {
  let updatedContent = content;
  
  // Fix parameter definitions with missing commas
  updatedContent = updatedContent.replace(
    /(\w+): (string|number|boolean|any|object)(?!\s*[,)])(\s+\w+)/g,
    '$1: $2,$3'
  );
  
  // Fix object property definitions with missing colons
  updatedContent = updatedContent.replace(
    /(\s*)(\w+)\s+(\{|\[|"|'|`|\d+|\w+\()/g,
    '$1$2: $3'
  );
  
  // Fix declaration or statement expected errors
  updatedContent = updatedContent.replace(
    /}\s*(?![\n{};])/g,
    '};\n'
  );
  
  return updatedContent;
}

/**
 * Fix SecurityHelpers.ts specific issues
 */
function fixSecurityHelpers(content) {
  let updatedContent = content;
  
  // Fix unknown keyword or identifier issues
  updatedContent = updatedContent.replace(
    /(\w+)\$2(\s*[,:)])/g,
    '$1: any$2'
  );
  
  // Fix closing parentheses issues
  updatedContent = updatedContent.replace(
    /(\w+)\s+(\w+)\s*\{/g,
    '$1($2) {'
  );
  
  return updatedContent;
}

/**
 * Main function
 */
function main() {
  log('Starting server syntax error fixes...', colors.cyan);
  
  const files = findTypeScriptFiles(SERVER_DIR);
  log(`Found ${files.length} TypeScript files to process`, colors.yellow);
  
  let totalFixedFiles = 0;
  let totalFixedErrors = 0;
  
  for (const file of files) {
    const fixCount = fixSyntaxErrors(file);
    if (fixCount > 0) {
      totalFixedFiles++;
      totalFixedErrors += fixCount;
    }
  }
  
  log(`\nSummary:`, colors.cyan);
  log(`Fixed ${totalFixedErrors} syntax errors in ${totalFixedFiles} files`, colors.green);
  log(`See ${LOG_FILE} for details`, colors.yellow);
}

// Run the main function
main();