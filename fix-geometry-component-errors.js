/**
 * Fix TypeScript Errors in Sacred Geometry Components
 * 
 * This focused script automatically fixes the malformed type annotations
 * in the sacred-geometry.tsx file's component parameters.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// File to fix
const filePath = path.join(__dirname, 'client/src/components/ui/cosmic/sacred-geometry.tsx');

// Pattern to find destructured parameters with `: any` annotations
const badPatternRegex = /children: any,\s*className: any,\s*glowColor = "rgba\((\d+): any, (\d+): any, (\d+): any, ([\d\.]+): any\)"/g;

// Replacement pattern with fixed structure
const fixedPattern = 'children,\n  className,\n  glowColor = "rgba($1, $2, $3, $4)"';

function fixGeometryComponentErrors() {
  console.log('\x1b[36m%s\x1b[0m', 'Fixing TypeScript errors in sacred-geometry.tsx...');
  
  // Create backup
  const backupPath = `${filePath}.backup`;
  fs.copyFileSync(filePath, backupPath);
  console.log('\x1b[32m%s\x1b[0m', `Backup created at ${backupPath}`);
  
  // Read file content
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Apply fix
  const fixedContent = content.replace(badPatternRegex, fixedPattern);
  
  // Count replacements
  const occurrences = (content.match(badPatternRegex) || []).length;
  
  // Write fixed content back
  fs.writeFileSync(filePath, fixedContent, 'utf8');
  
  console.log('\x1b[32m%s\x1b[0m', `Fixed ${occurrences} component parameter issues in sacred-geometry.tsx`);
}

// Run the fix
try {
  fixGeometryComponentErrors();
  console.log('\x1b[32m%s\x1b[0m', 'Completed successfully!');
} catch (error) {
  console.error('\x1b[31m%s\x1b[0m', 'Error fixing TypeScript issues:', error);
}