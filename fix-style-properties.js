/**
 * Fix Style Properties in JSX Components
 * 
 * This script fixes the incorrect use of JSX syntax in style properties,
 * specifically where curly braces are used incorrectly in direct DOM style assignments.
 * 
 * Usage: node fix-style-properties.js
 */

import fs from 'fs';
import path from 'path';

// Configuration
const ROOT_DIR = '.';
const CLIENT_SRC_DIR = path.join(ROOT_DIR, 'client', 'src');
const BACKUP_DIR = './ts-fixes-backup';
const LOG_FILE = 'style-properties-fixes.log';

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log(`Created backup directory: ${BACKUP_DIR}`);
}

// Initialize log file
fs.writeFileSync(LOG_FILE, `Style Properties Fixes - ${new Date().toISOString()}\n\n`);

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
 * Fix incorrect style property assignments in a file
 */
function fixStyleProperties(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Pattern to match incorrect style property assignments: style.prop={value}
    // This pattern specifically targets DOM style property assignments, not JSX style props
    const incorrectStylePattern = /style\.([\w-]+)\s*=\s*\{\s*(\d+|['"].*?['"])\s*\}/g;
    
    // Check if the file contains incorrect style assignments
    if (incorrectStylePattern.test(content)) {
      backupFile(filePath);
      
      // Fix the style assignments: style.prop={value} -> style.prop=value
      const newContent = content.replace(incorrectStylePattern, (match, prop, value) => {
        // Handle number values directly and string values with quotes
        if (value.match(/^\d+$/)) {
          return `style.${prop}=${value}`;
        } else {
          // If it's a string already with quotes, remove the unnecessary braces
          return `style.${prop}=${value}`;
        }
      });
      
      fs.writeFileSync(filePath, newContent, 'utf8');
      log(`Fixed style properties in: ${filePath}`);
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
  log('Starting style properties fixes...');
  
  // Find all TypeScript files
  const files = findTypeScriptFiles(CLIENT_SRC_DIR);
  log(`Found ${files.length} TypeScript files to process`);
  
  let fixedFiles = 0;
  
  // Process each file
  for (const file of files) {
    if (fixStyleProperties(file)) {
      fixedFiles++;
    }
  }
  
  log(`\nComplete! Fixed style properties in ${fixedFiles} files`);
}

// Run the main function
main();