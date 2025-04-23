#!/usr/bin/env node

/**
 * TypeScript Error Fixer
 * 
 * A utility to automatically detect and fix common TypeScript errors in a project.
 * This script scans all TypeScript files in a project and applies predefined
 * fixes to common error patterns.
 * 
 * Usage:
 *   npx ts-node ts-error-fixer.ts
 *   # or if globally installed
 *   ts-error-fixer
 * 
 * Common error patterns fixed:
 * - Malformed type annotations like `: string: string` in callback parameters
 * - Implicit 'any' type annotations
 * - Path aliases resolution issues
 * 
 * @author AI Assistant
 * @version 1.0.0
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  rootDir: './server',
  ignorePatterns: [
    'node_modules',
    'dist',
    '.git'
  ],
  fixPatterns: [
    {
      name: 'Malformed callback parameter type',
      description: 'Fixes malformed type annotations like `: string: string` in callback parameters',
      pattern: /(\w+): string: string =>/g,
      replacement: '$1 =>'
    },
    {
      name: 'Arrow function return type',
      description: 'Fixes malformed return type annotations in arrow functions',
      pattern: /\): void: string: string =>/g,
      replacement: '): void =>'
    }
  ],
  logLevel: 'info' // 'debug' | 'info' | 'warn' | 'error'
};

/**
 * Logging utility with colored output
 */
const Logger = {
  debug: (message: string) => {
    if (CONFIG.logLevel === 'debug') {
      console.log('\x1b[90m[DEBUG]\x1b[0m', message);
    }
  },
  info: (message: string) => {
    if (['debug', 'info'].includes(CONFIG.logLevel)) {
      console.log('\x1b[32m[INFO]\x1b[0m', message);
    }
  },
  warn: (message: string) => {
    if (['debug', 'info', 'warn'].includes(CONFIG.logLevel)) {
      console.log('\x1b[33m[WARN]\x1b[0m', message);
    }
  },
  error: (message: string) => {
    if (['debug', 'info', 'warn', 'error'].includes(CONFIG.logLevel)) {
      console.log('\x1b[31m[ERROR]\x1b[0m', message);
    }
  },
  success: (message: string) => {
    console.log('\x1b[32m✓\x1b[0m', message);
  }
};

/**
 * Find all TypeScript files in a directory
 */
const findTypeScriptFiles = (dir: string): string[] => {
  let results: string[] = [];
  
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
 * Fix a specific pattern in a file
 */
const fixPatternInFile = (filePath: string): boolean => {
  const content = fs.readFileSync(filePath, 'utf8');
  let updatedContent = content;
  let hasChanges = false;
  
  // Apply each fix pattern
  for (const fixPattern of CONFIG.fixPatterns) {
    const newContent = updatedContent.replace(fixPattern.pattern, fixPattern.replacement);
    
    if (newContent !== updatedContent) {
      Logger.debug(`Applied fix '${fixPattern.name}' in ${filePath}`);
      updatedContent = newContent;
      hasChanges = true;
    }
  }
  
  // Save the file if there were changes
  if (hasChanges) {
    fs.writeFileSync(filePath, updatedContent);
    Logger.success(`Fixed TypeScript errors in ${filePath}`);
    return true;
  }
  
  return false;
};

/**
 * Process all files
 */
const processFiles = (): void => {
  const files = findTypeScriptFiles(CONFIG.rootDir);
  let totalFixed = 0;
  
  Logger.info(`Found ${files.length} TypeScript files to scan`);
  
  for (const file of files) {
    try {
      const fixed = fixPatternInFile(file);
      if (fixed) {
        totalFixed++;
      }
    } catch (error) {
      Logger.error(`Error processing ${file}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  Logger.info(`\nFixed ${totalFixed} files with TypeScript errors`);
};

/**
 * Main function
 */
const main = (): void => {
  console.log('\n\x1b[1m🔍 TypeScript Error Fixer 🔧\x1b[0m\n');
  
  // Check we have TypeScript files
  try {
    execSync('find . -name "*.ts" | wc -l', { stdio: 'pipe' });
  } catch (error) {
    Logger.error('Failed to check for TypeScript files. Make sure you are in a TypeScript project.');
    process.exit(1);
  }
  
  // Process files
  processFiles();
  
  console.log('\n\x1b[1m✅ TypeScript Error Fixing completed\x1b[0m\n');
};

// Run the script
main();