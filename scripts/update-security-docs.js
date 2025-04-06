/**
 * Security Documentation Update Script
 * 
 * This script generates security documentation updates based on scan results
 * and vulnerability remediation status.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Paths for various files
const SECURITY_LOG_PATH = path.join('logs', 'security.log');
const SCAN_RESULTS_DIR = path.join('logs', 'security-scans');
const VULNERABILITY_PLAN_PATH = path.join('reports', 'vulnerability_remediation_plan.md');
const SECURITY_IMPL_REPORT_PATH = path.join('reports', 'security_implementation_report.md');

// Ensure needed directories exist
if (!fs.existsSync(SCAN_RESULTS_DIR)) {
  fs.mkdirSync(SCAN_RESULTS_DIR, { recursive: true });
}

/**
 * Gets the most recent security scan result
 * @returns {Object|null} The most recent scan result or null if none found
 */
function getLatestScanResult() {
  try {
    // Find the most recent scan file
    if (!fs.existsSync(SCAN_RESULTS_DIR)) {
      console.log('No security scan directory found');
      return null;
    }
    
    const scanFiles = fs.readdirSync(SCAN_RESULTS_DIR)
      .filter(file => file.startsWith('scan-') && file.endsWith('.json'))
      .sort();
    
    if (scanFiles.length === 0) {
      console.log('No security scan files found');
      return null;
    }
    
    const latestScanFile = path.join(SCAN_RESULTS_DIR, scanFiles[scanFiles.length - 1]);
    const scanData = fs.readFileSync(latestScanFile, 'utf8');
    return JSON.parse(scanData);
  } catch (error) {
    console.error('Error reading scan results:', error);
    return null;
  }
}

/**
 * Gets security events from the security log
 * @param {number} days - Number of days to look back
 * @returns {Array} Array of security events
 */
function getSecurityEvents(days = 7) {
  try {
    if (!fs.existsSync(SECURITY_LOG_PATH)) {
      console.log('No security log file found');
      return [];
    }
    
    const logContent = fs.readFileSync(SECURITY_LOG_PATH, 'utf8');
    const logLines = logContent.split('\n').filter(line => line.trim() !== '');
    
    // Parse log lines into events with timestamp, severity, and message
    const events = [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    for (const line of logLines) {
      // Example log format: [2025-04-06T19:32:54.123Z] [HIGH] Authentication failure: too many attempts
      const match = line.match(/\[([^\]]+)\] \[([^\]]+)\] (.+)/);
      if (match) {
        const timestamp = new Date(match[1]);
        if (timestamp >= cutoffDate) {
          events.push({
            timestamp,
            severity: match[2],
            message: match[3]
          });
        }
      }
    }
    
    return events;
  } catch (error) {
    console.error('Error reading security log:', error);
    return [];
  }
}

/**
 * Checks for dependency updates using npm outdated
 * @returns {Object} Information about outdated dependencies
 */
function checkDependencyUpdates() {
  try {
    const output = execSync('npm outdated --json', { encoding: 'utf8' });
    const outdatedDeps = JSON.parse(output || '{}');
    
    return {
      outdatedCount: Object.keys(outdatedDeps).length,
      outdated: outdatedDeps
    };
  } catch (error) {
    // If there's an error, try to extract the JSON output from stderr
    try {
      const outdatedDeps = JSON.parse(error.stdout || '{}');
      return {
        outdatedCount: Object.keys(outdatedDeps).length,
        outdated: outdatedDeps
      };
    } catch (e) {
      console.error('Error checking for outdated dependencies:', e);
      return {
        outdatedCount: 0,
        outdated: {}
      };
    }
  }
}

/**
 * Runs npm audit to check for vulnerabilities
 * @returns {Object} Information about vulnerabilities
 */
function checkVulnerabilities() {
  try {
    const output = execSync('npm audit --json', { encoding: 'utf8' });
    const auditData = JSON.parse(output || '{}');
    
    const vulnerabilities = auditData.vulnerabilities || {};
    
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
    
    return {
      total: Object.keys(vulnerabilities).length,
      severityCounts,
      vulnerabilities
    };
  } catch (error) {
    // If there's an error, try to extract the JSON output from stderr
    try {
      const auditData = JSON.parse(error.stdout || '{}');
      const vulnerabilities = auditData.vulnerabilities || {};
      
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
      
      return {
        total: Object.keys(vulnerabilities).length,
        severityCounts,
        vulnerabilities
      };
    } catch (e) {
      console.error('Error checking for vulnerabilities:', e);
      return {
        total: 0,
        severityCounts: {
          critical: 0,
          high: 0,
          moderate: 0,
          low: 0,
          info: 0
        },
        vulnerabilities: {}
      };
    }
  }
}

/**
 * Updates the timestamp in a markdown file
 * @param {string} filePath - Path to the markdown file
 */
function updateTimestamp(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Replace timestamp at the bottom of the file
    if (content.includes('*Plan updated:')) {
      content = content.replace(/\*Plan updated: .+\*/, `*Plan updated: ${today}*`);
    } else if (content.includes('*Report generated:')) {
      content = content.replace(/\*Report generated: .+\*/, `*Report generated: ${today}*`);
    } else if (content.includes('*Report Date:')) {
      content = content.replace(/\*Report Date: .+\*/, `*Report Date: ${today}*`);
    } else {
      // Add timestamp if none exists
      content += `\n\n---\n\n*Updated: ${today}*`;
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated timestamp in ${filePath}`);
  } catch (error) {
    console.error(`Error updating timestamp in ${filePath}:`, error);
  }
}

/**
 * Main function to update security documentation
 */
function updateSecurityDocumentation() {
  console.log('Starting security documentation update...');
  
  // Get latest security scan result
  const latestScan = getLatestScanResult();
  console.log('Latest scan result:', latestScan ? `Found from ${latestScan.timestamp}` : 'None found');
  
  // Get recent security events
  const securityEvents = getSecurityEvents(7); // Last 7 days
  console.log(`Found ${securityEvents.length} security events in the last 7 days`);
  
  // Check for outdated dependencies
  const dependencyStatus = checkDependencyUpdates();
  console.log(`Found ${dependencyStatus.outdatedCount} outdated dependencies`);
  
  // Check for vulnerabilities
  const vulnerabilityStatus = checkVulnerabilities();
  console.log(`Found ${vulnerabilityStatus.total} vulnerabilities`);
  
  // Update timestamps in documentation files
  if (fs.existsSync(VULNERABILITY_PLAN_PATH)) {
    updateTimestamp(VULNERABILITY_PLAN_PATH);
  }
  
  if (fs.existsSync(SECURITY_IMPL_REPORT_PATH)) {
    updateTimestamp(SECURITY_IMPL_REPORT_PATH);
  }
  
  // Output security status summary
  console.log('\nSecurity Status Summary:');
  console.log('------------------------');
  console.log(`Security Scan: ${latestScan ? latestScan.totalIssues + ' issues found' : 'No recent scan'}`);
  console.log(`Outdated Dependencies: ${dependencyStatus.outdatedCount}`);
  console.log(`Vulnerabilities: ${vulnerabilityStatus.total}`);
  if (vulnerabilityStatus.total > 0) {
    console.log(`- Critical: ${vulnerabilityStatus.severityCounts.critical}`);
    console.log(`- High: ${vulnerabilityStatus.severityCounts.high}`);
    console.log(`- Moderate: ${vulnerabilityStatus.severityCounts.moderate}`);
    console.log(`- Low: ${vulnerabilityStatus.severityCounts.low}`);
  }
  console.log(`Security Events: ${securityEvents.length} in the last 7 days`);
  
  console.log('\nDocumentation update completed');
}

// Run the documentation update
updateSecurityDocumentation();