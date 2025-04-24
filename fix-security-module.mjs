/**
 * Fix Security Module TypeScript Errors
 *
 * This script fixes syntax errors in the server/security/enableMaximumSecurity.ts file,
 * including comment-code confusion, incorrect function declarations, and improper logging syntax.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import colors from 'colors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const securityFilePath = path.join(process.cwd(), 'server/security/enableMaximumSecurity.ts');

// Log file
const logFilePath = path.join(process.cwd(), 'security-fixes.log');
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

/**
 * Log a message to both console and log file
 */
function log(message, color = colors.reset) {
  const logMessage = typeof color === 'function' ? color(message) : message;
  console.log(logMessage);
  logStream.write(message + '\n');
}

/**
 * Create a backup of the file
 */
function backupFile(filePath) {
  const backupPath = `${filePath}.backup`;
  try {
    fs.copyFileSync(filePath, backupPath);
    log(`Created backup at ${backupPath}`, colors.green);
    return true;
  } catch (error) {
    log(`Error creating backup: ${error.message}`, colors.red);
    return false;
  }
}

/**
 * Fix the security module file
 */
function fixSecurityModule() {
  log('Starting to fix server/security/enableMaximumSecurity.ts', colors.yellow);
  
  try {
    // Read the file content
    let content = fs.readFileSync(securityFilePath, 'utf8');
    
    // Fix the specific issue at line 77-82 (the logSecurityEvent that's commented out)
    const targetPattern = '// Log the changes: logSecurityEvent({';
    if (content.includes(targetPattern)) {
      content = content.replace(
        targetPattern,
        '// Log the changes\n  logSecurityEvent({'
      );
    }
    
    // Fix function declarations with colons
    content = content.replace(/export function: /g, 'export function ');
    
    // Fix getPerformanceImpactWarning declaration
    content = content.replace(/export function: getPerformanceImpactWarning\(\): string \| null: {/g, 
      'export function getPerformanceImpactWarning(): string | null {');
    
    // Fix any if statements with arrow function syntax
    content = content.replace(/if \(([^)]+)\) =>/g, 'if ($1)');
    
    // Fix any misplaced semicolons in objects
    content = content.replace(/(\w+): (.*?);,/g, '$1: $2,');
    
    // Write the fixed content back to the file
    fs.writeFileSync(securityFilePath, content);
    log('Fixed server/security/enableMaximumSecurity.ts successfully', colors.green);
    
    return true;
  } catch (error) {
    log(`Error fixing security module: ${error.message}`, colors.red);
    return false;
  }
}

// Main execution
if (backupFile(securityFilePath)) {
  if (fixSecurityModule()) {
    log('All fixes applied successfully!', colors.green);
  } else {
    log('Failed to apply all fixes.', colors.red);
  }
} else {
  log('Aborting due to backup failure.', colors.red);
}

logStream.end();
