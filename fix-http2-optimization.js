/**
 * Fix HTTP/2 Optimization TypeScript Errors
 * 
 * This script fixes syntax errors in the HTTP/2 optimization module,
 * particularly focusing on the function declarations, parameter types,
 * arrow functions, and switch statements.
 * 
 * Usage: node fix-http2-optimization.js
 */

import fs from 'fs';
import path from 'path';
import colors from 'colors';

// Output log file
const logFile = 'http2-optimization-fixes.log';

/**
 * Log a message to both console and log file
 */
function log(message, color = colors.reset) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(color(logMessage));
  fs.appendFileSync(logFile, logMessage + '\n');
}

/**
 * Create a backup of a file
 */
function backupFile(filePath) {
  const backupPath = filePath + '.bak';
  fs.copyFileSync(filePath, backupPath);
  log(`Created backup at ${backupPath}`, colors.yellow);
}

/**
 * Fix the http2-optimization.ts file
 */
function fixHttpOptimization() {
  const filePath = 'server/lib/http2-optimization.ts';
  
  try {
    // Create backup
    backupFile(filePath);
    
    // Read the file
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix function declarations with colons
    content = content.replace(/function:\s+([a-zA-Z0-9_]+)/g, 'function $1');
    
    // Fix function return type with multiple colons
    content = content.replace(/\):\s+([a-zA-Z0-9_'"[\]|]+):\s+{/g, '): $1 {');
    
    // Fix if statements with arrows
    content = content.replace(/if\s+\(([^)]+)\)\s+=>\s+{/g, 'if ($1) {');
    
    // Fix switch statements with arrows
    content = content.replace(/switch\s*\(([^)]+)\)\s+=>\s+{/g, 'switch($1) {');
    
    // Fix case statements with colons and commas
    content = content.replace(/case:\s+(['"][^'"]+['"]):/g, 'case $1:');
    content = content.replace(/case:\s+(['"][^'"]+['"])(,)/g, 'case $1:');
    
    // Fix return statements with colons
    content = content.replace(/return:\s+/g, 'return ');
    
    // Fix try statements with colons
    content = content.replace(/try:\s+{/g, 'try {');
    
    // Fix indentation for closing braces
    content = content.replace(/}(\n\s+)}/g, '}\n$1}');
    
    // Fix indentation within objects
    content = content.replace(/(\n\s+)([a-zA-Z0-9_'"]+)(\n\s+)}/g, '$1$2\n$3}');
    
    // Fix closing braces for if statements
    content = content.replace(/(\n\s+if\s+\([^{]+\)\s+{[^}]*\n\s+)([^\s}])/g, '$1}\n$2');
    
    // Write the fixed content back
    fs.writeFileSync(filePath, content);
    log(`Fixed HTTP/2 optimization file: ${filePath}`, colors.green);
    
    return true;
  } catch (error) {
    log(`Error fixing HTTP/2 optimization: ${error}`, colors.red);
    return false;
  }
}

/**
 * Main function
 */
function main() {
  log('Starting HTTP/2 optimization fixes...', colors.cyan);
  
  const success = fixHttpOptimization();
  
  if (success) {
    log('Successfully fixed HTTP/2 optimization issues.', colors.green);
  } else {
    log('Failed to fix some HTTP/2 optimization issues.', colors.red);
  }
}

// Run the main function
main();