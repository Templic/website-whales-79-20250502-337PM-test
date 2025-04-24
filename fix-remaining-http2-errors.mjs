/**
 * Fix Remaining HTTP/2 Optimization Errors
 * 
 * This script identifies and fixes specific syntax errors in the HTTP/2 optimization file
 * by examining problematic lines character by character.
 */

import fs from 'fs';

const filePath = 'server/lib/http2-optimization.ts';
const tempPath = 'server/lib/http2-optimization.ts.tmp';

console.log('Starting targeted HTTP/2 optimization file fix...');

// Read the file
try {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const lines = fileContent.split('\n');

  // Check line 357 character by character
  console.log('Checking line 357...');
  const lineContent = lines[356]; // 0-based indexing
  console.log(`Line 357 content: "${lineContent}"`);
  
  // Look for characters that might cause issues
  for (let i = 0; i < lineContent.length; i++) {
    const char = lineContent.charAt(i);
    const charCode = lineContent.charCodeAt(i);
    if (charCode > 127 || char === '\\' || char === ',') {
      console.log(`Potential issue at position ${i}: "${char}" (code: ${charCode})`);
    }
  }
  
  // Check if the escaping in the RegExp is correct
  if (lineContent.includes('/^\\//')) {
    console.log('Found RegExp pattern that might need fixing');
  }
  
  // Fix line by creating a fixed version of the file
  // The issue might be in the escaping of the backslash in the regular expression
  let fixedContent = fileContent.replace(
    /(resourcePath.replace\()\/\^\\\//\/, ''\)/g,
    '$1/^\\///, \'\')'
  );
  
  // Write fixed content to temp file
  fs.writeFileSync(tempPath, fixedContent);
  console.log(`Created fixed version at ${tempPath}`);
  
  // If you want to replace the original file
  fs.copyFileSync(tempPath, filePath);
  console.log(`Applied fixed version to ${filePath}`);
  
} catch (error) {
  console.error('Error fixing HTTP/2 optimization file:', error);
}