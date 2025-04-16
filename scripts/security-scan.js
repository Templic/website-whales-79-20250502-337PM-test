#!/usr/bin/env node

/**
 * Enhanced Security Scan Script
 * 
 * This script performs a comprehensive security scan of the application,
 * including dependency checks, code analysis, and configuration review.
 * 
 * Usage:
 *   node scripts/security-scan.js [options]
 * 
 * Options:
 *   --full       Run a full comprehensive scan (may take longer)
 *   --quick      Run a quick scan of critical components only
 *   --report     Generate a detailed report in the reports directory
 *   --fix        Attempt to automatically fix detected issues when possible
 *   --verbose    Show detailed output during scanning
 */

import fs from 'fs';
import path from 'path';
import { execSync, exec } from 'child_process';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';

const execAsync = promisify(exec);

// Constants
const SCAN_RESULTS_DIR = path.join(process.cwd(), 'logs', 'security-scans');
const SECURITY_LOG_FILE = path.join(process.cwd(), 'logs', 'security.log');
const REPORTS_DIR = path.join(process.cwd(), 'reports');

// Ensure directories exist
[SCAN_RESULTS_DIR, path.dirname(SECURITY_LOG_FILE), REPORTS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  full: args.includes('--full'),
  quick: args.includes('--quick'),
  report: args.includes('--report'),
  fix: args.includes('--fix'),
  verbose: args.includes('--verbose')
};

// If no scan type is specified, default to full
if (!options.full && !options.quick) {
  options.full = true;
}

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
async function runScan() {
  const startTime = Date.now();
  log(`Starting security scan (${options.full ? 'full' : 'quick'} scan)...`);
  
  /** @type {SecurityVulnerability[]} */
  const vulnerabilities = [];
  
  try {
    // Step 1: Check for outdated dependencies with security issues
    await checkDependencies(vulnerabilities);
    
    // Step 2: Check for secrets in code
    await checkForSecrets(vulnerabilities);
    
    // Step 3: Check for security headers in responses
    await checkSecurityHeaders(vulnerabilities);
    
    // Step 4: Check for proper CSRF protection
    await checkCSRFProtection(vulnerabilities);
    
    // Step 5: Check for input validation
    await checkInputValidation(vulnerabilities);
    
    // Only do these checks in full scan mode
    if (options.full) {
      // Step 6: Check for SQL injection vulnerabilities
      await checkForSQLInjection(vulnerabilities);
      
      // Step 7: Check for XSS vulnerabilities
      await checkForXSS(vulnerabilities);
      
      // Step 8: Check for secure authentication implementation
      await checkAuthentication(vulnerabilities);
      
      // Step 9: Check logging implementation
      await checkLogging(vulnerabilities);
      
      // Step 10: Check for insecure file operations
      await checkFileOperations(vulnerabilities);
    }
    
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
      scanType: options.full ? 'full' : 'quick',
      totalIssues: vulnerabilities.length,
      criticalIssues,
      highIssues,
      mediumIssues,
      lowIssues,
      vulnerabilities
    };
    
    // Save scan results
    const scanTimestamp = new Date().toISOString().replace(/:/g, '-');
    const scanResultFile = path.join(SCAN_RESULTS_DIR, `scan-${scanTimestamp}.json`);
    fs.writeFileSync(scanResultFile, JSON.stringify(scanResults, null, 2));
    
    // Generate report if requested
    if (options.report) {
      generateReport(scanResults);
    }
    
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
          if (v.recommendation && options.verbose) {
            log(`   Recommendation: ${v.recommendation}`, 'info');
          }
        });
    }
    
    // Attempt to fix issues if requested
    if (options.fix) {
      await attemptFixes(vulnerabilities);
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
    if (options.verbose && error.stack) {
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
    // Run npm audit
    const { stdout } = await execAsync('npm audit --json', { maxBuffer: 10 * 1024 * 1024 });
    const auditResult = JSON.parse(stdout);
    
    if (auditResult.vulnerabilities && Object.keys(auditResult.vulnerabilities).length > 0) {
      // Parse npm audit results
      for (const [pkgName, pkgInfo] of Object.entries(auditResult.vulnerabilities)) {
        // Convert npm severity to our levels
        let severity;
        switch (pkgInfo.severity) {
          case 'critical': severity = 'critical'; break;
          case 'high': severity = 'high'; break;
          case 'moderate': severity = 'medium'; break;
          case 'low': severity = 'low'; break;
          default: severity = 'low';
        }
        
        vulnerabilities.push({
          id: uuidv4(),
          severity,
          description: `Vulnerable dependency: ${pkgName} - ${pkgInfo.name || 'Unknown vulnerability'}`,
          recommendation: `Run 'npm audit fix' or update to version ${pkgInfo.fixAvailable?.version || 'latest'}`
        });
      }
    }
  } catch (error) {
    // Fallback to a simpler check if npm audit fails
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
  }
}

/**
 * Check for hardcoded secrets in code
 * @param {SecurityVulnerability[]} vulnerabilities - Array to add vulnerabilities to
 */
async function checkForSecrets(vulnerabilities) {
  log('Checking for hardcoded secrets in code...');
  
  try {
    // Patterns to search for
    const secretPatterns = [
      'api[_-]?key[\\s]*=[\\s]*[\\"\\\'][a-zA-Z0-9_\\-]{16,}[\\"\\\']',
      'secret[\\s]*=[\\s]*[\\"\\\'][a-zA-Z0-9_\\-]{16,}[\\"\\\']',
      'password[\\s]*=[\\s]*[\\"\\\'][^\\"\\\',]+[\\"\\\']',
      'token[\\s]*=[\\s]*[\\"\\\'][a-zA-Z0-9_\\-.]+[\\"\\\']',
      'access_token[\\s]*=[\\s]*[\\"\\\'][a-zA-Z0-9_\\-.]+[\\"\\\']',
      'authz?[\\s]*=[\\s]*[\\"\\\'][a-zA-Z0-9_\\-.]+[\\"\\\']',
      'bearer[\\s]+[a-zA-Z0-9_\\-.]+',
      '-----BEGIN\\s+(?:RSA|OPENSSH|DSA|EC)\\s+PRIVATE\\s+KEY-----'
    ];
    
    // Directories to exclude
    const excludeDirs = [
      'node_modules',
      '.git',
      'dist',
      'build',
      'logs',
      'coverage'
    ];
    
    // Files to look in
    const fileTypes = '\\.(js|ts|jsx|tsx|json|env|yaml|yml)$';
    
    // Use a more reliable approach to find secrets that doesn't rely on complex grep
    const results = [];
    
    // Function to check a file for secrets
    const checkFileForSecrets = (filePath) => {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check each pattern
        for (const pattern of secretPatterns) {
          const regex = new RegExp(pattern, 'i');
          if (regex.test(content)) {
            results.push(`${filePath}:${pattern}`);
          }
        }
      } catch (error) {
        // Skip files that can't be read
      }
    };
    
    // Function to recursively search directories
    const searchDirectory = (dir) => {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          // Skip excluded directories
          if (entry.isDirectory() && !excludeDirs.includes(entry.name)) {
            searchDirectory(fullPath);
          } else if (entry.isFile() && fullPath.match(new RegExp(fileTypes))) {
            checkFileForSecrets(fullPath);
          }
        }
      } catch (error) {
        // Skip directories that can't be read
      }
    };
    
    // Start the search from the current directory
    searchDirectory('.');
    
    // Format results similar to grep output
    const stdout = results.join('\n');
    
    if (stdout.trim()) {
      const results = stdout.split('\n').filter(line => line.trim() !== '');
      
      for (const result of results) {
        const parts = result.split(':', 1);
        const file = parts[0];
        const content = result.substring(file.length + 1);
        
        if (file && content) {
          // Check if this is in a test file or example
          const isExample = file.includes('example') || file.includes('test') || file.includes('mock') || file.includes('fixture');
          
          vulnerabilities.push({
            id: uuidv4(),
            severity: isExample ? 'medium' : 'high',
            description: 'Potential hardcoded secret detected',
            location: file,
            recommendation: 'Move secrets to environment variables or a secure secret management system'
          });
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
 * Check for CSRF protection
 * @param {SecurityVulnerability[]} vulnerabilities - Array to add vulnerabilities to
 */
async function checkCSRFProtection(vulnerabilities) {
  log('Checking for CSRF protection...');
  
  const serverFiles = [
    path.join(process.cwd(), 'server', 'index.ts'),
    path.join(process.cwd(), 'server', 'middleware.ts'),
    path.join(process.cwd(), 'server', 'routes.ts')
  ];
  
  let foundCSRFProtection = false;
  
  for (const file of serverFiles) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for CSRF protection
      if (
        content.includes('csrf') || 
        content.includes('CSRF') || 
        content.includes('csurf') || 
        content.includes('XSRF') || 
        content.includes('xsrf')
      ) {
        foundCSRFProtection = true;
        break;
      }
    }
  }
  
  if (!foundCSRFProtection) {
    vulnerabilities.push({
      id: uuidv4(),
      severity: 'high',
      description: 'No CSRF protection found',
      recommendation: 'Implement CSRF protection using csurf middleware for all state-changing endpoints'
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
 * Check for SQL injection vulnerabilities
 * @param {SecurityVulnerability[]} vulnerabilities - Array to add vulnerabilities to
 */
async function checkForSQLInjection(vulnerabilities) {
  log('Checking for SQL injection vulnerabilities...');
  
  try {
    // Look for raw SQL query strings with string concatenation
    const grepCommand = `grep -r -i -E "(executeQuery|query|execute|raw)\\s*\\(\\s*[\\\`\\\"\\']\\s*(SELECT|INSERT|UPDATE|DELETE).*\\$\\{" --include="*.js" --include="*.ts" --exclude-dir="node_modules" --exclude-dir=".git" . || true`;
    
    const { stdout } = await execAsync(grepCommand);
    
    if (stdout.trim()) {
      const results = stdout.split('\n').filter(line => line.trim() !== '');
      
      for (const result of results) {
        const parts = result.split(':', 1);
        const file = parts[0];
        
        if (file) {
          vulnerabilities.push({
            id: uuidv4(),
            severity: 'critical',
            description: 'Potential SQL injection vulnerability detected',
            location: file,
            recommendation: 'Use parameterized queries or an ORM instead of string concatenation'
          });
        }
      }
    }
  } catch (error) {
    log(`Error checking for SQL injection: ${error}`, 'error');
  }
}

/**
 * Check for XSS vulnerabilities
 * @param {SecurityVulnerability[]} vulnerabilities - Array to add vulnerabilities to
 */
async function checkForXSS(vulnerabilities) {
  log('Checking for XSS vulnerabilities...');
  
  try {
    // Look for dangerous patterns like innerHTML, dangerouslySetInnerHTML, and document.write
    const grepCommand = `grep -r -i -E "(innerHTML|dangerouslySetInnerHTML|document\\.write)" --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" --exclude-dir="node_modules" --exclude-dir=".git" . || true`;
    
    const { stdout } = await execAsync(grepCommand);
    
    if (stdout.trim()) {
      const results = stdout.split('\n').filter(line => line.trim() !== '');
      
      for (const result of results) {
        const parts = result.split(':', 1);
        const file = parts[0];
        
        if (file) {
          // Check if DOMPurify or other sanitization is used nearby
          const content = fs.readFileSync(file, 'utf8');
          const hasSanitization = content.includes('DOMPurify') || 
                                  content.includes('sanitize') || 
                                  content.includes('escapeHTML');
          
          if (!hasSanitization) {
            vulnerabilities.push({
              id: uuidv4(),
              severity: 'high',
              description: 'Potential XSS vulnerability detected',
              location: file,
              recommendation: 'Use DOMPurify or another HTML sanitization library to sanitize user-generated content'
            });
          }
        }
      }
    }
  } catch (error) {
    log(`Error checking for XSS: ${error}`, 'error');
  }
}

/**
 * Check authentication implementation
 * @param {SecurityVulnerability[]} vulnerabilities - Array to add vulnerabilities to
 */
async function checkAuthentication(vulnerabilities) {
  log('Checking authentication implementation...');
  
  const authFiles = [
    path.join(process.cwd(), 'server', 'auth.ts'),
    path.join(process.cwd(), 'server', 'middleware', 'auth.ts'),
    path.join(process.cwd(), 'server', 'controllers', 'authController.ts')
  ];
  
  let foundPasswordHashing = false;
  let foundBruteForceProtection = false;
  
  for (const file of authFiles) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for password hashing
      if (content.includes('bcrypt') || content.includes('argon2') || content.includes('pbkdf2') || content.includes('scrypt')) {
        foundPasswordHashing = true;
      }
      
      // Check for brute force protection
      if (content.includes('rate-limit') || content.includes('rateLimit') || content.includes('maxAttempts')) {
        foundBruteForceProtection = true;
      }
    }
  }
  
  if (!foundPasswordHashing) {
    vulnerabilities.push({
      id: uuidv4(),
      severity: 'critical',
      description: 'No secure password hashing detected',
      recommendation: 'Use bcrypt or argon2 for password hashing'
    });
  }
  
  if (!foundBruteForceProtection) {
    vulnerabilities.push({
      id: uuidv4(),
      severity: 'high',
      description: 'No brute force protection detected for authentication endpoints',
      recommendation: 'Implement rate limiting on login endpoints to prevent brute force attacks'
    });
  }
}

/**
 * Check logging implementation
 * @param {SecurityVulnerability[]} vulnerabilities - Array to add vulnerabilities to
 */
async function checkLogging(vulnerabilities) {
  log('Checking logging implementation...');
  
  let foundSecurityLogging = false;
  
  // Find log files or directories
  const logDir = path.join(process.cwd(), 'logs');
  if (fs.existsSync(logDir) && fs.statSync(logDir).isDirectory()) {
    const logFiles = fs.readdirSync(logDir);
    if (logFiles.some(file => file.includes('security') || file.includes('audit'))) {
      foundSecurityLogging = true;
    }
  }
  
  // Check for logging imports in server files
  if (!foundSecurityLogging) {
    const serverFiles = fs.readdirSync(path.join(process.cwd(), 'server'));
    for (const file of serverFiles) {
      const filePath = path.join(process.cwd(), 'server', file);
      if (fs.statSync(filePath).isFile() && (file.endsWith('.js') || file.endsWith('.ts'))) {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('logSecurityEvent') || content.includes('auditLog') || content.includes('securityLogger')) {
          foundSecurityLogging = true;
          break;
        }
      }
    }
  }
  
  if (!foundSecurityLogging) {
    vulnerabilities.push({
      id: uuidv4(),
      severity: 'medium',
      description: 'No dedicated security logging found',
      recommendation: 'Implement security event logging for authentication events, access control failures, and other security-relevant events'
    });
  }
}

/**
 * Check for insecure file operations
 * @param {SecurityVulnerability[]} vulnerabilities - Array to add vulnerabilities to
 */
async function checkFileOperations(vulnerabilities) {
  log('Checking for insecure file operations...');
  
  try {
    // Look for file operations with user input
    const grepCommand = `grep -r -i -E "(readFile|writeFile|appendFile|createReadStream|createWriteStream).*(req\\.|request\\.|body\\.|query\\.|params\\.)" --include="*.js" --include="*.ts" --exclude-dir="node_modules" --exclude-dir=".git" . || true`;
    
    const { stdout } = await execAsync(grepCommand);
    
    if (stdout.trim()) {
      const results = stdout.split('\n').filter(line => line.trim() !== '');
      
      for (const result of results) {
        const parts = result.split(':', 1);
        const file = parts[0];
        
        if (file) {
          // Check if path validation is used nearby
          const content = fs.readFileSync(file, 'utf8');
          const hasPathValidation = content.includes('normalize') || 
                                    content.includes('resolve') || 
                                    content.includes('isPathValid') || 
                                    content.includes('sanitizePath');
          
          if (!hasPathValidation) {
            vulnerabilities.push({
              id: uuidv4(),
              severity: 'high',
              description: 'Potential path traversal vulnerability in file operations',
              location: file,
              recommendation: 'Validate and sanitize file paths from user input to prevent path traversal attacks'
            });
          }
        }
      }
    }
  } catch (error) {
    log(`Error checking file operations: ${error}`, 'error');
  }
}

/**
 * Generate a markdown report from scan results
 * @param {Object} scanResults - The scan results object
 */
function generateReport(scanResults) {
  log('Generating security report...');
  
  const reportTimestamp = new Date().toISOString().replace(/:/g, '-');
  const reportPath = path.join(REPORTS_DIR, `security-scan-report-${reportTimestamp}.md`);
  
  const severityEmoji = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🟢'
  };
  
  let reportContent = `# Security Scan Report
  
**Scan Date**: ${new Date(scanResults.timestamp).toLocaleString()}
**Scan Type**: ${scanResults.scanType}
**Scan Duration**: ${scanResults.scanDuration}ms

## Summary

- **Total Issues**: ${scanResults.totalIssues}
- **Critical Issues**: ${scanResults.criticalIssues}
- **High Issues**: ${scanResults.highIssues}
- **Medium Issues**: ${scanResults.mediumIssues}
- **Low Issues**: ${scanResults.lowIssues}

## Vulnerabilities

`;

  // Group vulnerabilities by severity
  const grouped = {
    critical: scanResults.vulnerabilities.filter(v => v.severity === 'critical'),
    high: scanResults.vulnerabilities.filter(v => v.severity === 'high'),
    medium: scanResults.vulnerabilities.filter(v => v.severity === 'medium'),
    low: scanResults.vulnerabilities.filter(v => v.severity === 'low')
  };
  
  // Add each severity section
  ['critical', 'high', 'medium', 'low'].forEach(severity => {
    if (grouped[severity].length > 0) {
      reportContent += `### ${severity.charAt(0).toUpperCase() + severity.slice(1)} Severity Issues (${grouped[severity].length})\n\n`;
      
      grouped[severity].forEach((vuln, i) => {
        reportContent += `${i + 1}. ${severityEmoji[severity]} **${vuln.description}**\n`;
        if (vuln.location) {
          reportContent += `   - **Location**: \`${vuln.location}\`\n`;
        }
        if (vuln.recommendation) {
          reportContent += `   - **Recommendation**: ${vuln.recommendation}\n`;
        }
        reportContent += '\n';
      });
    }
  });
  
  // Add recommendations section
  reportContent += `## Recommendations

1. Fix all critical issues immediately
2. Address high severity issues in the next sprint
3. Plan for medium severity issues in upcoming work
4. Review low severity issues during normal maintenance

## Next Steps

1. Review this report with the security team
2. Create tickets for all critical and high issues
3. Schedule follow-up scan after fixes are implemented
4. Update documentation with lessons learned
`;

  // Write report to file
  fs.writeFileSync(reportPath, reportContent);
  
  log(`Report generated: ${reportPath}`);
}

/**
 * Attempt to automatically fix some security issues
 * @param {SecurityVulnerability[]} vulnerabilities - The detected vulnerabilities
 */
async function attemptFixes(vulnerabilities) {
  if (vulnerabilities.length === 0) {
    return;
  }
  
  log('Attempting to fix detected issues...');
  
  // Count of issues fixed
  let fixedCount = 0;
  
  // Try to fix npm vulnerabilities with npm audit fix
  if (vulnerabilities.some(v => v.description.includes('dependency'))) {
    log('Running npm audit fix for vulnerable dependencies...');
    try {
      await execAsync('npm audit fix --force');
      fixedCount++;
      log('npm audit fix completed', 'success');
    } catch (error) {
      log(`Error running npm audit fix: ${error}`, 'error');
    }
  }
  
  log(`Attempted to fix ${fixedCount} issues`);
}

// Run the scan
runScan();