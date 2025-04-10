/**
 * Security Scan Module
 * 
 * Provides configurable security scanning capabilities for the server
 * with support for scheduled scans and deferred initialization.
 */

import { loadConfig } from './config';
import { log } from './vite';
import path from 'path';
import fs from 'fs';
import { pgPool } from './db';

// Security risk levels
type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

// Security issue types
type SecurityIssueType = 
  'sql_injection' | 
  'xss' | 
  'csrf' | 
  'auth_bypass' | 
  'insecure_headers' | 
  'outdated_dependency' | 
  'unpatched_vulnerability' |
  'configuration_issue' |
  'rate_limit_missing' |
  'secret_exposure' |
  'access_control_issue';

// Security scan issue structure
interface SecurityIssue {
  id: string;
  type: SecurityIssueType;
  riskLevel: RiskLevel;
  description: string;
  location?: string;
  code?: string;
  recommendations: string[];
  detectedAt: Date;
  fixed: boolean;
  fixedAt?: Date;
}

// Security scan results
interface SecurityScanResult {
  scanId: string;
  timestamp: Date;
  duration: number;
  issuesFound: SecurityIssue[];
  totalIssues: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  scan_type: 'full' | 'quick' | 'targeted';
}

// In-memory storage for security issues
let securityIssues: SecurityIssue[] = [];
let lastScanResult: SecurityScanResult | null = null;
let securityScannerEnabled = true;
let intervalId: NodeJS.Timeout | null = null;

/**
 * Initialize security scanning
 */
export async function initializeSecurityScanning(): Promise<void> {
  const config = loadConfig();
  
  // Skip initialization if security scans are disabled
  if (!config.features.enableSecurityScans) {
    securityScannerEnabled = false;
    log('Security scanning disabled via configuration', 'security');
    return;
  }
  
  securityScannerEnabled = true;
  
  log('Initializing security scans with 24 hour interval', 'security');
  
  // Schedule recurring security scan
  if (intervalId) {
    clearInterval(intervalId);
  }
  
  // Convert hours to milliseconds (24 hours default)
  const scanInterval = 24 * 60 * 60 * 1000;
  
  intervalId = setInterval(async () => {
    try {
      await performSecurityScan('full');
    } catch (error) {
      console.error('Failed to perform scheduled security scan:', error);
    }
  }, scanInterval);
  
  // If not deferred or in test mode, run initial scan
  if (!config.deferSecurityScans) {
    log('Starting initial security scan...', 'security');
    await performSecurityScan('quick');
  }
}

/**
 * Perform a security scan
 */
export async function performSecurityScan(scanType: 'full' | 'quick' | 'targeted' = 'quick'): Promise<SecurityScanResult> {
  const config = loadConfig();
  
  // Skip scan if security scanning is disabled
  if (!config.features.enableSecurityScans || !securityScannerEnabled) {
    return {
      scanId: `skip-${Date.now()}`,
      timestamp: new Date(),
      duration: 0,
      issuesFound: [],
      totalIssues: 0,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
      scan_type: scanType
    };
  }
  
  const startTime = Date.now();
  const scanId = `scan-${startTime}`;
  
  // Simulate security checks
  const issues = await runSecurityChecks(scanType);
  
  // Calculate issue counts
  const criticalCount = issues.filter(i => i.riskLevel === 'critical').length;
  const highCount = issues.filter(i => i.riskLevel === 'high').length;
  const mediumCount = issues.filter(i => i.riskLevel === 'medium').length;
  const lowCount = issues.filter(i => i.riskLevel === 'low').length;
  
  // Store issues in memory
  securityIssues = [...securityIssues, ...issues];
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  // Create scan result
  const result: SecurityScanResult = {
    scanId,
    timestamp: new Date(),
    duration,
    issuesFound: issues,
    totalIssues: issues.length,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    scan_type: scanType
  };
  
  // Store last scan result
  lastScanResult = result;
  
  // Log scan completion
  log(`Initial security scan completed: ${issues.length} issues found`, 'security');
  
  // Log security event
  logSecurityEvent('SECURITY_SCAN', { 
    scanId, 
    issueCount: issues.length,
    scanType,
    duration 
  });
  
  return result;
}

/**
 * Run security checks based on scan type
 */
async function runSecurityChecks(scanType: 'full' | 'quick' | 'targeted'): Promise<SecurityIssue[]> {
  const issues: SecurityIssue[] = [];
  
  try {
    // Run appropriate checks based on scan type
    if (scanType === 'full' || scanType === 'quick') {
      // Check for security headers
      const headerIssues = await checkSecurityHeaders();
      issues.push(...headerIssues);
      
      // Check for database security
      const dbIssues = await checkDatabaseSecurity();
      issues.push(...dbIssues);
    }
    
    if (scanType === 'full') {
      // Check dependency vulnerabilities (in full scan only)
      const depIssues = await checkDependencies();
      issues.push(...depIssues);
      
      // Check for API security
      const apiIssues = await checkApiSecurity();
      issues.push(...apiIssues);
    }
    
    // Always check configuration
    const configIssues = await checkSecurityConfiguration();
    issues.push(...configIssues);
    
  } catch (error) {
    console.error('Error during security checks:', error);
  }
  
  return issues;
}

/**
 * Check for security headers configuration
 */
async function checkSecurityHeaders(): Promise<SecurityIssue[]> {
  const issues: SecurityIssue[] = [];
  
  // This is a simulated check - in a real system would inspect
  // the actual security headers being used
  
  // For demonstration, return a low-risk issue
  issues.push({
    id: `header-${Date.now()}`,
    type: 'insecure_headers',
    riskLevel: 'low',
    description: 'Content-Security-Policy header not set or incomplete',
    location: 'server/index.ts',
    recommendations: [
      'Implement a strict Content-Security-Policy header to prevent XSS',
      'Add frame-ancestors directive to prevent clickjacking'
    ],
    detectedAt: new Date(),
    fixed: false
  });
  
  return issues;
}

/**
 * Check for database security issues
 */
async function checkDatabaseSecurity(): Promise<SecurityIssue[]> {
  const issues: SecurityIssue[] = [];
  
  try {
    // Check for public schemas that should be restricted
    const schemaResult = await pgPool.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast') 
        AND schema_owner = 'public'
    `);
    
    if (schemaResult.rows.length > 0) {
      issues.push({
        id: `db-schema-${Date.now()}`,
        type: 'access_control_issue',
        riskLevel: 'medium',
        description: 'Database schemas with public ownership detected',
        recommendations: [
          'Restrict schema ownership to application-specific roles',
          'Use least privilege principle for database access'
        ],
        detectedAt: new Date(),
        fixed: false
      });
    }
  } catch (error) {
    console.error('Error checking database security:', error);
  }
  
  return issues;
}

/**
 * Check for dependency vulnerabilities
 */
async function checkDependencies(): Promise<SecurityIssue[]> {
  const issues: SecurityIssue[] = [];
  
  try {
    // In a real implementation, would parse package.json and check
    // dependencies against a vulnerability database
    
    // For demonstration, return a simulated issue
    issues.push({
      id: `dep-${Date.now()}`,
      type: 'outdated_dependency',
      riskLevel: 'medium',
      description: 'Outdated npm packages with known security vulnerabilities',
      recommendations: [
        'Run npm audit and fix vulnerabilities',
        'Regularly update dependencies'
      ],
      detectedAt: new Date(),
      fixed: false
    });
  } catch (error) {
    console.error('Error checking dependencies:', error);
  }
  
  return issues;
}

/**
 * Check API security configuration
 */
async function checkApiSecurity(): Promise<SecurityIssue[]> {
  const issues: SecurityIssue[] = [];
  
  // In a real implementation, would analyze routes for security issues
  
  // For demonstration, return a simulated issue
  issues.push({
    id: `api-${Date.now()}`,
    type: 'rate_limit_missing',
    riskLevel: 'medium',
    description: 'API endpoints missing rate limiting protection',
    recommendations: [
      'Implement rate limiting on all public API endpoints',
      'Add proper error handling for rate limit exceeded scenarios'
    ],
    detectedAt: new Date(),
    fixed: false
  });
  
  return issues;
}

/**
 * Check security configuration
 */
async function checkSecurityConfiguration(): Promise<SecurityIssue[]> {
  const issues: SecurityIssue[] = [];
  const config = loadConfig();
  
  // Check for insecure configuration settings
  if (!config.csrfProtection) {
    issues.push({
      id: `config-csrf-${Date.now()}`,
      type: 'csrf',
      riskLevel: 'high',
      description: 'CSRF protection is disabled in configuration',
      recommendations: [
        'Enable CSRF protection in configuration',
        'Implement proper CSRF token validation'
      ],
      detectedAt: new Date(),
      fixed: false
    });
  }
  
  if (config.corsOrigins.includes('*')) {
    issues.push({
      id: `config-cors-${Date.now()}`,
      type: 'configuration_issue',
      riskLevel: 'medium',
      description: 'CORS configured with wildcard origin (*)',
      recommendations: [
        'Specify exact origins instead of using wildcard',
        'Use environment-specific CORS configuration'
      ],
      detectedAt: new Date(),
      fixed: false
    });
  }
  
  return issues;
}

/**
 * Log security events for auditing
 */
export function logSecurityEvent(eventType: string, data: any): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    eventType,
    data
  };
  
  console.log(`Security event logged: ${eventType}`);
  
  try {
    // In a real implementation, would log to file or database
    const logStr = JSON.stringify(logEntry);
    
    // For this demo, just log to console
    // console.log(`[SECURITY_LOG] ${logStr}`);
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

/**
 * Get latest security scan results
 */
export function getSecurityScanResults(): SecurityScanResult | null {
  return lastScanResult;
}

/**
 * Get all detected security issues
 */
export function getSecurityIssues(): SecurityIssue[] {
  return securityIssues;
}

/**
 * Mark a security issue as fixed
 */
export function markIssueAsFixed(issueId: string): boolean {
  const issue = securityIssues.find(i => i.id === issueId);
  
  if (issue) {
    issue.fixed = true;
    issue.fixedAt = new Date();
    return true;
  }
  
  return false;
}

/**
 * Run deferred security scan
 */
export async function runDeferredSecurityScan(): Promise<void> {
  const config = loadConfig();
  
  if (!config.features.enableSecurityScans) {
    return;
  }
  
  log('Starting deferred security scan initialization...', 'security');
  
  // Initialize security scanning
  await initializeSecurityScanning();
  
  // Run initial scan if deferred
  if (config.deferSecurityScans) {
    setTimeout(async () => {
      log('Starting initial security scan...', 'security');
      await performSecurityScan('quick');
    }, config.securityScanDelay);
  }
}