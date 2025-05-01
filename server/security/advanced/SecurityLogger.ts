/**
 * Security Logger
 * 
 * This module provides a centralized logging mechanism for security events.
 * It handles different severity levels, categorization, and persistence of security logs.
 */

import { SecurityEventCategory, SecurityEventSeverity } from './SecurityFabric';

// Interface for security log data
export interface SecurityLogData {
  category: SecurityEventCategory;
  severity: SecurityEventSeverity;
  message: string;
  data?: Record<string, any>;
}

// Interface for a complete security log entry
export interface SecurityLogEntry extends SecurityLogData {
  id: string;
  timestamp: number;
  ip?: string;
  userId?: string;
}

// In-memory storage for security logs
const securityLogs: SecurityLogEntry[] = [];

// Maximum number of logs to keep in memory
const MAX_IN_MEMORY_LOGS = 1000;

/**
 * Generate a unique identifier for a log
 */
function generateLogId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Log a security event
 */
export function logSecurityEvent(data: SecurityLogData): void {
  const logEntry: SecurityLogEntry = {
    id: generateLogId(),
    timestamp: Date.now(),
    ...data
  };
  
  // Add to in-memory storage
  securityLogs.push(logEntry);
  
  // Keep the log size manageable
  if (securityLogs.length > MAX_IN_MEMORY_LOGS) {
    securityLogs.shift(); // Remove oldest log
  }
  
  // Log to console for development
  const severityColor = getSeverityColor(data.severity);
  console.log(
    `[${new Date(logEntry.timestamp).toISOString()}] ` +
    `[${severityColor}${data.severity}${resetColor}] ` +
    `[${getCategoryColor(data.category)}${data.category}${resetColor}] ` +
    `${data.message}`,
    data.data || {}
  );
  
  // In a production system, you would also:
  // 1. Send to a secure external logging service
  // 2. Write to an encrypted log file
  // 3. Log to a security information and event management (SIEM) system
}

// ANSI color codes for different severities
const resetColor = '\x1b[0m';
const redColor = '\x1b[31m';
const yellowColor = '\x1b[33m';
const blueColor = '\x1b[34m';
const magentaColor = '\x1b[35m';
const cyanColor = '\x1b[36m';
const greenColor = '\x1b[32m';

/**
 * Get color code for severity level
 */
function getSeverityColor(severity: SecurityEventSeverity): string {
  switch (severity) {
    case SecurityEventSeverity.CRITICAL:
    case SecurityEventSeverity.ERROR:
      return redColor;
    case SecurityEventSeverity.HIGH:
    case SecurityEventSeverity.WARNING:
      return yellowColor;
    case SecurityEventSeverity.MEDIUM:
      return magentaColor;
    case SecurityEventSeverity.LOW:
      return cyanColor;
    case SecurityEventSeverity.INFO:
      return greenColor;
    case SecurityEventSeverity.DEBUG:
      return blueColor;
    default:
      return resetColor;
  }
}

/**
 * Get color code for event category
 */
function getCategoryColor(category: SecurityEventCategory): string {
  switch (category) {
    case SecurityEventCategory.ATTACK_ATTEMPT:
    case SecurityEventCategory.THREAT_DETECTED:
      return redColor;
    case SecurityEventCategory.AUTHENTICATION:
    case SecurityEventCategory.AUTHORIZATION:
      return yellowColor;
    case SecurityEventCategory.API_SECURITY:
    case SecurityEventCategory.VALIDATION:
      return magentaColor;
    case SecurityEventCategory.SECURITY_INITIALIZATION:
    case SecurityEventCategory.SYSTEM_EVENT:
      return blueColor;
    case SecurityEventCategory.USER_ACTION:
    case SecurityEventCategory.ADMIN_ACTION:
      return greenColor;
    default:
      return cyanColor;
  }
}

/**
 * Query security logs with filtering
 */
export function querySecurityLogs(options: {
  category?: SecurityEventCategory;
  minSeverity?: SecurityEventSeverity;
  startTime?: number;
  endTime?: number;
  userId?: string;
  limit?: number;
  offset?: number;
}): {
  logs: SecurityLogEntry[];
  total: number;
} {
  const {
    category,
    minSeverity,
    startTime,
    endTime,
    userId,
    limit = 50,
    offset = 0
  } = options;
  
  // Filter logs based on criteria
  let filteredLogs = [...securityLogs];
  
  if (category) {
    filteredLogs = filteredLogs.filter(log => log.category === category);
  }
  
  if (minSeverity) {
    const severityLevels = Object.values(SecurityEventSeverity);
    const minSeverityIndex = severityLevels.indexOf(minSeverity);
    
    if (minSeverityIndex >= 0) {
      filteredLogs = filteredLogs.filter(log => {
        const logSeverityIndex = severityLevels.indexOf(log.severity);
        return logSeverityIndex <= minSeverityIndex;
      });
    }
  }
  
  if (startTime) {
    filteredLogs = filteredLogs.filter(log => log.timestamp >= startTime);
  }
  
  if (endTime) {
    filteredLogs = filteredLogs.filter(log => log.timestamp <= endTime);
  }
  
  if (userId) {
    filteredLogs = filteredLogs.filter(log => log.userId === userId);
  }
  
  // Sort by timestamp (newest first)
  filteredLogs.sort((a, b) => b.timestamp - a.timestamp);
  
  // Apply pagination
  const paginatedLogs = filteredLogs.slice(offset, offset + limit);
  
  return {
    logs: paginatedLogs,
    total: filteredLogs.length
  };
}

/**
 * Clear all security logs (for testing and development only)
 */
export function clearSecurityLogs(): void {
  securityLogs.length = 0;
  console.log('[SECURITY] Cleared all security logs');
}

/**
 * Get a count of logs by severity
 */
export function getLogsBySeverity(): Record<SecurityEventSeverity, number> {
  const counts = {} as Record<SecurityEventSeverity, number>;
  
  // Initialize counts
  Object.values(SecurityEventSeverity).forEach(severity => {
    counts[severity] = 0;
  });
  
  // Count logs by severity
  securityLogs.forEach(log => {
    counts[log.severity]++;
  });
  
  return counts;
}

/**
 * Get a count of logs by category
 */
export function getLogsByCategory(): Record<SecurityEventCategory, number> {
  const counts = {} as Record<SecurityEventCategory, number>;
  
  // Initialize counts
  Object.values(SecurityEventCategory).forEach(category => {
    counts[category] = 0;
  });
  
  // Count logs by category
  securityLogs.forEach(log => {
    counts[log.category]++;
  });
  
  return counts;
}

export default {
  logSecurityEvent,
  querySecurityLogs,
  clearSecurityLogs,
  getLogsBySeverity,
  getLogsByCategory
};