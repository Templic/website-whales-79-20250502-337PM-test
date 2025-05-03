/**
 * Reduced Logging Startup Script
 * 
 * This script starts the server with reduced logging settings to suppress
 * excessive Express router logs in the console. It applies multiple logging 
 * reduction techniques:
 * 
 * 1. Sets DEBUG environment variable to only show error-level Express logs
 * 2. Temporarily captures console.log output to filter out router logs
 * 3. Restores normal logging after server initialization
 */

// CommonJS style for better compatibility
const { spawn } = require('child_process');
const path = require('path');

// Remember original environment variables
const originalDebug = process.env.DEBUG;

// Only show error-level Express logs
process.env.DEBUG = 'express:error';

// Save original console methods
const originalConsoleLog = console.log;
const originalConsoleInfo = console.info;

// Set up logging filter
const ROUTER_LOG_PATTERNS = [
  'express:router',
  'Route path:',
  'Route method:',
  'Route handler:',
  'new route',
  'Router.use',
  'Route listed'
];

// Create filtered console logging
function filterLogging() {
  console.log = function(...args) {
    // Check if this is a router log that should be suppressed
    const logStr = args.join(' ');
    const isRouterLog = ROUTER_LOG_PATTERNS.some(pattern => 
      typeof logStr === 'string' && logStr.includes(pattern)
    );
    
    // Skip router logs
    if (!isRouterLog) {
      originalConsoleLog.apply(console, args);
    }
  };
  
  console.info = function(...args) {
    // Check if this is a router log that should be suppressed
    const logStr = args.join(' ');
    const isRouterLog = ROUTER_LOG_PATTERNS.some(pattern => 
      typeof logStr === 'string' && logStr.includes(pattern)
    );
    
    // Skip router logs
    if (!isRouterLog) {
      originalConsoleInfo.apply(console, args);
    }
  };
}

// Restore original console methods
function restoreLogging() {
  console.log = originalConsoleLog;
  console.info = originalConsoleInfo;
}

// Apply logging filter
filterLogging();

console.log('Starting application with reduced logging...');
console.log(`DEBUG level set to: ${process.env.DEBUG}`);
console.log('Express router debug logs are suppressed');

// Set timeout to restore normal logging after server startup
setTimeout(() => {
  restoreLogging();
  console.log('Full application logging restored (router logs still suppressed via DEBUG)');
}, 10000);

// Run the server
const serverProcess = spawn('npm', ['run', 'dev'], { 
  stdio: 'inherit',
  env: process.env
});

// Handle server process exit
serverProcess.on('exit', (code) => {
  // Restore original environment variables
  if (originalDebug !== undefined) {
    process.env.DEBUG = originalDebug;
  } else {
    delete process.env.DEBUG;
  }
  
  // Restore console methods
  restoreLogging();
  
  process.exit(code);
});

// Handle CTRL+C and other termination signals
process.on('SIGINT', () => {
  serverProcess.kill('SIGINT');
  restoreLogging();
});

process.on('SIGTERM', () => {
  serverProcess.kill('SIGTERM');
  restoreLogging();
});