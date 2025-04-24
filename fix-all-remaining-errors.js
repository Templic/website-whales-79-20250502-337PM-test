/**
 * Fix All Remaining TypeScript Errors
 * 
 * This comprehensive script runs all specialized fixers to resolve
 * the remaining TypeScript errors in the codebase.
 * 
 * Usage: node fix-all-remaining-errors.js
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import colors from 'colors';

// Configuration
const ROOT_DIR = '.';
const BACKUP_DIR = './ts-fixes-backup/all-remaining';
const LOG_FILE = 'all-remaining-errors-fixes.log';

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log(`Created backup directory: ${BACKUP_DIR}`);
}

// Initialize log file
fs.writeFileSync(LOG_FILE, `Fix All Remaining TypeScript Errors - ${new Date().toISOString()}\n\n`);

/**
 * Log a message to both console and log file
 */
function log(message, color = colors.reset) {
  console.log(color(message));
  fs.appendFileSync(LOG_FILE, message + '\n');
}

/**
 * Execute a shell command and return the output
 */
function execCommand(command) {
  try {
    const output = execSync(command, { encoding: 'utf8' });
    return { success: true, output };
  } catch (error) {
    return { success: false, output: error.message };
  }
}

/**
 * Run a fix script and return the result
 */
function runFixScript(scriptName, description) {
  log(`\nRunning: ${scriptName} - ${description}`, colors.cyan);
  
  const { success, output } = execCommand(`node ${scriptName}`);
  
  if (success) {
    log(`Success: ${scriptName} completed successfully`, colors.green);
    
    // Extract the last non-empty line as a summary
    const outputLines = output.split('\n').filter(line => line.trim() !== '');
    const summary = outputLines.length > 0 ? outputLines[outputLines.length - 1] : 'No output';
    
    log(`Output: ${summary}`, colors.yellow);
    return true;
  } else {
    log(`Error running ${scriptName}:`, colors.red);
    log(output, colors.red);
    return false;
  }
}

/**
 * Create backup of all TypeScript files
 */
function createBackup() {
  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
  const backupDir = path.join(BACKUP_DIR, timestamp);
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  // Copy client directory
  if (fs.existsSync(path.join(ROOT_DIR, 'client'))) {
    execCommand(`cp -r ${path.join(ROOT_DIR, 'client')} ${backupDir}`);
  }
  
  // Copy server directory
  if (fs.existsSync(path.join(ROOT_DIR, 'server'))) {
    execCommand(`cp -r ${path.join(ROOT_DIR, 'server')} ${backupDir}`);
  }
  
  // Copy shared directory
  if (fs.existsSync(path.join(ROOT_DIR, 'shared'))) {
    execCommand(`cp -r ${path.join(ROOT_DIR, 'shared')} ${backupDir}`);
  }
  
  log(`Created backup of all TypeScript files at ${backupDir}`, colors.green);
  return backupDir;
}

/**
 * Check for remaining TypeScript errors
 */
function checkRemainingErrors() {
  log('\nChecking for remaining TypeScript errors...', colors.cyan);
  
  const { success, output } = execCommand('tsc --noEmit');
  
  if (success) {
    log('No TypeScript errors found! 🎉', colors.green.bold);
    return { errors: 0, output };
  } else {
    // Count the number of errors
    const errorCount = (output.match(/error TS/g) || []).length;
    log(`Warning: Found ${errorCount} remaining TypeScript errors`, colors.yellow.bold);
    
    // Show a sample of the errors
    const errorLines = output.split('\n')
      .filter(line => line.includes('error TS'))
      .slice(0, 5);
    
    log('Sample of remaining errors:', colors.yellow);
    errorLines.forEach(line => log(`  ${line}`, colors.yellow));
    
    if (errorCount > 5) {
      log(`  ... and ${errorCount - 5} more errors`, colors.yellow);
    }
    
    return { errors: errorCount, output };
  }
}

/**
 * Main function
 */
async function main() {
  log('Starting TypeScript Error Fixer for All Remaining Errors...', colors.cyan.bold);
  
  // Create backup of TypeScript files
  const backupDir = createBackup();
  
  // Define fix scripts in order of priority - new ones first
  const fixScripts = [
    { name: 'fix-server-syntax-errors.js', description: 'Fix server-side syntax errors' },
    { name: 'fix-client-syntax-errors.js', description: 'Fix client-side syntax errors' },
    { name: 'fix-module-paths.js', description: 'Fix module import paths' },
    
    // Existing fixers from previous work
    { name: 'fix-parameter-errors.js', description: 'Fix parameter errors in function declarations' },
    { name: 'fix-secure-api-client.js', description: 'Fix syntax errors in secureApiClient.ts' },
    { name: 'fix-order-confirmation-page.js', description: 'Fix syntax errors in OrderConfirmationPage.tsx' },
    { name: 'fix-style-properties.js', description: 'Fix style property assignments in DOM elements' },
    { name: 'fix-type-guards.js', description: 'Fix syntax errors in typeGuards.ts' },
    { name: 'fix-service-worker.js', description: 'Fix syntax errors in service-worker.ts' },
    { name: 'fix-duplicate-imports.js', description: 'Fix duplicate component imports' },
    { name: 'fix-duplicate-type-imports.js', description: 'Fix duplicate type imports' },
    { name: 'fix-duplicate-react-imports-advanced.js', description: 'Fix advanced duplicate React imports' },
    { name: 'fix-duplicate-cn-imports.js', description: 'Fix duplicate cn imports' },
    { name: 'fix-duplicate-react-imports-improved.js', description: 'Fix duplicate React imports' },
    { name: 'fix-lib-utils-imports.js', description: 'Fix @/lib/utils imports' },
    { name: 'fix-memory-leak-detector.js', description: 'Fix memory leak detector imports' },
    { name: 'fix-frequency-visualizer.js', description: 'Fix frequency visualizer component' }
  ];
  
  let successful = 0;
  let failed = 0;
  
  for (const script of fixScripts) {
    if (runFixScript(script.name, script.description)) {
      successful++;
    } else {
      failed++;
    }
  }
  
  // Check remaining errors
  const { errors } = checkRemainingErrors();
  
  // Report summary
  log('\n===== TypeScript Error Fixing Summary =====', colors.cyan.bold);
  log(`Scripts run successfully: ${successful}`, colors.green);
  log(`Scripts failed: ${failed}`, failed > 0 ? colors.red : colors.green);
  log(`Remaining TypeScript errors: ${errors}`, errors > 0 ? colors.yellow : colors.green);
  log(`Backup created at: ${backupDir}`, colors.cyan);
  log('======================================', colors.cyan.bold);
  
  if (errors === 0) {
    log(colors.green.bold('🎉 All TypeScript errors have been fixed! 🎉'));
  } else {
    log(colors.yellow.bold(`⚠️ Fixed some errors, but ${errors} errors remain. Manual inspection may be needed.`));
  }
}

// Run the main function
main().catch(error => {
  log(`${colors.red.bold('Fatal error:')} ${error.message}`);
});