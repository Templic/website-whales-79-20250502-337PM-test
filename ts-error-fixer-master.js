/**
 * Master TypeScript Error Fixer
 * 
 * This script runs all the TypeScript error fixing solutions in the correct order
 * to systematically resolve all TypeScript errors across the codebase.
 * 
 * Industry best practices:
 * - Creates backups of all modified files
 * - Performs comprehensive logging
 * - Follows Google TypeScript Style Guide
 * - Follows Microsoft TypeScript recommended configurations
 * - Implements defensive coding patterns
 * - Prioritizes fixes for maximum impact
 * 
 * Usage: node ts-error-fixer-master.js
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import colors from 'colors';

// Configuration
const LOG_FILE = 'typescript-error-fixes-master.log';

// Initialize log file
fs.writeFileSync(LOG_FILE, `TypeScript Error Fixing Run - ${new Date().toISOString()}\n\n`);

/**
 * Log a message to both console and log file
 */
function log(message) {
  console.log(message);
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
    return { 
      success: false, 
      output: error.stdout || '', 
      error: error.message 
    };
  }
}

/**
 * Create a backup of all TypeScript files
 */
function createBackup() {
  const backupDir = './ts-error-fixer-master-backup';
  
  // Create backup directory if it doesn't exist
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  // Create a date-stamped backup directory
  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
  const timestampedBackupDir = path.join(backupDir, timestamp);
  fs.mkdirSync(timestampedBackupDir, { recursive: true });
  
  // Copy important directories
  log('Creating backup of TypeScript files...');
  
  // Client source files
  if (fs.existsSync('./client/src')) {
    execCommand(`cp -r ./client/src ${timestampedBackupDir}/client-src`);
  }
  
  // Server source files
  if (fs.existsSync('./server')) {
    execCommand(`cp -r ./server ${timestampedBackupDir}/server`);
  }
  
  // Shared source files
  if (fs.existsSync('./shared')) {
    execCommand(`cp -r ./shared ${timestampedBackupDir}/shared`);
  }
  
  log(`Backup created at ${timestampedBackupDir}`);
  return timestampedBackupDir;
}

/**
 * Run a fix script
 */
function runFixScript(scriptName, description) {
  log(`\n${colors.yellow.bold('Running:')} ${scriptName} - ${description}`);
  const result = execCommand(`node ${scriptName}`);
  
  if (result.success) {
    log(`${colors.green.bold('Success:')} ${scriptName} completed successfully`);
    log(`Output: ${result.output.trim().split('\n').pop() || 'No output'}`);
    return true;
  } else {
    log(`${colors.red.bold('Error:')} ${scriptName} failed:`);
    log(result.error);
    return false;
  }
}

/**
 * Run TypeScript compiler to check for remaining errors
 */
function checkRemainingErrors() {
  log('\nChecking for remaining TypeScript errors...');
  
  // Run the TypeScript compiler in noEmit mode
  const result = execCommand('npx tsc --noEmit');
  
  if (result.success) {
    log(`${colors.green.bold('Success:')} No TypeScript errors found!`);
    return { success: true, errors: 0 };
  } else {
    // Count the number of errors
    const errorLines = result.output.split('\n').filter(line => line.includes('error TS'));
    const errorCount = errorLines.length;
    
    log(`${colors.yellow.bold('Warning:')} Found ${errorCount} remaining TypeScript errors`);
    
    // Log a sample of errors (first 5)
    if (errorCount > 0) {
      log('Sample of remaining errors:');
      errorLines.slice(0, 5).forEach(line => log(`  ${line}`));
      
      if (errorCount > 5) {
        log(`  ... and ${errorCount - 5} more errors`);
      }
    }
    
    return { success: false, errors: errorCount };
  }
}

/**
 * Main function
 */
async function main() {
  log('Starting TypeScript Error Fixer Master...');
  
  // Create backup of TypeScript files
  const backupDir = createBackup();
  
  // Run fix scripts in order of priority
  const fixScripts = [
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
  log('\n===== TypeScript Error Fixing Summary =====');
  log(`Scripts run successfully: ${successful}`);
  log(`Scripts failed: ${failed}`);
  log(`Remaining TypeScript errors: ${errors}`);
  log(`Backup created at: ${backupDir}`);
  log('======================================');
  
  if (errors === 0) {
    log(colors.green.bold('🎉 All TypeScript errors have been fixed! 🎉'));
  } else {
    log(colors.yellow.bold(`⚠️ Fixed some errors, but ${errors} errors remain. Run individual fix scripts for more specific fixes.`));
  }
}

// Run the main function
main().catch(error => {
  log(`${colors.red.bold('Fatal error:')} ${error.message}`);
});