/**
 * Fix Duplicate React Imports
 * 
 * This script identifies and fixes files that have duplicate React imports 
 * after running our previous fix scripts.
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

// Fix duplicate React imports in a file
function fixDuplicateReactImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check for duplicate React imports
    const defaultImportRegex = /^\s*import\s+React\s+from\s+["']react["'];?\s*$/gm;
    const namespaceImportRegex = /^\s*import\s+\*\s+as\s+React\s+from\s+["']react["'];?\s*$/gm;
    
    // Get all matches
    const defaultImports = [...content.matchAll(defaultImportRegex)].map(m => m[0]);
    const namespaceImports = [...content.matchAll(namespaceImportRegex)].map(m => m[0]);
    
    // If we have both types or multiple of either type, we need to fix
    if (defaultImports.length + namespaceImports.length > 1) {
      // Create a backup
      const backupPath = `${filePath}.react-import-backup`;
      fs.writeFileSync(backupPath, content);
      
      // Keep only one React import - prefer the namespace import if it exists
      if (namespaceImports.length > 0) {
        // Remove all default imports and keep only the first namespace import
        for (const importStmt of defaultImports) {
          content = content.replace(importStmt, '');
        }
        
        // Remove extra namespace imports after the first one
        const firstNamespaceImport = namespaceImports[0];
        for (let i = 1; i < namespaceImports.length; i++) {
          content = content.replace(namespaceImports[i], '');
        }
      } else {
        // Keep only the first default import and remove the rest
        const firstDefaultImport = defaultImports[0];
        for (let i = 1; i < defaultImports.length; i++) {
          content = content.replace(defaultImports[i], '');
        }
      }
      
      // Remove any empty lines created by our replacements
      content = content.replace(/^\s*[\r\n]{2,}/gm, '\n');
      
      // Write the fixed content back
      fs.writeFileSync(filePath, content);
      
      console.log(`${colors.green}Fixed duplicate React imports in:${colors.reset} ${filePath}`);
      return true;
    }
    
    return false;
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
    } else if (file.endsWith('.tsx') || file.endsWith('.jsx') || file.endsWith('.ts')) {
      // Process all TypeScript files
      results.push(fullPath);
    }
  }
  
  return results;
}

// Main function
async function main() {
  console.log(`${colors.blue}Fixing duplicate React imports...${colors.reset}`);
  
  // Find all TypeScript files in client/src directory
  const clientSrcDir = path.join(__dirname, 'client/src');
  console.log(`${colors.blue}Searching for TypeScript files in:${colors.reset} ${clientSrcDir}`);
  
  let tsFiles;
  try {
    tsFiles = findTsFiles(clientSrcDir);
    console.log(`${colors.blue}Found ${tsFiles.length} TypeScript files${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Error finding TypeScript files:${colors.reset}`, error.message);
    process.exit(1);
  }
  
  // Process all files
  let fixedCount = 0;
  for (const file of tsFiles) {
    if (fixDuplicateReactImports(file)) {
      fixedCount++;
    }
  }
  
  console.log(`${colors.green}Fixed duplicate React imports in ${fixedCount} files${colors.reset}`);
}

// Run the script
try {
  main();
} catch (error) {
  console.error(`${colors.red}Error running script:${colors.reset}`, error);
}