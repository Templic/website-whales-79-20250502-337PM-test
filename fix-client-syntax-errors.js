/**
 * Fix Client-Side Syntax Errors
 * 
 * This script fixes syntax errors in client-side files,
 * particularly focusing on the secureApiClient.ts file.
 * 
 * Usage: node fix-client-syntax-errors.js
 */

import fs from 'fs';
import path from 'path';
import colors from 'colors';

// Configuration
const ROOT_DIR = '.';
const CLIENT_DIR = path.join(ROOT_DIR, 'client', 'src');
const SECURE_API_CLIENT_PATH = path.join(CLIENT_DIR, 'lib', 'secureApiClient.ts');
const MEMORY_LEAK_DETECTOR_PATH = path.join(CLIENT_DIR, 'lib', 'memory-leak-detector.ts');
const BACKUP_DIR = './ts-fixes-backup/client-syntax';
const LOG_FILE = 'client-syntax-fixes.log';

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log(`Created backup directory: ${BACKUP_DIR}`);
}

// Initialize log file
fs.writeFileSync(LOG_FILE, `Client Syntax Error Fixes - ${new Date().toISOString()}\n\n`);

/**
 * Log a message to both console and log file
 */
function log(message, color = colors.reset) {
  console.log(color(message));
  fs.appendFileSync(LOG_FILE, message + '\n');
}

/**
 * Create a backup of a file
 */
function backupFile(filePath) {
  const filename = path.basename(filePath);
  const backupPath = path.join(BACKUP_DIR, filename);
  
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(filePath, backupPath);
    log(`Backed up: ${filePath} to ${backupPath}`);
  }
}

/**
 * Fix the secureApiClient.ts file
 */
function fixSecureApiClient() {
  if (!fs.existsSync(SECURE_API_CLIENT_PATH)) {
    log(`Error: Could not find secureApiClient.ts at ${SECURE_API_CLIENT_PATH}`, colors.red);
    return false;
  }
  
  try {
    const content = fs.readFileSync(SECURE_API_CLIENT_PATH, 'utf8');
    backupFile(SECURE_API_CLIENT_PATH);
    
    // Replace the problematic generic syntax
    let updatedContent = content.replace(
      /export\s+class\s+SecureApiClient<T\$2,\s*R\$2>/g,
      'export class SecureApiClient<T = any, R = any>'
    );
    
    // Fix other syntax errors in secureApiClient.ts
    updatedContent = updatedContent.replace(
      /AxiosResponse<APIResponse<R\$2>>/g,
      'AxiosResponse<APIResponse<R>>'
    );
    
    updatedContent = updatedContent.replace(
      /headers: \{\s*'Content-Type': 'application\/json'\s*Authorization: `Bearer \${token}`\s*\}/g,
      "headers: {\n        'Content-Type': 'application/json',\n        Authorization: `Bearer ${token}`\n      }"
    );
    
    fs.writeFileSync(SECURE_API_CLIENT_PATH, updatedContent, 'utf8');
    log(`Successfully fixed secureApiClient.ts`, colors.green);
    return true;
  } catch (error) {
    log(`Error fixing secureApiClient.ts: ${error.message}`, colors.red);
    return false;
  }
}

/**
 * Fix the memory-leak-detector.ts file
 */
function fixMemoryLeakDetector() {
  if (!fs.existsSync(MEMORY_LEAK_DETECTOR_PATH)) {
    log(`Error: Could not find memory-leak-detector.ts at ${MEMORY_LEAK_DETECTOR_PATH}`, colors.red);
    return false;
  }
  
  try {
    const content = fs.readFileSync(MEMORY_LEAK_DETECTOR_PATH, 'utf8');
    backupFile(MEMORY_LEAK_DETECTOR_PATH);
    
    // Fix improper import inside the file
    let updatedContent = content.replace(
      /\{(\s*)import \{ MemoryLeakDetector \} from '@\/lib\/memory-leak-detector';?(\s*)\}/g,
      '{\n  // Implementation of MemoryLeakDetector methods\n}'
    );
    
    fs.writeFileSync(MEMORY_LEAK_DETECTOR_PATH, updatedContent, 'utf8');
    log(`Successfully fixed memory-leak-detector.ts`, colors.green);
    return true;
  } catch (error) {
    log(`Error fixing memory-leak-detector.ts: ${error.message}`, colors.red);
    return false;
  }
}

/**
 * Main function
 */
function main() {
  log('Starting client syntax error fixes...', colors.cyan);
  
  let successful = 0;
  let failed = 0;
  
  if (fixSecureApiClient()) {
    successful++;
  } else {
    failed++;
  }
  
  if (fixMemoryLeakDetector()) {
    successful++;
  } else {
    failed++;
  }
  
  log(`\nSummary:`, colors.cyan);
  log(`Successfully fixed: ${successful} files`, colors.green);
  log(`Failed to fix: ${failed} files`, failed > 0 ? colors.red : colors.green);
}

// Run the main function
main();