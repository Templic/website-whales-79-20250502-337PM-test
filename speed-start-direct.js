/**
 * Direct Speed Mode Starter
 * 
 * This script directly sets environment variables before importing the server,
 * ensuring the fastest possible startup by bypassing the configuration system.
 */

// Set environment variables before importing any modules
process.env.ENABLE_SPEED_MODE = 'true';
process.env.ENABLE_FULL_SECURITY = 'false';
process.env.STARTUP_PRIORITY = 'quickstart';
process.env.STARTUP_MODE = 'minimal';
process.env.ENABLE_SECURITY_SCANS = 'false';
process.env.ENABLE_BACKGROUND_TASKS = 'false';
process.env.ENABLE_DATABASE_OPTIMIZATION = 'false';
process.env.ENABLE_RATE_LIMITING = 'false';
process.env.EXTRA_LOGGING = 'false';
process.env.ENABLE_COMPRESSION = 'false';
process.env.NODE_OPTIONS = '--max-old-space-size=256'; // Reduce memory usage

// Print banner
console.log('=======================================');
console.log('⚡ STARTING SERVER IN DIRECT SPEED MODE ⚡');
console.log('=======================================');
console.log('All environment variables set for maximum performance');
console.log('Startup Priority: quickstart');
console.log('Security Scans: disabled');
console.log('Background Tasks: disabled');
console.log('Database Optimization: disabled');
console.log('=======================================');

// Set low timeout for startup
setTimeout(() => {
  console.log('Server startup took too long, exiting...');
  process.exit(1);
}, 30000);

// Start time tracking
const startTime = Date.now();

// Import the server (this will start it)
import('./server/index.js')
  .then(() => {
    // Calculate startup time
    const startupTime = Date.now() - startTime;
    console.log(`⚡ Server started in ${startupTime}ms ⚡`);
  })
  .catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });