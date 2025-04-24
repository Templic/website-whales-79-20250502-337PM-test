/**
 * Comprehensive TypeScript Error Fixer
 * 
 * This script automatically fixes common TypeScript errors across the codebase, focusing on:
 * - Function declarations with colons (function: name)
 * - Return statements with colons (return: value)
 * - If statements with arrows (if (condition) => {})
 * - Switch statements with arrows (switch(value) => {})
 * - Case statements with colons and commas (case: value:,)
 * - Try statements with colons (try: {})
 * - Indentation and brace issues
 * 
 * Usage: node fix-typescript-errors.mjs [file or directory]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory of current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Default target is server directory if not provided
const targetPath = process.argv[2] || path.join(__dirname, 'server');

// List of TypeScript file extensions
const TS_EXTENSIONS = ['.ts', '.tsx'];

// Counter for modified files
let modifiedFiles = 0;

/**
 * Check if a file is a TypeScript file
 */
function isTypeScriptFile(filePath) {
  const ext = path.extname(filePath);
  return TS_EXTENSIONS.includes(ext);
}

/**
 * Find all TypeScript files in a directory recursively
 */
function findTypeScriptFiles(dir) {
  const files = [];
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && !entry.name.startsWith('node_modules') && !entry.name.startsWith('.git')) {
        // Recursively process subdirectories
        files.push(...findTypeScriptFiles(fullPath));
      } else if (entry.isFile() && isTypeScriptFile(fullPath)) {
        // Add TypeScript file to list
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }
  
  return files;
}

/**
 * Create a backup of a file
 */
function backupFile(filePath) {
  const backupPath = filePath + '.bak';
  
  try {
    fs.copyFileSync(filePath, backupPath);
    return true;
  } catch (error) {
    console.error(`Error creating backup for ${filePath}:`, error);
    return false;
  }
}

/**
 * Fix TypeScript errors in a file
 */
function fixFile(filePath) {
  try {
    // Create backup
    if (!backupFile(filePath)) {
      return false;
    }
    
    // Read file content
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Fix function declarations with colons
    content = content.replace(/function:\s+([a-zA-Z0-9_]+)/g, 'function $1');
    
    // Fix function return type with multiple colons
    content = content.replace(/\):\s+([a-zA-Z0-9_'"\\[\\]|<>]+):\s+{/g, '): $1 {');
    
    // Fix if statements with arrows
    content = content.replace(/if\s+\\(([^\\)]+)\\)\s+=>\s+{/g, 'if ($1) {');
    
    // Fix switch statements with arrows
    content = content.replace(/switch\s*\\(([^\\)]+)\\)\s+=>\s+{/g, 'switch($1) {');
    
    // Fix case statements with colons and commas
    content = content.replace(/case:\s+(['"][^'"]+['"]):/g, 'case $1:');
    content = content.replace(/case:\s+(['"][^'"]+['"])(,)/g, 'case $1:');
    
    // Fix return statements with colons
    content = content.replace(/return:\s+/g, 'return ');
    
    // Fix try statements with colons
    content = content.replace(/try:\s+{/g, 'try {');
    
    // Fix missing curly braces after if statements
    content = content.replace(/(if\s*\\([^\\)]+\\)\s*[^{]*\n\s+[^\s{])/g, '$1\n}');
    
    // Fix incorrect indentation for closing braces
    content = content.replace(/}(\n\s+)}/g, '}\n$1}');
    
    // Fix commas in export statements
    content = content.replace(/export\s+{([^}]+),(\s*)}/g, 'export {$1$2}');
    
    // Fix extra closing braces
    content = content.replace(/}\s*}/g, '}');
    
    // If we made changes, write them back
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed TypeScript errors in ${filePath}`);
      modifiedFiles++;
      return true;
    } else {
      console.log(`No TypeScript errors found in ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error);
    return false;
  }
}

/**
 * Main function
 */
function main() {
  console.log(`Finding TypeScript files in ${targetPath}...`);
  
  let files = [];
  
  // Check if target is a file or directory
  const stat = fs.statSync(targetPath);
  
  if (stat.isFile() && isTypeScriptFile(targetPath)) {
    // Target is a single TypeScript file
    files = [targetPath];
  } else if (stat.isDirectory()) {
    // Target is a directory, find all TypeScript files
    files = findTypeScriptFiles(targetPath);
  } else {
    console.error('Target must be a TypeScript file or directory');
    process.exit(1);
  }
  
  console.log(`Found ${files.length} TypeScript files`);
  
  // Process each file
  for (const file of files) {
    fixFile(file);
  }
  
  console.log(`\nFixed TypeScript errors in ${modifiedFiles} files`);
}

// Run the main function
main();