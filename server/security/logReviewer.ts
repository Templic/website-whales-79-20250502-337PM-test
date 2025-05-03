/**
 * Security Log Review System
 * 
 * This module implements an automated log review system to meet PCI-DSS Requirement 10.6:
 * Review logs and security events for all system components.
 * 
 * Features:
 * 1. Automated daily log analysis
 * 2. Anomaly detection
 * 3. Security event correlation
 * 4. Alert generation
 * 5. Regular review reports
 */

import fs from 'fs';
import path from 'path';
import { getAuditLogs } from './secureAuditTrail';
import { log } from '../utils/logger';

// Configuration
const LOGS_DIR = path.join(process.cwd(), 'logs');
const REVIEW_DIR = path.join(LOGS_DIR, 'reviews');
const ALERT_THRESHOLD = 5; // Number of critical events that trigger an alert

// Review intervals
const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

// Patterns to look for in logs
const SUSPICIOUS_PATTERNS = [
  /failed login attempt/i,
  /permission denied/i,
  /unauthorized access/i,
  /authentication failed/i,
  /invalid token/i,
  /security violation/i,
  /INTEGRITY_VIOLATION/,
  /brute force/i,
  /injection attempt/i,
  /XSS attempt/i,
  /CSRF attempt/i,
  /path traversal/i,
  /unusual activity/i,
  /suspicious IP/i
];

// Threat categories for classification
enum ThreatCategory {
  AUTHENTICATION_FAILURE = 'Authentication Failure',
  ACCESS_CONTROL_VIOLATION = 'Access Control Violation',
  INTEGRITY_VIOLATION = 'Data Integrity Violation',
  INJECTION_ATTACK = 'Injection Attack',
  UNUSUAL_ACTIVITY = 'Unusual Activity Pattern',
  SYSTEM_ERROR = 'System Error',
  COMPLIANCE_VIOLATION = 'Compliance Violation',
  UNKNOWN = 'Unknown'
}

// Review state
let isInitialized = false;
let reviewInterval: NodeJS.Timeout | null = null;

/**
 * Initialize the log review system
 */
export function initializeLogReviewer(intervalHours = 24): void {
  if (isInitialized) {
    log('Log review system already initialized', 'security');
    return;
  }

  try {
    // Create review directory if it doesn't exist
    if (!fs.existsSync(REVIEW_DIR)) {
      fs.mkdirSync(REVIEW_DIR, { recursive: true });
    }

    // Schedule regular log reviews
    const reviewIntervalMs = intervalHours * HOUR_MS;
    reviewInterval = setInterval(() => {
      reviewSecurityLogs();
    }, reviewIntervalMs);

    log(`Log review system initialized. Reviews scheduled every ${intervalHours} hours`, 'security');
    isInitialized = true;

    // Perform initial review
    setTimeout(() => {
      log('Performing initial security log review...', 'security');
      reviewSecurityLogs();
    }, 5000); // Wait 5 seconds to allow the system to stabilize

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Failed to initialize log review system: ${errorMessage}`, 'security');
  }
}

/**
 * Stop the log review system
 */
export function stopLogReviewer(): void {
  if (reviewInterval) {
    clearInterval(reviewInterval);
    reviewInterval = null;
  }
  isInitialized = false;
  log('Log review system stopped', 'security');
}

/**
 * Review security logs for suspicious activity
 */
export function reviewSecurityLogs(
  lookbackHours = 24,
  generateReport = true
): { alerts: number; reviewed: number } {
  try {
    log(`Reviewing security logs for the past ${lookbackHours} hours...`, 'security');

    // Calculate time range for review
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (lookbackHours * HOUR_MS));

    // Get audit logs for the period
    const auditLogs = getAuditLogs(startDate, endDate);
    
    // Also analyze other log files
    const systemLogs = getSystemLogs(startDate, endDate);
    
    // Find suspicious events
    const suspiciousEvents = findSuspiciousEvents(auditLogs, systemLogs);
    
    // Correlate events to find patterns
    const correlatedEvents = correlateEvents(suspiciousEvents);
    
    // Generate alerts for critical findings
    const alerts = generateAlerts(correlatedEvents);
    
    // Generate review report if requested
    if (generateReport) {
      generateReviewReport(startDate, endDate, suspiciousEvents, correlatedEvents, alerts);
    }
    
    // Log summary
    log(`Log review completed: Found ${suspiciousEvents.length} suspicious events, ${correlatedEvents.length} patterns, and generated ${alerts.length} alerts`, 'security');
    
    return {
      alerts: alerts.length,
      reviewed: auditLogs.length + systemLogs.length
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Error during security log review: ${errorMessage}`, 'security');
    return { alerts: 0, reviewed: 0 };
  }
}

/**
 * Get system logs from various sources
 */
function getSystemLogs(startDate: Date, endDate: Date): Array<any> {
  const logs: Array<any> = [];
  
  try {
    // Get application logs
    const appLogDir = path.join(LOGS_DIR, 'app');
    if (fs.existsSync(appLogDir)) {
      const logFiles = fs.readdirSync(appLogDir)
        .filter(file => file.endsWith('.log'));
      
      for (const file of logFiles) {
        const filepath = path.join(appLogDir, file);
        const stats = fs.statSync(filepath);
        
        // Only process files that might have logs in our time range
        if (stats.mtime >= startDate && stats.mtime <= endDate) {
          const content = fs.readFileSync(filepath, 'utf8');
          const lines = content.split('\n');
          
          for (const line of lines) {
            // Extract timestamp and check if in range
            const timestampMatch = line.match(/\[(.*?)\]/);
            if (timestampMatch) {
              try {
                const timestamp = new Date(timestampMatch[1]);
                if (timestamp >= startDate && timestamp <= endDate) {
                  logs.push({
                    timestamp: timestamp.toISOString(),
                    source: 'app',
                    content: line,
                    file: file
                  });
                }
              } catch (e) {
                // Skip lines with invalid timestamps
              }
            }
          }
        }
      }
    }
    
    // Get server logs
    const serverLogDir = path.join(LOGS_DIR, 'server');
    if (fs.existsSync(serverLogDir)) {
      // Similar processing for server logs
      // (Similar code as above, but for server logs)
    }
    
    // Get access logs
    const accessLogDir = path.join(LOGS_DIR, 'access');
    if (fs.existsSync(accessLogDir)) {
      // Similar processing for access logs
      // (Similar code as above, but for access logs)
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Error retrieving system logs: ${errorMessage}`, 'security');
  }
  
  return logs;
}

/**
 * Find suspicious events in logs
 */
function findSuspiciousEvents(auditLogs: any[], systemLogs: any[]): any[] {
  const suspicious: any[] = [];
  
  // Check audit logs
  for (const entry of auditLogs) {
    // Critical and warning events are automatically suspicious
    if (entry.severity === 'critical' || entry.severity === 'warning') {
      suspicious.push({
        ...entry,
        reason: `High severity event: ${entry.severity}`,
        source: 'audit',
        category: categorizeThreat(entry)
      });
      continue;
    }
    
    // Failed actions are suspicious
    if (entry.result === 'failure') {
      suspicious.push({
        ...entry,
        reason: 'Operation failed',
        source: 'audit',
        category: categorizeThreat(entry)
      });
      continue;
    }
    
    // Check for suspicious patterns in details
    if (entry.details) {
      const detailsStr = JSON.stringify(entry.details).toLowerCase();
      for (const pattern of SUSPICIOUS_PATTERNS) {
        if (pattern.test(detailsStr)) {
          suspicious.push({
            ...entry,
            reason: `Matched pattern: ${pattern}`,
            source: 'audit',
            category: categorizeThreat(entry)
          });
          break;
        }
      }
    }
  }
  
  // Check system logs
  for (const log of systemLogs) {
    // Check for suspicious patterns
    for (const pattern of SUSPICIOUS_PATTERNS) {
      if (pattern.test(log.content)) {
        suspicious.push({
          ...log,
          reason: `Matched pattern: ${pattern}`,
          source: 'system',
          category: categorizeThreat(log)
        });
        break;
      }
    }
  }
  
  return suspicious;
}

/**
 * Categorize a threat based on log entry
 */
function categorizeThreat(entry: any): ThreatCategory {
  // For audit logs
  if (entry.source === 'audit') {
    if (entry.action?.includes('LOGIN') || entry.action?.includes('AUTH')) {
      return ThreatCategory.AUTHENTICATION_FAILURE;
    }
    
    if (entry.action?.includes('ACCESS') || entry.action?.includes('PERMISSION')) {
      return ThreatCategory.ACCESS_CONTROL_VIOLATION;
    }
    
    if (entry.action?.includes('INTEGRITY') || entry.action?.includes('TAMPER')) {
      return ThreatCategory.INTEGRITY_VIOLATION;
    }
    
    if (
      entry.details?.message?.includes('injection') || 
      entry.details?.message?.includes('XSS') || 
      entry.details?.message?.includes('CSRF')
    ) {
      return ThreatCategory.INJECTION_ATTACK;
    }
  }
  
  // For system logs, check content
  if (entry.source === 'system' && entry.content) {
    const content = entry.content.toLowerCase();
    
    if (
      content.includes('login') || 
      content.includes('auth') || 
      content.includes('password')
    ) {
      return ThreatCategory.AUTHENTICATION_FAILURE;
    }
    
    if (
      content.includes('permission') || 
      content.includes('access') || 
      content.includes('unauthorized')
    ) {
      return ThreatCategory.ACCESS_CONTROL_VIOLATION;
    }
    
    if (
      content.includes('integrity') || 
      content.includes('tamper') || 
      content.includes('modified')
    ) {
      return ThreatCategory.INTEGRITY_VIOLATION;
    }
    
    if (
      content.includes('injection') || 
      content.includes('xss') || 
      content.includes('csrf') || 
      content.includes('script')
    ) {
      return ThreatCategory.INJECTION_ATTACK;
    }
    
    if (
      content.includes('unusual') || 
      content.includes('suspicious') || 
      content.includes('abnormal')
    ) {
      return ThreatCategory.UNUSUAL_ACTIVITY;
    }
    
    if (
      content.includes('error') || 
      content.includes('exception') || 
      content.includes('crash')
    ) {
      return ThreatCategory.SYSTEM_ERROR;
    }
    
    if (
      content.includes('compliance') || 
      content.includes('policy') || 
      content.includes('violation')
    ) {
      return ThreatCategory.COMPLIANCE_VIOLATION;
    }
  }
  
  return ThreatCategory.UNKNOWN;
}

/**
 * Correlate events to identify patterns
 */
function correlateEvents(events: any[]): any[] {
  if (events.length === 0) return [];
  
  const correlations: any[] = [];
  
  // Group by category
  const byCategory = events.reduce((groups, event) => {
    const category = event.category || ThreatCategory.UNKNOWN;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(event);
    return groups;
  }, {} as Record<string, any[]>);
  
  // Look for patterns within each category
  for (const [category, categoryEvents] of Object.entries(byCategory)) {
    // Skip if only one event
    if (categoryEvents.length <= 1) continue;
    
    // Group by resource
    const byResource = categoryEvents.reduce((resources, event) => {
      const resource = event.resource || 'unknown';
      if (!resources[resource]) {
        resources[resource] = [];
      }
      resources[resource].push(event);
      return resources;
    }, {} as Record<string, any[]>);
    
    for (const [resource, resourceEvents] of Object.entries(byResource)) {
      // Skip if only one event
      if (resourceEvents.length <= 1) continue;
      
      // Group by IP address (if available)
      if (resourceEvents.some(e => e.ipAddress)) {
        const byIP = resourceEvents.reduce((ips, event) => {
          const ip = event.ipAddress || 'unknown';
          if (!ips[ip]) {
            ips[ip] = [];
          }
          ips[ip].push(event);
          return ips;
        }, {} as Record<string, any[]>);
        
        for (const [ip, ipEvents] of Object.entries(byIP)) {
          if (ipEvents.length > 2) {
            // Found a pattern: multiple events from same IP on same resource
            correlations.push({
              type: 'ip_resource_pattern',
              category,
              resource,
              ipAddress: ip,
              count: ipEvents.length,
              events: ipEvents,
              severity: calculateSeverity(ipEvents)
            });
          }
        }
      }
      
      // Group by user ID (if available)
      if (resourceEvents.some(e => e.userId)) {
        const byUser = resourceEvents.reduce((users, event) => {
          const user = event.userId || 'unknown';
          if (!users[user]) {
            users[user] = [];
          }
          users[user].push(event);
          return users;
        }, {} as Record<string, any[]>);
        
        for (const [user, userEvents] of Object.entries(byUser)) {
          if (userEvents.length > 2) {
            // Found a pattern: multiple events from same user on same resource
            correlations.push({
              type: 'user_resource_pattern',
              category,
              resource,
              userId: user,
              count: userEvents.length,
              events: userEvents,
              severity: calculateSeverity(userEvents)
            });
          }
        }
      }
      
      // Look for time-based patterns (events happening close together)
      if (resourceEvents.length > 2) {
        // Sort by timestamp
        const sortedEvents = [...resourceEvents].sort((a, b) => {
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        });
        
        // Look for events clustered in time
        const timeWindows: any[][] = [];
        let currentWindow: any[] = [sortedEvents[0]];
        
        for (let i = 1; i < sortedEvents.length; i++) {
          const prevTime = new Date(sortedEvents[i-1].timestamp).getTime();
          const currTime = new Date(sortedEvents[i].timestamp).getTime();
          
          // If events are within 5 minutes, consider them part of same window
          if (currTime - prevTime <= 5 * 60 * 1000) {
            currentWindow.push(sortedEvents[i]);
          } else {
            if (currentWindow.length > 1) {
              timeWindows.push(currentWindow);
            }
            currentWindow = [sortedEvents[i]];
          }
        }
        
        if (currentWindow.length > 1) {
          timeWindows.push(currentWindow);
        }
        
        // Add time-based patterns
        for (const window of timeWindows) {
          if (window.length > 2) {
            correlations.push({
              type: 'time_cluster',
              category,
              resource,
              count: window.length,
              timeSpan: `${new Date(window[0].timestamp).toISOString()} to ${new Date(window[window.length - 1].timestamp).toISOString()}`,
              events: window,
              severity: calculateSeverity(window)
            });
          }
        }
      }
    }
    
    // If many events in same category, consider it a pattern
    if (categoryEvents.length > 5) {
      correlations.push({
        type: 'category_frequency',
        category,
        count: categoryEvents.length,
        events: categoryEvents,
        severity: calculateSeverity(categoryEvents)
      });
    }
  }
  
  return correlations;
}

/**
 * Calculate severity of a group of events
 */
function calculateSeverity(events: any[]): 'low' | 'medium' | 'high' | 'critical' {
  const critical = events.filter(e => e.severity === 'critical').length;
  const warning = events.filter(e => e.severity === 'warning').length;
  
  if (critical > 0) {
    if (critical > 2 || events.length > 5) {
      return 'critical';
    }
    return 'high';
  }
  
  if (warning > 0) {
    if (warning > 3 || events.length > 7) {
      return 'high';
    }
    return 'medium';
  }
  
  if (events.length > 10) {
    return 'medium';
  }
  
  return 'low';
}

/**
 * Generate alerts based on correlations
 */
function generateAlerts(correlations: any[]): any[] {
  const alerts: any[] = [];
  
  for (const correlation of correlations) {
    // Generate alerts for high or critical patterns
    if (correlation.severity === 'high' || correlation.severity === 'critical') {
      const alert = {
        timestamp: new Date().toISOString(),
        type: 'security_pattern',
        severity: correlation.severity,
        category: correlation.category,
        message: generateAlertMessage(correlation),
        correlation,
        id: `ALERT-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      };
      
      alerts.push(alert);
      
      // Log the alert
      log(`SECURITY ALERT: ${alert.message}`, 'security');
      
      // In a real system, this would trigger notifications
      // sendNotification(alert);
    }
  }
  
  return alerts;
}

/**
 * Generate a descriptive alert message
 */
function generateAlertMessage(correlation: any): string {
  switch (correlation.type) {
    case 'ip_resource_pattern':
      return `Detected ${correlation.count} suspicious ${correlation.category} events from IP ${correlation.ipAddress} targeting ${correlation.resource}`;
      
    case 'user_resource_pattern':
      return `Detected ${correlation.count} suspicious ${correlation.category} events from user ${correlation.userId} on ${correlation.resource}`;
      
    case 'time_cluster':
      return `Detected time-clustered attack: ${correlation.count} ${correlation.category} events on ${correlation.resource} within a short time window`;
      
    case 'category_frequency':
      return `Unusual frequency of ${correlation.category} events detected (${correlation.count} events)`;
      
    default:
      return `Security pattern detected: ${correlation.count} ${correlation.category} events`;
  }
}

/**
 * Generate a comprehensive review report
 */
function generateReviewReport(
  startDate: Date,
  endDate: Date,
  suspiciousEvents: any[],
  patterns: any[],
  alerts: any[]
): string {
  try {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const reportPath = path.join(REVIEW_DIR, `security-review-${timestamp}.txt`);
    
    // Build report content
    let report = `Security Log Review Report\n`;
    report += `==========================\n\n`;
    report += `Review Period: ${startDate.toISOString()} to ${endDate.toISOString()}\n`;
    report += `Generated: ${new Date().toISOString()}\n\n`;
    
    // Summary section
    report += `SUMMARY\n-------\n`;
    report += `Suspicious Events Found: ${suspiciousEvents.length}\n`;
    report += `Patterns Identified: ${patterns.length}\n`;
    report += `Alerts Generated: ${alerts.length}\n\n`;
    
    // Categorize events
    const byCategory = suspiciousEvents.reduce((groups, event) => {
      const category = event.category || ThreatCategory.UNKNOWN;
      if (!groups[category]) {
        groups[category] = 0;
      }
      groups[category]++;
      return groups;
    }, {} as Record<string, number>);
    
    report += `Events by Category:\n`;
    for (const [category, count] of Object.entries(byCategory)) {
      report += `  ${category}: ${count}\n`;
    }
    report += '\n';
    
    // Alerts section (if any)
    if (alerts.length > 0) {
      report += `SECURITY ALERTS\n---------------\n`;
      for (const alert of alerts) {
        report += `[${alert.severity.toUpperCase()}] ${alert.message}\n`;
        report += `  Category: ${alert.category}\n`;
        report += `  Pattern: ${alert.correlation.type}\n`;
        report += `  Events: ${alert.correlation.count}\n\n`;
      }
    }
    
    // Patterns section
    if (patterns.length > 0) {
      report += `IDENTIFIED PATTERNS\n------------------\n`;
      for (const pattern of patterns) {
        report += `Pattern: ${pattern.type} (${pattern.severity.toUpperCase()})\n`;
        report += `  Category: ${pattern.category}\n`;
        report += `  Count: ${pattern.count}\n`;
        
        if (pattern.resource) {
          report += `  Resource: ${pattern.resource}\n`;
        }
        
        if (pattern.ipAddress) {
          report += `  IP Address: ${pattern.ipAddress}\n`;
        }
        
        if (pattern.userId) {
          report += `  User ID: ${pattern.userId}\n`;
        }
        
        if (pattern.timeSpan) {
          report += `  Time Span: ${pattern.timeSpan}\n`;
        }
        
        report += '\n';
      }
    }
    
    // Suspicious events section
    if (suspiciousEvents.length > 0) {
      report += `SUSPICIOUS EVENTS\n----------------\n`;
      // Group by category
      const eventsByCategory = suspiciousEvents.reduce((categories, event) => {
        const category = event.category;
        if (!categories[category]) {
          categories[category] = [];
        }
        categories[category].push(event);
        return categories;
      }, {} as Record<string, any[]>);
      
      for (const [category, events] of Object.entries(eventsByCategory)) {
        report += `\n${category}:\n`;
        
        for (const event of events) {
          const time = event.timestamp.split('T')[1].substring(0, 8);
          report += `  [${time}] ${event.action || event.content.substring(0, 60)}...\n`;
          report += `    Reason: ${event.reason}\n`;
          report += `    Source: ${event.source}\n`;
          
          if (event.resource) {
            report += `    Resource: ${event.resource}\n`;
          }
          
          if (event.ipAddress) {
            report += `    IP: ${event.ipAddress}\n`;
          }
          
          if (event.userId) {
            report += `    User: ${event.userId}\n`;
          }
          
          report += '\n';
        }
      }
    }
    
    // Recommendations
    report += `RECOMMENDATIONS\n---------------\n`;
    
    if (alerts.length > 0) {
      report += `1. Investigate the ${alerts.length} high-severity security alerts identified in this report.\n`;
    } else {
      report += `1. No high-severity alerts were identified in this review period.\n`;
    }
    
    if (suspiciousEvents.length > 0) {
      report += `2. Review suspicious events, particularly in the following categories:\n`;
      for (const [category, count] of Object.entries(byCategory)) {
        if (count > 2) {
          report += `   - ${category} (${count} events)\n`;
        }
      }
    }
    
    report += `3. Next scheduled review: ${new Date(Date.now() + 24 * HOUR_MS).toISOString()}\n\n`;
    
    report += `End of Report\n`;
    
    // Write report to file
    fs.writeFileSync(reportPath, report);
    log(`Security review report generated: ${reportPath}`, 'security');
    
    return reportPath;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Error generating review report: ${errorMessage}`, 'security');
    return '';
  }
}