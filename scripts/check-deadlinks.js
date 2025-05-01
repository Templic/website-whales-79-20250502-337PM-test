#!/usr/bin/env node

/**
 * Dead Link Checker Utility
 * 
 * A simple command-line interface for running the agent-deadlink-checker.js script.
 * This makes it easy to run the checker with different options.
 * 
 * Usage: node scripts/check-deadlinks.js [options]
 * 
 * Options:
 *   --url <url>      Base URL to check (default: http://localhost:5000)
 *   --depth <n>      Maximum crawl depth (default: 2)
 *   --timeout <ms>   Request timeout in milliseconds (default: 5000)
 *   --output <file>  Output file path (default: agent-deadlinks-report.json)
 *   --help           Show this help message
 * 
 * Example:
 *   node scripts/check-deadlinks.js --url http://localhost:3000 --depth 3
 */

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  url: 'http://localhost:5000',
  depth: 2,
  timeout: 5000,
  output: 'agent-deadlinks-report.json'
};

// Parse arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  
  if (arg === '--help' || arg === '-h') {
    showHelp();
    process.exit(0);
  } else if (arg === '--url' && i + 1 < args.length) {
    options.url = args[++i];
  } else if (arg === '--depth' && i + 1 < args.length) {
    options.depth = parseInt(args[++i], 10);
  } else if (arg === '--timeout' && i + 1 < args.length) {
    options.timeout = parseInt(args[++i], 10);
  } else if (arg === '--output' && i + 1 < args.length) {
    options.output = args[++i];
  } else {
    console.error(`Unknown option: ${arg}`);
    showHelp();
    process.exit(1);
  }
}

// Run the checker
runChecker(options);

/**
 * Show help message
 */
function showHelp() {
  console.log(`
Dead Link Checker Utility

Usage: node scripts/check-deadlinks.js [options]

Options:
  --url <url>      Base URL to check (default: http://localhost:5000)
  --depth <n>      Maximum crawl depth (default: 2)
  --timeout <ms>   Request timeout in milliseconds (default: 5000)
  --output <file>  Output file path (default: agent-deadlinks-report.json)
  --help           Show this help message

Example:
  node scripts/check-deadlinks.js --url http://localhost:3000 --depth 3
  `);
}

/**
 * Run the checker with the specified options
 */
function runChecker(options) {
  // Set environment variables to pass options to the checker
  const env = {
    ...process.env,
    BASE_URL: options.url,
    MAX_DEPTH: options.depth.toString(),
    REQUEST_TIMEOUT: options.timeout.toString(),
    OUTPUT_FILE: options.output
  };
  
  // Get directory name in ES modules
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
  // Spawn the checker process
  const checkerPath = path.join(__dirname, 'agent-deadlink-checker.js');
  
  console.log('Starting Dead Link Checker...');
  console.log(`URL: ${options.url}`);
  console.log(`Depth: ${options.depth}`);
  console.log(`Timeout: ${options.timeout}ms`);
  console.log(`Output: ${options.output}`);
  console.log('-'.repeat(50));
  
  const child = spawn('node', [checkerPath], {
    env,
    stdio: 'inherit'
  });
  
  // Handle process exit
  child.on('exit', (code) => {
    if (code === 0) {
      console.log('\nDead Link Checker completed successfully.');
      
      // Check if the report file exists
      if (fs.existsSync(options.output)) {
        try {
          const report = JSON.parse(fs.readFileSync(options.output, 'utf8'));
          
          console.log('\nSummary:');
          console.log(`Pages visited: ${report.summary.pagesVisited}`);
          console.log(`Links found: ${report.homepage.links.total}`);
          console.log(`Buttons found: ${report.homepage.buttons.total}`);
          console.log(`Broken links: ${report.brokenLinks.length}`);
          console.log(`Dead-end buttons: ${report.deadEndButtons.length}`);
          
          console.log(`\nFull report saved to: ${options.output}`);
        } catch (error) {
          console.error(`Error reading report: ${error.message}`);
        }
      }
    } else {
      console.error(`\nDead Link Checker exited with code ${code}`);
    }
  });
}