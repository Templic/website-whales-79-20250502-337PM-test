/**
 * Fix @/lib/utils Imports
 * 
 * This script identifies and resolves any import issues related to the @/lib/utils module
 * by ensuring that components use the proper import path and have the correct import statement.
 * 
 * Usage: node fix-lib-utils-imports.js
 */

import fs from 'fs';
import path from 'path';

// Configuration
const ROOT_DIR = '.';
const BACKUP_DIR = './ts-fixes-backup';
const CLIENT_SRC_DIR = path.join(ROOT_DIR, 'client', 'src');
const EXCLUDED_DIRS = ['node_modules', '.git', 'dist', 'build', '.config', '.cache', '.vscode', BACKUP_DIR];
const UTILS_PATH = path.join(CLIENT_SRC_DIR, 'lib', 'utils.ts');
const LOG_FILE = 'lib-utils-fixes.log';

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log(`Created backup directory: ${BACKUP_DIR}`);
}

// Initialize log file
fs.writeFileSync(LOG_FILE, `@/lib/utils Import Fixes - ${new Date().toISOString()}\n\n`);

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
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(filePath, backupPath);
    log(`Backed up: ${filePath} to ${backupPath}`);
  }
}

/**
 * Check if file contains import from @/lib/utils
 */
function hasUtilsImport(content) {
  return /import\s+.*?\s+from\s+['"]@\/lib\/utils['"]/i.test(content);
}

/**
 * Check if file contains 'cn' function usage
 */
function usesCnFunction(content) {
  return /cn\s*\(/i.test(content) || /className=\{cn\(/i.test(content);
}

/**
 * Add import for @/lib/utils
 */
function addUtilsImport(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // If already has the import, skip
    if (hasUtilsImport(content)) {
      return false;
    }
    
    // Check if file uses the cn function
    if (usesCnFunction(content)) {
      // Create backup
      backupFile(filePath);
      
      // Add the import after React import if it exists
      if (content.includes('import React')) {
        content = content.replace(
          /import React.*?;(\r?\n|\r)/,
          (match) => `${match}import { cn } from "@/lib/utils";\n`
        );
      } else {
        // Add at the top of the file
        content = `import { cn } from "@/lib/utils";\n${content}`;
      }
      
      fs.writeFileSync(filePath, content, 'utf8');
      log(`Added @/lib/utils import to: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    log(`Error processing ${filePath}: ${error.message}`);
    return false;
  }
}

/**
 * Create the utils.ts file if it doesn't exist
 */
function createUtilsModule() {
  const libDir = path.join(CLIENT_SRC_DIR, 'lib');
  
  // Create the lib directory if it doesn't exist
  if (!fs.existsSync(libDir)) {
    fs.mkdirSync(libDir, { recursive: true });
    log(`Created directory: ${libDir}`);
  }
  
  // Create the utils.ts file if it doesn't exist
  if (!fs.existsSync(UTILS_PATH)) {
    const content = `/**
 * Utility Functions
 * 
 * Common utility functions used throughout the application.
 */
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names with Tailwind classes
 * Uses clsx and tailwind-merge to handle conditional classes and conflicts
 */
export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}
`;
    
    fs.writeFileSync(UTILS_PATH, content, 'utf8');
    log(`Created utils module at: ${UTILS_PATH}`);
    return true;
  }
  
  return false;
}

/**
 * Fix all files with @/lib/utils import
 */
function fixAllFiles() {
  // First create the utils module if needed
  createUtilsModule();
  
  // Find all TypeScript files
  const tsFiles = findTypeScriptFiles(CLIENT_SRC_DIR);
  log(`Found ${tsFiles.length} TypeScript files to process`);
  
  let fixedCount = 0;
  
  // Add import where needed
  for (const file of tsFiles) {
    if (addUtilsImport(file)) {
      fixedCount++;
    }
  }
  
  log(`\nComplete! Added @/lib/utils import to ${fixedCount} files`);
}

// Run the main function
fixAllFiles();