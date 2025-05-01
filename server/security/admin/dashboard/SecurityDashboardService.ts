/**
 * Security Dashboard Service
 * 
 * Provides data and functionality for the Security Dashboard in the Admin Portal.
 * This service aggregates security metrics, events, and statistics from various
 * security components for display in the dashboard.
 * 
 * Features:
 * - Security metrics aggregation
 * - Threat detection statistics
 * - Vulnerability scanning results
 * - Security event visualization
 * - System health monitoring
 */

import { SecurityEventCategory, SecurityEventSeverity } from '../../advanced/SecurityFabric';
import { AuditAction, AuditCategory, filterAuditLogs } from '../../advanced/audit/AuditLogService';
import { getRuntimeStats } from '../../advanced/rasp/RuntimeProtection';

// Security metrics structure
export interface SecurityMetrics {
  totalRequests: number;
  blockedRequests: number;
  threatDetections: number;
  activeThreats: number;
  vulnerabilitiesDetected: number;
  securityScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

// Security event summary structure
export interface SecurityEventSummary {
  total: number;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
  recentEvents: Array<{
    id: string;
    category: string;
    severity: string;
    message: string;
    timestamp: number;
  }>;
}

// System health metrics structure
export interface SystemHealthMetrics {
  cpuUsage: number;
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  uptime: number;
  activeSessions: number;
  apiResponseTime: number;
  databaseConnectionStatus: 'healthy' | 'degraded' | 'failed';
}

// Mock data storage (in a real implementation, this would come from various sources)
let securityEvents: Array<{
  id: string;
  category: string;
  severity: string;
  message: string;
  timestamp: number;
  data?: any;
}> = [];

// Sample metrics (in a real implementation, these would be live metrics)
const metrics: SecurityMetrics = {
  totalRequests: 0,
  blockedRequests: 0,
  threatDetections: 0,
  activeThreats: 0,
  vulnerabilitiesDetected: 0,
  securityScore: 85,
  riskLevel: 'low'
};

// Update metrics periodically (for simulation)
setInterval(() => {
  // Increment request counters
  metrics.totalRequests += Math.floor(Math.random() * 5);
  
  // Random blocked requests (about 2% of total requests)
  if (Math.random() < 0.02) {
    metrics.blockedRequests++;
    
    // Log a security event for the blocked request
    logSecurityEvent(
      SecurityEventCategory.API_SECURITY,
      SecurityEventSeverity.MEDIUM,
      'Suspicious request blocked',
      { reason: 'Anomalous pattern detected' }
    );
  }
  
  // Random threat detections (very rare)
  if (Math.random() < 0.005) {
    metrics.threatDetections++;
    metrics.activeThreats = Math.max(0, metrics.activeThreats + (Math.random() < 0.7 ? 1 : -1));
    
    // Log a security event for the threat detection
    logSecurityEvent(
      SecurityEventCategory.THREAT_DETECTED,
      SecurityEventSeverity.HIGH,
      'Potential security threat detected',
      { threatType: 'Unusual access pattern', mitigated: Math.random() < 0.5 }
    );
  }
  
  // Calculate security score based on ratio of blocked/total and active threats
  const blockRatio = metrics.totalRequests > 0 ? metrics.blockedRequests / metrics.totalRequests : 0;
  metrics.securityScore = Math.round(100 - (blockRatio * 100) - (metrics.activeThreats * 5));
  
  // Determine risk level based on security score
  if (metrics.securityScore >= 90) metrics.riskLevel = 'low';
  else if (metrics.securityScore >= 70) metrics.riskLevel = 'medium';
  else if (metrics.securityScore >= 50) metrics.riskLevel = 'high';
  else metrics.riskLevel = 'critical';
  
}, 30000); // Update every 30 seconds

/**
 * Log a security event to the dashboard
 */
export function logSecurityEvent(
  category: SecurityEventCategory,
  severity: SecurityEventSeverity,
  message: string,
  data?: any
): void {
  const event = {
    id: Math.random().toString(36).substring(2, 15),
    category,
    severity,
    message,
    timestamp: Date.now(),
    data
  };
  
  // Add to events collection (limit to 1000 most recent events)
  securityEvents.unshift(event);
  if (securityEvents.length > 1000) {
    securityEvents = securityEvents.slice(0, 1000);
  }
}

/**
 * Get current security metrics
 */
export function getSecurityMetrics(): SecurityMetrics {
  return { ...metrics };
}

/**
 * Get summarized security events
 */
export function getSecurityEvents(limit: number = 10): SecurityEventSummary {
  const byCategory: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};
  
  // Count events by category and severity
  securityEvents.forEach(event => {
    byCategory[event.category] = (byCategory[event.category] || 0) + 1;
    bySeverity[event.severity] = (bySeverity[event.severity] || 0) + 1;
  });
  
  return {
    total: securityEvents.length,
    byCategory,
    bySeverity,
    recentEvents: securityEvents.slice(0, limit)
  };
}

/**
 * Get system health metrics
 */
export function getSystemHealth(): SystemHealthMetrics {
  const memoryUsage = process.memoryUsage();
  
  return {
    cpuUsage: Math.random() * 30 + 10, // Simulated CPU usage between 10-40%
    memoryUsage: {
      rss: memoryUsage.rss,
      heapTotal: memoryUsage.heapTotal,
      heapUsed: memoryUsage.heapUsed,
      external: memoryUsage.external
    },
    uptime: process.uptime(),
    activeSessions: Math.floor(Math.random() * 50) + 10, // Simulated active sessions
    apiResponseTime: Math.random() * 200 + 50, // Simulated API response time 50-250ms
    databaseConnectionStatus: 'healthy' // Simulated database status
  };
}

/**
 * Get vulnerability assessment results
 */
export function getVulnerabilityAssessment(): {
  lastScanTime: number;
  vulnerabilitiesFound: number;
  criticalVulnerabilities: number;
  highVulnerabilities: number;
  mediumVulnerabilities: number;
  lowVulnerabilities: number;
  categories: Record<string, number>;
} {
  return {
    lastScanTime: Date.now() - Math.floor(Math.random() * 86400000), // Random time within last 24 hours
    vulnerabilitiesFound: metrics.vulnerabilitiesDetected,
    criticalVulnerabilities: Math.floor(metrics.vulnerabilitiesDetected * 0.1),
    highVulnerabilities: Math.floor(metrics.vulnerabilitiesDetected * 0.2),
    mediumVulnerabilities: Math.floor(metrics.vulnerabilitiesDetected * 0.3),
    lowVulnerabilities: Math.floor(metrics.vulnerabilitiesDetected * 0.4),
    categories: {
      'Outdated Dependencies': Math.floor(metrics.vulnerabilitiesDetected * 0.3),
      'Configuration Issues': Math.floor(metrics.vulnerabilitiesDetected * 0.25),
      'Input Validation': Math.floor(metrics.vulnerabilitiesDetected * 0.2),
      'Authentication': Math.floor(metrics.vulnerabilitiesDetected * 0.15),
      'Other': Math.floor(metrics.vulnerabilitiesDetected * 0.1)
    }
  };
}

/**
 * Get runtime security stats
 */
export function getRuntimeSecurityStats(): any {
  // Get runtime stats from RASP
  const raspStats = getRuntimeStats();
  
  return {
    ...raspStats,
    monitoredFunctions: Object.keys(raspStats.functionCalls).length,
    monitoredModules: raspStats.moduleIntegrity.monitoredModules.length,
    memoryProtection: {
      currentUsage: raspStats.memory.heapUsed / (1024 * 1024), // MB
      totalHeap: raspStats.memory.heapTotal / (1024 * 1024), // MB
      rss: raspStats.memory.rss / (1024 * 1024) // MB
    }
  };
}

/**
 * Get audit activity summary
 */
export function getAuditActivitySummary(): {
  totalEvents: number;
  authenticationEvents: number;
  dataAccessEvents: number;
  adminActionEvents: number;
  byActionType: Record<string, number>;
} {
  // Get audit logs for the last 24 hours
  const oneDayAgo = Date.now() - 86400000;
  const recentLogs = filterAuditLogs({
    startTime: oneDayAgo
  });
  
  // Count events by category
  const authenticationEvents = recentLogs.filter(log => 
    log.category === AuditCategory.AUTHENTICATION
  ).length;
  
  const dataAccessEvents = recentLogs.filter(log => 
    log.category === AuditCategory.DATA_ACCESS
  ).length;
  
  const adminActionEvents = recentLogs.filter(log => 
    log.category === AuditCategory.ADMIN
  ).length;
  
  // Count events by action type
  const byActionType: Record<string, number> = {};
  recentLogs.forEach(log => {
    byActionType[log.action] = (byActionType[log.action] || 0) + 1;
  });
  
  return {
    totalEvents: recentLogs.length,
    authenticationEvents,
    dataAccessEvents,
    adminActionEvents,
    byActionType
  };
}

/**
 * Get complete dashboard data
 */
export function getDashboardData(): {
  metrics: SecurityMetrics;
  events: SecurityEventSummary;
  systemHealth: SystemHealthMetrics;
  vulnerabilities: ReturnType<typeof getVulnerabilityAssessment>;
  runtimeSecurity: ReturnType<typeof getRuntimeSecurityStats>;
  auditActivity: ReturnType<typeof getAuditActivitySummary>;
} {
  return {
    metrics: getSecurityMetrics(),
    events: getSecurityEvents(10),
    systemHealth: getSystemHealth(),
    vulnerabilities: getVulnerabilityAssessment(),
    runtimeSecurity: getRuntimeSecurityStats(),
    auditActivity: getAuditActivitySummary()
  };
}

export default {
  logSecurityEvent,
  getSecurityMetrics,
  getSecurityEvents,
  getSystemHealth,
  getVulnerabilityAssessment,
  getRuntimeSecurityStats,
  getAuditActivitySummary,
  getDashboardData
};