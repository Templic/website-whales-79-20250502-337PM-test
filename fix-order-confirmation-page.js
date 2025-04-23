/**
 * Fix OrderConfirmationPage.tsx
 * 
 * This script fixes syntax errors in the OrderConfirmationPage.tsx file.
 * 
 * Usage: node fix-order-confirmation-page.js
 */

import fs from 'fs';
import path from 'path';

// Configuration
const ROOT_DIR = '.';
const BACKUP_DIR = './ts-fixes-backup';
const FILE_PATH = path.join(ROOT_DIR, 'client', 'src', 'pages', 'shop', 'OrderConfirmationPage.tsx');
const LOG_FILE = 'order-confirmation-page-fixes.log';

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log(`Created backup directory: ${BACKUP_DIR}`);
}

// Initialize log file
fs.writeFileSync(LOG_FILE, `Order Confirmation Page Fixes - ${new Date().toISOString()}\n\n`);

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
 * Fix the OrderConfirmationPage.tsx file
 */
function fixOrderConfirmationPage() {
  if (!fs.existsSync(FILE_PATH)) {
    log(`Error: Could not find OrderConfirmationPage.tsx at ${FILE_PATH}`);
    return false;
  }
  
  try {
    // Read the file
    const content = fs.readFileSync(FILE_PATH, 'utf8');
    
    // Create backup
    backupFile(FILE_PATH);
    
    // Fix 1: Fix double curly braces in component declarations
    let newContent = content.replace(
      /function Package\(props: any\) \{\{/g,
      'function Package(props: any) {'
    );
    
    newContent = newContent.replace(
      /function Truck\(props: any\) \{\{/g,
      'function Truck(props: any) {'
    );
    
    // Write the fixed content
    fs.writeFileSync(FILE_PATH, newContent, 'utf8');
    log(`Fixed OrderConfirmationPage.tsx at: ${FILE_PATH}`);
    return true;
  } catch (error) {
    log(`Error fixing OrderConfirmationPage.tsx: ${error.message}`);
    return false;
  }
}

/**
 * Main function
 */
function main() {
  log('Starting OrderConfirmationPage.tsx fixes...');
  
  if (fixOrderConfirmationPage()) {
    log('Successfully fixed OrderConfirmationPage.tsx');
  } else {
    log('Failed to fix OrderConfirmationPage.tsx');
  }
}

// Run the main function
main();