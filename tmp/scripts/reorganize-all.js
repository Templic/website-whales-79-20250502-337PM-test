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

// Get the current directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  const dirsToBackup = ['client', 'server', 'shared', 'src', 'v0_extract', 'tmp_import'];
  
  dirsToBackup.forEach(dir => {
    if (fs.existsSync(dir)) {
      execSync(`cp -r ${dir} ${backupDir}/`);
      console.log(`Backed up: ${dir}`);
    } else {
      console.log(`Directory not found, skipping: ${dir}`);
    }
  });
  
  console.log('Backup completed!');
  return backupDir;
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
  const skipBackup = process.argv.includes('--no-backup');
  
  if (testMode) {
    console.log('Running in test mode - no changes will be made');
    testScript('./scripts/repository-reorganization.js', 'Directory Structure');
    testScript('./scripts/component-migration.js', 'Component Migration');
    testScript('./scripts/page-reorganization.js', 'Page Reorganization');
    testScript('./scripts/update-imports.js', 'Import Path Updates');
    console.log('\nTest completed. Review the outputs above to understand the changes that would be made.');
    process.exit(0);
  }
  
  // Create backup
  let backupPath = null;
  if (!skipBackup) {
    console.log('\n== Step 0: Creating Backup ==');
    backupPath = createBackup();
    console.log(`Backup created at: ${backupPath}`);
  } else {
    console.log('\n== Step 0: Skipping Backup (--no-backup flag detected) ==');
  }
  
  // Step 1: Create directory structure
  if (!runScript('./scripts/repository-reorganization.js', 'Step 1: Creating Directory Structure')) {
    console.log('Failed at step 1. Aborting.');
    console.log(backupPath ? `You can restore from backup at: ${backupPath}` : 'No backup was created.');
    return;
  }
  
  // Step 2: Migrate components
  if (!runScript('./scripts/component-migration.js', 'Step 2: Migrating Components')) {
    console.log('Failed at step 2. Review component-migration.js and try again.');
    console.log(backupPath ? `You can restore from backup at: ${backupPath}` : 'No backup was created.');
    return;
  }
  
  // Step 3: Reorganize pages
  if (!runScript('./scripts/page-reorganization.js', 'Step 3: Reorganizing Pages')) {
    console.log('Failed at step 3. Review page-reorganization.js and try again.');
    console.log(backupPath ? `You can restore from backup at: ${backupPath}` : 'No backup was created.');
    return;
  }
  
  // Step 4: Update imports
  if (!runScript('./scripts/update-imports.js', 'Step 4: Updating Import Paths')) {
    console.log('Failed at step 4. Review update-imports.js and try again.');
    console.log(backupPath ? `You can restore from backup at: ${backupPath}` : 'No backup was created.');
    return;
  }
  
  console.log('\n=== Repository Reorganization Completed ===');
  console.log('Please review the changes and run your tests to ensure everything works correctly.');
  if (backupPath) {
    console.log(`If you find issues, you can restore from the backup created at: ${backupPath}`);
  }
}

// Run the script
main();