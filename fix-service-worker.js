/**
 * Fix Service Worker
 * 
 * This script fixes syntax errors in the service-worker.ts file,
 * specifically the malformed parameter syntax.
 * 
 * Usage: node fix-service-worker.js
 */

import fs from 'fs';
import path from 'path';

// Configuration
const ROOT_DIR = '.';
const CLIENT_SRC_DIR = path.join(ROOT_DIR, 'client', 'src');
const SERVICE_WORKER_PATH = path.join(CLIENT_SRC_DIR, 'lib', 'service-worker.ts');
const BACKUP_DIR = './ts-fixes-backup';
const LOG_FILE = 'service-worker-fixes.log';

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log(`Created backup directory: ${BACKUP_DIR}`);
}

// Initialize log file
fs.writeFileSync(LOG_FILE, `Service Worker Fixes - ${new Date().toISOString()}\n\n`);

/**
 * Log a message to both console and log file
 */
function log(message) {
  console.log(message);
  fs.appendFileSync(LOG_FILE, message + '\n');
}

/**
 * Create a backup of a file
 */
function backupFile(filePath) {
  const backupPath = path.join(BACKUP_DIR, filePath.replace(/\//g, '_').replace(/\\/g, '_'));
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(filePath, backupPath);
    log(`Backed up: ${filePath} to ${backupPath}`);
  }
}

/**
 * Fix service worker syntax
 */
function fixServiceWorker() {
  if (!fs.existsSync(SERVICE_WORKER_PATH)) {
    log(`Error: Could not find service-worker.ts at ${SERVICE_WORKER_PATH}`);
    return false;
  }
  
  try {
    // Read the file
    const content = fs.readFileSync(SERVICE_WORKER_PATH, 'utf8');
    
    // Create backup
    backupFile(SERVICE_WORKER_PATH);
    
    // Fix 1: Fix malformed parameter type in sendMessage function
    let newContent = content.replace(
      /export\s+async\s+function\s+sendMessage\s*\(message\$2:\s*Promise<void>\s*\{/g,
      'export async function sendMessage(message: any): Promise<void> {'
    );
    
    // Fix 2: Fix other similar malformed parameters if any
    newContent = newContent.replace(
      /(\w+)\$2:\s*([A-Za-z<>[\]|]+)\s*\{/g,
      '$1: any): $2 {'
    );
    
    // Write the fixed content
    fs.writeFileSync(SERVICE_WORKER_PATH, newContent, 'utf8');
    log(`Fixed service-worker.ts at: ${SERVICE_WORKER_PATH}`);
    return true;
  } catch (error) {
    log(`Error fixing service-worker.ts: ${error.message}`);
    return false;
  }
}

/**
 * Main function
 */
function main() {
  log('Starting service worker fixes...');
  
  if (fixServiceWorker()) {
    log('Successfully fixed service worker');
  } else {
    log('Failed to fix service worker');
  }
}

// Run the main function
main();