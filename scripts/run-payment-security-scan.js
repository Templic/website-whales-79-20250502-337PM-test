#!/usr/bin/env node

/**
 * Payment Security Scanner Runner
 * 
 * This script executes the payment security scanner with the provided options.
 * 
 * Usage:
 *   node scripts/run-payment-security-scan.js [options]
 * 
 * Options:
 *   --report     Generate a detailed report in the reports directory
 *   --verbose    Show detailed output during scanning
 */

import { spawn } from 'child_process';
import path from 'path';

// Get command line arguments
const args = process.argv.slice(2);

// Path to the payment security scanner script
const scannerScript = path.join(process.cwd(), 'scripts', 'payment-security-scan.js');

// Output formatting helper
function formatOutput(output, prefix = '') {
  return output
    .toString()
    .split('\n')
    .filter(line => line.trim() !== '')
    .map(line => `${prefix}${line}`)
    .join('\n');
}

// Run the scanner script with the provided arguments
const scanner = spawn('node', [scannerScript, ...args], {
  stdio: ['inherit', 'pipe', 'pipe']
});

// Handle scanner output
scanner.stdout.on('data', data => {
  console.log(formatOutput(data));
});

scanner.stderr.on('data', data => {
  console.error(formatOutput(data, 'ERROR: '));
});

// Handle script completion
scanner.on('close', code => {
  if (code === 0) {
    console.log('\n✅ Payment security scan completed successfully');
  } else {
    console.error(`\n⚠️ Payment security scan exited with code ${code}`);
    
    if (code === 1) {
      console.log('High severity issues found. Review the report for details.');
    } else if (code === 2) {
      console.log('Critical severity issues found! Immediate attention required.');
    } else {
      console.log('An error occurred during the scan. Check logs for details.');
    }
  }
});