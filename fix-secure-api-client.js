/**
 * Fix Secure API Client
 * 
 * This script fixes syntax errors in the secureApiClient.ts file.
 * 
 * Usage: node fix-secure-api-client.js
 */

import fs from 'fs';
import path from 'path';

// Configuration
const ROOT_DIR = '.';
const BACKUP_DIR = './ts-fixes-backup';
const CLIENT_SRC_DIR = path.join(ROOT_DIR, 'client', 'src');
const SECURE_API_CLIENT_PATH = path.join(CLIENT_SRC_DIR, 'lib', 'secureApiClient.ts');
const LOG_FILE = 'secure-api-client-fixes.log';

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log(`Created backup directory: ${BACKUP_DIR}`);
}

// Initialize log file
fs.writeFileSync(LOG_FILE, `Secure API Client Fixes - ${new Date().toISOString()}\n\n`);

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
 * Fix the secure API client
 */
function fixSecureApiClient() {
  if (!fs.existsSync(SECURE_API_CLIENT_PATH)) {
    log(`Error: Could not find secureApiClient.ts at ${SECURE_API_CLIENT_PATH}`);
    return false;
  }
  
  try {
    // Read the file
    const content = fs.readFileSync(SECURE_API_CLIENT_PATH, 'utf8');
    
    // Create backup
    backupFile(SECURE_API_CLIENT_PATH);
    
    // Fix various syntax errors
    
    // Fix 1: Fix malformed generic type parameters
    let newContent = content.replace(
      /export\s+class\s+SecureApiClient<T\$2,\s*R\$2>/g,
      'export class SecureApiClient<T = any, R = any>'
    );
    
    // Fix 2: Fix malformed parameter types
    newContent = newContent.replace(
      /constructor\s*\(\s*baseUrl\$2\s*,\s*options\$2\s*\)/g,
      'constructor(baseUrl: string, options: ApiClientOptions = {})'
    );
    
    // Fix 3: Fix malformed method parameters
    newContent = newContent.replace(
      /async\s+request\$2\s*\(\s*endpoint\$2\s*,\s*method\$2\s*,\s*data\$2\s*,\s*headers\$2\s*\)/g,
      'async request(endpoint: string, method: HttpMethod, data?: any, headers?: Record<string, string>)'
    );
    
    // Fix 4: Fix other malformed parameters
    newContent = newContent.replace(/(\w+)\$2(\s*[:)])/g, '$1: any$2');
    
    // Fix 5: Fix malformed generic types
    newContent = newContent.replace(/<T\$2>/g, '<T = any>');
    newContent = newContent.replace(/<T\$2,\s*R\$2>/g, '<T = any, R = any>');
    
    // Write the fixed content
    fs.writeFileSync(SECURE_API_CLIENT_PATH, newContent, 'utf8');
    log(`Fixed secureApiClient.ts at: ${SECURE_API_CLIENT_PATH}`);
    return true;
  } catch (error) {
    log(`Error fixing secureApiClient.ts: ${error.message}`);
    return false;
  }
}

/**
 * Main function
 */
function main() {
  log('Starting secure API client fixes...');
  
  if (fixSecureApiClient()) {
    log('Successfully fixed secureApiClient.ts');
  } else {
    log('Failed to fix secureApiClient.ts');
  }
}

// Run the main function
main();