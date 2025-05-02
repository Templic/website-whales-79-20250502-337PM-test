#!/usr/bin/env node

/**
 * Speed Mode Disabler
 * 
 * This script reverts the speed-optimized configuration and
 * restores standard mode settings for the server.
 * It modifies the .env file with balanced feature settings.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Path to .env file
const mainEnvPath = path.join(rootDir, '.env');

// Standard configuration settings
const standardConfig = {
  STARTUP_PRIORITY: 'standard',
  STARTUP_MODE: 'standard',
  ENABLE_DATABASE_OPTIMIZATION: 'true',
  ENABLE_SECURITY_SCANS: 'true',
  ENABLE_BACKGROUND_TASKS: 'true',
  ENABLE_RATE_LIMITING: 'true',
  ENABLE_EXTRA_LOGGING: 'false',
  ENABLE_CONTENT_SCHEDULING: 'true',
  ENABLE_WEBSOCKETS: 'true',
  ENABLE_COMPRESSION: 'true',
  CSRF_PROTECTION: 'true',
  DB_POOL_MIN: '5',
  DB_POOL_MAX: '20',
  DB_IDLE_TIMEOUT: '30000',
  MAX_PAYLOAD_SIZE: '50mb'
};

// Read the current .env file if it exists
let currentEnvContent = '';
if (fs.existsSync(mainEnvPath)) {
  currentEnvContent = fs.readFileSync(mainEnvPath, 'utf8');
}

// Parse current env into lines
const currentEnvLines = currentEnvContent.split('\n');
const currentEnvSettings = {};

// Extract current non-speed settings
for (const line of currentEnvLines) {
  // Skip comments and empty lines
  if (line.trim().startsWith('#') || line.trim() === '') {
    continue;
  }
  
  const [key, value] = line.split('=');
  if (key && value !== undefined && !Object.keys(standardConfig).includes(key.trim())) {
    currentEnvSettings[key.trim()] = value.trim();
  }
}

// Merge standard config with non-speed settings from current env
const mergedSettings = {
  ...currentEnvSettings,
  ...standardConfig
};

// Generate the new .env content
let newEnvContent = '';
for (const [key, value] of Object.entries(mergedSettings)) {
  newEnvContent += `${key}=${value}\n`;
}

// Save the new .env file
fs.writeFileSync(mainEnvPath, newEnvContent);

console.log('✅ Standard mode restored!');
console.log('The server will now start with the balanced configuration.');
console.log('All standard features like security scans and background tasks are enabled.');