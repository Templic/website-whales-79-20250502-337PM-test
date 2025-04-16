/**
 * PCI DSS Compliance Checker
 * 
 * This module provides functionality to check an application against
 * Payment Card Industry Data Security Standard (PCI DSS) requirements.
 * 
 * It focuses on key requirements relevant to payment processing in the application.
 */

import fs from 'fs';
import path from 'path';
import { log } from '../vite';

// Interface for a compliance check result
export interface ComplianceCheckResult {
  requirement: string;
  compliant: boolean;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  details?: string;
  remediation?: string;
}

// Interface for compliance scan results
export interface ComplianceScanResults {
  timestamp: string;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  checkResults: ComplianceCheckResult[];
}

/**
 * Run a PCI DSS compliance scan on the application
 * Enhanced with performance validation and comprehensive logging
 * @returns Compliance scan results
 */
export async function runPCIDSSComplianceScan(): Promise<ComplianceScanResults> {
  log('Running PCI DSS compliance scan...', 'security');
  
  const startTime = Date.now();
  const results: ComplianceCheckResult[] = [];
  
  // Define all checks to run
  const checks = [
    { name: 'Network Security', fn: checkNetworkSecurity },
    { name: 'Data Protection', fn: checkDataProtection },
    { name: 'Vulnerability Management', fn: checkVulnerabilityManagement },
    { name: 'Access Control', fn: checkAccessControl },
    { name: 'Secure Implementation', fn: checkSecureImplementation },
    { name: 'Logging and Monitoring', fn: checkLoggingAndMonitoring } // New check added
  ];
  
  // Run each check and track performance
  for (const check of checks) {
    const checkStartTime = Date.now();
    log(`Running ${check.name} check...`, 'security');
    
    try {
      const checkResults = await check.fn();
      results.push(...checkResults);
      
      // Log performance metrics for this check
      const checkDuration = Date.now() - checkStartTime;
      log(`${check.name} check completed in ${checkDuration}ms`, 'performance');
      
      // Log results of this specific check
      const passedInCheck = checkResults.filter(r => r.compliant).length;
      const failedInCheck = checkResults.filter(r => !r.compliant).length;
      log(`${check.name} results: ${passedInCheck}/${checkResults.length} checks passed`, 'security');
      
      if (failedInCheck > 0) {
        const criticalInCheck = checkResults.filter(r => !r.compliant && r.severity === 'critical').length;
        if (criticalInCheck > 0) {
          log(`WARNING: ${criticalInCheck} critical issues in ${check.name}`, 'security');
        }
      }
    } catch (error) {
      log(`Error in ${check.name} check: ${error}`, 'error');
    }
  }
  
  // Calculate statistics
  const totalChecks = results.length;
  const passedChecks = results.filter(r => r.compliant).length;
  const failedChecks = results.filter(r => !r.compliant).length;
  
  const criticalIssues = results.filter(r => !r.compliant && r.severity === 'critical').length;
  const highIssues = results.filter(r => !r.compliant && r.severity === 'high').length;
  const mediumIssues = results.filter(r => !r.compliant && r.severity === 'medium').length;
  const lowIssues = results.filter(r => !r.compliant && r.severity === 'low').length;
  
  // Log summary
  const scanDuration = Date.now() - startTime;
  log(`PCI DSS compliance scan completed in ${scanDuration}ms`, 'security');
  log(`Results: ${passedChecks}/${totalChecks} checks passed (${failedChecks} failed)`, 'security');
  
  if (criticalIssues > 0 || highIssues > 0) {
    log(`Critical issues: ${criticalIssues}, High issues: ${highIssues}`, 'security');
    
    // Notify team about critical issues
    notifyTeam(`Critical PCI DSS compliance issues found: ${criticalIssues} critical, ${highIssues} high severity issues`);
  } else if (mediumIssues > 0) {
    // Notify about medium issues, but with lower urgency
    notifyTeam(`Medium severity PCI DSS compliance issues found: ${mediumIssues} issues`, 'medium');
  }
  
  // Return scan results
  return {
    timestamp: new Date().toISOString(),
    totalChecks,
    passedChecks,
    failedChecks,
    criticalIssues,
    highIssues,
    mediumIssues,
    lowIssues,
    checkResults: results
  };
}

/**
 * Check network security requirements (PCI DSS Requirement 1)
 * @returns Array of compliance check results
 */
async function checkNetworkSecurity(): Promise<ComplianceCheckResult[]> {
  const results: ComplianceCheckResult[] = [];
  
  // Check 1.1: Network security controls
  const hasSecurityHeaders = findInServerFiles([
    'helmet', 'Content-Security-Policy', 'csp', 'Strict-Transport-Security'
  ]);
  
  results.push({
    requirement: '1.1 - Network security controls and firewalls',
    compliant: hasSecurityHeaders,
    description: 'Verify that security headers and network controls are properly configured',
    severity: 'high',
    details: hasSecurityHeaders 
      ? 'Security headers detected in server configuration' 
      : 'No security headers detected in server configuration',
    remediation: hasSecurityHeaders 
      ? undefined 
      : 'Implement security headers using the Helmet middleware or similar'
  });
  
  // Check 1.2: Secure connections
  const hasSecureConnections = findInServerFiles([
    'https', 'ssl', 'tls', 'Strict-Transport-Security', 'secure: true'
  ]);
  
  results.push({
    requirement: '1.2 - Secure connections and protocols',
    compliant: hasSecureConnections,
    description: 'Verify that connections to and from the cardholder data environment use secure protocols',
    severity: 'critical',
    details: hasSecureConnections 
      ? 'Secure connection configuration detected' 
      : 'No secure connection configuration detected',
    remediation: hasSecureConnections 
      ? undefined 
      : 'Implement HTTPS and configure Strict-Transport-Security header'
  });
  
  return results;
}

/**
 * Check data protection requirements (PCI DSS Requirement 3)
 * @returns Array of compliance check results
 */
async function checkDataProtection(): Promise<ComplianceCheckResult[]> {
  const results: ComplianceCheckResult[] = [];
  
  // Check 3.1: Data storage minimization
  const hasCardStorage = findInFiles([
    'cardNumber', 
    'creditCard', 
    'card_number', 
    'cvv', 
    'cvc', 
    'securityCode'
  ], ['shared/schema.ts', 'server/db']);
  
  results.push({
    requirement: '3.1 - Minimize cardholder data storage',
    compliant: !hasCardStorage,
    description: 'Verify that card data storage is minimized or eliminated',
    severity: 'critical',
    details: !hasCardStorage 
      ? 'No evidence of card data storage in database schemas' 
      : 'Potential card data storage detected in database schemas',
    remediation: !hasCardStorage 
      ? undefined 
      : 'Remove any storage of full card data and use tokenization instead'
  });
  
  // Check 3.2: Tokenization
  const hasTokenization = findInFiles([
    'stripe.createToken', 
    'stripe.createPaymentMethod', 
    'paymentMethodId', 
    'paymentIntent'
  ], ['client/src', 'server']);
  
  results.push({
    requirement: '3.2 - Use tokenization or other secure technologies',
    compliant: hasTokenization,
    description: 'Verify that tokenization or other secure technologies are used for payment processing',
    severity: 'critical',
    details: hasTokenization 
      ? 'Evidence of tokenization detected' 
      : 'No evidence of tokenization detected',
    remediation: hasTokenization 
      ? undefined 
      : 'Implement Stripe tokenization for payment processing'
  });
  
  // Check 3.3: Encryption
  const hasEncryption = findInServerFiles([
    'crypto', 
    'encrypt', 
    'decrypt', 
    'cipher', 
    'hash', 
    'bcrypt'
  ]);
  
  results.push({
    requirement: '3.3 - Protect stored cardholder data with encryption',
    compliant: hasEncryption,
    description: 'Verify that any stored sensitive data is encrypted',
    severity: 'high',
    details: hasEncryption 
      ? 'Evidence of encryption usage detected' 
      : 'No evidence of encryption usage detected',
    remediation: hasEncryption 
      ? undefined 
      : 'Implement encryption for any sensitive data that must be stored'
  });
  
  return results;
}

/**
 * Check vulnerability management requirements (PCI DSS Requirement 6)
 * @returns Array of compliance check results
 */
async function checkVulnerabilityManagement(): Promise<ComplianceCheckResult[]> {
  const results: ComplianceCheckResult[] = [];
  
  // Check 6.1: Security scanning process
  const hasSecurityScanning = fs.existsSync(path.join(process.cwd(), 'scripts', 'security-scan.js'));
  
  results.push({
    requirement: '6.1 - Develop and maintain secure systems and applications',
    compliant: hasSecurityScanning,
    description: 'Verify that security scanning is implemented',
    severity: 'medium',
    details: hasSecurityScanning 
      ? 'Security scanning process detected' 
      : 'No security scanning process detected',
    remediation: hasSecurityScanning 
      ? undefined 
      : 'Implement regular security scanning and vulnerability management'
  });
  
  // Check 6.2: Input validation
  const hasInputValidation = findInFiles([
    'validate', 
    'validator', 
    'validation', 
    'schema.parse', 
    'zod', 
    'joi',
    'sanitize'
  ], ['client/src', 'server']);
  
  results.push({
    requirement: '6.2 - Secure coding practices and input validation',
    compliant: hasInputValidation,
    description: 'Verify that input validation is implemented',
    severity: 'high',
    details: hasInputValidation 
      ? 'Input validation detected in code' 
      : 'No evidence of input validation detected',
    remediation: hasInputValidation 
      ? undefined 
      : 'Implement proper input validation using a library like Zod, Joi, or Express Validator'
  });
  
  // Check 6.3: Code reviews
  const hasCodeReviewProcess = fs.existsSync(path.join(process.cwd(), 'docs', 'CODE_REVIEW.md')) ||
                              fs.existsSync(path.join(process.cwd(), 'docs', 'SECURITY_AUDIT_PLAN.md'));
  
  results.push({
    requirement: '6.3 - Code review process',
    compliant: hasCodeReviewProcess,
    description: 'Verify that a code review process is in place',
    severity: 'medium',
    details: hasCodeReviewProcess 
      ? 'Code review process documentation detected' 
      : 'No code review process documentation detected',
    remediation: hasCodeReviewProcess 
      ? undefined 
      : 'Document and implement a formal code review process'
  });
  
  return results;
}

/**
 * Check access control requirements (PCI DSS Requirement 7-8)
 * @returns Array of compliance check results
 */
async function checkAccessControl(): Promise<ComplianceCheckResult[]> {
  const results: ComplianceCheckResult[] = [];
  
  // Check 7.1: Access restrictions
  const hasAccessRestrictions = findInFiles([
    'authorize', 
    'isAuthenticated', 
    'requireAuth', 
    'checkPermission', 
    'role'
  ], ['server', 'client/src/components/admin']);
  
  results.push({
    requirement: '7.1 - Access controls for system components',
    compliant: hasAccessRestrictions,
    description: 'Verify that access control measures are implemented',
    severity: 'high',
    details: hasAccessRestrictions 
      ? 'Access control mechanisms detected' 
      : 'No access control mechanisms detected',
    remediation: hasAccessRestrictions 
      ? undefined 
      : 'Implement proper access control and authorization'
  });
  
  // Check 8.1: Authentication security
  const hasSecureAuth = findInFiles([
    'bcrypt', 
    'password', 
    'hash', 
    'salt', 
    'argon2', 
    'pbkdf2'
  ], ['server/auth', 'server/routes']);
  
  results.push({
    requirement: '8.1 - Secure authentication mechanisms',
    compliant: hasSecureAuth,
    description: 'Verify that secure authentication methods are used',
    severity: 'high',
    details: hasSecureAuth 
      ? 'Secure authentication methods detected' 
      : 'No secure authentication methods detected',
    remediation: hasSecureAuth 
      ? undefined 
      : 'Implement proper password hashing using bcrypt or similar'
  });
  
  // Check 8.2: Multi-factor authentication
  const hasMFA = findInFiles([
    'mfa', 
    'multi-factor', 
    'totp', 
    'otplib', 
    'twoFactor', 
    'secondFactor'
  ], ['server', 'client/src/components/auth']);
  
  results.push({
    requirement: '8.2 - Multi-factor authentication',
    compliant: hasMFA,
    description: 'Verify that multi-factor authentication is available for sensitive operations',
    severity: 'medium',
    details: hasMFA 
      ? 'Multi-factor authentication detected' 
      : 'No multi-factor authentication detected',
    remediation: hasMFA 
      ? undefined 
      : 'Implement multi-factor authentication for admin and payment operations'
  });
  
  return results;
}

/**
 * Check secure implementation requirements (PCI DSS Requirement 4)
 * @returns Array of compliance check results
 */
async function checkSecureImplementation(): Promise<ComplianceCheckResult[]> {
  const results: ComplianceCheckResult[] = [];
  
  // Check 4.1: Stripe implementation
  const hasSecureStripeImplementation = findInFiles([
    'PaymentElement', 
    'Elements', 
    'loadStripe'
  ], ['client/src/components/shop']);
  
  results.push({
    requirement: '4.1 - Secure implementation of payment processing',
    compliant: hasSecureStripeImplementation,
    description: 'Verify that Stripe Elements is used for secure payment processing',
    severity: 'critical',
    details: hasSecureStripeImplementation 
      ? 'Stripe Elements implementation detected' 
      : 'No evidence of Stripe Elements implementation',
    remediation: hasSecureStripeImplementation 
      ? undefined 
      : 'Implement Stripe Elements for secure card collection'
  });
  
  // Check 4.2: PAN data handling
  const hasDirectCardDataHandling = findInFiles([
    'card.number', 
    'cardNumber', 
    'creditCardNumber', 
    'card-number'
  ], ['client/src', 'server']);
  
  results.push({
    requirement: '4.2 - Never handle PAN directly',
    compliant: !hasDirectCardDataHandling,
    description: 'Verify that the application never directly handles card numbers',
    severity: 'critical',
    details: !hasDirectCardDataHandling 
      ? 'No evidence of direct card number handling' 
      : 'Potential direct handling of card numbers detected',
    remediation: !hasDirectCardDataHandling 
      ? undefined 
      : 'Remove direct handling of card numbers and use Stripe tokenization'
  });
  
  // Check 4.3: Frontend security
  const hasFrontendSecurity = findInFiles([
    'csrf', 
    'xsrf', 
    'Content-Security-Policy', 
    'sanitize'
  ], ['client/src', 'server']);
  
  results.push({
    requirement: '4.3 - Frontend security measures',
    compliant: hasFrontendSecurity,
    description: 'Verify that frontend security measures are implemented',
    severity: 'high',
    details: hasFrontendSecurity 
      ? 'Frontend security measures detected' 
      : 'No frontend security measures detected',
    remediation: hasFrontendSecurity 
      ? undefined 
      : 'Implement CSRF protection and content security policy'
  });
  
  return results;
}

/**
 * Check logging and monitoring requirements (PCI DSS Requirement 10)
 * @returns Array of compliance check results
 */
async function checkLoggingAndMonitoring(): Promise<ComplianceCheckResult[]> {
  const results: ComplianceCheckResult[] = [];
  
  // Check 10.1: Audit logging
  const hasSecurityLogging = fs.existsSync(path.join(process.cwd(), 'logs', 'security.log')) ||
                            findInServerFiles(['winston', 'morgan', 'audit trail', 'audit log']);
  
  results.push({
    requirement: '10.1 - Implement audit trails',
    compliant: hasSecurityLogging,
    description: 'Verify that security event logging is implemented',
    severity: 'medium',
    details: hasSecurityLogging 
      ? 'Security event logging detected' 
      : 'No security event logging found',
    remediation: hasSecurityLogging 
      ? undefined 
      : 'Implement comprehensive logging for security events'
  });
  
  // Check 10.2: Payment event logging
  const hasPaymentLogging = findInFiles([
    'payment.log', 
    'transaction.log', 
    'logPayment', 
    'logTransaction',
    'log(\'payment'
  ], ['server/routes', 'server/controllers', 'server/services']);
  
  results.push({
    requirement: '10.2 - Automated audit trails for payment transactions',
    compliant: hasPaymentLogging,
    description: 'Verify that all payment transactions are logged',
    severity: 'high',
    details: hasPaymentLogging 
      ? 'Payment transaction logging detected' 
      : 'No payment transaction logging detected',
    remediation: hasPaymentLogging 
      ? undefined 
      : 'Implement comprehensive logging for all payment transactions'
  });
  
  // Check 10.3: Access logging
  const hasAccessLogging = findInFiles([
    'login', 
    'loggedIn', 
    'authenticate', 
    'authLog',
    'access log'
  ], ['server/auth', 'server/middleware']);
  
  results.push({
    requirement: '10.3 - User access logging',
    compliant: hasAccessLogging,
    description: 'Verify that user access events are logged',
    severity: 'medium',
    details: hasAccessLogging 
      ? 'User access logging detected' 
      : 'No user access logging detected',
    remediation: hasAccessLogging 
      ? undefined 
      : 'Implement logging for all user authentication and access events'
  });
  
  // Check 10.4: Log monitoring
  const hasLogMonitoring = findInFiles([
    'logMonitor', 
    'monitorLogs', 
    'alertOnLog', 
    'logAlert', 
    'winston-alerts'
  ], ['server']);
  
  results.push({
    requirement: '10.4 - Log monitoring and alerting',
    compliant: hasLogMonitoring,
    description: 'Verify that logs are monitored for suspicious activities',
    severity: 'medium',
    details: hasLogMonitoring 
      ? 'Log monitoring mechanisms detected' 
      : 'No log monitoring mechanisms detected',
    remediation: hasLogMonitoring 
      ? undefined 
      : 'Implement monitoring and alerting for security-related log events'
  });
  
  // Check 10.5: Log protection
  const hasLogProtection = findInFiles([
    'writeProtectedLog', 
    'secureLog',
    'encryptedLog', 
    'logRotate',
    'winston-rotating'
  ], ['server']);
  
  results.push({
    requirement: '10.5 - Secure audit trails',
    compliant: hasLogProtection,
    description: 'Verify that logs are protected from unauthorized modification',
    severity: 'medium',
    details: hasLogProtection 
      ? 'Log protection mechanisms detected' 
      : 'No log protection mechanisms detected',
    remediation: hasLogProtection 
      ? undefined 
      : 'Implement log rotation, encryption, and access controls for audit trails'
  });
  
  return results;
}

/**
 * Notify the team about compliance issues
 * @param message The notification message
 * @param severity The severity of the notification (defaults to 'high')
 */
function notifyTeam(message: string, severity: 'critical' | 'high' | 'medium' | 'low' = 'high'): void {
  // Log the notification
  log(`Notification [${severity}]: ${message}`, 'notification');
  
  // Create logs directory if it doesn't exist
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  
  // Write to notifications log file
  const notificationsLogPath = path.join(logsDir, 'compliance-notifications.log');
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${severity.toUpperCase()}] ${message}\n`;
  
  try {
    fs.appendFileSync(notificationsLogPath, logEntry);
  } catch (err) {
    log(`Error writing to notifications log: ${err}`, 'error');
  }
  
  // TODO: Implement additional notification channels as needed:
  // - Email notifications
  // - Slack/Teams webhooks
  // - SMS notifications for critical issues
  // - Integration with monitoring systems
}

/**
 * Search for patterns in server files
 * @param patterns Patterns to search for
 * @returns True if any pattern is found
 */
function findInServerFiles(patterns: string[]): boolean {
  return findInFiles(patterns, ['server']);
}

/**
 * Search for patterns in specified directories
 * @param patterns Patterns to search for
 * @param directories Directories to search in
 * @returns True if any pattern is found
 */
function findInFiles(patterns: string[], directories: string[]): boolean {
  try {
    // For each directory
    for (const dir of directories) {
      const dirPath = path.join(process.cwd(), dir);
      
      // Skip if directory doesn't exist
      if (!fs.existsSync(dirPath)) {
        continue;
      }
      
      // Get all files in directory recursively
      const files = getAllFiles(dirPath);
      
      // Check each file for patterns
      for (const file of files) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          
          // Check for each pattern
          for (const pattern of patterns) {
            if (content.includes(pattern)) {
              return true;
            }
          }
        } catch (err) {
          // Skip files that can't be read
        }
      }
    }
    
    return false;
  } catch (err) {
    log(`Error in findInFiles: ${err}`, 'error');
    return false;
  }
}

/**
 * Get all files in a directory recursively
 * @param dirPath Directory path
 * @returns Array of file paths
 */
function getAllFiles(dirPath: string): string[] {
  let files: string[] = [];
  
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
          files = [...files, ...getAllFiles(fullPath)];
        }
      } else {
        // Only include relevant files
        if (
          fullPath.endsWith('.js') || 
          fullPath.endsWith('.ts') || 
          fullPath.endsWith('.jsx') || 
          fullPath.endsWith('.tsx')
        ) {
          files.push(fullPath);
        }
      }
    }
  } catch (err) {
    // Skip directories that can't be read
  }
  
  return files;
}

/**
 * Generate a comprehensive PCI DSS compliance report
 * @param scanResults Compliance scan results
 * @returns Path to the generated report
 */
export function generateComplianceReport(scanResults: ComplianceScanResults): string {
  try {
    // Create reports directory if it doesn't exist
    const reportsDir = path.join(process.cwd(), 'reports', 'compliance');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    // Generate report filename
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const reportPath = path.join(reportsDir, `pci-compliance-${timestamp}.md`);
    
    // Build report content
    let reportContent = `# PCI DSS Compliance Report\n\n`;
    reportContent += `**Generated:** ${scanResults.timestamp}\n\n`;
    
    // Add summary section
    reportContent += `## Summary\n\n`;
    reportContent += `- **Total Checks:** ${scanResults.totalChecks}\n`;
    reportContent += `- **Passed Checks:** ${scanResults.passedChecks}\n`;
    reportContent += `- **Failed Checks:** ${scanResults.failedChecks}\n`;
    reportContent += `- **Compliance Rate:** ${Math.round((scanResults.passedChecks / scanResults.totalChecks) * 100)}%\n\n`;
    
    // Add issues by severity
    const criticalIssues = scanResults.checkResults.filter(r => !r.compliant && r.severity === 'critical');
    const highIssues = scanResults.checkResults.filter(r => !r.compliant && r.severity === 'high');
    const mediumIssues = scanResults.checkResults.filter(r => !r.compliant && r.severity === 'medium');
    const lowIssues = scanResults.checkResults.filter(r => !r.compliant && r.severity === 'low');
    
    if (criticalIssues.length > 0 || highIssues.length > 0) {
      reportContent += `## Critical and High Priority Issues\n\n`;
      
      if (criticalIssues.length > 0) {
        reportContent += `### Critical Issues (${criticalIssues.length})\n\n`;
        
        for (const issue of criticalIssues) {
          reportContent += `#### ${issue.requirement}\n\n`;
          reportContent += `**Description:** ${issue.description}\n\n`;
          
          if (issue.details) {
            reportContent += `**Details:** ${issue.details}\n\n`;
          }
          
          if (issue.remediation) {
            reportContent += `**Remediation:** ${issue.remediation}\n\n`;
          }
        }
      }
      
      if (highIssues.length > 0) {
        reportContent += `### High Priority Issues (${highIssues.length})\n\n`;
        
        for (const issue of highIssues) {
          reportContent += `#### ${issue.requirement}\n\n`;
          reportContent += `**Description:** ${issue.description}\n\n`;
          
          if (issue.details) {
            reportContent += `**Details:** ${issue.details}\n\n`;
          }
          
          if (issue.remediation) {
            reportContent += `**Remediation:** ${issue.remediation}\n\n`;
          }
        }
      }
    }
    
    // Add all checks section
    reportContent += `## All Compliance Checks\n\n`;
    reportContent += `| Requirement | Status | Severity | Description |\n`;
    reportContent += `|-------------|--------|----------|-------------|\n`;
    
    for (const check of scanResults.checkResults) {
      const status = check.compliant ? '✅ Pass' : '❌ Fail';
      const severity = check.compliant 
        ? '—' 
        : check.severity.charAt(0).toUpperCase() + check.severity.slice(1);
      
      reportContent += `| ${check.requirement} | ${status} | ${severity} | ${check.description} |\n`;
    }
    
    // Add recommendations section
    reportContent += `\n## Recommendations\n\n`;
    
    if (criticalIssues.length > 0 || highIssues.length > 0) {
      reportContent += `### Priority Recommendations\n\n`;
      
      const allImportantIssues = [...criticalIssues, ...highIssues];
      for (const issue of allImportantIssues) {
        if (issue.remediation) {
          reportContent += `- **${issue.requirement}**: ${issue.remediation}\n`;
        }
      }
    } else {
      reportContent += `No critical or high priority issues found.\n`;
    }
    
    // Add PCI DSS overview
    reportContent += `\n## PCI DSS Overview\n\n`;
    reportContent += `The Payment Card Industry Data Security Standard (PCI DSS) is a set of security standards designed to ensure that all companies that accept, process, store, or transmit credit card information maintain a secure environment.\n\n`;
    reportContent += `Key requirements include:\n\n`;
    reportContent += `1. Install and maintain a firewall configuration to protect cardholder data\n`;
    reportContent += `2. Do not use vendor-supplied defaults for system passwords and other security parameters\n`;
    reportContent += `3. Protect stored cardholder data\n`;
    reportContent += `4. Encrypt transmission of cardholder data across open, public networks\n`;
    reportContent += `5. Use and regularly update anti-virus software or programs\n`;
    reportContent += `6. Develop and maintain secure systems and applications\n`;
    reportContent += `7. Restrict access to cardholder data by business need to know\n`;
    reportContent += `8. Assign a unique ID to each person with computer access\n`;
    reportContent += `9. Restrict physical access to cardholder data\n`;
    reportContent += `10. Track and monitor all access to network resources and cardholder data\n`;
    reportContent += `11. Regularly test security systems and processes\n`;
    reportContent += `12. Maintain a policy that addresses information security for all personnel\n`;
    
    // Write report to file
    fs.writeFileSync(reportPath, reportContent);
    
    log(`PCI DSS compliance report generated: ${reportPath}`, 'security');
    return reportPath;
  } catch (err) {
    log(`Error generating compliance report: ${err}`, 'error');
    return '';
  }
}