/**
 * Repository Backup Script
 * 
 * This script creates a backup of the important directories 
 * before performing the repository reorganization.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get the current directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

/**
 * Creates a backup of specified directories
 */
function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(rootDir, `backups/backup-${timestamp}`);
  
  console.log(`Creating backup in ${backupDir}...`);
  
  // Create backup directory
  fs.mkdirSync(backupDir, { recursive: true });
  
  // Directories to backup
  const dirsToBackup = [
    'client', 
    'server', 
    'shared', 
    'src', 
    'v0_extract', 
    'tmp_import'
  ];
  
  dirsToBackup.forEach(dir => {
    const fullPath = path.join(rootDir, dir);
    if (fs.existsSync(fullPath)) {
      const targetDir = path.join(backupDir, dir);
      fs.mkdirSync(path.dirname(targetDir), { recursive: true });
      
      try {
        execSync(`cp -r "${fullPath}" "${targetDir}"`);
        console.log(`Backed up: ${dir}`);
      } catch (error) {
        console.error(`Failed to backup ${dir}: ${error.message}`);
      }
    } else {
      console.log(`Directory not found, skipping: ${dir}`);
    }
  });
  
  console.log('Backup completed!');
  return backupDir;
}

// Run the function if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('=== Repository Backup Process ===');
  const backupPath = createBackup();
  console.log(`Backup created at: ${backupPath}`);
}

// Export for use in other scripts
export default createBackup;