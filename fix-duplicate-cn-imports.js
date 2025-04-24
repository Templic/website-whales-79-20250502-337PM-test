/**
 * Fix Duplicate cn Imports
 * 
 * This script identifies and fixes files that have duplicate cn imports
 * from the utils module, which causes TypeScript errors.
 * 
 * Usage: node fix-duplicate-cn-imports.js
 */

import fs from 'fs';
import path from 'path';

// Configuration
const ROOT_DIR = '.';
const CLIENT_SRC_DIR = path.join(ROOT_DIR, 'client', 'src');
const BACKUP_DIR = './ts-fixes-backup';
const LOG_FILE = 'duplicate-cn-imports-fixes.log';

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log(`Created backup directory: ${BACKUP_DIR}`);
}

// Initialize log file
fs.writeFileSync(LOG_FILE, `Duplicate cn Imports Fixes - ${new Date().toISOString()}\n\n`);

/**
 * Log a message to both console and log file
 */
function log(message) {
  console.log(message);
  fs.appendFileSync(LOG_FILE, message + '\n');
}

/**
 * Find all TypeScript files in a directory recursively
 */
function findTypeScriptFiles(dir) {
  let results = [];
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and hidden directories
      if (file !== 'node_modules' && !file.startsWith('.')) {
        results = results.concat(findTypeScriptFiles(filePath));
      }
    } else if (
      file.endsWith('.tsx') || 
      file.endsWith('.ts')
    ) {
      results.push(filePath);
    }
  }
  
  return results;
}

/**
 * Create a backup of a file
 */
function backupFile(filePath) {
  const backupPath = path.join(BACKUP_DIR, filePath.replace(/\//g, '_').replace(/\\/g, '_'));
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(filePath, backupPath);
    log(`Backed up: ${filePath} to ${backupPath}`);
  }
}

/**
 * Fix duplicate cn imports in a file
 */
function fixDuplicateCnImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for duplicate cn imports
    const aliasImport = /import\s+{\s*cn\s*}\s+from\s+["']@\/lib\/utils["'];?/;
    const relativeImport = /import\s+{\s*cn\s*}\s+from\s+["'][\.\/]+lib\/utils["'];?/;
    
    const hasAliasImport = aliasImport.test(content);
    const hasRelativeImport = relativeImport.test(content);
    
    // Only fix if both types of imports exist
    if (hasAliasImport && hasRelativeImport) {
      backupFile(filePath);
      
      // Remove the relative import and keep the alias import
      const newContent = content.replace(relativeImport, '');
      
      fs.writeFileSync(filePath, newContent, 'utf8');
      log(`Fixed duplicate cn imports in: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    log(`Error fixing ${filePath}: ${error.message}`);
    return false;
  }
}

/**
 * Main function
 */
function main() {
  log('Starting duplicate cn imports fixes...');
  
  // Find all TypeScript files
  const files = findTypeScriptFiles(CLIENT_SRC_DIR);
  log(`Found ${files.length} TypeScript files to process`);
  
  let fixedFiles = 0;
  
  // Process each file
  for (const file of files) {
    if (fixDuplicateCnImports(file)) {
      fixedFiles++;
    }
  }
  
  log(`\nComplete! Fixed duplicate cn imports in ${fixedFiles} files`);
}

// Run the main function
main();