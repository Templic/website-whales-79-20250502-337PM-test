#!/usr/bin/env node

/**
 * Security Audit Script
 * 
 * This script performs a comprehensive security audit of the application,
 * checking against industry best practices and OWASP Top 10 vulnerabilities.
 * 
 * Usage:
 *   node scripts/security-audit.js [options]
 * 
 * Options:
 *   --compliance   Include compliance checks for GDPR, HIPAA, etc.
 *   --detailed     Generate a detailed report with code snippets
 *   --owasp        Focus on OWASP Top 10 vulnerabilities
 *   --report       Generate a formal audit report PDF
 */

import fs from 'fs';
import path from 'path';
import { execSync, exec } from 'child_process';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';

const execAsync = promisify(exec);

// Constants
const AUDIT_RESULTS_DIR = path.join(process.cwd(), 'reports', 'audits');
const COMPLIANCE_CHECKS = {
  'gdpr': ['data-deletion', 'data-export', 'consent', 'data-breach-notification'],
  'hipaa': ['access-controls', 'audit-logging', 'encryption', 'data-integrity'],
  'pci-dss': ['restrict-access', 'protect-data', 'vulnerability-management', 'secure-networks']
};

// OWASP Top 10 - 2021
const OWASP_TOP_10 = [
  { 
    id: 'A01',
    name: 'Broken Access Control',
    patterns: [
      /\.findById\(\s*req\.params/,
      /\.findOne\(\s*\{\s*[^}]*\s*id\s*:\s*req\.params/,
      /role\s*=\s*req\.body\.role/,
      /isAdmin\s*=\s*req\.body\.isAdmin/
    ]
  },
  { 
    id: 'A02',
    name: 'Cryptographic Failures',
    patterns: [
      /createCipher\(/,
      /createHash\('md5'\)/,
      /createHash\('sha1'\)/,
      /http:\/\//,
      /\.env.*PASSWORD/
    ]
  },
  { 
    id: 'A03',
    name: 'Injection',
    patterns: [
      /query\(\s*[\`'"]\s*SELECT.*\$\{/,
      /query\(\s*[\`'"]\s*INSERT.*\$\{/,
      /query\(\s*[\`'"]\s*UPDATE.*\$\{/,
      /query\(\s*[\`'"]\s*DELETE.*\$\{/,
      /eval\(/,
      /new\s+Function\(/
    ]
  },
  { 
    id: 'A04',
    name: 'Insecure Design',
    // This requires manual review
    patterns: []
  },
  { 
    id: 'A05',
    name: 'Security Misconfiguration',
    patterns: [
      /DEBUG\s*=\s*true/,
      /NODE_ENV\s*=\s*['"]?development['"]?/,
      /stacktrace/i
    ]
  },
  { 
    id: 'A06',
    name: 'Vulnerable and Outdated Components',
    // This is checked via npm audit
    patterns: []
  },
  { 
    id: 'A07',
    name: 'Identification and Authentication Failures',
    patterns: [
      /password\s*===\s*/,
      /secrets\s*===\s*/,
      /(!req\.session\.authenticated|!authenticated)/
    ]
  },
  { 
    id: 'A08',
    name: 'Software and Data Integrity Failures',
    patterns: [
      /deserialize/,
      /unserialize/,
      /GITHUB_WEBHOOK_SECRET/
    ]
  },
  { 
    id: 'A09',
    name: 'Security Logging and Monitoring Failures',
    patterns: [
      /catch\s*\([^)]*\)\s*\{\s*\}/,
      /catch\s*\([^)]*\)\s*\{\s*console/
    ]
  },
  { 
    id: 'A10',
    name: 'Server-Side Request Forgery',
    patterns: [
      /https?\.get\(\s*req\.body/,
      /https?\.get\(\s*req\.query/,
      /https?\.get\(\s*req\.params/,
      /fetch\(\s*req\.body/,
      /fetch\(\s*req\.query/,
      /fetch\(\s*req\.params/,
      /axios\.get\(\s*req\.body/,
      /axios\.get\(\s*req\.query/,
      /axios\.get\(\s*req\.params/
    ]
  }
];

// Ensure directory exists
if (!fs.existsSync(AUDIT_RESULTS_DIR)) {
  fs.mkdirSync(AUDIT_RESULTS_DIR, { recursive: true });
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  compliance: args.includes('--compliance'),
  detailed: args.includes('--detailed'),
  owasp: args.includes('--owasp'),
  report: args.includes('--report')
};

// Logger
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
  console.log(logEntry);
}

/**
 * Main function to run the security audit
 */
async function runAudit() {
  log('Starting security audit...');
  const startTime = Date.now();
  
  // Audit results
  const results = {
    timestamp: new Date().toISOString(),
    owaspFindings: [],
    generalFindings: [],
    npmAudit: null,
    complianceFindings: [],
    summary: {
      criticalIssues: 0,
      highIssues: 0,
      mediumIssues: 0,
      lowIssues: 0,
      complianceGaps: 0
    }
  };
  
  try {
    // 1. Check for OWASP Top 10 vulnerabilities
    if (options.owasp || !options.compliance) {
      await checkOwaspTop10(results);
    }
    
    // 2. Run npm audit
    await runNpmAudit(results);
    
    // 3. Check authentication implementation
    await checkAuthImplementation(results);
    
    // 4. Check for secure coding practices
    await checkSecureCoding(results);
    
    // 5. Check for proper error handling
    await checkErrorHandling(results);
    
    // 6. Check for environment-specific configurations
    await checkEnvironmentConfig(results);
    
    // 7. Check compliance requirements if specified
    if (options.compliance) {
      await checkCompliance(results);
    }
    
    // 8. Check for security headers
    await checkSecurityHeaders(results);
    
    // 9. Check for exposed sensitive information
    await checkForExposedInfo(results);
    
    // Calculate duration
    const duration = Date.now() - startTime;
    results.duration = duration;
    
    // Count issues
    countIssues(results);
    
    // Save results
    const auditTimestamp = new Date().toISOString().replace(/:/g, '-');
    const auditResultFile = path.join(AUDIT_RESULTS_DIR, `audit-${auditTimestamp}.json`);
    fs.writeFileSync(auditResultFile, JSON.stringify(results, null, 2));
    
    // Generate report if requested
    if (options.report) {
      generateAuditReport(results);
    }
    
    // Output summary
    log(`Security audit completed in ${duration}ms`);
    log(`Results: ${results.summary.criticalIssues + results.summary.highIssues + results.summary.mediumIssues + results.summary.lowIssues} issues found`);
    log(`  Critical: ${results.summary.criticalIssues}`);
    log(`  High: ${results.summary.highIssues}`);
    log(`  Medium: ${results.summary.mediumIssues}`);
    log(`  Low: ${results.summary.lowIssues}`);
    
    if (options.compliance) {
      log(`  Compliance gaps: ${results.summary.complianceGaps}`);
    }
    
    // Exit with status code based on findings
    if (results.summary.criticalIssues > 0) {
      process.exit(2);
    } else if (results.summary.highIssues > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error) {
    log(`Error during security audit: ${error}`, 'error');
    process.exit(3);
  }
}

/**
 * Check for OWASP Top 10 vulnerabilities
 * @param {Object} results - The audit results object
 */
async function checkOwaspTop10(results) {
  log('Checking for OWASP Top 10 vulnerabilities...');
  
  // Find all code files
  const codeFiles = await findCodeFiles();
  
  // Check each OWASP category
  for (const category of OWASP_TOP_10) {
    log(`Checking for ${category.id}: ${category.name}...`);
    
    // Skip categories that need manual review
    if (category.patterns.length === 0) {
      continue;
    }
    
    // Check patterns across code files
    const findings = [];
    
    for (const file of codeFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        for (const pattern of category.patterns) {
          if (pattern.test(content)) {
            // Extract the matching line(s) for detailed report
            const lines = content.split('\n');
            const matchingLines = [];
            
            for (let i = 0; i < lines.length; i++) {
              if (pattern.test(lines[i])) {
                const lineNumber = i + 1;
                matchingLines.push({
                  line: lineNumber,
                  content: lines[i].trim()
                });
              }
            }
            
            findings.push({
              file,
              matchingLines,
              pattern: pattern.toString()
            });
          }
        }
      } catch (error) {
        // Skip files that can't be read
        continue;
      }
    }
    
    // Add findings to results
    if (findings.length > 0) {
      results.owaspFindings.push({
        id: category.id,
        name: category.name,
        findings,
        severity: getSeverityForOwasp(category.id)
      });
    }
  }
}

/**
 * Run npm audit for dependency vulnerabilities
 * @param {Object} results - The audit results object
 */
async function runNpmAudit(results) {
  log('Running npm audit...');
  
  try {
    // Run npm audit --json
    const { stdout } = await execAsync('npm audit --json', { maxBuffer: 10 * 1024 * 1024 });
    const auditResult = JSON.parse(stdout);
    
    // Add to results
    results.npmAudit = {
      metadata: auditResult.metadata,
      vulnerabilities: {}
    };
    
    // Process vulnerabilities
    if (auditResult.vulnerabilities) {
      for (const [name, details] of Object.entries(auditResult.vulnerabilities)) {
        results.npmAudit.vulnerabilities[name] = {
          name,
          severity: details.severity,
          via: details.via,
          effects: details.effects,
          fixAvailable: details.fixAvailable ? true : false
        };
      }
    }
  } catch (error) {
    log(`Error running npm audit: ${error}`, 'warning');
    results.npmAudit = {
      error: 'Failed to run npm audit',
      message: error.message
    };
  }
}

/**
 * Check authentication implementation
 * @param {Object} results - The audit results object
 */
async function checkAuthImplementation(results) {
  log('Checking authentication implementation...');
  
  const authFiles = [
    'server/auth.ts',
    'server/middleware/auth.ts',
    'server/controllers/authController.ts',
    'server/routes/auth.ts'
  ];
  
  const findings = [];
  
  for (const relFile of authFiles) {
    const file = path.join(process.cwd(), relFile);
    if (!fs.existsSync(file)) continue;
    
    const content = fs.readFileSync(file, 'utf8');
    
    // Check for password hashing
    if (!content.includes('bcrypt') && !content.includes('argon2') && !content.includes('pbkdf2')) {
      findings.push({
        file: relFile,
        issue: 'No secure password hashing detected',
        recommendation: 'Use bcrypt, argon2, or pbkdf2 for password hashing',
        severity: 'critical'
      });
    }
    
    // Check for plain text password comparisons
    if (/password\s*===|password\s*==/.test(content)) {
      findings.push({
        file: relFile,
        issue: 'Plain text password comparison detected',
        recommendation: 'Use secure password comparison functions like bcrypt.compare',
        severity: 'critical'
      });
    }
    
    // Check for rate limiting
    if (!content.includes('rate-limit') && !content.includes('rateLimit')) {
      findings.push({
        file: relFile,
        issue: 'No rate limiting detected on authentication endpoints',
        recommendation: 'Implement rate limiting to prevent brute force attacks',
        severity: 'high'
      });
    }
    
    // Check for session security
    if (content.includes('session') && !content.includes('secure: true') && !content.includes('httpOnly: true')) {
      findings.push({
        file: relFile,
        issue: 'Insecure session configuration detected',
        recommendation: 'Set secure and httpOnly flags on session cookies',
        severity: 'high'
      });
    }
  }
  
  // Add findings to results
  findings.forEach(finding => {
    results.generalFindings.push({
      category: 'Authentication Security',
      ...finding
    });
  });
}

/**
 * Check for secure coding practices
 * @param {Object} results - The audit results object
 */
async function checkSecureCoding(results) {
  log('Checking for secure coding practices...');
  
  const codeFiles = await findCodeFiles();
  const findings = [];
  
  for (const file of codeFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const relFile = path.relative(process.cwd(), file);
      
      // Check for eval
      if (content.includes('eval(')) {
        findings.push({
          file: relFile,
          issue: 'Use of eval() detected',
          recommendation: 'Avoid using eval() as it can execute arbitrary code',
          severity: 'critical'
        });
      }
      
      // Check for setTimeout with string argument
      if (/setTimeout\(\s*['"]/.test(content)) {
        findings.push({
          file: relFile,
          issue: 'setTimeout with string argument detected',
          recommendation: 'Avoid passing strings to setTimeout as they use eval() internally',
          severity: 'high'
        });
      }
      
      // Check for dangerous functions
      if (
        content.includes('document.write(') || 
        content.includes('innerHTML') || 
        content.includes('dangerouslySetInnerHTML')
      ) {
        findings.push({
          file: relFile,
          issue: 'Potentially unsafe DOM manipulation detected',
          recommendation: 'Use safe DOM manipulation methods or sanitize input with DOMPurify',
          severity: 'high'
        });
      }
      
      // Check for absence of input validation
      if (
        (content.includes('req.body') || content.includes('req.params') || content.includes('req.query')) &&
        !content.includes('validate') && !content.includes('validator') && !content.includes('joi') && !content.includes('zod')
      ) {
        findings.push({
          file: relFile,
          issue: 'Possible lack of input validation',
          recommendation: 'Validate all user input using a validation library',
          severity: 'medium'
        });
      }
      
      // Check for weak random number generation
      if (content.includes('Math.random()') && 
          (content.includes('token') || content.includes('password') || content.includes('secret') || content.includes('key'))) {
        findings.push({
          file: relFile,
          issue: 'Use of Math.random() for security-sensitive values',
          recommendation: 'Use crypto.randomBytes() or similar cryptographically secure random number generation',
          severity: 'high'
        });
      }
    } catch (error) {
      // Skip files that can't be read
      continue;
    }
  }
  
  // Add findings to results
  findings.forEach(finding => {
    results.generalFindings.push({
      category: 'Secure Coding',
      ...finding
    });
  });
}

/**
 * Check for proper error handling
 * @param {Object} results - The audit results object
 */
async function checkErrorHandling(results) {
  log('Checking for proper error handling...');
  
  const codeFiles = await findCodeFiles();
  const findings = [];
  
  for (const file of codeFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const relFile = path.relative(process.cwd(), file);
      
      // Empty catch blocks
      if (/catch\s*\([^)]*\)\s*\{\s*\}/.test(content)) {
        findings.push({
          file: relFile,
          issue: 'Empty catch block detected',
          recommendation: 'Properly handle errors instead of silently ignoring them',
          severity: 'medium'
        });
      }
      
      // Console.log in catch blocks
      if (/catch\s*\([^)]*\)\s*\{[^}]*console\.log/.test(content)) {
        findings.push({
          file: relFile,
          issue: 'console.log in catch block detected',
          recommendation: 'Use proper error logging for production environments',
          severity: 'low'
        });
      }
      
      // Error details exposed to users
      if (/res\.send\(.*error/.test(content) || /res\.json\(.*error/.test(content)) {
        findings.push({
          file: relFile,
          issue: 'Possible exposure of error details to users',
          recommendation: 'Avoid sending detailed error information to clients',
          severity: 'medium'
        });
      }
    } catch (error) {
      // Skip files that can't be read
      continue;
    }
  }
  
  // Add findings to results
  findings.forEach(finding => {
    results.generalFindings.push({
      category: 'Error Handling',
      ...finding
    });
  });
}

/**
 * Check for environment-specific configurations
 * @param {Object} results - The audit results object
 */
async function checkEnvironmentConfig(results) {
  log('Checking for environment-specific configurations...');
  
  const configFiles = [
    '.env',
    '.env.example',
    '.env.development',
    '.env.production',
    'config/default.js',
    'config/default.ts',
    'config/development.js',
    'config/development.ts',
    'config/production.js',
    'config/production.ts'
  ];
  
  const findings = [];
  
  for (const relFile of configFiles) {
    const file = path.join(process.cwd(), relFile);
    if (!fs.existsSync(file)) continue;
    
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for hardcoded secrets
      if (
        /(API_KEY|SECRET|PASSWORD|TOKEN|CREDENTIALS)="[^"]{5,}"/.test(content) ||
        /(API_KEY|SECRET|PASSWORD|TOKEN|CREDENTIALS)='[^']{5,}'/.test(content)
      ) {
        findings.push({
          file: relFile,
          issue: 'Hardcoded secrets detected in configuration file',
          recommendation: 'Remove secrets from configuration files and use environment variables',
          severity: 'critical'
        });
      }
      
      // Check for development settings in production files
      if (
        relFile.includes('production') &&
        (content.includes('DEBUG=true') || content.includes('NODE_ENV=development'))
      ) {
        findings.push({
          file: relFile,
          issue: 'Development settings in production configuration',
          recommendation: 'Ensure production configurations have appropriate security settings',
          severity: 'high'
        });
      }
    } catch (error) {
      // Skip files that can't be read
      continue;
    }
  }
  
  // Add findings to results
  findings.forEach(finding => {
    results.generalFindings.push({
      category: 'Configuration Security',
      ...finding
    });
  });
}

/**
 * Check for compliance with regulations
 * @param {Object} results - The audit results object
 */
async function checkCompliance(results) {
  log('Checking for compliance requirements...');
  
  const codeFiles = await findCodeFiles();
  
  // Check each compliance framework
  for (const [framework, checks] of Object.entries(COMPLIANCE_CHECKS)) {
    log(`Checking ${framework.toUpperCase()} compliance...`);
    
    const findings = [];
    
    for (const check of checks) {
      let found = false;
      
      // Look for implementations of each compliance requirement
      for (const file of codeFiles) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          
          // This is a simplified check - in a real audit, this would be more comprehensive
          if (content.includes(check) || content.includes(check.replace('-', ' '))) {
            found = true;
            break;
          }
        } catch (error) {
          continue;
        }
      }
      
      if (!found) {
        findings.push({
          check,
          issue: `No implementation found for ${framework.toUpperCase()} requirement: ${check}`,
          recommendation: `Implement ${check} functionality to comply with ${framework.toUpperCase()}`
        });
      }
    }
    
    // Add findings to results
    if (findings.length > 0) {
      results.complianceFindings.push({
        framework: framework.toUpperCase(),
        findings
      });
      
      // Update compliance gaps count
      results.summary.complianceGaps += findings.length;
    }
  }
}

/**
 * Check for security headers
 * @param {Object} results - The audit results object
 */
async function checkSecurityHeaders(results) {
  log('Checking for security headers...');
  
  const serverFiles = [
    'server/index.ts',
    'server/app.ts',
    'server/middleware.ts',
    'server/index.js',
    'server/app.js',
    'server/middleware.js'
  ];
  
  const findings = [];
  let foundHelmet = false;
  
  for (const relFile of serverFiles) {
    const file = path.join(process.cwd(), relFile);
    if (!fs.existsSync(file)) continue;
    
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for helmet
      if (content.includes('helmet') || content.includes('Helmet')) {
        foundHelmet = true;
        break;
      }
    } catch (error) {
      continue;
    }
  }
  
  if (!foundHelmet) {
    // Check for individual security headers
    let foundCSP = false;
    let foundXFO = false;
    let foundHSTS = false;
    
    for (const relFile of serverFiles) {
      const file = path.join(process.cwd(), relFile);
      if (!fs.existsSync(file)) continue;
      
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for Content-Security-Policy
        if (content.includes('Content-Security-Policy')) {
          foundCSP = true;
        }
        
        // Check for X-Frame-Options
        if (content.includes('X-Frame-Options')) {
          foundXFO = true;
        }
        
        // Check for Strict-Transport-Security
        if (content.includes('Strict-Transport-Security')) {
          foundHSTS = true;
        }
      } catch (error) {
        continue;
      }
    }
    
    // Add findings for missing headers
    if (!foundCSP) {
      findings.push({
        issue: 'Content Security Policy (CSP) header not found',
        recommendation: 'Implement CSP to prevent XSS and data injection attacks',
        severity: 'high'
      });
    }
    
    if (!foundXFO) {
      findings.push({
        issue: 'X-Frame-Options header not found',
        recommendation: 'Set X-Frame-Options to prevent clickjacking attacks',
        severity: 'medium'
      });
    }
    
    if (!foundHSTS) {
      findings.push({
        issue: 'HTTP Strict Transport Security (HSTS) header not found',
        recommendation: 'Implement HSTS to enforce HTTPS connections',
        severity: 'medium'
      });
    }
    
    if (findings.length > 0 && !foundHelmet) {
      findings.push({
        issue: 'Helmet middleware not found',
        recommendation: 'Use Helmet middleware to easily implement security headers',
        severity: 'medium'
      });
    }
  }
  
  // Add findings to results
  findings.forEach(finding => {
    results.generalFindings.push({
      category: 'Security Headers',
      ...finding
    });
  });
}

/**
 * Check for exposed sensitive information
 * @param {Object} results - The audit results object
 */
async function checkForExposedInfo(results) {
  log('Checking for exposed sensitive information...');
  
  const findings = [];
  
  // Check for sensitive files in version control
  const gitIgnore = path.join(process.cwd(), '.gitignore');
  if (fs.existsSync(gitIgnore)) {
    const content = fs.readFileSync(gitIgnore, 'utf8');
    
    // Check if .env files are gitignored
    if (!content.includes('.env') && !content.includes('*.env')) {
      findings.push({
        file: '.gitignore',
        issue: '.env files may not be ignored in version control',
        recommendation: 'Add .env and *.env to .gitignore to prevent committing secrets',
        severity: 'high'
      });
    }
    
    // Check if log files are gitignored
    if (!content.includes('logs/') && !content.includes('*.log')) {
      findings.push({
        file: '.gitignore',
        issue: 'Log files may not be ignored in version control',
        recommendation: 'Add logs/ and *.log to .gitignore to prevent committing sensitive logs',
        severity: 'medium'
      });
    }
  }
  
  // Check for sensitive data in code
  const patterns = [
    {
      pattern: /console\.log\(.*password/i,
      issue: 'Logging of password data',
      recommendation: 'Avoid logging sensitive information like passwords',
      severity: 'high'
    },
    {
      pattern: /console\.log\(.*user/i,
      issue: 'Possible logging of user data',
      recommendation: 'Ensure no sensitive user data is logged',
      severity: 'medium'
    },
    {
      pattern: /console\.log\(.*credit/i,
      issue: 'Possible logging of credit card data',
      recommendation: 'Never log financial or credit card information',
      severity: 'critical'
    }
  ];
  
  const codeFiles = await findCodeFiles();
  
  for (const file of codeFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const relFile = path.relative(process.cwd(), file);
      
      // Check each pattern
      for (const { pattern, issue, recommendation, severity } of patterns) {
        if (pattern.test(content)) {
          findings.push({
            file: relFile,
            issue,
            recommendation,
            severity
          });
        }
      }
    } catch (error) {
      continue;
    }
  }
  
  // Add findings to results
  findings.forEach(finding => {
    results.generalFindings.push({
      category: 'Sensitive Information Exposure',
      ...finding
    });
  });
}

/**
 * Count issues by severity
 * @param {Object} results - The audit results object
 */
function countIssues(results) {
  // Count general findings
  results.generalFindings.forEach(finding => {
    switch (finding.severity) {
      case 'critical':
        results.summary.criticalIssues++;
        break;
      case 'high':
        results.summary.highIssues++;
        break;
      case 'medium':
        results.summary.mediumIssues++;
        break;
      case 'low':
        results.summary.lowIssues++;
        break;
    }
  });
  
  // Count OWASP findings
  results.owaspFindings.forEach(category => {
    switch (category.severity) {
      case 'critical':
        results.summary.criticalIssues++;
        break;
      case 'high':
        results.summary.highIssues++;
        break;
      case 'medium':
        results.summary.mediumIssues++;
        break;
      case 'low':
        results.summary.lowIssues++;
        break;
    }
  });
  
  // Count npm audit findings
  if (results.npmAudit && results.npmAudit.vulnerabilities) {
    Object.values(results.npmAudit.vulnerabilities).forEach(vuln => {
      switch (vuln.severity) {
        case 'critical':
          results.summary.criticalIssues++;
          break;
        case 'high':
          results.summary.highIssues++;
          break;
        case 'moderate':
          results.summary.mediumIssues++;
          break;
        case 'low':
          results.summary.lowIssues++;
          break;
      }
    });
  }
}

/**
 * Generate an audit report
 * @param {Object} results - The audit results object
 */
function generateAuditReport(results) {
  log('Generating audit report...');
  
  const reportTimestamp = new Date().toISOString().replace(/:/g, '-');
  const reportPath = path.join(AUDIT_RESULTS_DIR, `security-audit-report-${reportTimestamp}.md`);
  
  let reportContent = `# Security Audit Report

**Date**: ${new Date(results.timestamp).toLocaleString()}
**Duration**: ${results.duration}ms

## Executive Summary

This security audit evaluates the application against industry best practices and the OWASP Top 10 vulnerabilities. The audit found:

- **${results.summary.criticalIssues}** critical issues
- **${results.summary.highIssues}** high severity issues
- **${results.summary.mediumIssues}** medium severity issues
- **${results.summary.lowIssues}** low severity issues
${options.compliance ? `- **${results.summary.complianceGaps}** compliance gaps` : ''}

${getSecurityScoreText(results)}

## OWASP Top 10 Findings

`;

  // Add OWASP findings
  if (results.owaspFindings.length === 0) {
    reportContent += 'No OWASP vulnerabilities detected.\n\n';
  } else {
    results.owaspFindings.forEach(category => {
      reportContent += `### ${category.id}: ${category.name}\n\n`;
      reportContent += `**Severity**: ${category.severity}\n\n`;
      reportContent += `**Findings**: ${category.findings.length} issue(s)\n\n`;
      
      category.findings.forEach(finding => {
        reportContent += `- **File**: ${finding.file}\n`;
        if (options.detailed && finding.matchingLines && finding.matchingLines.length > 0) {
          reportContent += '  **Matching Lines**:\n';
          finding.matchingLines.forEach(line => {
            reportContent += `  - Line ${line.line}: \`${line.content}\`\n`;
          });
        }
      });
      
      reportContent += '\n';
    });
  }
  
  // Add general findings
  reportContent += '## General Security Findings\n\n';
  
  if (results.generalFindings.length === 0) {
    reportContent += 'No general security issues detected.\n\n';
  } else {
    // Group by category
    const groupedFindings = {};
    results.generalFindings.forEach(finding => {
      if (!groupedFindings[finding.category]) {
        groupedFindings[finding.category] = [];
      }
      groupedFindings[finding.category].push(finding);
    });
    
    // Add each category
    for (const [category, findings] of Object.entries(groupedFindings)) {
      reportContent += `### ${category}\n\n`;
      
      findings.forEach((finding, index) => {
        reportContent += `${index + 1}. **${finding.issue}** [${finding.severity}]\n`;
        if (finding.file) {
          reportContent += `   - **File**: ${finding.file}\n`;
        }
        reportContent += `   - **Recommendation**: ${finding.recommendation}\n\n`;
      });
    }
  }
  
  // Add npm audit findings
  reportContent += '## Dependency Security\n\n';
  
  if (results.npmAudit && results.npmAudit.vulnerabilities) {
    const vulnerabilities = results.npmAudit.vulnerabilities;
    const vulnCount = Object.keys(vulnerabilities).length;
    
    if (vulnCount === 0) {
      reportContent += 'No vulnerable dependencies detected.\n\n';
    } else {
      reportContent += `${vulnCount} vulnerable dependencies detected:\n\n`;
      
      // Group by severity
      const bySeverity = {
        critical: [],
        high: [],
        moderate: [],
        low: []
      };
      
      for (const [name, details] of Object.entries(vulnerabilities)) {
        if (!bySeverity[details.severity]) {
          bySeverity[details.severity] = [];
        }
        bySeverity[details.severity].push({ name, ...details });
      }
      
      // Add each severity group
      for (const severity of ['critical', 'high', 'moderate', 'low']) {
        const vulns = bySeverity[severity];
        if (vulns && vulns.length > 0) {
          reportContent += `### ${severity.charAt(0).toUpperCase() + severity.slice(1)} Severity Dependencies (${vulns.length})\n\n`;
          
          vulns.forEach(vuln => {
            reportContent += `- **${vuln.name}**\n`;
            reportContent += `  - ${Array.isArray(vuln.via) ? vuln.via.join(', ') : vuln.via}\n`;
            if (vuln.fixAvailable) {
              reportContent += `  - Fix available\n`;
            }
            reportContent += '\n';
          });
        }
      }
    }
  } else {
    reportContent += 'Unable to retrieve dependency information.\n\n';
  }
  
  // Add compliance findings if requested
  if (options.compliance) {
    reportContent += '## Compliance Findings\n\n';
    
    if (results.complianceFindings.length === 0) {
      reportContent += 'No compliance gaps detected.\n\n';
    } else {
      results.complianceFindings.forEach(compliance => {
        reportContent += `### ${compliance.framework} Compliance\n\n`;
        reportContent += `${compliance.findings.length} compliance gaps detected:\n\n`;
        
        compliance.findings.forEach((finding, index) => {
          reportContent += `${index + 1}. **${finding.check}**\n`;
          reportContent += `   - **Issue**: ${finding.issue}\n`;
          reportContent += `   - **Recommendation**: ${finding.recommendation}\n\n`;
        });
      });
    }
  }
  
  // Add recommendations
  reportContent += '## Recommendations\n\n';
  reportContent += '1. **Address Critical Issues First**: Fix all critical security issues immediately\n';
  reportContent += '2. **Implement Security Headers**: Ensure proper security headers are set for all responses\n';
  reportContent += '3. **Update Dependencies**: Keep all dependencies up to date and regularly run security audits\n';
  reportContent += '4. **Input Validation**: Validate all user input before processing or storing it\n';
  reportContent += '5. **Error Handling**: Improve error handling to avoid leaking sensitive information\n';
  
  if (results.summary.criticalIssues + results.summary.highIssues > 0) {
    reportContent += '6. **Schedule Follow-up Audit**: After addressing high and critical issues, schedule a follow-up audit\n';
  }
  
  if (options.compliance && results.summary.complianceGaps > 0) {
    reportContent += '7. **Address Compliance Gaps**: Implement the recommended changes to address compliance requirements\n';
  }
  
  // Add next steps
  reportContent += '\n## Next Steps\n\n';
  reportContent += '1. Prioritize issues based on severity and business impact\n';
  reportContent += '2. Create tickets for each issue that needs to be addressed\n';
  reportContent += '3. Establish a timeline for remediation\n';
  reportContent += '4. Implement improvements and fixes\n';
  reportContent += '5. Conduct a follow-up audit to verify issues have been resolved\n';
  reportContent += '6. Establish a regular security testing schedule\n';
  
  // Write report to file
  fs.writeFileSync(reportPath, reportContent);
  
  log(`Audit report generated: ${reportPath}`);
}

/**
 * Get security score text based on findings
 * @param {Object} results - The audit results object
 * @returns {string} The security score text
 */
function getSecurityScoreText(results) {
  const { criticalIssues, highIssues, mediumIssues, lowIssues } = results.summary;
  
  let score = 100;
  
  // Calculate score based on issues
  score -= criticalIssues * 15;
  score -= highIssues * 7;
  score -= mediumIssues * 3;
  score -= lowIssues * 1;
  
  // Ensure score is between 0 and 100
  score = Math.max(0, Math.min(100, score));
  
  // Get rating based on score
  let rating;
  if (score >= 95) {
    rating = 'Excellent';
  } else if (score >= 85) {
    rating = 'Good';
  } else if (score >= 70) {
    rating = 'Fair';
  } else if (score >= 50) {
    rating = 'Poor';
  } else {
    rating = 'Critical';
  }
  
  return `The application's current security score is **${score.toFixed(1)}%** (${rating}).`;
}

/**
 * Get severity for OWASP category
 * @param {string} categoryId - The OWASP category ID
 * @returns {string} The severity level
 */
function getSeverityForOwasp(categoryId) {
  // Define severity levels for each OWASP category
  const severityMap = {
    'A01': 'critical',
    'A02': 'critical',
    'A03': 'critical',
    'A04': 'high',
    'A05': 'high',
    'A06': 'high',
    'A07': 'critical',
    'A08': 'high',
    'A09': 'medium',
    'A10': 'high'
  };
  
  return severityMap[categoryId] || 'medium';
}

/**
 * Find all code files in the project
 * @returns {Promise<string[]>} Array of file paths
 */
async function findCodeFiles() {
  return new Promise((resolve, reject) => {
    exec('find . -type f \\( -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" \\) -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/dist/*" -not -path "*/build/*"', (error, stdout, stderr) => {
      if (error) {
        // Fallback to a simpler approach
        try {
          const files = [];
          function walkDir(dir) {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
              const fullPath = path.join(dir, entry.name);
              if (entry.isDirectory()) {
                // Skip node_modules, .git, etc.
                if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'dist' && entry.name !== 'build') {
                  walkDir(fullPath);
                }
              } else if (entry.isFile()) {
                // Only include JS/TS files
                if (['.js', '.ts', '.jsx', '.tsx'].includes(path.extname(entry.name))) {
                  files.push(fullPath);
                }
              }
            }
          }
          walkDir(process.cwd());
          resolve(files);
        } catch (err) {
          reject(err);
        }
      } else {
        resolve(stdout.trim().split('\n'));
      }
    });
  });
}

// Run the audit
runAudit();