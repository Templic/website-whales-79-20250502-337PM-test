/**
 * Quiet Start Script
 * 
 * Starts the application with minimal logging by setting appropriate environment variables
 * to suppress excessive Express router logs.
 */

const { spawn } = require('child_process');
const path = require('path');

// Save original environment variables
const originalDebug = process.env.DEBUG;

// Set environment variables to limit logging
process.env.DEBUG = 'express:error';  // Only show express errors, not router debug logs
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.PORT = process.env.PORT || '5000';

console.log('Starting application with reduced logging...');
console.log(`DEBUG set to: ${process.env.DEBUG}`);

// Run npm script with reduced logging
const npmDev = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  env: process.env
});

// Handle process exit
npmDev.on('exit', (code) => {
  // Restore original environment variables
  if (originalDebug !== undefined) {
    process.env.DEBUG = originalDebug;
  } else {
    delete process.env.DEBUG;
  }
  
  process.exit(code);
});

// Handle process errors
npmDev.on('error', (err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});

// Handle SIGINT (Ctrl+C) to properly terminate the child process
process.on('SIGINT', () => {
  npmDev.kill('SIGINT');
});