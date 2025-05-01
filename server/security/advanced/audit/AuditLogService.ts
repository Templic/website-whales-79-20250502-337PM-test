/**
 * Advanced Audit Logging Service
 * 
 * Provides comprehensive audit logging functionality to track
 * user actions, system events, and security-related activities.
 * 
 * Features:
 * - Detailed activity logging with user attribution
 * - Immutable audit trail for compliance requirements
 * - Categorized events for easy filtering and analysis
 * - Integration with security monitoring systems
 * - Support for export and report generation
 */

import { Request } from 'express';
import { createHash } from 'crypto';
import { logSecurityEvent } from '../SecurityLogger';
import { SecurityEventCategory, SecurityEventSeverity } from '../SecurityFabric';

// Define types for better type safety
export enum AuditAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  EXPORT = 'export',
  IMPORT = 'import',
  CONFIG_CHANGE = 'config_change',
  PERMISSION_CHANGE = 'permission_change',
  SECURITY_CHANGE = 'security_change',
  ADMIN_ACTION = 'admin_action',
  SYSTEM_EVENT = 'system_event'
}

export enum AuditCategory {
  USER = 'user',
  CONTENT = 'content',
  SYSTEM = 'system',
  SECURITY = 'security',
  DATA = 'data',
  CONFIGURATION = 'configuration',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  API = 'api'
}

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  userId: string | null;
  action: AuditAction;
  category: AuditCategory;
  resource: string;
  resourceId?: string;
  details: any;
  clientInfo: {
    ip: string;
    userAgent: string;
    referrer?: string;
  };
  meta: {
    immutableHash: string;
    previousEntryHash: string | null;
  };
}

// Store for audit logs - in production, use a database with proper indexing
let auditLogs: AuditLogEntry[] = [];
let lastEntryHash: string | null = null;

/**
 * Calculate a hash for an audit log entry to ensure immutability
 */
function calculateEntryHash(entry: Omit<AuditLogEntry, 'meta'>): string {
  const content = JSON.stringify(entry);
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Create a unique ID for an audit log entry
 */
function generateEntryId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * Log an audit event
 */
export function logAuditEvent(
  action: AuditAction,
  category: AuditCategory,
  resource: string,
  details: any,
  req: Request,
  userId?: string,
  resourceId?: string
): AuditLogEntry {
  const timestamp = Date.now();
  
  // Extract client information
  const clientInfo = {
    ip: req.ip,
    userAgent: req.headers['user-agent'] as string || 'Unknown',
    referrer: req.headers.referer as string
  };
  
  // Create the base entry without the meta field
  const baseEntry = {
    id: generateEntryId(),
    timestamp,
    userId: userId || (req.user?.id as string) || null,
    action,
    category,
    resource,
    resourceId,
    details,
    clientInfo
  };
  
  // Calculate the hash for this entry
  const immutableHash = calculateEntryHash(baseEntry);
  
  // Create the full entry with the meta field
  const entry: AuditLogEntry = {
    ...baseEntry,
    meta: {
      immutableHash,
      previousEntryHash: lastEntryHash
    }
  };
  
  // Update the last entry hash
  lastEntryHash = immutableHash;
  
  // Store the entry
  auditLogs.push(entry);
  
  // If this is a security-related event, also log it in the security log
  if (category === AuditCategory.SECURITY || 
      category === AuditCategory.AUTHENTICATION || 
      category === AuditCategory.AUTHORIZATION) {
    
    let severity = SecurityEventSeverity.INFO;
    
    // Determine severity based on action
    if (action === AuditAction.SECURITY_CHANGE || 
        action === AuditAction.PERMISSION_CHANGE) {
      severity = SecurityEventSeverity.MEDIUM;
    }
    
    logSecurityEvent({
      category: SecurityEventCategory.AUDIT,
      severity,
      message: `Audit: ${action} on ${resource}`,
      data: {
        auditId: entry.id,
        userId: entry.userId,
        action,
        category,
        resource,
        resourceId,
        details
      }
    });
  }
  
  return entry;
}

/**
 * Query audit logs with filtering
 */
export function queryAuditLogs(options: {
  userId?: string;
  action?: AuditAction | AuditAction[];
  category?: AuditCategory | AuditCategory[];
  resource?: string;
  resourceId?: string;
  startTime?: number;
  endTime?: number;
  limit?: number;
  offset?: number;
}): AuditLogEntry[] {
  let results = auditLogs;
  
  // Apply filters
  if (options.userId) {
    results = results.filter(entry => entry.userId === options.userId);
  }
  
  if (options.action) {
    const actions = Array.isArray(options.action) ? options.action : [options.action];
    results = results.filter(entry => actions.includes(entry.action));
  }
  
  if (options.category) {
    const categories = Array.isArray(options.category) ? options.category : [options.category];
    results = results.filter(entry => categories.includes(entry.category));
  }
  
  if (options.resource) {
    results = results.filter(entry => entry.resource === options.resource);
  }
  
  if (options.resourceId) {
    results = results.filter(entry => entry.resourceId === options.resourceId);
  }
  
  if (options.startTime) {
    results = results.filter(entry => entry.timestamp >= options.startTime);
  }
  
  if (options.endTime) {
    results = results.filter(entry => entry.timestamp <= options.endTime);
  }
  
  // Sort by timestamp (newest first)
  results = results.sort((a, b) => b.timestamp - a.timestamp);
  
  // Apply pagination
  if (options.offset || options.limit) {
    const offset = options.offset || 0;
    const limit = options.limit || results.length;
    results = results.slice(offset, offset + limit);
  }
  
  return results;
}

/**
 * Verify the integrity of the audit log chain
 */
export function verifyAuditLogIntegrity(): { valid: boolean; invalidEntries: string[] } {
  if (auditLogs.length === 0) {
    return { valid: true, invalidEntries: [] };
  }
  
  const invalidEntries: string[] = [];
  let expectedPreviousHash: string | null = null;
  
  // Iterate through the logs in reverse chronological order
  for (let i = auditLogs.length - 1; i >= 0; i--) {
    const entry = auditLogs[i];
    
    // Verify that the previous hash matches
    if (entry.meta.previousEntryHash !== expectedPreviousHash) {
      invalidEntries.push(entry.id);
    }
    
    // Verify the hash of the current entry
    const { meta, ...baseEntry } = entry;
    const calculatedHash = calculateEntryHash(baseEntry);
    
    if (calculatedHash !== entry.meta.immutableHash) {
      invalidEntries.push(entry.id);
    }
    
    expectedPreviousHash = entry.meta.immutableHash;
  }
  
  return {
    valid: invalidEntries.length === 0,
    invalidEntries
  };
}

/**
 * Clear audit logs - should only be used in development or with proper archiving
 */
export function clearAuditLogs(): void {
  auditLogs = [];
  lastEntryHash = null;
  
  logSecurityEvent({
    category: SecurityEventCategory.AUDIT,
    severity: SecurityEventSeverity.HIGH,
    message: 'Audit logs cleared',
    data: {}
  });
}

/**
 * Export audit logs for archiving or reporting
 */
export function exportAuditLogs(format: 'json' | 'csv' = 'json'): string {
  if (format === 'json') {
    return JSON.stringify(auditLogs);
  } else if (format === 'csv') {
    // Simple CSV export - in production, use a proper CSV library
    const headers = ['id', 'timestamp', 'userId', 'action', 'category', 'resource', 'resourceId', 'details', 'ip', 'userAgent'];
    const rows = auditLogs.map(entry => [
      entry.id,
      new Date(entry.timestamp).toISOString(),
      entry.userId || '',
      entry.action,
      entry.category,
      entry.resource,
      entry.resourceId || '',
      JSON.stringify(entry.details),
      entry.clientInfo.ip,
      entry.clientInfo.userAgent
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    return csvContent;
  }
  
  throw new Error(`Unsupported export format: ${format}`);
}

/**
 * Convenience function to log user actions
 */
export function logUserAction(
  userId: string,
  action: AuditAction,
  resource: string,
  details: any,
  req: Request,
  resourceId?: string
): AuditLogEntry {
  return logAuditEvent(action, AuditCategory.USER, resource, details, req, userId, resourceId);
}

/**
 * Convenience function to log content changes
 */
export function logContentChange(
  action: AuditAction,
  resource: string,
  details: any,
  req: Request,
  resourceId?: string
): AuditLogEntry {
  return logAuditEvent(action, AuditCategory.CONTENT, resource, details, req, req.user?.id as string, resourceId);
}

/**
 * Convenience function to log system events
 */
export function logSystemEvent(
  action: AuditAction,
  resource: string,
  details: any,
  req: Request
): AuditLogEntry {
  return logAuditEvent(action, AuditCategory.SYSTEM, resource, details, req);
}

export default {
  logAuditEvent,
  queryAuditLogs,
  verifyAuditLogIntegrity,
  clearAuditLogs,
  exportAuditLogs,
  logUserAction,
  logContentChange,
  logSystemEvent,
  AuditAction,
  AuditCategory
};