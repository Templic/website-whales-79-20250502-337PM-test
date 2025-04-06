/**
 * Update Dependencies Script
 * 
 * This script automates the process of checking for outdated dependencies,
 * updating them, and running security audits.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const LOG_FILE = path.join('logs', 'dependency-updates.log');

// Ensure logs directory exists
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs', { recursive: true });
}

/**
 * Log message to console and log file
 * @param {string} message - Message to log
 */
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  
  console.log(logMessage);
  
  fs.appendFileSync(LOG_FILE, logMessage + '\n');
}

/**
 * Execute a command and return the output
 * @param {string} command - Command to execute
 * @returns {string} Command output
 */
function execute(command) {
  try {
    log(`Executing: ${command}`);
    const output = execSync(command, { encoding: 'utf8' });
    return output;
  } catch (error) {
    log(`Error executing command: ${command}`);
    log(`Error message: ${error.message}`);
    return error.stdout || '';
  }
}

// Start the update process
log('Starting dependency update process...');

// Check for outdated packages
log('Checking for outdated packages...');
const outdatedOutput = execute('npm outdated --json');
let outdatedPackages = {};

try {
  outdatedPackages = JSON.parse(outdatedOutput);
  const packageCount = Object.keys(outdatedPackages).length;
  log(`Found ${packageCount} outdated packages.`);
} catch (error) {
  log('No outdated packages found or error parsing npm outdated output.');
}

// Run security audit
log('Running security audit...');
const auditOutput = execute('npm audit --json');
let vulnerabilities = {};

try {
  const auditData = JSON.parse(auditOutput);
  vulnerabilities = auditData.vulnerabilities || {};
  const vulnerabilityCount = Object.keys(vulnerabilities).length;
  log(`Found ${vulnerabilityCount} vulnerabilities.`);
  
  // Count by severity
  const severityCounts = {
    critical: 0,
    high: 0,
    moderate: 0,
    low: 0,
    info: 0
  };
  
  for (const [_, vulnerability] of Object.entries(vulnerabilities)) {
    severityCounts[vulnerability.severity]++;
  }
  
  log(`Vulnerability breakdown: ${JSON.stringify(severityCounts)}`);
} catch (error) {
  log('No vulnerabilities found or error parsing npm audit output.');
}

// Update dependencies
log('Updating dependencies...');
const updateOutput = execute('npm update');
log(updateOutput);

// Run audit again to check if vulnerabilities were fixed
log('Running security audit after updates...');
const postUpdateAuditOutput = execute('npm audit --json');
let remainingVulnerabilities = {};

try {
  const auditData = JSON.parse(postUpdateAuditOutput);
  remainingVulnerabilities = auditData.vulnerabilities || {};
  const vulnerabilityCount = Object.keys(remainingVulnerabilities).length;
  
  if (vulnerabilityCount > 0) {
    log(`${vulnerabilityCount} vulnerabilities remain after updates.`);
    log('Some vulnerabilities may require manual intervention or major version upgrades.');
    
    // Generate report of remaining vulnerabilities
    log('Remaining vulnerabilities:');
    for (const [packageName, vulnerability] of Object.entries(remainingVulnerabilities)) {
      log(`- ${packageName} (${vulnerability.severity}): ${vulnerability.via[0].title || 'Unknown'}`);
      log(`  Fix available: ${vulnerability.fixAvailable ? 'Yes' : 'No'}`);
      if (vulnerability.fixAvailable && vulnerability.fixAvailable !== true) {
        log(`  Fix command: npm install ${vulnerability.fixAvailable.name}@${vulnerability.fixAvailable.version}`);
      }
    }
  } else {
    log('All vulnerabilities have been fixed!');
  }
} catch (error) {
  log('Error parsing post-update npm audit output.');
}

log('Dependency update process completed.');