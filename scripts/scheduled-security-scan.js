#!/usr/bin/env node

/**
 * Scheduled Security Scanning Script
 * 
 * This script is designed to be run on a schedule (daily, weekly, etc.)
 * to automatically scan the application for security vulnerabilities.
 * 
 * It can be configured to:
 * - Run different types of scans on different schedules
 * - Send notifications when vulnerabilities are found
 * - Automatically generate reports
 * - Track security trends over time
 * 
 * Usage:
 *   node scripts/scheduled-security-scan.js [options]
 * 
 * Options:
 *   --notify     Send notifications for detected issues
 *   --compare    Compare with previous scan results to show new issues
 *   --quick      Run a quick scan for critical vulnerabilities only
 *   --report     Generate a PDF report of the scan results
 *   --stats      Update security statistics dashboard data
 */

import fs from 'fs';
import path from 'path';
import { execSync, exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Configuration
const CONFIG = {
  scanTypes: {
    quick: {
      schedule: 'daily', // daily, weekly, monthly
      reportPath: 'reports/daily-scan.json',
      notifyOnSeverity: ['critical', 'high']
    },
    full: {
      schedule: 'weekly',
      reportPath: 'reports/weekly-scan.json',
      notifyOnSeverity: ['critical', 'high', 'medium']
    },
    audit: {
      schedule: 'monthly',
      reportPath: 'reports/monthly-audit.json',
      notifyOnSeverity: ['critical', 'high', 'medium', 'low']
    }
  },
  notification: {
    enabled: false,
    methods: ['email', 'slack'],
    recipients: {
      email: ['security@example.com'],
      slack: '#security-alerts'
    }
  },
  scanHistoryPath: 'logs/security-scans',
  statsPath: 'reports/security-stats.json'
};

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  notify: args.includes('--notify') || CONFIG.notification.enabled,
  compare: args.includes('--compare'),
  quick: args.includes('--quick'),
  report: args.includes('--report'),
  stats: args.includes('--stats')
};

// Determine scan type based on options
const scanType = options.quick ? 'quick' : 'full';

// Logger
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
  console.log(logEntry);
}

/**
 * Main function to run the scheduled security scan
 */
async function runScheduledScan() {
  try {
    log(`Starting scheduled ${scanType} security scan...`);
    
    // Create directories if they don't exist
    ensureDirectoriesExist();
    
    // Run the appropriate scan
    const scanResults = await runScan(scanType);
    
    // Compare with previous scan if requested
    if (options.compare) {
      const comparison = await compareWithPreviousScan(scanResults);
      log(`Found ${comparison.newIssues.length} new issues since last scan`);
      
      // Add comparison data to scan results
      scanResults.comparison = comparison;
    }
    
    // Save scan results
    saveScanResults(scanResults);
    
    // Generate a report if requested
    if (options.report) {
      await generateReport(scanResults);
    }
    
    // Update security stats if requested
    if (options.stats) {
      await updateSecurityStats(scanResults);
    }
    
    // Send notifications if enabled and vulnerabilities are found
    if (options.notify) {
      await sendNotifications(scanResults);
    }
    
    log(`Scheduled security scan completed successfully`);
    
  } catch (error) {
    log(`Error during scheduled security scan: ${error}`, 'error');
    process.exit(1);
  }
}

/**
 * Ensure all required directories exist
 */
function ensureDirectoriesExist() {
  const dirs = [
    path.dirname(CONFIG.scanTypes.quick.reportPath),
    path.dirname(CONFIG.scanTypes.full.reportPath),
    path.dirname(CONFIG.scanTypes.audit.reportPath),
    CONFIG.scanHistoryPath,
    path.dirname(CONFIG.statsPath)
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

/**
 * Run the security scan of the specified type
 * @param {string} type - Type of scan to run (quick, full, audit)
 * @returns {Promise<Object>} Scan results
 */
async function runScan(type) {
  let command;
  
  switch (type) {
    case 'quick':
      command = 'node scripts/security-scan.js --quick';
      break;
    case 'full':
      command = 'node scripts/security-scan.js --full';
      break;
    case 'audit':
      command = 'node scripts/security-audit.js';
      break;
    default:
      command = 'node scripts/security-scan.js';
  }
  
  log(`Executing scan command: ${command}`);
  
  try {
    // Run the scan command
    const { stdout, stderr } = await execAsync(command);
    
    // Find the most recent scan result file
    const scanDir = CONFIG.scanHistoryPath;
    const files = fs.readdirSync(scanDir)
      .filter(file => file.startsWith('scan-') && file.endsWith('.json'))
      .sort()
      .reverse();
    
    if (files.length === 0) {
      throw new Error(`No scan result files found in ${scanDir}`);
    }
    
    // Read the latest scan results
    const latestScanFile = path.join(scanDir, files[0]);
    const scanData = fs.readFileSync(latestScanFile, 'utf8');
    return JSON.parse(scanData);
    
  } catch (error) {
    log(`Error running scan: ${error}`, 'error');
    
    // Return a minimal scan result with the error
    return {
      timestamp: new Date().toISOString(),
      error: error.message,
      success: false,
      scanType: type
    };
  }
}

/**
 * Compare current scan results with previous scan
 * @param {Object} currentScan - Current scan results
 * @returns {Promise<Object>} Comparison results
 */
async function compareWithPreviousScan(currentScan) {
  log('Comparing with previous scan results...');
  
  const scanType = currentScan.scanType || 'full';
  const reportPath = CONFIG.scanTypes[scanType].reportPath;
  
  // Check if previous report exists
  if (!fs.existsSync(reportPath)) {
    return {
      previousScanDate: null,
      newIssues: currentScan.vulnerabilities || [],
      resolvedIssues: [],
      comparisonAvailable: false
    };
  }
  
  // Read previous scan results
  const previousData = fs.readFileSync(reportPath, 'utf8');
  const previousScan = JSON.parse(previousData);
  
  // Compare vulnerabilities
  const currentVulns = currentScan.vulnerabilities || [];
  const previousVulns = previousScan.vulnerabilities || [];
  
  // Find new issues (in current but not in previous)
  const newIssues = currentVulns.filter(current => {
    return !previousVulns.some(prev => 
      prev.description === current.description && 
      prev.location === current.location
    );
  });
  
  // Find resolved issues (in previous but not in current)
  const resolvedIssues = previousVulns.filter(prev => {
    return !currentVulns.some(current => 
      current.description === prev.description && 
      current.location === prev.location
    );
  });
  
  return {
    previousScanDate: previousScan.timestamp,
    newIssues,
    resolvedIssues,
    comparisonAvailable: true
  };
}

/**
 * Save scan results to the appropriate report file
 * @param {Object} scanResults - Scan results
 */
function saveScanResults(scanResults) {
  const scanType = scanResults.scanType || 'full';
  const reportPath = CONFIG.scanTypes[scanType].reportPath;
  
  // Save to report path
  fs.writeFileSync(reportPath, JSON.stringify(scanResults, null, 2));
  log(`Saved scan results to ${reportPath}`);
}

/**
 * Generate a report from scan results
 * @param {Object} scanResults - Scan results
 */
async function generateReport(scanResults) {
  log('Generating security scan report...');
  
  const scanType = scanResults.scanType || 'full';
  const reportDir = path.dirname(CONFIG.scanTypes[scanType].reportPath);
  const reportTimestamp = new Date().toISOString().replace(/:/g, '-');
  const reportPath = path.join(reportDir, `security-scan-report-${reportTimestamp}.md`);
  
  // Generate markdown report
  let reportContent = `# Security Scan Report

**Scan Date**: ${new Date(scanResults.timestamp).toLocaleString()}
**Scan Type**: ${scanType}

## Summary

- **Total Issues**: ${scanResults.totalIssues || 0}
- **Critical Issues**: ${scanResults.criticalIssues || 0}
- **High Issues**: ${scanResults.highIssues || 0}
- **Medium Issues**: ${scanResults.mediumIssues || 0}
- **Low Issues**: ${scanResults.lowIssues || 0}

`;

  // Add comparison if available
  if (scanResults.comparison && scanResults.comparison.comparisonAvailable) {
    const { previousScanDate, newIssues, resolvedIssues } = scanResults.comparison;
    
    reportContent += `## Changes Since Previous Scan

**Previous Scan Date**: ${new Date(previousScanDate).toLocaleString()}

- **New Issues**: ${newIssues.length}
- **Resolved Issues**: ${resolvedIssues.length}

`;

    // List new issues
    if (newIssues.length > 0) {
      reportContent += `### New Issues\n\n`;
      
      newIssues.forEach((issue, i) => {
        reportContent += `${i + 1}. **[${issue.severity.toUpperCase()}] ${issue.description}**\n`;
        if (issue.location) {
          reportContent += `   - **Location**: \`${issue.location}\`\n`;
        }
        if (issue.recommendation) {
          reportContent += `   - **Recommendation**: ${issue.recommendation}\n`;
        }
        reportContent += '\n';
      });
    }
    
    // List resolved issues
    if (resolvedIssues.length > 0) {
      reportContent += `### Resolved Issues\n\n`;
      
      resolvedIssues.forEach((issue, i) => {
        reportContent += `${i + 1}. **[${issue.severity.toUpperCase()}] ${issue.description}**\n`;
        if (issue.location) {
          reportContent += `   - **Location**: \`${issue.location}\`\n`;
        }
        reportContent += '\n';
      });
    }
  }

  // Add vulnerabilities
  if (scanResults.vulnerabilities && scanResults.vulnerabilities.length > 0) {
    reportContent += `## Vulnerabilities\n\n`;
    
    // Group by severity
    const bySeverity = {
      critical: [],
      high: [],
      medium: [],
      low: []
    };
    
    scanResults.vulnerabilities.forEach(vuln => {
      if (!bySeverity[vuln.severity]) {
        bySeverity[vuln.severity] = [];
      }
      bySeverity[vuln.severity].push(vuln);
    });
    
    // Add each severity section
    ['critical', 'high', 'medium', 'low'].forEach(severity => {
      const vulns = bySeverity[severity];
      if (vulns && vulns.length > 0) {
        reportContent += `### ${severity.charAt(0).toUpperCase() + severity.slice(1)} Severity Issues (${vulns.length})\n\n`;
        
        vulns.forEach((vuln, i) => {
          reportContent += `${i + 1}. **${vuln.description}**\n`;
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
  }
  
  // Write report to file
  fs.writeFileSync(reportPath, reportContent);
  log(`Report generated: ${reportPath}`);
}

/**
 * Update security statistics
 * @param {Object} scanResults - Scan results
 */
async function updateSecurityStats(scanResults) {
  log('Updating security statistics...');
  
  // Get current stats or initialize if not exists
  let stats = {
    lastUpdated: new Date().toISOString(),
    scans: [],
    trends: {
      critical: [],
      high: [],
      medium: [],
      low: [],
      total: []
    }
  };
  
  if (fs.existsSync(CONFIG.statsPath)) {
    try {
      const statsData = fs.readFileSync(CONFIG.statsPath, 'utf8');
      stats = JSON.parse(statsData);
    } catch (error) {
      log(`Error reading stats file: ${error}`, 'error');
    }
  }
  
  // Add current scan to stats
  stats.scans.push({
    date: scanResults.timestamp,
    type: scanResults.scanType || 'full',
    criticalIssues: scanResults.criticalIssues || 0,
    highIssues: scanResults.highIssues || 0,
    mediumIssues: scanResults.mediumIssues || 0,
    lowIssues: scanResults.lowIssues || 0,
    totalIssues: scanResults.totalIssues || 0
  });
  
  // Limit to last 100 scans
  if (stats.scans.length > 100) {
    stats.scans = stats.scans.slice(-100);
  }
  
  // Update trends (last 10 scans)
  const last10Scans = stats.scans.slice(-10);
  
  stats.trends.critical = last10Scans.map(scan => ({ date: scan.date, count: scan.criticalIssues }));
  stats.trends.high = last10Scans.map(scan => ({ date: scan.date, count: scan.highIssues }));
  stats.trends.medium = last10Scans.map(scan => ({ date: scan.date, count: scan.mediumIssues }));
  stats.trends.low = last10Scans.map(scan => ({ date: scan.date, count: scan.lowIssues }));
  stats.trends.total = last10Scans.map(scan => ({ date: scan.date, count: scan.totalIssues }));
  
  // Update last updated timestamp
  stats.lastUpdated = new Date().toISOString();
  
  // Save stats file
  fs.writeFileSync(CONFIG.statsPath, JSON.stringify(stats, null, 2));
  log(`Security statistics updated successfully`);
}

/**
 * Send notifications for security issues
 * @param {Object} scanResults - Scan results
 */
async function sendNotifications(scanResults) {
  if (!options.notify) return;
  
  log('Checking if notifications are needed...');
  
  const scanType = scanResults.scanType || 'full';
  const notifyOnSeverity = CONFIG.scanTypes[scanType].notifyOnSeverity;
  
  // Check if there are issues that require notification
  const vulnerabilities = scanResults.vulnerabilities || [];
  const notifiableIssues = vulnerabilities.filter(v => notifyOnSeverity.includes(v.severity));
  
  if (notifiableIssues.length === 0) {
    log('No issues require notification');
    return;
  }
  
  log(`Found ${notifiableIssues.length} issues that require notification`);
  
  // Format notification message
  const message = formatNotificationMessage(scanResults, notifiableIssues);
  
  // Send to each configured notification method
  for (const method of CONFIG.notification.methods) {
    try {
      switch (method) {
        case 'email':
          await sendEmailNotification(message, CONFIG.notification.recipients.email);
          break;
        case 'slack':
          await sendSlackNotification(message, CONFIG.notification.recipients.slack);
          break;
      }
    } catch (error) {
      log(`Error sending ${method} notification: ${error}`, 'error');
    }
  }
}

/**
 * Format notification message
 * @param {Object} scanResults - Scan results
 * @param {Array} notifiableIssues - Issues to notify about
 * @returns {string} Formatted message
 */
function formatNotificationMessage(scanResults, notifiableIssues) {
  const scanType = scanResults.scanType || 'full';
  const scanDate = new Date(scanResults.timestamp).toLocaleString();
  
  let message = `Security Scan Alert (${scanType})\n\n`;
  message += `Scan Date: ${scanDate}\n`;
  message += `Critical Issues: ${scanResults.criticalIssues || 0}\n`;
  message += `High Issues: ${scanResults.highIssues || 0}\n`;
  message += `Medium Issues: ${scanResults.mediumIssues || 0}\n`;
  message += `Low Issues: ${scanResults.lowIssues || 0}\n\n`;
  
  message += `Issues Requiring Attention:\n\n`;
  
  // Group by severity
  const bySeverity = {
    critical: [],
    high: [],
    medium: [],
    low: []
  };
  
  notifiableIssues.forEach(issue => {
    if (!bySeverity[issue.severity]) {
      bySeverity[issue.severity] = [];
    }
    bySeverity[issue.severity].push(issue);
  });
  
  // Add each severity group
  ['critical', 'high', 'medium', 'low'].forEach(severity => {
    const issues = bySeverity[severity];
    if (issues && issues.length > 0) {
      message += `${severity.toUpperCase()} ISSUES:\n`;
      
      issues.forEach((issue, i) => {
        message += `${i + 1}. ${issue.description}`;
        if (issue.location) {
          message += ` (${issue.location})`;
        }
        message += '\n';
      });
      
      message += '\n';
    }
  });
  
  return message;
}

/**
 * Send an email notification
 * @param {string} message - Notification message
 * @param {Array} recipients - Email recipients
 */
async function sendEmailNotification(message, recipients) {
  // This is a placeholder for actual email sending
  // You would integrate with your email service here
  log(`Would send email to: ${recipients.join(', ')}`);
  log('Email content:\n' + message);
  log('Email notification placeholder - implement with your email service');
}

/**
 * Send a Slack notification
 * @param {string} message - Notification message
 * @param {string} channel - Slack channel
 */
async function sendSlackNotification(message, channel) {
  // This is a placeholder for actual Slack integration
  // You would integrate with Slack API here
  log(`Would send Slack message to channel: ${channel}`);
  log('Slack content:\n' + message);
  log('Slack notification placeholder - implement with Slack API');
}

// Run the scheduled scan
runScheduledScan();