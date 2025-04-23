/**
 * Fix Catch Clause Type Annotation Errors
 * 
 * This script fixes errors with catch clauses that use Error type annotation
 * instead of unknown or any.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Regex pattern to find catch clauses with Error type annotations
const badCatchPattern = /catch\s*\(\s*(\w+)\s*:\s*Error\s*\)/g;

// Replacement pattern with unknown type
const fixedCatchPattern = 'catch ($1: unknown)';

// Function to process a file
function fixCatchClausesInFile(filePath) {
  console.log(`Checking ${filePath}...`);
  
  // Create backup
  const backupPath = `${filePath}.catch-backup`;
  fs.copyFileSync(filePath, backupPath);
  
  // Read file content
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if the file has any matches
  const hasMatches = badCatchPattern.test(content);
  badCatchPattern.lastIndex = 0; // Reset regex index
  
  if (!hasMatches) {
    console.log(`  No catch clause issues found in ${filePath}`);
    fs.unlinkSync(backupPath); // Remove unnecessary backup
    return 0;
  }
  
  // Apply fix
  const fixedContent = content.replace(badCatchPattern, fixedCatchPattern);
  
  // Count replacements
  const matches = content.match(badCatchPattern) || [];
  const count = matches.length;
  
  // Write fixed content back
  fs.writeFileSync(filePath, fixedContent, 'utf8');
  
  console.log(`  Fixed ${count} catch clause issues in ${filePath}`);
  
  return count;
}

// Find all TypeScript files in directory
function findTypeScriptFiles(dir) {
  const results = [];
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and other non-source directories
      if (file !== 'node_modules' && file !== '.git' && !file.startsWith('.')) {
        results.push(...findTypeScriptFiles(filePath));
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(filePath);
    }
  }
  
  return results;
}

// Main function to process files
async function main() {
  console.log('\x1b[36m%s\x1b[0m', 'Fixing catch clause type annotation issues...');
  
  // Find all TypeScript files in client/src
  const clientSrcDir = path.join(__dirname, 'client/src');
  const tsFiles = findTypeScriptFiles(clientSrcDir);
  
  console.log(`Found ${tsFiles.length} TypeScript files to check.`);
  
  let totalFixed = 0;
  let filesFixed = 0;
  
  for (const filePath of tsFiles) {
    const fixed = fixCatchClausesInFile(filePath);
    if (fixed > 0) {
      filesFixed++;
      totalFixed += fixed;
    }
  }
  
  console.log('\x1b[32m%s\x1b[0m', `Fixed ${totalFixed} catch clause issues in ${filesFixed} files.`);
}

// Run the script
try {
  main();
} catch (error) {
  console.error('\x1b[31m%s\x1b[0m', 'Error fixing catch clause issues:', error);
}