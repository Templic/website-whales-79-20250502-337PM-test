/**
 * Comprehensive Syntax Error Fixer
 * 
 * This script automatically repairs common syntax errors across the codebase:
 * - Fixes "new: Error" to "new Error"
 * - Fixes "try: {" to "try {"
 * - Fixes "const: {" to "const {"
 * - Fixes "await: " to "await "
 * - Fixes "type: " to "type "
 * - Fixes other malformed declarations with colons
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure logging
const logFile = 'syntax-error-fixes.log';
fs.writeFileSync(logFile, ''); // Clear log file

/**
 * Log a message to both console and log file
 */
function log(message, color = chalk.white) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(color(logMessage));
  fs.appendFileSync(logFile, logMessage + '\n');
}

/**
 * Create backup of a file
 */
function backupFile(filePath) {
  const backupPath = `${filePath}.backup`;
  fs.copyFileSync(filePath, backupPath);
  return backupPath;
}

/**
 * Find all TypeScript files in a directory recursively
 */
function findTypeScriptFiles(dir) {
  let results = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const itemPath = path.join(dir, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory() && !item.startsWith('node_modules') && !item.startsWith('.git')) {
      results = results.concat(findTypeScriptFiles(itemPath));
    } else if (stat.isFile() && (itemPath.endsWith('.ts') || itemPath.endsWith('.tsx'))) {
      results.push(itemPath);
    }
  }
  
  return results;
}

/**
 * Fix syntax errors in a file
 */
function fixSyntaxErrors(filePath) {
  log(`Processing ${filePath}...`, chalk.blue);
  
  // Create backup
  const backupPath = backupFile(filePath);
  
  // Read file
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Define patterns to fix
  const patterns = [
    { find: /new: Error/g, replace: 'new Error' },
    { find: /try: {/g, replace: 'try {' },
    { find: /catch: \(/g, replace: 'catch (' },
    { find: /const: {/g, replace: 'const {' },
    { find: /const: (\w+)/g, replace: 'const $1' },
    { find: /let: (\w+)/g, replace: 'let $1' },
    { find: /await: /g, replace: 'await ' },
    { find: /async: /g, replace: 'async ' },
    { find: /type: /g, replace: 'type ' },
    { find: /function: /g, replace: 'function ' },
    { find: /export: /g, replace: 'export ' },
    { find: /else: {/g, replace: 'else {' },
    { find: /else: if/g, replace: 'else if' },
    { find: /interface: /g, replace: 'interface ' },
    { find: /class: /g, replace: 'class ' },
    { find: /import: /g, replace: 'import ' },
    { find: /return: /g, replace: 'return ' },
    { find: /throw: /g, replace: 'throw ' },
    { find: /typeof: /g, replace: 'typeof ' },
    { find: /instanceof: /g, replace: 'instanceof ' },
    { find: /default: /g, replace: 'default ' }
  ];
  
  // Apply fixes
  let replacementsMade = 0;
  for (const pattern of patterns) {
    const replaced = content.replace(pattern.find, (match) => {
      replacementsMade++;
      return pattern.replace;
    });
    
    if (replaced !== content) {
      content = replaced;
    }
  }
  
  // Save changes if fixes were made
  if (replacementsMade > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    log(`Fixed ${replacementsMade} syntax errors in ${filePath}`, colors.green);
    return true;
  } else {
    log(`No syntax errors found in ${filePath}`, colors.yellow);
    return false;
  }
}

/**
 * Fix syntax errors in the server directory
 */
function fixServerFiles() {
  log('Scanning server directory for TypeScript files...', colors.blue);
  const files = findTypeScriptFiles('./server');
  log(`Found ${files.length} TypeScript files`, colors.blue);
  
  let fixedFilesCount = 0;
  for (const file of files) {
    const fixed = fixSyntaxErrors(file);
    if (fixed) fixedFilesCount++;
  }
  
  log(`Fixed syntax errors in ${fixedFilesCount} files`, colors.green);
}

/**
 * Fix the specific syntax errors in validation.ts
 */
function fixValidationFile() {
  const validationPath = './server/validation.ts';
  log(`Specifically targeting ${validationPath}...`, colors.blue);
  
  if (!fs.existsSync(validationPath)) {
    log(`File ${validationPath} does not exist!`, colors.red);
    return;
  }
  
  // Create backup
  const backupPath = backupFile(validationPath);
  
  // Read file
  let content = fs.readFileSync(validationPath, 'utf8');
  
  // Fix specific issues in validation.ts - semicolons after withMessage calls
  content = content.replace(/\.withMessage\([^)]+\);/g, (match) => {
    return match.replace(';', '');
  });
  
  // Fix new: Error issues
  content = content.replace(/throw new: Error\([^)]+\);/g, (match) => {
    return match.replace('new: ', 'new ');
  });

  // Fix param() followed by semicolons
  content = content.replace(/param\([^)]+\);/g, (match) => {
    return match.replace(';', '');
  });

  // Fix query() followed by semicolons
  content = content.replace(/query\([^)]+\);/g, (match) => {
    return match.replace(';', '');
  });

  // Fix body() followed by semicolons
  content = content.replace(/body\([^)]+\);/g, (match) => {
    return match.replace(';', '');
  });
  
  // Save changes
  fs.writeFileSync(validationPath, content, 'utf8');
  log(`Fixed validation.ts syntax errors`, colors.green);
}

/**
 * Main function
 */
function main() {
  log('Starting syntax error fixing process...', colors.blue);
  
  // Fix server files
  fixServerFiles();
  
  // Fix validation.ts specifically
  fixValidationFile();
  
  log('Syntax error fixing process completed!', colors.green);
}

main();