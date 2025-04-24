/**
 * Fix Server Config TypeScript Errors
 *
 * This script fixes the numerous syntax errors in the server/config.ts file
 * including improper import syntax, malformed interface declarations, incorrect
 * comparison operators, and improper function declarations.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import colors from 'colors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configFilePath = path.join(process.cwd(), 'server/config.ts');

// Log file
const logFilePath = path.join(process.cwd(), 'server-config-fixes.log');
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
 * Fix the server/config.ts file
 */
function fixServerConfig() {
  log('Starting to fix server/config.ts', colors.yellow);
  
  try {
    // Read the file content
    let content = fs.readFileSync(configFilePath, 'utf8');
    
    // Fix import statements with colons
    content = content.replace(/import (.*?) from: /g, 'import $1 from ');
    content = content.replace(/import: {/g, 'import {');
    content = content.replace(/} from: /g, '} from ');
    
    // Fix interface declarations with colons
    content = content.replace(/interface (\w+):/g, 'interface $1');
    
    // Fix properties with commas
    content = content.replace(/(\w+): (.*?);,/g, '$1: $2,');
    
    // Fix function declarations with colons
    content = content.replace(/function: (\w+)/g, 'function $1');
    
    // Fix comparison operators with incorrect spacing
    content = content.replace(/= ==/g, '===');
    
    // Fix else with colons
    content = content.replace(/} else: {/g, '} else {');
    
    // Fix for loop with colons
    content = content.replace(/for \(const: \[(.*?)\]/g, 'for (const [$1]');
    
    // Fix if condition with arrow function
    content = content.replace(/if \(enabled\) =>/g, 'if (enabled)');
    
    // Fix comments with extra semicolons
    content = content.replace(/\/\/ Feature flags,;/g, '// Feature flags');
    content = content.replace(/\/\/ Database configuration,;/g, '// Database configuration');
    
    // Write the fixed content back to the file
    fs.writeFileSync(configFilePath, content);
    log('Fixed server/config.ts successfully', colors.green);
    
    return true;
  } catch (error) {
    log(`Error fixing server/config.ts: ${error.message}`, colors.red);
    return false;
  }
}

// Main execution
if (backupFile(configFilePath)) {
  if (fixServerConfig()) {
    log('All fixes applied successfully!', colors.green);
  } else {
    log('Failed to apply all fixes.', colors.red);
  }
} else {
  log('Aborting due to backup failure.', colors.red);
}

logStream.end();
