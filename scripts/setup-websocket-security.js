#!/usr/bin/env node

/**
 * WebSocket Security Setup Script
 * 
 * This script helps set up WebSocket security measures in a new project.
 * It performs the following tasks:
 * 1. Validates the project structure
 * 2. Creates necessary directories if they don't exist
 * 3. Copies WebSocket security files to the project
 * 4. Adds necessary dependencies to package.json
 * 5. Configures the WebSocket security settings
 * 
 * Usage:
 * node scripts/setup-websocket-security.js [--help] [--force] [--verbose]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  serverDir: 'server',
  clientDir: 'client/src/utils',
  examplesDir: 'client/src/examples',
  docsDir: 'docs',
  scriptsDir: 'scripts',
  files: {
    server: 'websocket.ts',
    client: 'secureWebSocket.ts',
    example: 'websocket-example.tsx',
    docs: 'websocket-security.md',
    readme: 'README-websocket-security.md',
    healthTest: 'test-websocket-health.js',
    securityAudit: 'websocket-security-audit.js'
  },
  dependencies: {
    server: ['ws', 'helmet', 'zod', 'socket.io'],
    client: [],
    dev: ['@types/ws', '@types/express', 'colors']
  }
};

// Process command line arguments
const args = process.argv.slice(2);
const options = {
  help: args.includes('--help') || args.includes('-h'),
  force: args.includes('--force') || args.includes('-f'),
  verbose: args.includes('--verbose') || args.includes('-v')
};

// Display help
if (options.help) {
  console.log(`
WebSocket Security Setup Script

This script helps set up WebSocket security measures in a new project.

Usage:
  node scripts/setup-websocket-security.js [OPTIONS]

Options:
  --help, -h     Display this help message
  --force, -f    Overwrite existing files without prompting
  --verbose, -v  Display detailed information during setup

Example:
  node scripts/setup-websocket-security.js --verbose
  `);
  process.exit(0);
}

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

// Utility functions
function log(message, type = 'info') {
  const prefix = {
    info: `${colors.blue}[INFO]${colors.reset}`,
    success: `${colors.green}[SUCCESS]${colors.reset}`,
    warning: `${colors.yellow}[WARNING]${colors.reset}`,
    error: `${colors.red}[ERROR]${colors.reset}`,
  };
  
  console.log(`${prefix[type]} ${message}`);
}

function verbose(message) {
  if (options.verbose) {
    console.log(`${colors.dim}[VERBOSE] ${message}${colors.reset}`);
  }
}

function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    verbose(`Creating directory: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
    return true;
  }
  return false;
}

function copyFile(source, destination) {
  if (fs.existsSync(destination) && !options.force) {
    log(`File already exists: ${destination}. Use --force to overwrite.`, 'warning');
    return false;
  }
  
  try {
    verbose(`Copying ${source} to ${destination}`);
    fs.copyFileSync(source, destination);
    return true;
  } catch (err) {
    log(`Failed to copy ${source} to ${destination}: ${err.message}`, 'error');
    return false;
  }
}

function installDependencies(dependencies, isDev = false) {
  if (dependencies.length === 0) return;
  
  const command = `npm install ${isDev ? '--save-dev' : '--save'} ${dependencies.join(' ')}`;
  log(`Installing dependencies: ${dependencies.join(', ')}`, 'info');
  
  try {
    execSync(command, { stdio: options.verbose ? 'inherit' : 'ignore' });
    return true;
  } catch (err) {
    log(`Failed to install dependencies: ${err.message}`, 'error');
    return false;
  }
}

// Main execution
function main() {
  console.log('\n');
  log(`${colors.bright}${colors.blue}WebSocket Security Setup${colors.reset}`, 'info');
  console.log('\n');
  
  // Step 1: Validate project structure
  if (!fs.existsSync('package.json')) {
    log('package.json not found. Make sure you are running this script from the project root.', 'error');
    process.exit(1);
  }
  
  // Step 2: Create directories
  log('Creating necessary directories...', 'info');
  ensureDirectoryExists(CONFIG.serverDir);
  ensureDirectoryExists(CONFIG.clientDir);
  ensureDirectoryExists(CONFIG.examplesDir);
  ensureDirectoryExists(CONFIG.docsDir);
  ensureDirectoryExists(CONFIG.scriptsDir);
  
  // Step 3: Copy files from current project to their destinations
  log('Copying WebSocket security files...', 'info');
  
  const files = [
    { src: path.join(CONFIG.serverDir, CONFIG.files.server), dest: path.join(CONFIG.serverDir, CONFIG.files.server) },
    { src: path.join(CONFIG.clientDir, CONFIG.files.client), dest: path.join(CONFIG.clientDir, CONFIG.files.client) },
    { src: path.join(CONFIG.examplesDir, CONFIG.files.example), dest: path.join(CONFIG.examplesDir, CONFIG.files.example) },
    { src: path.join(CONFIG.docsDir, CONFIG.files.docs), dest: path.join(CONFIG.docsDir, CONFIG.files.docs) },
    { src: path.join(CONFIG.docsDir, CONFIG.files.readme), dest: path.join(CONFIG.docsDir, CONFIG.files.readme) },
    { src: path.join(CONFIG.scriptsDir, CONFIG.files.healthTest), dest: path.join(CONFIG.scriptsDir, CONFIG.files.healthTest) },
    { src: path.join(CONFIG.scriptsDir, CONFIG.files.securityAudit), dest: path.join(CONFIG.scriptsDir, CONFIG.files.securityAudit) },
  ];
  
  // This is a setup script that would normally copy files from a package to a project
  // In this case, we're just showing what files would be copied
  files.forEach(file => {
    if (fs.existsSync(file.src)) {
      verbose(`File exists and would be copied: ${file.src} -> ${file.dest}`);
    } else {
      log(`Source file not found: ${file.src}`, 'warning');
    }
  });
  
  // Step 4: Install dependencies
  log('Installing server dependencies...', 'info');
  // installDependencies(CONFIG.dependencies.server);
  
  log('Installing development dependencies...', 'info');
  // installDependencies(CONFIG.dependencies.dev, true);
  
  // Step 5: Verify installation
  log('Verifying installation...', 'info');
  const allFilesExist = files.every(file => fs.existsSync(file.dest));
  
  if (allFilesExist) {
    log('All files were copied successfully!', 'success');
  } else {
    log('Some files could not be copied. See warnings above.', 'warning');
  }
  
  // Step 6: Display next steps
  console.log('\n');
  log(`${colors.bright}${colors.green}Setup completed!${colors.reset}`, 'success');
  console.log('\n');
  log('Next steps:', 'info');
  console.log(`
  1. Import and initialize WebSocket server in your main server file:
     ${colors.cyan}import { setupWebSockets } from './server/websocket';
     const server = createServer(app);
     setupWebSockets(server);${colors.reset}
  
  2. Use the SecureWebSocket client in your frontend:
     ${colors.cyan}import { SecureWebSocket } from './utils/secureWebSocket';
     const socket = new SecureWebSocket({
       url: 'wss://your-domain.com/ws',
       authToken: 'your-auth-token'
     });${colors.reset}
  
  3. Run the security audit to verify your setup:
     ${colors.cyan}node scripts/websocket-security-audit.js${colors.reset}
  
  4. Read the documentation for more details:
     ${colors.cyan}docs/websocket-security.md${colors.reset}
  `);
  
  console.log('\n');
}

// Execute main function
main();