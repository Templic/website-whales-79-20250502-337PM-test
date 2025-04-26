#!/usr/bin/env node

/**
 * TypeScript Storage Error Fixer
 * 
 * This utility specifically targets TypeScript errors related to database operations
 * and storage interfaces, with a focus on type mismatches between schema definitions
 * and code implementation.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');

// Configuration
const CONFIG = {
  storageFile: path.join(ROOT_DIR, 'server/storage.ts'),
  schemaFile: path.join(ROOT_DIR, 'shared/schema.ts'),
  createBackup: true,
  logLevel: 'info'
};

// Logging utility
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
 * Create a backup of a file
 */
const createBackup = (filePath) => {
  const backupPath = `${filePath}.backup`;
  fs.copyFileSync(filePath, backupPath);
  Logger.success(`Created backup at ${backupPath}`);
  return backupPath;
};

/**
 * Fix storage.ts issues
 */
const fixStorageFile = () => {
  Logger.info('Analyzing storage.ts file for TypeScript errors...');
  
  // Create backup if requested
  if (CONFIG.createBackup) {
    createBackup(CONFIG.storageFile);
  }
  
  // Read the file
  let content = fs.readFileSync(CONFIG.storageFile, 'utf8');
  const originalContent = content;
  let fixCount = 0;
  
  // Fix 1: Fix createUser method to properly handle varchar IDs
  const createUserPattern = /async createUser\(\s*insertUser: InsertUser\s*\): Promise<User> \{[^}]+\}/gs;
  const createUserMatch = content.match(createUserPattern);
  
  if (createUserMatch) {
    Logger.info('Found createUser method for inspection...');
    
    // Check for missing ID generation
    if (!createUserMatch[0].includes('id:')) {
      Logger.info('Missing ID generation in createUser method - adding UUID generation');
      
      // Add UUID import if not present
      if (!content.includes('import { v4 as uuidv4 }')) {
        content = content.replace(
          /import {/,
          'import { v4 as uuidv4 } from "uuid";\nimport {'
        );
        Logger.success('Added UUID import');
      }
      
      // Fix the createUser method to include ID generation
      const fixedCreateUser = createUserMatch[0].replace(
        /const \[user\] = await db/,
        'const userWithId = { ...insertUser, id: uuidv4() };\n    const [user] = await db'
      ).replace(
        /\.values\(insertUser\)/,
        '.values(userWithId)'
      );
      
      content = content.replace(createUserMatch[0], fixedCreateUser);
      fixCount++;
      Logger.success('Fixed createUser method to generate IDs for users');
    }
  }
  
  // Fix 2: Fix type mismatches in user-related queries
  let eqUserIdPattern = /eq\(users\.id,\s+(\w+)\)/g;
  let eqUserIdMatch;
  
  while ((eqUserIdMatch = eqUserIdPattern.exec(content)) !== null) {
    const paramName = eqUserIdMatch[1];
    
    // Look for type conversions needed
    if (content.includes(`${paramName}: number`) || 
        content.includes(`${paramName}?: number`) ||
        content.includes(`${paramName} as number`)) {
      
      // Add toString() for the parameter
      const fixedEqUserId = `eq(users.id, ${paramName}.toString())`;
      content = content.replace(eqUserIdMatch[0], fixedEqUserId);
      fixCount++;
      Logger.success(`Fixed user ID type mismatch for parameter: ${paramName}`);
    }
  }
  
  // Only write if changes were made
  if (fixCount > 0) {
    fs.writeFileSync(CONFIG.storageFile, content);
    Logger.success(`Made ${fixCount} fixes to ${CONFIG.storageFile}`);
  } else {
    Logger.info('No fixes needed for storage.ts');
  }
  
  return fixCount;
};

/**
 * Main function
 */
const main = async () => {
  console.log('\n\x1b[1m🔧 TypeScript Storage Error Fixer\x1b[0m\n');
  
  try {
    // Fix storage.ts
    const storageFixCount = fixStorageFile();
    
    // Summary
    console.log('\n\x1b[1m📊 Results Summary\x1b[0m');
    console.log(`Fixed ${storageFixCount} issues in storage.ts`);
    
    console.log('\n\x1b[1m✅ TypeScript Storage Error Fixer completed!\x1b[0m');
  } catch (error) {
    Logger.error(`An error occurred: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
};

// Run the script
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});