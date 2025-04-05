/**
 * Run Component Merge Script
 * 
 * This script orchestrates the entire component analysis, merging, and consolidation process.
 * It runs the scripts in the correct order and provides a simplified interface for users.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Configuration options
const CONFIG = {
  // Which scripts to run
  runAnalysis: true,
  runEnhancedMerge: true,
  runConsolidation: false,  // Default to false for safety
  
  // Backup options
  createBackup: true,
  
  // Consolidation options
  updateImportPaths: true,
  deleteOriginals: false,
  addDeprecationNotices: true,
  
  // Testing options
  testRun: true,  // Default to true for safety
  
  // Confirmation prompts
  promptForConfirmation: true
};

/**
 * Creates a backup of the components directory
 */
function createBackup() {
  console.log('\nCreating backup...');
  
  const backupDir = path.join(process.cwd(), 'backups/components-' + Date.now());
  
  // Ensure backup directory exists
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  // Copy components directory to backup
  const componentsDir = path.join(process.cwd(), 'client/src/components');
  
  try {
    execSync(`cp -r ${componentsDir}/* ${backupDir}/`, { stdio: 'inherit' });
    console.log(`Backup created successfully in: ${backupDir}`);
    return backupDir;
  } catch (error) {
    console.error('Error creating backup:', error);
    return null;
  }
}

/**
 * Run a script and log the result
 */
function runScript(scriptPath, description, options = {}) {
  console.log(`\n==== ${description} ====`);
  
  // If it's a test run, display that
  const testPrefix = CONFIG.testRun && !options.ignoreTestFlag ? '[TEST RUN] ' : '';
  
  try {
    // Build the node command
    let command = `node ${scriptPath}`;
    
    // If configuration variables are passed, convert them to environment variables
    if (options.config) {
      for (const [key, value] of Object.entries(options.config)) {
        // Skip undefined values
        if (value === undefined) continue;
        
        // Convert booleans to strings
        const strValue = typeof value === 'boolean' ? (value ? 'true' : 'false') : value;
        
        // Add environment variable
        command = `${key}=${strValue} ${command}`;
      }
    }
    
    console.log(`${testPrefix}Running: ${command}`);
    
    if (!CONFIG.testRun || options.ignoreTestFlag) {
      execSync(command, { stdio: 'inherit' });
      console.log(`✅ Successfully completed: ${description}`);
      return true;
    } else {
      console.log(`✅ [TEST RUN] Would have run: ${command}`);
      return true;
    }
  } catch (error) {
    console.error(`❌ Error executing ${scriptPath}:`, error.message);
    return false;
  }
}

/**
 * Ask for user confirmation
 */
function askConfirmation(message) {
  return new Promise((resolve) => {
    rl.question(`${message} (y/n): `, (answer) => {
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Main function
 */
async function main() {
  console.log('Component Merge Process');
  console.log('======================');
  
  // Display configuration
  console.log('\nCurrent Configuration:');
  Object.entries(CONFIG).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });
  
  // Ask for confirmation if needed
  if (CONFIG.promptForConfirmation) {
    const proceed = await askConfirmation('\nDo you want to proceed with this configuration?');
    if (!proceed) {
      console.log('Process aborted by user.');
      rl.close();
      return;
    }
  }
  
  // Create a backup if configured
  let backupDir = null;
  if (CONFIG.createBackup) {
    backupDir = createBackup();
    if (!backupDir && !CONFIG.testRun) {
      const proceedWithoutBackup = await askConfirmation('Backup failed. Proceed anyway?');
      if (!proceedWithoutBackup) {
        console.log('Process aborted by user after backup failure.');
        rl.close();
        return;
      }
    }
  }
  
  // Run the enhanced merge script if configured
  if (CONFIG.runEnhancedMerge) {
    if (CONFIG.promptForConfirmation) {
      const confirm = await askConfirmation('Run the enhanced component merge process?');
      if (!confirm) {
        console.log('Skipping enhanced component merge.');
      } else {
        runScript('scripts/enhanced-merge-components.js', 'Enhanced Component Merge');
      }
    } else {
      runScript('scripts/enhanced-merge-components.js', 'Enhanced Component Merge');
    }
  }
  
  // Run the component analysis script if configured
  if (CONFIG.runAnalysis) {
    if (CONFIG.promptForConfirmation) {
      const confirm = await askConfirmation('Run the component similarity analysis?');
      if (!confirm) {
        console.log('Skipping component similarity analysis.');
      } else {
        runScript('scripts/analyze-similar-components.js', 'Component Similarity Analysis');
      }
    } else {
      runScript('scripts/analyze-similar-components.js', 'Component Similarity Analysis');
    }
  }
  
  // Run the consolidation script if configured
  if (CONFIG.runConsolidation) {
    if (CONFIG.promptForConfirmation) {
      const confirm = await askConfirmation('Run the component consolidation process?');
      if (!confirm) {
        console.log('Skipping component consolidation.');
      } else {
        const config = {
          UPDATE_IMPORT_PATHS: CONFIG.updateImportPaths,
          DELETE_ORIGINALS: CONFIG.deleteOriginals,
          ADD_DEPRECATION_NOTICES: CONFIG.addDeprecationNotices
        };
        
        runScript('scripts/consolidate-components.js', 'Component Consolidation', { config });
      }
    } else {
      const config = {
        UPDATE_IMPORT_PATHS: CONFIG.updateImportPaths,
        DELETE_ORIGINALS: CONFIG.deleteOriginals,
        ADD_DEPRECATION_NOTICES: CONFIG.addDeprecationNotices
      };
      
      runScript('scripts/consolidate-components.js', 'Component Consolidation', { config });
    }
  }
  
  console.log('\n==== Process Complete ====');
  if (backupDir) {
    console.log(`A backup of your components was created in: ${backupDir}`);
  }
  
  if (CONFIG.testRun) {
    console.log('\nThis was a TEST RUN. No actual changes were made to your components.');
    console.log('To run for real, edit this script and set CONFIG.testRun = false');
  }
  
  rl.close();
}

// Run the script
main().catch(err => {
  console.error('Error executing script:', err);
  rl.close();
});