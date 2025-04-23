/**
 * Fix React Import Errors Script
 * 
 * This script automatically fixes the "React refers to a UMD global, but the current file is a module" 
 * TypeScript errors by adding the proper React import statement to files missing it.
 * 
 * Usage: node fix-react-import-errors.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name from ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

// Check if a file already has a React import
function hasReactImport(content) {
  const reactImportRegex = /^\s*import\s+React(\s*,\s*\{\s*([^}]+)\s*\}|\s*,\s*([^{]+)|\s*from\s+).*?['"]react['"];?/m;
  return reactImportRegex.test(content);
}

// Add React import to a file if it doesn't already have one
function addReactImport(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Skip if React is already imported
    if (hasReactImport(content)) {
      console.log(`${colors.yellow}Already has React import:${colors.reset} ${filePath}`);
      return false;
    }
    
    // Create a backup
    const backupPath = `${filePath}.react-import-backup`;
    fs.writeFileSync(backupPath, content);
    
    // Check if the file actually uses React JSX or React references
    const usesReactRegex = /(<\s*[A-Z][A-Za-z0-9]*|<\s*[a-z][A-Za-z0-9]*|React\.)/;
    if (!usesReactRegex.test(content)) {
      console.log(`${colors.yellow}No React usage detected:${colors.reset} ${filePath}`);
      return false;
    }
    
    // Add React import at the top, after any initial comments
    let importStatement = 'import React from "react";\n';
    
    // If there's a shebang or license comment at the top, preserve it
    const initialCommentRegex = /^(\/\*[\s\S]*?\*\/|\/\/.*?\n|#!.*?\n)+/;
    const initialComment = content.match(initialCommentRegex);
    
    if (initialComment) {
      // Insert after the initial comment
      content = content.replace(initialCommentRegex, match => match + importStatement);
    } else {
      // Insert at the beginning
      content = importStatement + content;
    }
    
    // Write the fixed content back
    fs.writeFileSync(filePath, content);
    console.log(`${colors.green}Added React import to:${colors.reset} ${filePath}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}Error processing ${filePath}:${colors.reset}`, error.message);
    return false;
  }
}

// Find all TypeScript/TSX files in a directory recursively
function findTsFiles(dir) {
  let results = [];
  
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    
    // Skip node_modules, hidden directories, and other non-source directories
    if (file === 'node_modules' || file === '.git' || file.startsWith('.')) {
      continue;
    }
    
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Recursively search subdirectories
      results = results.concat(findTsFiles(fullPath));
    } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
      // Only process TypeScript React files
      results.push(fullPath);
    }
  }
  
  return results;
}

// Main function
async function main() {
  console.log(`${colors.blue}Fixing React import errors...${colors.reset}`);
  
  // Find all TypeScript files in client/src directory
  const clientSrcDir = path.join(__dirname, 'client/src');
  console.log(`${colors.blue}Searching for TypeScript React files in:${colors.reset} ${clientSrcDir}`);
  
  let tsxFiles;
  try {
    tsxFiles = findTsFiles(clientSrcDir);
    console.log(`${colors.blue}Found ${tsxFiles.length} TypeScript React files${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Error finding TypeScript files:${colors.reset}`, error.message);
    process.exit(1);
  }
  
  // Process all files
  let fixedCount = 0;
  for (const file of tsxFiles) {
    if (addReactImport(file)) {
      fixedCount++;
    }
  }
  
  console.log(`${colors.green}Fixed React import errors in ${fixedCount} files out of ${tsxFiles.length} total files${colors.reset}`);
}

// Run the script
try {
  main();
} catch (error) {
  console.error(`${colors.red}Error running script:${colors.reset}`, error);
}