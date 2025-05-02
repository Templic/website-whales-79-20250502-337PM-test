#!/usr/bin/env node

/**
 * Speed Mode Enabler
 * 
 * This script applies the speed-optimized configuration to enable
 * the fastest startup mode for the server. It modifies the .env file
 * with settings optimized for speed over features.
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Path to configuration files
const speedOptimizedEnvPath = path.join(rootDir, 'config', 'speed-optimized.env');
const mainEnvPath = path.join(rootDir, '.env');

// Check if speed-optimized.env exists
if (!fs.existsSync(speedOptimizedEnvPath)) {
  console.error('Error: speed-optimized.env configuration file not found.');
  process.exit(1);
}

// Read the speed-optimized configuration
const speedConfig = fs.readFileSync(speedOptimizedEnvPath, 'utf8');
const speedConfigLines = speedConfig.split('\n');

// Parse the current .env file if it exists
let currentEnv = {};
if (fs.existsSync(mainEnvPath)) {
  currentEnv = dotenv.parse(fs.readFileSync(mainEnvPath, 'utf8'));
}

// Extract settings from speed config (ignoring comments and empty lines)
const speedSettings = {};
for (const line of speedConfigLines) {
  // Skip comments and empty lines
  if (line.trim().startsWith('#') || line.trim() === '') {
    continue;
  }
  
  const [key, value] = line.split('=');
  if (key && value !== undefined) {
    speedSettings[key.trim()] = value.trim();
  }
}

// Merge the new settings with existing ones, prioritizing speed settings
const mergedEnv = {
  ...currentEnv,
  ...speedSettings,
};

// Generate the new .env content
let newEnvContent = '';
for (const [key, value] of Object.entries(mergedEnv)) {
  newEnvContent += `${key}=${value}\n`;
}

// Save the new .env file
fs.writeFileSync(mainEnvPath, newEnvContent);

console.log('✅ Speed mode enabled successfully!');
console.log('The server will now start with the fastest configuration.');
console.log('Note: Some features like security scans and background tasks are disabled.');