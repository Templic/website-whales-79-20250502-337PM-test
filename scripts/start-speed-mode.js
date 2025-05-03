#!/usr/bin/env node

/**
 * Speed Mode Startup Script
 * 
 * This script starts the server in the fastest possible mode by
 * setting performance-optimized environment variables.
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('⚡ Starting server in SPEED mode...');

// Set the environment variables for maximum performance
process.env.STARTUP_PRIORITY = 'quickstart';
process.env.STARTUP_MODE = 'minimal';
process.env.ENABLE_DATABASE_OPTIMIZATION = 'false';
process.env.ENABLE_SECURITY_SCANS = 'false';
process.env.ENABLE_BACKGROUND_TASKS = 'false';
process.env.ENABLE_RATE_LIMITING = 'false';
process.env.ENABLE_EXTRA_LOGGING = 'false';
process.env.ENABLE_CONTENT_SCHEDULING = 'false';
process.env.ENABLE_COMPRESSION = 'false';
process.env.CSRF_PROTECTION = 'false';
process.env.MAX_PAYLOAD_SIZE = '10mb';

// Start the server
const serverProcess = spawn('tsx', ['server/index.ts'], {
  stdio: 'inherit',
  env: process.env,
  cwd: rootDir
});

// Handle server process events
serverProcess.on('error', (error) => {
  console.error(`Failed to start server: ${error.message}`);
  process.exit(1);
});

serverProcess.on('close', (code) => {
  if (code !== 0) {
    console.error(`Server process exited with code ${code}`);
    process.exit(code);
  }
});

// Handle termination signals
process.on('SIGINT', () => {
  console.log('Stopping server...');
  serverProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('Stopping server...');
  serverProcess.kill('SIGTERM');
});