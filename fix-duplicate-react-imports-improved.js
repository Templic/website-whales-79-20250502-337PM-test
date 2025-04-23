/**
 * Fix Duplicate React Imports - Improved
 * 
 * This script fixes the common issue of duplicate React imports in TypeScript files.
 * It uses a more reliable pattern matching approach and provides detailed logs.
 * 
 * Usage: node fix-duplicate-react-imports-improved.js
 */

import fs from 'fs';
import path from 'path';

// Configuration
const ROOT_DIR = '.';
const BACKUP_DIR = './ts-fixes-backup';
const CLIENT_SRC_DIR = path.join(ROOT_DIR, 'client', 'src');
const EXCLUDED_DIRS = ['node_modules', '.git', 'dist', 'build', '.config', '.cache', '.vscode', BACKUP_DIR];
const LOG_FILE = 'duplicate-react-import-fixes.log';

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log(`Created backup directory: ${BACKUP_DIR}`);
}

// Initialize log file
fs.writeFileSync(LOG_FILE, `Duplicate React Import Fixes - ${new Date().toISOString()}\n\n`);

/**
 * Log a message to both console and log file
 */
function log(message) {
  console.log(message);
  fs.appendFileSync(LOG_FILE, message + '\n');
}

/**
 * Recursively find all TypeScript files
 */
function findTypeScriptFiles(dir) {
  const result = [];
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    // Skip hidden files and directories
    if (file.startsWith('.') || EXCLUDED_DIRS.includes(file)) {
      continue;
    }
    
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      result.push(...findTypeScriptFiles(filePath));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      result.push(filePath);
    }
  }
  
  return result;
}

/**
 * Create a backup of a file
 */
function backupFile(filePath) {
  const backupPath = path.join(BACKUP_DIR, filePath.replace(/\//g, '_').replace(/\\/g, '_'));
  fs.copyFileSync(filePath, backupPath);
  log(`Backed up: ${filePath} to ${backupPath}`);
}

/**
 * Fix duplicate React imports in a file
 */
function fixDuplicateReactImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Pattern 1: Multiple import statements including React
    const pattern1 = /import\s+(?:\*\s+as\s+)?React\s+from\s+['"]react['"];\s*import\s+(?:\*\s+as\s+)?React\s+from\s+['"]react['"];/g;
    
    // Pattern 2: Multiple React imports with other imports in between
    const pattern2 = /import\s+\*\s+as\s+React\s+from\s+['"]react['"][\s\S]*?import\s+React\s+from\s+['"]react['"];/g;
    
    // Pattern 3: Comment followed by import
    const pattern3 = /\/\*[\s\S]*?\*\/\s*import\s+React\s+from\s+['"]react['"];\s*import\s+React\s+from\s+['"]react['"];/g;
    
    // Check if any pattern matches
    if (pattern1.test(content) || pattern2.test(content) || pattern3.test(content)) {
      // Make a backup before modifying
      backupFile(filePath);
      
      // Perform replacements
      let newContent = content;
      
      // Replace pattern 1
      newContent = newContent.replace(pattern1, 'import React from "react";');
      
      // Replace pattern 2
      newContent = newContent.replace(pattern2, 'import React from "react";');
      
      // Replace pattern 3
      newContent = newContent.replace(pattern3, (match) => {
        // Extract comment
        const commentMatch = match.match(/\/\*[\s\S]*?\*\//);
        const comment = commentMatch ? commentMatch[0] : '';
        return `${comment}\nimport React from "react";`;
      });
      
      // Fix pattern 4: Merge comment and import
      newContent = newContent.replace(/(\/\*[\s\S]*?\*\/)\s*import\s+React\s+from\s+['"]react['"];/g, '$1\nimport React from "react";');
      
      // Additional fix for inline comment imports
      newContent = newContent.replace(/\/\*[\s\S]*?\*\/import\s+React\s+from\s+['"]react['"];/g, (match) => {
        const commentMatch = match.match(/\/\*[\s\S]*?\*\//);
        return `${commentMatch[0]}\nimport React from "react";`;
      });
      
      // Write the fixed content back
      fs.writeFileSync(filePath, newContent);
      log(`Fixed duplicate React imports in: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    log(`Error processing ${filePath}: ${error.message}`);
    return false;
  }
}

// Main function
function main() {
  log('Starting duplicate React imports fix...');
  
  const tsxFiles = findTypeScriptFiles(CLIENT_SRC_DIR);
  log(`Found ${tsxFiles.length} TypeScript files to process`);
  
  let fixedCount = 0;
  
  for (const file of tsxFiles) {
    if (fixDuplicateReactImports(file)) {
      fixedCount++;
    }
  }
  
  log(`\nComplete! Fixed duplicate React imports in ${fixedCount} files`);
}

main();