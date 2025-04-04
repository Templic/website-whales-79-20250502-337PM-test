/**
 * Complete Repository Reorganization Script
 * 
 * This script orchestrates the entire repository reorganization process
 * by running all the individual scripts in the correct order.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

// Get the current directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Prompts for confirmation before proceeding
 */
function confirm(message) {
  return new Promise((resolve) => {
    rl.question(`${message} (y/n): `, (answer) => {
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

/**
 * Runs a script and logs the result
 */
function runScript(scriptPath, description) {
  console.log(`\n== ${description} ==`);
  try {
    console.log(`Running ${scriptPath}...`);
    execSync(`node ${scriptPath}`, { stdio: 'inherit' });
    console.log(`✅ Completed: ${description}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed: ${description}`);
    console.error(error.message);
    return false;
  }
}

/**
 * Creates a backup of the current codebase
 */
function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = `./backup-${timestamp}`;
  
  console.log(`Creating backup in ${backupDir}...`);
  
  // Create backup directory
  fs.mkdirSync(backupDir);
  
  // Directories to backup
  const dirsToBackup = ['client', 'server', 'shared'];
  
  dirsToBackup.forEach(dir => {
    if (fs.existsSync(dir)) {
      execSync(`cp -r ${dir} ${backupDir}/`);
    }
  });
  
  console.log('Backup completed!');
}

/**
 * Tests a script without executing its actions
 */
function testScript(scriptPath, description) {
  console.log(`\n== Testing ${description} ==`);
  try {
    console.log(`Running ${scriptPath} in test mode...`);
    execSync(`node ${scriptPath} --test`, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`❌ Failed to test: ${description}`);
    console.error(error.message);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('=== Repository Reorganization Process ===');
  
  // Check if running in test mode
  const testMode = process.argv.includes('--test');
  
  if (testMode) {
    console.log('Running in test mode - no changes will be made');
    testScript('./scripts/repository-reorganization.js', 'Directory Structure');
    testScript('./scripts/component-migration.js', 'Component Migration');
    testScript('./scripts/page-reorganization.js', 'Page Reorganization');
    testScript('./scripts/update-imports.js', 'Import Path Updates');
    console.log('\nTest completed. Review the outputs above to understand the changes that would be made.');
    process.exit(0);
  }
  
  // Confirm before proceeding
  const shouldProceed = await confirm('This script will reorganize your repository. Make sure you have committed all changes. Proceed?');
  if (!shouldProceed) {
    console.log('Operation cancelled.');
    rl.close();
    return;
  }
  
  // Create backup
  console.log('\n== Step 0: Creating Backup ==');
  createBackup();
  
  // Step 1: Create directory structure
  if (!runScript('./scripts/repository-reorganization.js', 'Step 1: Creating Directory Structure')) {
    console.log('Failed at step 1. Aborting.');
    rl.close();
    return;
  }
  
  // Confirm before component migration
  const proceedWithComponents = await confirm('Proceed with component migration?');
  if (!proceedWithComponents) {
    console.log('Stopped at directory structure. Please customize component-migration.js before continuing.');
    rl.close();
    return;
  }
  
  // Step 2: Migrate components
  if (!runScript('./scripts/component-migration.js', 'Step 2: Migrating Components')) {
    console.log('Failed at step 2. Review component-migration.js and try again.');
    rl.close();
    return;
  }
  
  // Confirm before page reorganization
  const proceedWithPages = await confirm('Proceed with page reorganization?');
  if (!proceedWithPages) {
    console.log('Stopped at component migration. Please customize page-reorganization.js before continuing.');
    rl.close();
    return;
  }
  
  // Step 3: Reorganize pages
  if (!runScript('./scripts/page-reorganization.js', 'Step 3: Reorganizing Pages')) {
    console.log('Failed at step 3. Review page-reorganization.js and try again.');
    rl.close();
    return;
  }
  
  // Confirm before updating imports
  const proceedWithImports = await confirm('Proceed with updating import paths?');
  if (!proceedWithImports) {
    console.log('Stopped at page reorganization. Please customize update-imports.js before continuing.');
    rl.close();
    return;
  }
  
  // Step 4: Update imports
  if (!runScript('./scripts/update-imports.js', 'Step 4: Updating Import Paths')) {
    console.log('Failed at step 4. Review update-imports.js and try again.');
    rl.close();
    return;
  }
  
  console.log('\n=== Repository Reorganization Completed ===');
  console.log('Please review the changes and run your tests to ensure everything works correctly.');
  console.log('If you find issues, you can restore from the backup created at the beginning.');
  
  rl.close();
}

// Run the script
main();