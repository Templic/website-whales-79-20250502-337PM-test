/**
 * Reduced Logging Startup Script
 * 
 * This script starts the server with reduced logging settings to suppress
 * excessive Express router logs in the console.
 */

// CommonJS style for better compatibility
const { execSync } = require('child_process');
const path = require('path');

// Only show error-level Express logs
process.env.DEBUG = 'express:error';

console.log('Starting application with reduced logging...');
console.log(`DEBUG level set to: ${process.env.DEBUG}`);
console.log('Express router debug logs are suppressed');

try {
  // Run npm dev script with our environment variables
  execSync('npm run dev', { 
    stdio: 'inherit',
    env: process.env
  });
} catch (error) {
  console.error('Error starting application:', error.message);
  process.exit(1);
}