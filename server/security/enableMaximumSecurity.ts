/**
 * Maximum Security Mode Enabler
 * 
 * This module activates the maximum security features in the application.
 * It's designed to provide the highest level of security at the expense of performance.
 */

import { log } from '../vite';
import { runMaximumSecurityScan } from './maximumSecurityScan';
import fs from 'fs';
import path from 'path';

// Set scan interval in milliseconds (default: 1 hour)
const SCAN_INTERVAL = 3600000;

/**
 * Initialize maximum security mode
 */
export async function enableMaximumSecurity(): Promise<void> {
  try {
    log('ACTIVATING MAXIMUM SECURITY MODE - ALL SHIELDS UP', 'security');
    log('This mode prioritizes security over performance', 'security');
    
    // Create reports directory if it doesn't exist
    const reportsDir = path.join(process.cwd(), 'reports', 'security');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    // Run initial scan
    log('Running initial maximum security scan...', 'security');
    runInitialScan();
    
    // Schedule periodic scans
    log(`Scheduling maximum security scans every ${SCAN_INTERVAL / 60000} minutes`, 'security');
    setInterval(runPeriodicScan, SCAN_INTERVAL);
    
    log('Maximum security mode activated successfully', 'security');
  } catch (error) {
    log(`Error enabling maximum security mode: ${error}`, 'error');
  }
}

/**
 * Run initial security scan
 */
async function runInitialScan(): Promise<void> {
  try {
    const result = await runMaximumSecurityScan();
    
    // Log results
    if (result.summary.total > 0) {
      log(`Initial security scan found ${result.summary.total} potential issues:`, 'security');
      log(`  Critical: ${result.summary.critical}`, 'security');
      log(`  High: ${result.summary.high}`, 'security');
      log(`  Medium: ${result.summary.medium}`, 'security');
      log(`  Low: ${result.summary.low}`, 'security');
      log(`Security Score: ${result.securityScore}/100`, 'security');
      
      // Log critical and high severity issues
      const severeIssues = result.vulnerabilities.filter(v => v.severity === 'critical' || v.severity === 'high');
      if (severeIssues.length > 0) {
        log('CRITICAL/HIGH SEVERITY ISSUES DETECTED:', 'security');
        severeIssues.forEach((issue, index) => {
          log(`[${index + 1}] [${issue.severity.toUpperCase()}] ${issue.description}`, 'security');
        });
      }
    } else {
      log('Initial security scan completed with no issues found', 'security');
    }
    
    // Save scan report
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const reportPath = path.join(process.cwd(), 'reports', 'security', `initial-scan-${timestamp}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));
    log(`Security scan report saved to ${reportPath}`, 'security');
    
  } catch (error) {
    log(`Error running initial security scan: ${error}`, 'error');
  }
}

/**
 * Run periodic security scan
 */
async function runPeriodicScan(): Promise<void> {
  try {
    log('Running scheduled maximum security scan...', 'security');
    const result = await runMaximumSecurityScan();
    
    // Log results
    if (result.summary.total > 0) {
      log(`Scheduled security scan found ${result.summary.total} potential issues:`, 'security');
      log(`  Critical: ${result.summary.critical}`, 'security');
      log(`  High: ${result.summary.high}`, 'security');
      log(`  Medium: ${result.summary.medium}`, 'security');
      log(`  Low: ${result.summary.low}`, 'security');
      
      // Log critical and high severity issues
      const severeIssues = result.vulnerabilities.filter(v => v.severity === 'critical' || v.severity === 'high');
      if (severeIssues.length > 0) {
        log('CRITICAL/HIGH SEVERITY ISSUES DETECTED:', 'security');
        severeIssues.forEach((issue, index) => {
          log(`[${index + 1}] [${issue.severity.toUpperCase()}] ${issue.description}`, 'security');
        });
      }
    } else {
      log('Scheduled security scan completed with no issues found', 'security');
    }
    
    // Save scan report
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const reportPath = path.join(process.cwd(), 'reports', 'security', `scheduled-scan-${timestamp}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));
    
  } catch (error) {
    log(`Error running scheduled security scan: ${error}`, 'error');
  }
}