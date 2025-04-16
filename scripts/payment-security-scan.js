#!/usr/bin/env node

/**
 * Payment Processing Security Scanner
 * 
 * This script performs specialized security checks for payment processing code,
 * focusing on PCI DSS compliance and Stripe integration security.
 * 
 * Usage:
 *   node scripts/payment-security-scan.js [options]
 * 
 * Options:
 *   --report     Generate a detailed report in the reports directory
 *   --verbose    Show detailed output during scanning
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { v4 as uuidv4 } from 'uuid';

// Constants
const REPORTS_DIR = path.join(process.cwd(), 'reports', 'payment-security');
const SECURITY_LOG_FILE = path.join(process.cwd(), 'logs', 'payment-security.log');

// Ensure directories exist
[REPORTS_DIR, path.dirname(SECURITY_LOG_FILE)].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  report: args.includes('--report'),
  verbose: args.includes('--verbose')
};

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
 * @property {string} [pciRequirement] - Related PCI DSS requirement
 */

/**
 * Main scan function
 */
async function runScan() {
  const startTime = Date.now();
  log(`Starting payment security scan...`);
  
  /** @type {SecurityVulnerability[]} */
  const vulnerabilities = [];
  
  try {
    // Step 1: Scan payment processing components
    await scanPaymentComponents(vulnerabilities);
    
    // Step 2: Check for proper use of Stripe API
    await checkStripeAPIUsage(vulnerabilities);
    
    // Step 3: Check for credit card data handling
    await scanForCreditCardData(vulnerabilities);
    
    // Step 4: Check for PCI DSS compliance
    await checkPCIDSSCompliance(vulnerabilities);
    
    // Step 5: Check for secure token handling
    await checkSecureTokenHandling(vulnerabilities);
    
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
      scanType: 'payment-security',
      totalIssues: vulnerabilities.length,
      criticalIssues,
      highIssues,
      mediumIssues,
      lowIssues,
      vulnerabilities
    };
    
    // Save scan results
    const scanTimestamp = new Date().toISOString().replace(/:/g, '-');
    const scanResultFile = path.join(REPORTS_DIR, `payment-scan-${scanTimestamp}.json`);
    fs.writeFileSync(scanResultFile, JSON.stringify(scanResults, null, 2));
    
    // Generate report if requested
    if (options.report) {
      generateReport(scanResults);
    }
    
    // Display summary
    log(`Payment security scan completed in ${scanDuration}ms`);
    log(`Results: ${scanResults.totalIssues} issues found (${criticalIssues} critical, ${highIssues} high, ${mediumIssues} medium, ${lowIssues} low)`);
    
    // Show critical and high vulnerabilities in terminal
    if (criticalIssues > 0 || highIssues > 0) {
      log('Critical and high severity issues:', 'warning');
      vulnerabilities
        .filter(v => ['critical', 'high'].includes(v.severity))
        .forEach((v, i) => {
          log(`${i + 1}. [${v.severity.toUpperCase()}] ${v.description}${v.location ? ` (${v.location})` : ''}`, v.severity);
          if (v.pciRequirement && options.verbose) {
            log(`   PCI DSS Requirement: ${v.pciRequirement}`, 'info');
          }
          if (v.recommendation && options.verbose) {
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
    log(`Error during payment security scan: ${error}`, 'error');
    if (options.verbose && error.stack) {
      log(error.stack, 'error');
    }
    process.exit(3); // Scan error
  }
}

/**
 * Scan payment processing components
 * @param {SecurityVulnerability[]} vulnerabilities - Array to add vulnerabilities to
 */
async function scanPaymentComponents(vulnerabilities) {
  log('Scanning payment processing components...');
  
  // Key payment component files to scan
  const paymentComponentPaths = [
    'client/src/components/shop/payment/StripeElements.tsx',
    'client/src/components/shop/payment/StripeProvider.tsx',
    'client/src/components/shop/checkout',
    'server/routes/payment.ts',
    'server/routes/checkout.ts'
  ];
  
  const paymentComponentIssues = [];
  
  // Check if files exist and scan them
  for (const componentPath of paymentComponentPaths) {
    const isDirectory = !componentPath.includes('.');
    
    if (isDirectory) {
      // Handle directory
      if (fs.existsSync(componentPath)) {
        const files = fs.readdirSync(componentPath)
          .filter(file => file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.jsx') || file.endsWith('.js'))
          .map(file => path.join(componentPath, file));
        
        for (const file of files) {
          scanPaymentFile(file, paymentComponentIssues);
        }
      }
    } else {
      // Handle single file
      if (fs.existsSync(componentPath)) {
        scanPaymentFile(componentPath, paymentComponentIssues);
      }
    }
  }
  
  // Add issues to vulnerabilities
  for (const issue of paymentComponentIssues) {
    vulnerabilities.push({
      id: uuidv4(),
      ...issue
    });
  }
}

/**
 * Scan a payment processing file for security issues
 * @param {string} filePath - Path to the file
 * @param {Array} issues - Array to add issues to
 */
function scanPaymentFile(filePath, issues) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check 1: Direct card element access without proper security measures
    if (content.includes('CardElement') && !content.includes('Elements') && !content.includes('loadStripe')) {
      issues.push({
        severity: 'high',
        description: 'Direct use of CardElement without proper Stripe Elements wrapper',
        location: filePath,
        recommendation: 'Always use Stripe Elements wrapper for secure card element handling',
        pciRequirement: '6.5.1 - Implement secure coding practices to avoid vulnerabilities'
      });
    }
    
    // Check 2: Improper PAN (Primary Account Number) handling
    if (
      (content.includes('card.number') || content.includes('cardNumber') || content.includes('creditCardNumber')) && 
      !content.includes('stripe.createToken') && !content.includes('stripe.createPaymentMethod')
    ) {
      issues.push({
        severity: 'critical',
        description: 'Potential direct handling of card numbers without tokenization',
        location: filePath,
        recommendation: 'Always use Stripe tokenization and never handle raw card numbers',
        pciRequirement: '3.2 - Do not store sensitive authentication data after authorization'
      });
    }
    
    // Check 3: Logging of sensitive data
    if (
      content.includes('console.log') && 
      (content.includes('card') || content.includes('payment') || content.includes('stripe'))
    ) {
      issues.push({
        severity: 'high',
        description: 'Possible logging of payment information',
        location: filePath,
        recommendation: 'Never log payment details or sensitive information',
        pciRequirement: '3.3 - Mask PAN when displayed'
      });
    }
    
    // Check 4: Proper error handling
    if (
      (content.includes('catch') || content.includes('onError')) && 
      filePath.includes('payment') &&
      !content.includes('setError')
    ) {
      issues.push({
        severity: 'medium',
        description: 'Potential lack of proper error handling in payment processing',
        location: filePath,
        recommendation: 'Implement specific error handling for payment processing',
        pciRequirement: '10.2 - Implement automated audit trails'
      });
    }
    
    // Check 5: Missing client-side validation
    if (
      content.includes('onSubmit') && 
      content.includes('payment') &&
      !content.includes('validate') && !content.includes('validation')
    ) {
      issues.push({
        severity: 'medium',
        description: 'Potential lack of client-side validation in payment form',
        location: filePath,
        recommendation: 'Implement client-side validation for payment forms',
        pciRequirement: '6.5.7 - Improper input validation'
      });
    }
  } catch (error) {
    log(`Error scanning file ${filePath}: ${error}`, 'error');
  }
}

/**
 * Check for proper use of Stripe API
 * @param {SecurityVulnerability[]} vulnerabilities - Array to add vulnerabilities to
 */
async function checkStripeAPIUsage(vulnerabilities) {
  log('Checking for proper use of Stripe API...');
  
  const stripeApiIssues = [];
  
  // Directory to scan for Stripe API usage
  const directoriesToScan = [
    'client/src',
    'server'
  ];
  
  // Files to check in each directory
  for (const dirPath of directoriesToScan) {
    if (!fs.existsSync(dirPath)) {
      continue;
    }
    
    const files = getAllFiles(dirPath, ['.js', '.ts', '.jsx', '.tsx']);
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check 1: Hardcoded Stripe API keys
        if (
          content.includes('sk_test_') || 
          content.includes('sk_live_')
        ) {
          stripeApiIssues.push({
            severity: 'critical',
            description: 'Hardcoded Stripe secret key detected',
            location: file,
            recommendation: 'Never hardcode Stripe secret keys; use environment variables',
            pciRequirement: '3.5 - Protect cryptographic keys'
          });
        }
        
        // Check 2: Client-side usage of secret key
        if (
          file.startsWith('client/') && 
          (
            content.includes('stripe.customers.create') || 
            content.includes('stripe.paymentIntents.create')
          )
        ) {
          stripeApiIssues.push({
            severity: 'critical',
            description: 'Client-side usage of Stripe server-side methods',
            location: file,
            recommendation: 'Never use Stripe server API methods in client-side code',
            pciRequirement: '6.5.8 - Improper access control'
          });
        }
        
        // Check 3: Webhook signature validation
        if (
          content.includes('stripe.webhooks') && 
          !content.includes('constructEvent')
        ) {
          stripeApiIssues.push({
            severity: 'high',
            description: 'Stripe webhook without signature validation',
            location: file,
            recommendation: 'Always validate Stripe webhook signatures',
            pciRequirement: '4.1 - Use strong cryptography and security protocols'
          });
        }
        
        // Check 4: Error handling in payment processing
        if (
          (content.includes('stripe.charges.create') || content.includes('stripe.paymentIntents.create')) && 
          !content.includes('try') && !content.includes('catch')
        ) {
          stripeApiIssues.push({
            severity: 'medium',
            description: 'Missing error handling in Stripe API calls',
            location: file,
            recommendation: 'Implement proper error handling for all Stripe API calls',
            pciRequirement: '10.2 - Implement automated audit trails'
          });
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }
  }
  
  // Add issues to vulnerabilities
  for (const issue of stripeApiIssues) {
    vulnerabilities.push({
      id: uuidv4(),
      ...issue
    });
  }
}

/**
 * Scan for unsafe credit card data handling
 * @param {SecurityVulnerability[]} vulnerabilities - Array to add vulnerabilities to
 */
async function scanForCreditCardData(vulnerabilities) {
  log('Scanning for credit card data handling...');
  
  const ccDataIssues = [];
  
  // Credit card data patterns
  const ccPatterns = [
    // Credit card number formats (without spaces/dashes)
    /\b(?:\d{13,16})\b/g, 
    // Credit card number formats (with spaces/dashes)
    /\b(?:\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4})\b/g,
    // Variable names suggesting credit card storage
    /\b(?:cardNumber|creditCard|ccNumber|card_number)\b/g,
    // CVV storage
    /\b(?:cvv|cvc|securityCode|securityNumber|card_code)\b/g
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
  const fileTypes = '\.(js|ts|jsx|tsx|json|env|yaml|yml)$';
  
  // Function to check a file for credit card data
  const checkFileForCCData = (filePath) => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check each pattern
      for (const pattern of ccPatterns) {
        if (pattern.test(content)) {
          // Determine severity based on file location and pattern
          let severity = 'high';
          let description = 'Potential credit card data handling detected';
          let recommendation = 'Use Stripe Elements and never handle raw card data';
          let pciRequirement = '3.2 - Do not store sensitive authentication data after authorization';
          
          // Adjust severity for different cases
          if (filePath.includes('test') || filePath.includes('mock')) {
            severity = 'medium';
            description = 'Credit card data in test/mock files';
            recommendation = 'Use fake data for tests that doesn\'t resemble real card formats';
          } else if (filePath.includes('stripe') && filePath.includes('element')) {
            severity = 'low';
            description = 'Credit card references in Stripe Elements (expected)';
            recommendation = 'Ensure proper Stripe Elements integration';
          } else if (filePath.includes('schema') || filePath.includes('type')) {
            severity = 'medium';
            description = 'Credit card fields in schema/type definitions';
            recommendation = 'Use tokenized references instead of raw card data in schemas';
          }
          
          ccDataIssues.push({
            severity,
            description,
            location: filePath,
            recommendation,
            pciRequirement
          });
          
          // Only report once per file per pattern
          break;
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
          checkFileForCCData(fullPath);
        }
      }
    } catch (error) {
      // Skip directories that can't be read
    }
  };
  
  // Start the search from the current directory
  searchDirectory('.');
  
  // Add issues to vulnerabilities
  for (const issue of ccDataIssues) {
    vulnerabilities.push({
      id: uuidv4(),
      ...issue
    });
  }
}

/**
 * Check for PCI DSS compliance
 * @param {SecurityVulnerability[]} vulnerabilities - Array to add vulnerabilities to
 */
async function checkPCIDSSCompliance(vulnerabilities) {
  log('Checking PCI DSS compliance...');
  
  // Define PCI DSS checklist items
  const pciChecklist = [
    {
      requirement: '1.3 - Prohibit direct public access to cardholder data environment',
      verification: () => {
        // Check security headers and access controls
        const serverFiles = [
          'server/index.ts',
          'server/middleware.ts',
          'server/app.ts'
        ];
        
        let foundSecurityHeaders = false;
        
        for (const file of serverFiles) {
          if (fs.existsSync(file)) {
            const content = fs.readFileSync(file, 'utf8');
            if (content.includes('helmet') || content.includes('Content-Security-Policy')) {
              foundSecurityHeaders = true;
              break;
            }
          }
        }
        
        return foundSecurityHeaders;
      },
      severity: 'high',
      description: 'Missing network security controls for cardholder data environment',
      recommendation: 'Implement proper security headers and firewall rules'
    },
    {
      requirement: '2.2 - Develop configuration standards for system components',
      verification: () => {
        return fs.existsSync('docs/SECURITY_AUDIT_CHECKLIST.md') || 
               fs.existsSync('docs/SECURITY_AUDIT_PLAN.md');
      },
      severity: 'medium',
      description: 'Missing security configuration standards documentation',
      recommendation: 'Create comprehensive security configuration standards'
    },
    {
      requirement: '3.2 - Do not store sensitive authentication data after authorization',
      verification: () => {
        // Check for any potential card storage in database schemas
        const schemaFiles = getAllFiles('shared', ['.ts', '.js'])
          .filter(file => file.includes('schema') || file.includes('model'));
        
        for (const file of schemaFiles) {
          const content = fs.readFileSync(file, 'utf8');
          if (
            content.includes('card') || 
            content.includes('credit') || 
            content.includes('cvv') || 
            content.includes('security')
          ) {
            return false;
          }
        }
        
        return true;
      },
      severity: 'critical',
      description: 'Potential storage of sensitive authentication data',
      recommendation: 'Never store full card data, use tokenization instead'
    },
    {
      requirement: '4.1 - Use strong cryptography and security protocols',
      verification: () => {
        // Check for HTTPS enforcement
        const serverFiles = [
          'server/index.ts',
          'server/middleware.ts',
          'server/app.ts'
        ];
        
        let foundHttpsEnforcement = false;
        
        for (const file of serverFiles) {
          if (fs.existsSync(file)) {
            const content = fs.readFileSync(file, 'utf8');
            if (
              content.includes('helmet') || 
              content.includes('Strict-Transport-Security') || 
              content.includes('requireHttps')
            ) {
              foundHttpsEnforcement = true;
              break;
            }
          }
        }
        
        return foundHttpsEnforcement;
      },
      severity: 'high',
      description: 'Missing HTTPS enforcement for cardholder data',
      recommendation: 'Enforce HTTPS using Helmet middleware or similar'
    },
    {
      requirement: '6.5 - Address common coding vulnerabilities',
      verification: () => {
        // Check if security scanning is in place
        return fs.existsSync('scripts/security-scan.js') && 
               fs.existsSync('scripts/security-audit.js');
      },
      severity: 'medium',
      description: 'Insufficient security scanning for coding vulnerabilities',
      recommendation: 'Implement comprehensive security scanning'
    },
    {
      requirement: '6.6 - Protect public-facing web applications from vulnerabilities',
      verification: () => {
        // Check for web application firewall or similar
        const packageJsonPath = 'package.json';
        if (fs.existsSync(packageJsonPath)) {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
          const dependencies = {
            ...(packageJson.dependencies || {}),
            ...(packageJson.devDependencies || {})
          };
          
          return dependencies['helmet'] || 
                 dependencies['express-rate-limit'] || 
                 dependencies['express-validator'];
        }
        return false;
      },
      severity: 'high',
      description: 'Missing web application security controls',
      recommendation: 'Implement WAF, rate limiting, and input validation'
    },
    {
      requirement: '8.2 - User authentication using secure methods',
      verification: () => {
        // Check for secure authentication methods
        const authFiles = getAllFiles('server', ['.ts', '.js'])
          .filter(file => file.includes('auth') || file.includes('login'));
        
        for (const file of authFiles) {
          const content = fs.readFileSync(file, 'utf8');
          if (
            content.includes('bcrypt') || 
            content.includes('pbkdf2') || 
            content.includes('argon2')
          ) {
            return true;
          }
        }
        
        return false;
      },
      severity: 'high',
      description: 'Potentially insecure authentication methods',
      recommendation: 'Use strong password hashing algorithms'
    },
    {
      requirement: '10.2 - Implement automated audit trails',
      verification: () => {
        // Check for logging of security events
        const serverFiles = getAllFiles('server', ['.ts', '.js']);
        
        for (const file of serverFiles) {
          const content = fs.readFileSync(file, 'utf8');
          if (
            (content.includes('log') || content.includes('logger')) && 
            (content.includes('auth') || content.includes('payment'))
          ) {
            return true;
          }
        }
        
        return false;
      },
      severity: 'medium',
      description: 'Insufficient audit logging for payment transactions',
      recommendation: 'Implement comprehensive security event logging'
    }
  ];
  
  // Run each compliance check
  for (const check of pciChecklist) {
    try {
      const passed = check.verification();
      
      if (!passed) {
        vulnerabilities.push({
          id: uuidv4(),
          severity: check.severity,
          description: check.description,
          recommendation: check.recommendation,
          pciRequirement: check.requirement
        });
      }
    } catch (error) {
      log(`Error in PCI DSS check [${check.requirement}]: ${error}`, 'error');
      
      vulnerabilities.push({
        id: uuidv4(),
        severity: 'medium',
        description: `Unable to verify PCI DSS requirement: ${check.requirement}`,
        recommendation: 'Manually verify this requirement',
        pciRequirement: check.requirement
      });
    }
  }
}

/**
 * Check for secure token handling
 * @param {SecurityVulnerability[]} vulnerabilities - Array to add vulnerabilities to
 */
async function checkSecureTokenHandling(vulnerabilities) {
  log('Checking for secure token handling...');
  
  const tokenIssues = [];
  
  // Files that might contain token handling
  const files = getAllFiles('.', ['.js', '.ts', '.jsx', '.tsx'])
    .filter(file => 
      !file.includes('node_modules') && 
      !file.includes('dist') && 
      !file.includes('build')
    );
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check 1: Stripe tokens in localStorage
      if (
        content.includes('localStorage') && 
        (
          content.includes('token') || 
          content.includes('stripe') || 
          content.includes('payment')
        )
      ) {
        tokenIssues.push({
          severity: 'high',
          description: 'Potential storage of payment tokens in localStorage',
          location: file,
          recommendation: 'Never store payment tokens in localStorage, use secure server-side storage',
          pciRequirement: '3.2 - Do not store sensitive authentication data after authorization'
        });
      }
      
      // Check 2: Tokens in URL
      if (
        (content.includes('location.href') || content.includes('navigate') || content.includes('history.push')) && 
        (content.includes('token') || content.includes('payment'))
      ) {
        tokenIssues.push({
          severity: 'high',
          description: 'Potential exposure of payment tokens in URL',
          location: file,
          recommendation: 'Never include payment tokens in URLs',
          pciRequirement: '4.2 - Never send unprotected PANs by end-user messaging technologies'
        });
      }
      
      // Check 3: Insecure token handling
      if (
        content.includes('paymentMethod') && 
        (
          content.includes('console.log') || 
          content.includes('alert') || 
          content.includes('document.write')
        )
      ) {
        tokenIssues.push({
          severity: 'medium',
          description: 'Potential logging or insecure handling of payment method',
          location: file,
          recommendation: 'Avoid logging payment tokens or methods',
          pciRequirement: '4.2 - Never send unprotected PANs by end-user messaging technologies'
        });
      }
    } catch (error) {
      // Skip files that can't be read
    }
  }
  
  // Add issues to vulnerabilities
  for (const issue of tokenIssues) {
    vulnerabilities.push({
      id: uuidv4(),
      ...issue
    });
  }
}

/**
 * Generate a comprehensive report
 * @param {object} scanResults - Scan results object
 */
function generateReport(scanResults) {
  log('Generating payment security report...');
  
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const reportPath = path.join(REPORTS_DIR, `payment-security-report-${timestamp}.md`);
  
  let reportContent = `# Payment Processing Security Report\n\n`;
  reportContent += `**Generated:** ${new Date().toISOString()}\n\n`;
  
  // Add summary section
  reportContent += `## Summary\n\n`;
  reportContent += `- **Scan Duration:** ${scanResults.scanDuration}ms\n`;
  reportContent += `- **Total Issues:** ${scanResults.totalIssues}\n`;
  reportContent += `- **Critical Issues:** ${scanResults.criticalIssues}\n`;
  reportContent += `- **High Issues:** ${scanResults.highIssues}\n`;
  reportContent += `- **Medium Issues:** ${scanResults.mediumIssues}\n`;
  reportContent += `- **Low Issues:** ${scanResults.lowIssues}\n\n`;
  
  // Add PCI DSS compliance overview
  reportContent += `## PCI DSS Compliance Overview\n\n`;
  
  const pciRequirements = scanResults.vulnerabilities
    .filter(v => v.pciRequirement)
    .map(v => v.pciRequirement)
    .filter((value, index, self) => self.indexOf(value) === index);
  
  if (pciRequirements.length > 0) {
    reportContent += `The following PCI DSS requirements need attention:\n\n`;
    
    for (const req of pciRequirements) {
      reportContent += `- ${req}\n`;
    }
    
    reportContent += `\n`;
  } else {
    reportContent += `No specific PCI DSS requirements identified for remediation.\n\n`;
  }
  
  // Add vulnerabilities by severity
  const severities = ['critical', 'high', 'medium', 'low'];
  
  for (const severity of severities) {
    const issuesByType = scanResults.vulnerabilities.filter(v => v.severity === severity);
    
    if (issuesByType.length > 0) {
      reportContent += `## ${severity.charAt(0).toUpperCase() + severity.slice(1)} Severity Issues\n\n`;
      
      for (const issue of issuesByType) {
        reportContent += `### ${issue.description}\n\n`;
        
        if (issue.location) {
          reportContent += `**Location:** ${issue.location}\n\n`;
        }
        
        if (issue.pciRequirement) {
          reportContent += `**PCI DSS Requirement:** ${issue.pciRequirement}\n\n`;
        }
        
        if (issue.recommendation) {
          reportContent += `**Recommendation:** ${issue.recommendation}\n\n`;
        }
      }
    }
  }
  
  // Add recommendations section
  reportContent += `## General Recommendations\n\n`;
  reportContent += `1. **Use Stripe Elements**: Always use Stripe Elements for secure card collection.\n`;
  reportContent += `2. **Server-side Processing**: Process payments on the server-side, never client-side.\n`;
  reportContent += `3. **Tokenization**: Use tokenization for all payment data, never handle raw card details.\n`;
  reportContent += `4. **Secure Storage**: Never store sensitive authentication data.\n`;
  reportContent += `5. **Error Handling**: Implement proper error handling without exposing sensitive details.\n`;
  reportContent += `6. **Audit Logging**: Log all payment transactions for audit purposes.\n`;
  reportContent += `7. **Input Validation**: Validate all payment-related inputs.\n`;
  reportContent += `8. **PCI DSS Compliance**: Regularly audit and maintain PCI DSS compliance.\n\n`;
  
  // Write report to file
  fs.writeFileSync(reportPath, reportContent);
  
  log(`Payment security report generated: ${reportPath}`);
}

/**
 * Get all files in a directory recursively
 * @param {string} dirPath - Directory path
 * @param {string[]} extensions - Array of file extensions to include
 * @returns {string[]} - Array of file paths
 */
function getAllFiles(dirPath, extensions = []) {
  let files = [];
  
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        // Skip node_modules, .git, etc.
        if (
          !entry.name.startsWith('.') && 
          entry.name !== 'node_modules' && 
          entry.name !== 'dist' && 
          entry.name !== 'build' && 
          entry.name !== 'coverage'
        ) {
          files = [...files, ...getAllFiles(fullPath, extensions)];
        }
      } else if (
        extensions.length === 0 || 
        extensions.some(ext => entry.name.endsWith(ext))
      ) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // Skip directories that can't be read
  }
  
  return files;
}

// Run the scan
runScan().catch(error => {
  log(`Error in payment security scan: ${error}`, 'error');
  process.exit(1);
});