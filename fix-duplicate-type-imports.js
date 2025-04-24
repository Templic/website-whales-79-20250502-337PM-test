/**
 * Fix Duplicate Type Imports
 * 
 * This script fixes issues with duplicate type imports, 
 * particularly in components that have both a regular React import
 * and a type-only React import.
 * 
 * Usage: node fix-duplicate-type-imports.js
 */

import fs from 'fs';
import path from 'path';

// Configuration
const ROOT_DIR = '.';
const CLIENT_SRC_DIR = path.join(ROOT_DIR, 'client', 'src');
const COMPONENTS_DIR = path.join(CLIENT_SRC_DIR, 'components');
const COSMIC_FONTS_PATH = path.join(COMPONENTS_DIR, 'common', 'cosmic-fonts.tsx');
const BACKUP_DIR = './ts-fixes-backup';
const LOG_FILE = 'duplicate-type-imports-fixes.log';

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log(`Created backup directory: ${BACKUP_DIR}`);
}

// Initialize log file
fs.writeFileSync(LOG_FILE, `Duplicate Type Imports Fixes - ${new Date().toISOString()}\n\n`);

/**
 * Log a message to both console and log file
 */
function log(message) {
  console.log(message);
  fs.appendFileSync(LOG_FILE, message + '\n');
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
 * Fix duplicate type imports in cosmic-fonts.tsx
 */
function fixCosmicFonts() {
  if (!fs.existsSync(COSMIC_FONTS_PATH)) {
    log(`Error: Could not find cosmic-fonts.tsx at ${COSMIC_FONTS_PATH}`);
    return false;
  }
  
  try {
    // Read the file
    const content = fs.readFileSync(COSMIC_FONTS_PATH, 'utf8');
    
    // Create backup
    backupFile(COSMIC_FONTS_PATH);
    
    // Fix duplicate React imports
    const updatedContent = content
      .replace(/import\s+type\s+React\s+from\s+["']react["']\s*\n/g, '// Removed duplicate type React import\n');
    
    // Write the fixed content
    fs.writeFileSync(COSMIC_FONTS_PATH, updatedContent, 'utf8');
    log(`Fixed duplicate type imports in cosmic-fonts.tsx at: ${COSMIC_FONTS_PATH}`);
    return true;
  } catch (error) {
    log(`Error fixing duplicate type imports in cosmic-fonts.tsx: ${error.message}`);
    return false;
  }
}

/**
 * Fix duplicate type imports in all TypeScript files
 */
function fixAllDuplicateTypeImports() {
  const files = findTypeScriptFiles(COMPONENTS_DIR);
  let fixedFiles = 0;
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check if there are both regular and type imports of the same module
      const hasRegularReactImport = /import\s+(?!type).*\s+from\s+["']react["']/g.test(content);
      const hasTypeReactImport = /import\s+type\s+React\s+from\s+["']react["']/g.test(content);
      
      if (hasRegularReactImport && hasTypeReactImport) {
        backupFile(file);
        
        // Remove type imports when regular imports exist
        const updatedContent = content
          .replace(/import\s+type\s+React\s+from\s+["']react["']\s*\n/g, '// Removed duplicate type React import\n');
        
        fs.writeFileSync(file, updatedContent, 'utf8');
        log(`Fixed duplicate type imports in: ${file}`);
        fixedFiles++;
      }
    } catch (error) {
      log(`Error processing file ${file}: ${error.message}`);
    }
  }
  
  return fixedFiles;
}

/**
 * Main function
 */
function main() {
  log('Starting duplicate type imports fixes...');
  
  if (fixCosmicFonts()) {
    log('Successfully fixed duplicate type imports in cosmic-fonts.tsx');
  } else {
    log('Failed to fix duplicate type imports in cosmic-fonts.tsx');
  }
  
  const fixedFilesCount = fixAllDuplicateTypeImports();
  log(`Fixed duplicate type imports in ${fixedFilesCount} files in total`);
}

// Run the main function
main();