#!/usr/bin/env node

/**
 * Fix Type Annotations Script
 * 
 * This script automatically fixes malformed type annotations across TypeScript files.
 * It specifically targets the pattern where `: any` appears after parameter names in
 * function calls rather than as proper type declarations.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  directories: ['./server', './src', './client'],
  ignorePatterns: [
    'node_modules',
    'dist',
    '.git',
    'build',
    'coverage'
  ],
  fixPatterns: [
    // Function call arguments
    {
      description: 'Remove ": any" from function call arguments',
      pattern: /(\w+): any([,)])/g,
      replacement: '$1$2'
    },
    // Function or method calls with multiple arguments
    {
      description: 'Fix method calls with multiple arguments',
      pattern: /\(([^)]*\w+): any([^)]*)\)/g,
      fix: (match) => {
        return match.replace(/(\w+): any([,)])/g, '$1$2');
      }
    },
    // Status method calls
    {
      description: 'Fix status method calls',
      pattern: /(res\.status\([\d]+): any(\))/g,
      replacement: '$1$2'
    },
    // Error as Error: any
    {
      description: 'Fix error as Error: any pattern',
      pattern: /\((\w+) as (\w+): any\)/g,
      replacement: '($1 as $2)'
    }
  ],
  createBackup: true,
  backupSuffix: '.bak',
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
 * Fix a file's type annotations
 */
const fixFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  let hasChanges = false;
  
  // Apply each fix pattern
  for (const fixPattern of CONFIG.fixPatterns) {
    if (typeof fixPattern.fix === 'function') {
      // Use custom fix function
      content = content.replace(fixPattern.pattern, (...args) => {
        const result = fixPattern.fix(...args);
        if (result !== args[0]) {
          Logger.debug(`Applied fix '${fixPattern.description}' in ${filePath}`);
          hasChanges = true;
        }
        return result;
      });
    } else {
      // Use simple pattern replacement
      const newContent = content.replace(fixPattern.pattern, fixPattern.replacement);
      if (newContent !== content) {
        Logger.debug(`Applied fix '${fixPattern.description}' in ${filePath}`);
        content = newContent;
        hasChanges = true;
      }
    }
  }
  
  // If there were changes, create backup and save the file
  if (hasChanges) {
    if (CONFIG.createBackup) {
      fs.writeFileSync(`${filePath}${CONFIG.backupSuffix}`, originalContent);
    }
    fs.writeFileSync(filePath, content);
    Logger.success(`Fixed type annotations in ${filePath}`);
    return true;
  }
  
  return false;
};

/**
 * Main function
 */
const main = () => {
  console.log('\n\x1b[1m🔧 TypeScript Type Annotation Fixer\x1b[0m\n');
  
  let allFiles = [];
  
  // Find all TypeScript files in the specified directories
  for (const dir of CONFIG.directories) {
    if (fs.existsSync(dir)) {
      const files = findTypeScriptFiles(dir);
      allFiles = allFiles.concat(files);
      Logger.info(`Found ${files.length} TypeScript files in ${dir}`);
    } else {
      Logger.warn(`Directory ${dir} does not exist, skipping`);
    }
  }
  
  if (allFiles.length === 0) {
    Logger.error('No TypeScript files found in the specified directories');
    return;
  }
  
  Logger.info(`Processing ${allFiles.length} TypeScript files...`);
  
  // Fix files
  let totalFixed = 0;
  
  for (const file of allFiles) {
    try {
      const fixed = fixFile(file);
      if (fixed) {
        totalFixed++;
      }
    } catch (error) {
      Logger.error(`Error processing ${file}: ${error.message}`);
    }
  }
  
  Logger.info(`\nFixed ${totalFixed} files with malformed type annotations`);
  
  if (totalFixed > 0) {
    console.log('\n\x1b[1m✅ TypeScript type annotation fixes applied successfully!\x1b[0m');
    
    if (CONFIG.createBackup) {
      console.log(`\nBackup files were created with the suffix "${CONFIG.backupSuffix}"`);
      console.log('You can restore them if needed or delete them once you confirm the fixes are correct.');
    }
  } else {
    console.log('\n\x1b[1m✅ No issues found that match the specified patterns.\x1b[0m');
  }
};

// Run the script
main();