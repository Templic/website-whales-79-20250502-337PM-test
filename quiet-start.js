#!/usr/bin/env node

/**
 * Quiet Start - Simple Wrapper Script
 * 
 * This script is a simplified version that just sets the DEBUG environment
 * variable to suppress express router logs before starting the server.
 */

// Set DEBUG environment variable to only show errors, not router debug logs
process.env.DEBUG = 'express:error';

// Display information
console.log('Starting server with reduced logging (express:router logs suppressed)...');

// Execute the npm script directly
require('child_process').spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  env: process.env
}).on('exit', (code) => process.exit(code));