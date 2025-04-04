/**
 * Finalize Imported Components Merge
 * 
 * This script orchestrates the process of merging imported components
 * and updating import paths, then removes the imported directory.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Runs a script and logs the result
 */
function runScript(scriptPath, description) {
  console.log(`\n==== ${description} ====`);
  try {
    execSync(`node ${scriptPath}`, { stdio: 'inherit' });
    console.log(`✅ Successfully completed: ${description}`);
    return true;
  } catch (error) {
    console.error(`❌ Error executing ${scriptPath}:`, error.message);
    return false;
  }
}

/**
 * Create a backup of imported components
 */
function backupImportedComponents() {
  console.log('\n==== Creating backup of imported components ====');
  
  const importedDir = path.join(process.cwd(), 'client/src/components/imported');
  const backupDir = path.join(process.cwd(), 'backups/imported-components-' + Date.now());
  
  if (!fs.existsSync(importedDir)) {
    console.log('Imported components directory does not exist, skipping backup');
    return true;
  }
  
  try {
    // Create backup directory
    fs.mkdirSync(backupDir, { recursive: true });
    
    // Copy imported directory to backup
    execSync(`cp -r ${importedDir}/* ${backupDir}/`, { stdio: 'inherit' });
    
    console.log(`✅ Successfully backed up imported components to: ${backupDir}`);
    return true;
  } catch (error) {
    console.error('❌ Error creating backup:', error.message);
    return false;
  }
}

/**
 * Remove the imported directory after successful merge and backup
 */
function removeImportedDirectory() {
  console.log('\n==== Removing imported directory ====');
  
  const importedDir = path.join(process.cwd(), 'client/src/components/imported');
  
  if (!fs.existsSync(importedDir)) {
    console.log('Imported components directory does not exist, nothing to remove');
    return true;
  }
  
  try {
    fs.rmSync(importedDir, { recursive: true, force: true });
    console.log(`✅ Successfully removed imported directory: ${importedDir}`);
    return true;
  } catch (error) {
    console.error('❌ Error removing imported directory:', error.message);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('Starting to finalize imported components merge...');
  
  // 1. Backup the imported components
  const backupSuccess = backupImportedComponents();
  if (!backupSuccess) {
    console.log('❌ Aborting due to backup failure!');
    return;
  }
  
  // 2. Run the merge script
  const mergeSuccess = runScript('scripts/merge-imported-components.js', 'Merging imported components');
  if (!mergeSuccess) {
    console.log('❌ Aborting due to merge failure!');
    return;
  }
  
  // 3. Run the import path update script
  const updateSuccess = runScript('scripts/update-imported-paths.js', 'Updating import paths');
  if (!updateSuccess) {
    console.log('❌ Aborting due to import path update failure!');
    return;
  }
  
  // 4. Remove the imported directory
  const removeSuccess = removeImportedDirectory();
  if (!removeSuccess) {
    console.log('❌ Failed to remove imported directory');
  }
  
  console.log('\n==== Finalization Complete ====');
  console.log('✅ Imported components have been merged into the main components directories');
  console.log('✅ Import paths have been updated throughout the codebase');
  
  if (backupSuccess) {
    console.log('✅ A backup of the original imported components has been created');
  }
  
  if (removeSuccess) {
    console.log('✅ The imported directory has been removed');
  }
}

// Run the script
main();