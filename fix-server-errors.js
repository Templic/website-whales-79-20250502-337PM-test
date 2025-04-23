#!/usr/bin/env node

/**
 * Server TypeScript Error Fixer
 * 
 * A targeted script to fix critical TypeScript errors preventing server startup.
 * Focuses specifically on malformed type annotations in the server directory.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  directory: './server',
  backupDirectory: './server-backup',
  ignorePatterns: [
    'node_modules',
    'dist',
    '.git',
    'build',
    'coverage'
  ],
  logLevel: 'info'
};

/**
 * Logging utility
 */
const Logger = {
  debug: (message) => {
    if (CONFIG.logLevel === 'debug') {
      console.log('\x1b[90m[DEBUG]\x1b[0m', message);
    }
  },
  info: (message) => {
    if (['debug', 'info'].includes(CONFIG.logLevel)) {
      console.log('\x1b[32m[INFO]\x1b[0m', message);
    }
  },
  warn: (message) => {
    if (['debug', 'info', 'warn'].includes(CONFIG.logLevel)) {
      console.log('\x1b[33m[WARN]\x1b[0m', message);
    }
  },
  error: (message) => {
    if (['debug', 'info', 'warn', 'error'].includes(CONFIG.logLevel)) {
      console.log('\x1b[31m[ERROR]\x1b[0m', message);
    }
  },
  success: (message) => {
    console.log('\x1b[32m✓\x1b[0m', message);
  }
};

/**
 * Find all TypeScript files in a directory
 */
const findTypeScriptFiles = (dir) => {
  let results = [];
  
  // Skip if directory doesn't exist or is in ignore list
  if (!fs.existsSync(dir) || CONFIG.ignorePatterns.some(pattern => dir.includes(pattern))) {
    return results;
  }
  
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      results = results.concat(findTypeScriptFiles(filePath));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(filePath);
    }
  }
  
  return results;
};

/**
 * Create a backup of the server directory
 */
const createBackup = () => {
  if (fs.existsSync(CONFIG.backupDirectory)) {
    fs.rmSync(CONFIG.backupDirectory, { recursive: true, force: true });
  }
  
  fs.mkdirSync(CONFIG.backupDirectory, { recursive: true });
  
  const copyRecursive = (src, dest) => {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();
    
    if (isDirectory) {
      fs.mkdirSync(dest, { recursive: true });
      fs.readdirSync(src).forEach(childItemName => {
        copyRecursive(path.join(src, childItemName), path.join(dest, childItemName));
      });
    } else {
      fs.copyFileSync(src, dest);
    }
  };
  
  copyRecursive(CONFIG.directory, CONFIG.backupDirectory);
  Logger.success(`Created backup at ${CONFIG.backupDirectory}`);
};

/**
 * Fix TypeScript errors in a file
 */
const fixFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  let hasChanges = false;
  
  // Fix pattern: paramName: any in function calls - remove the : any part
  const functionCallPattern = /\(([^)]*)\)/g;
  content = content.replace(functionCallPattern, (match) => {
    // Only process if contains ": any"
    if (!match.includes(': any')) return match;
    
    const fixed = match.replace(/(\w+): any([,)])/g, '$1$2');
    if (fixed !== match) {
      hasChanges = true;
    }
    return fixed;
  });
  
  // Fix pattern: variable: any - remove the : any part outside of type declarations
  const variablePattern = /(\w+): any(?!\s*=[^=])/g;
  content = content.replace(variablePattern, (match, p1) => {
    hasChanges = true;
    return p1;
  });
  
  // Fix pattern: catch (error: any) - preserve this for type annotation
  content = content.replace(/catch \((\w+)\)(?!:)/g, (match, p1) => {
    hasChanges = true;
    return `catch (${p1}: any)`;
  });
  
  // Fix pattern: res.status(500: any) - remove the : any part
  content = content.replace(/(res\.status\([\d]+): any(\))/g, (match, p1, p2) => {
    hasChanges = true;
    return `${p1}${p2}`;
  });
  
  // If there were changes, write the file
  if (hasChanges) {
    fs.writeFileSync(filePath, content);
    Logger.success(`Fixed ${filePath}`);
    return true;
  }
  
  return false;
};

/**
 * Main function
 */
const main = () => {
  console.log('\n\x1b[1m🔧 Server TypeScript Error Fixer\x1b[0m\n');
  
  // Create backup
  createBackup();
  
  // Find all TypeScript files
  const files = findTypeScriptFiles(CONFIG.directory);
  Logger.info(`Found ${files.length} TypeScript files to scan`);
  
  // Process files
  let totalFixed = 0;
  
  for (const file of files) {
    try {
      const fixed = fixFile(file);
      if (fixed) {
        totalFixed++;
      }
    } catch (error) {
      Logger.error(`Error processing ${file}: ${error.message}`);
    }
  }
  
  Logger.info(`\nFixed ${totalFixed} files with TypeScript errors`);
  console.log('\n\x1b[1m✅ Completed!\x1b[0m');
};

// Run the script
main();