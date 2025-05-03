#!/usr/bin/env node

/**
 * Custom Quick Security Scan
 * 
 * This script performs a quick scan of all security components except CSRF protection.
 * Includes:
 * 1. Core Security Scanning
 * 2. Dependency Scanner
 * 3. Malware Import Scanner
 * 4. API Security (headers only)
 * 5. Input Validation
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { v4 as uuidv4 } from 'uuid';

// Constants
const SCAN_RESULTS_DIR = path.join(process.cwd(), 'logs', 'security-scans');
const SECURITY_LOG_FILE = path.join(process.cwd(), 'logs', 'security.log');

// Ensure directories exist
[SCAN_RESULTS_DIR, path.dirname(SECURITY_LOG_FILE)].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Logger
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
  
  console.log(logEntry);
  
  // Add to security log file for important messages
  if (['error', 'warning', 'critical'].includes(type.toLowerCase())) {
    fs.appendFileSync(SECURITY_LOG_FILE, logEntry + '\n');
  }
}

// Vulnerability type
/**
 * @typedef {Object} SecurityVulnerability
 * @property {string} id - Unique identifier for the vulnerability
 * @property {'critical'|'high'|'medium'|'low'} severity - Severity level
 * @property {string} description - Description of the vulnerability
 * @property {string} [location] - File or location where the vulnerability was found
 * @property {string} [recommendation] - Recommendation for fixing the vulnerability
 */

/**
 * Main scan function
 */
async function runCustomQuickScan() {
  const startTime = Date.now();
  log(`Starting custom quick security scan (excluding CSRF protection)...`);
  
  /** @type {SecurityVulnerability[]} */
  const vulnerabilities = [];
  
  try {
    // Step 1: Check for outdated dependencies with security issues
    await checkDependencies(vulnerabilities);
    
    // Step 2: Check for secrets in code
    await checkForSecrets(vulnerabilities);
    
    // Step 3: Check for security headers in responses
    await checkSecurityHeaders(vulnerabilities);
    
    // Step 4: Skip CSRF Protection (as requested)
    log('Skipping CSRF protection check as requested');
    
    // Step 5: Check for input validation
    await checkInputValidation(vulnerabilities);
    
    // Step 6: Check for malware in imports
    await scanImportsForMalware(vulnerabilities);
    
    // Process scan results
    const scanDuration = Date.now() - startTime;
    
    // Count issues by severity
    let criticalIssues = 0;
    let highIssues = 0;
    let mediumIssues = 0;
    let lowIssues = 0;
    
    vulnerabilities.forEach(vuln => {
      switch (vuln.severity) {
        case 'critical': criticalIssues++; break;
        case 'high': highIssues++; break;
        case 'medium': mediumIssues++; break;
        case 'low': lowIssues++; break;
      }
    });
    
    // Build scan results object
    const scanResults = {
      timestamp: new Date().toISOString(),
      scanDuration,
      scanType: 'custom-quick',
      totalIssues: vulnerabilities.length,
      criticalIssues,
      highIssues,
      mediumIssues,
      lowIssues,
      vulnerabilities
    };
    
    // Save scan results
    const scanTimestamp = new Date().toISOString().replace(/:/g, '-');
    const scanResultFile = path.join(SCAN_RESULTS_DIR, `custom-scan-${scanTimestamp}.json`);
    fs.writeFileSync(scanResultFile, JSON.stringify(scanResults, null, 2));
    
    // Display summary
    log(`Security scan completed in ${scanDuration}ms`);
    log(`Results: ${scanResults.totalIssues} issues found (${criticalIssues} critical, ${highIssues} high, ${mediumIssues} medium, ${lowIssues} low)`);
    
    // Show critical and high vulnerabilities in terminal
    if (criticalIssues > 0 || highIssues > 0) {
      log('Critical and high severity issues:', 'warning');
      vulnerabilities
        .filter(v => ['critical', 'high'].includes(v.severity))
        .forEach((v, i) => {
          log(`${i + 1}. [${v.severity.toUpperCase()}] ${v.description}${v.location ? ` (${v.location})` : ''}`, v.severity);
          if (v.recommendation) {
            log(`   Recommendation: ${v.recommendation}`, 'info');
          }
        });
    }
    
    // Return exit code based on severity
    if (criticalIssues > 0) {
      process.exit(2); // Critical issues found
    } else if (highIssues > 0) {
      process.exit(1); // High issues found
    } else {
      process.exit(0); // No critical or high issues
    }
    
  } catch (error) {
    log(`Error during security scan: ${error}`, 'error');
    if (error.stack) {
      log(error.stack, 'error');
    }
    process.exit(3); // Scan error
  }
}

/**
 * Check for outdated dependencies with security issues
 * @param {SecurityVulnerability[]} vulnerabilities - Array to add vulnerabilities to
 */
async function checkDependencies(vulnerabilities) {
  log('Checking for vulnerable dependencies...');
  
  try {
    // Using a simpler check to avoid hanging
    const packageLockPath = path.join(process.cwd(), 'package-lock.json');
    
    if (fs.existsSync(packageLockPath)) {
      const packageLockContent = fs.readFileSync(packageLockPath, 'utf8');
      const packageLock = JSON.parse(packageLockContent);
      
      // This is a simplistic check for common vulnerable packages
      const vulnerableDependencies = [
        { name: 'lodash', version: '<4.17.21', severity: 'high', description: 'Prototype Pollution' },
        { name: 'axios', version: '<0.21.1', severity: 'medium', description: 'Server-Side Request Forgery' },
        { name: 'minimist', version: '<1.2.6', severity: 'medium', description: 'Prototype Pollution' }
      ];
      
      // Check dependencies
      const dependencies = packageLock.dependencies || {};
      Object.entries(dependencies).forEach(([depName, depInfo]) => {
        const vulnInfo = vulnerableDependencies.find(v => v.name === depName);
        if (vulnInfo) {
          const version = depInfo.version || '';
          // Simple version check
          if (version.replace(/[^0-9.]/g, '') < vulnInfo.version.replace(/[<>=^~]/g, '')) {
            vulnerabilities.push({
              id: uuidv4(),
              severity: vulnInfo.severity,
              description: `Potentially vulnerable dependency: ${depName}@${version} - ${vulnInfo.description}`,
              recommendation: `Update ${depName} to a version matching ${vulnInfo.version}`
            });
          }
        }
      });
    }
  } catch (error) {
    log(`Error checking dependencies: ${error}`, 'error');
    vulnerabilities.push({
      id: uuidv4(),
      severity: 'medium',
      description: 'Error checking for vulnerable dependencies',
      recommendation: 'Run npm audit manually to check for vulnerabilities'
    });
  }
}

/**
 * Check for hardcoded secrets in code
 * @param {SecurityVulnerability[]} vulnerabilities - Array to add vulnerabilities to
 */
async function checkForSecrets(vulnerabilities) {
  log('Checking for hardcoded secrets in code (sample only)...');
  
  try {
    // Simplified scan to prevent timeouts
    // Just check a few key files rather than the entire codebase
    
    const filesToCheck = [
      'server/config.ts',
      'server/auth.ts',
      '.env.example',
      'server/authentication/index.ts'
    ];
    
    // Patterns to search for
    const secretPatterns = [
      'api[_-]?key[\\s]*=[\\s]*[\\"\\\'][a-zA-Z0-9_\\-]{16,}[\\"\\\']',
      'secret[\\s]*=[\\s]*[\\"\\\'][a-zA-Z0-9_\\-]{16,}[\\"\\\']',
      'password[\\s]*=[\\s]*[\\"\\\'][^\\"\\\',]+[\\"\\\']',
      'token[\\s]*=[\\s]*[\\"\\\'][a-zA-Z0-9_\\-.]+[\\"\\\']'
    ];
    
    // Check each file
    for (const filePath of filesToCheck) {
      const fullPath = path.join(process.cwd(), filePath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Check for patterns
        for (const pattern of secretPatterns) {
          const regex = new RegExp(pattern, 'i');
          if (regex.test(content)) {
            // Check if this is in a test file or example
            const isExample = filePath.includes('example') || 
                             filePath.includes('test') || 
                             filePath.includes('mock') || 
                             filePath.includes('fixture');
            
            vulnerabilities.push({
              id: uuidv4(),
              severity: isExample ? 'medium' : 'high',
              description: 'Potential hardcoded secret detected',
              location: filePath,
              recommendation: 'Move secrets to environment variables or a secure secret management system'
            });
          }
        }
      }
    }
  } catch (error) {
    log(`Error checking for secrets: ${error}`, 'error');
    vulnerabilities.push({
      id: uuidv4(),
      severity: 'medium',
      description: 'Unable to check for hardcoded secrets',
      recommendation: 'Manually review code for hardcoded secrets and credentials'
    });
  }
}

/**
 * Check for security headers
 * @param {SecurityVulnerability[]} vulnerabilities - Array to add vulnerabilities to
 */
async function checkSecurityHeaders(vulnerabilities) {
  log('Checking for security headers...');
  
  const serverFiles = [
    path.join(process.cwd(), 'server', 'index.ts'),
    path.join(process.cwd(), 'server', 'middleware.ts'),
    path.join(process.cwd(), 'server', 'app.ts')
  ];
  
  let foundHelmet = false;
  let foundCSP = false;
  let foundHSTS = false;
  let foundXFO = false;
  let foundXSSProtection = false;
  
  for (const file of serverFiles) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for helmet (security headers package)
      if (content.includes('helmet')) {
        foundHelmet = true;
      }
      
      // Check for explicit security headers
      if (content.includes('Content-Security-Policy') || content.includes('csp')) {
        foundCSP = true;
      }
      
      if (content.includes('Strict-Transport-Security') || content.includes('hsts')) {
        foundHSTS = true;
      }
      
      if (content.includes('X-Frame-Options') || content.includes('xfo')) {
        foundXFO = true;
      }
      
      if (content.includes('X-XSS-Protection')) {
        foundXSSProtection = true;
      }
    }
  }
  
  // If helmet is found, assume all headers are set
  if (foundHelmet) {
    return;
  }
  
  // Check for individual headers if helmet is not used
  if (!foundCSP) {
    vulnerabilities.push({
      id: uuidv4(),
      severity: 'high',
      description: 'No Content Security Policy (CSP) header found',
      recommendation: 'Use helmet middleware or set Content-Security-Policy header'
    });
  }
  
  if (!foundHSTS) {
    vulnerabilities.push({
      id: uuidv4(),
      severity: 'medium',
      description: 'No HTTP Strict Transport Security (HSTS) header found',
      recommendation: 'Use helmet middleware or set Strict-Transport-Security header'
    });
  }
  
  if (!foundXFO) {
    vulnerabilities.push({
      id: uuidv4(),
      severity: 'medium',
      description: 'No X-Frame-Options header found',
      recommendation: 'Use helmet middleware or set X-Frame-Options header to prevent clickjacking'
    });
  }
  
  if (!foundXSSProtection) {
    vulnerabilities.push({
      id: uuidv4(),
      severity: 'medium',
      description: 'No X-XSS-Protection header found',
      recommendation: 'Use helmet middleware or set X-XSS-Protection header'
    });
  }
}

/**
 * Check for input validation
 * @param {SecurityVulnerability[]} vulnerabilities - Array to add vulnerabilities to
 */
async function checkInputValidation(vulnerabilities) {
  log('Checking for input validation...');
  
  const serverFiles = [
    path.join(process.cwd(), 'server', 'routes.ts')
  ];
  
  let foundInputValidation = false;
  
  for (const file of serverFiles) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for input validation
      if (
        content.includes('validator') || 
        content.includes('joi') || 
        content.includes('zod') || 
        content.includes('express-validator') || 
        content.includes('validateRequest')
      ) {
        foundInputValidation = true;
        break;
      }
    }
  }
  
  if (!foundInputValidation) {
    vulnerabilities.push({
      id: uuidv4(),
      severity: 'high',
      description: 'No comprehensive input validation found',
      recommendation: 'Implement input validation for all API endpoints using express-validator, zod, or similar'
    });
  }
}

/**
 * Enhanced scan of imported modules for known vulnerabilities, exploits, malware
 * @param {SecurityVulnerability[]} vulnerabilities - Array to add vulnerabilities to
 */
async function scanImportsForMalware(vulnerabilities) {
  log('Scanning imports for known vulnerabilities, exploits, and malware...');
  
  // Get package.json to scan installed dependencies
  try {
    // Read package.json to get actual dependencies
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJsonData = fs.readFileSync(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(packageJsonData);
    
    // Extract all dependencies
    const allDependencies = {
      ...(packageJson.dependencies || {}),
      ...(packageJson.devDependencies || {})
    };
    
    const packageNames = Object.keys(allDependencies);
    log(`Scanning ${packageNames.length} installed packages...`);
    
    // Known malicious packages (expanded list)
    const knownMaliciousImports = [
      'malicious-package-1',
      'malicious-package-2',
      'event-logger', // Known typosquatting package
      'cross-env-shell', // Fake version of legitimate package
      'eslint-config-airbnb-standard', // Known trojan package
      'electron-native-notify', // Known for crypto mining
      'codecov', // Historical vulnerability (for demonstration)
      'browserslist', // Historical vulnerability (for demonstration)
      'ua-parser-js', // Historical vulnerability
      'coa', // Historical vulnerability
      'rc', // Historical vulnerability
      'node-ipc', // Politically motivated malware
      'event-source-polyfill', // Suspicious package
      'nodetest', // Typosquatting
      'javascripttest', // Typosquatting
      'simple-dropbox', // Data stealing
      'n0de-env', // Typosquatting for node-env
      'loadyaml', // Malicious
      'fallguys', // Unauthorized package
      'nodejs-encrypt', // Unauthorized package
      'discord-lofy', // Malicious
      'discord-youtube-dl', // Malicious
      'create-test-repo', // Malicious
      'discord-selfbot-rpc', // Malicious
      'node-dataplicity', // Malicious
      'discord-dose', // Malicious
      'express-toobusy', // Supply chain
      'npm-backdoor', // Explicit backdoor
      'mining-tarball', // Crypto mining
      'crypto-miner', // Crypto mining
      'discordrpc', // Data stealing
      'wallet-address-validator', // Potential crypto theft
      'http-scanner', // Network scanning
      'chromium-browser' // Malicious execution
    ];
    
    // Check for typosquatting or dependency confusion
    const popularPackages = {
      'lodash': 'loadash',
      'express': 'expres',
      'react': 'reactjs',
      'axios': 'axois',
      'moment': 'momentjs',
      'jquery': 'jqury',
      'chalk': 'chalks',
      'dotenv': 'dot-env',
      'request': 'requests'
    };
    
    // Check for exact matches of known malicious packages
    for (const packageName of packageNames) {
      if (knownMaliciousImports.includes(packageName)) {
        vulnerabilities.push({
          id: uuidv4(),
          severity: 'critical',
          description: `Known malicious package detected: ${packageName}`,
          recommendation: 'Remove this package immediately and check for any unusual system activity'
        });
      }
      
      // Check for suspicious names similar to popular packages (typosquatting)
      for (const [legitimate, typosquat] of Object.entries(popularPackages)) {
        if (packageName === typosquat) {
          vulnerabilities.push({
            id: uuidv4(),
            severity: 'high',
            description: `Possible typosquatting package detected: ${packageName} (similar to ${legitimate})`,
            recommendation: `Verify the package is legitimate and consider replacing with ${legitimate}`
          });
        }
      }
    }
    
    // Add scan result
    log(`Package scan completed. ${vulnerabilities.length} potential issues found.`);
    
  } catch (error) {
    log(`Error scanning for malicious imports: ${error}`, 'error');
    vulnerabilities.push({
      id: uuidv4(),
      severity: 'medium',
      description: 'Error scanning for malicious imports',
      recommendation: 'Manually review dependencies for suspicious packages'
    });
  }
}

// Run the scan
runCustomQuickScan();