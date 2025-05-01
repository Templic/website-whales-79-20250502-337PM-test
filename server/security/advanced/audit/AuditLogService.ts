/**
 * Audit Log Service
 * 
 * Provides comprehensive, tamper-evident audit logging for
 * all security-sensitive operations and system events.
 * 
 * Features:
 * - Immutable audit trail with cryptographic verification
 * - Categorized audit events
 * - User action tracking
 * - Detailed contextual information
 * - Advanced filtering and search capabilities
 * - Compliance reporting
 */

import { createHash } from 'crypto';
import { Request } from 'express';
import { logSecurityEvent } from '../SecurityLogger';
import { SecurityEventCategory, SecurityEventSeverity } from '../SecurityFabric';

// Audit action types
export enum AuditAction {
  LOGIN = 'login',
  LOGOUT = 'logout',
  ACCOUNT_CREATED = 'account_created',
  ACCOUNT_UPDATED = 'account_updated',
  ACCOUNT_DELETED = 'account_deleted',
  ROLE_ASSIGNED = 'role_assigned',
  PASSWORD_CHANGED = 'password_changed',
  PASSWORD_RESET = 'password_reset',
  MFA_ENABLED = 'mfa_enabled',
  MFA_DISABLED = 'mfa_disabled',
  MFA_VERIFIED = 'mfa_verified',
  ACCESS_GRANTED = 'access_granted',
  ACCESS_DENIED = 'access_denied',
  SETTINGS_CHANGED = 'settings_changed',
  DATA_EXPORTED = 'data_exported',
  DATA_IMPORTED = 'data_imported',
  DATA_VIEWED = 'data_viewed',
  DATA_CREATED = 'data_created', 
  DATA_UPDATED = 'data_updated',
  DATA_DELETED = 'data_deleted',
  SYSTEM_UPDATED = 'system_updated',
  SYSTEM_ERROR = 'system_error',
  SCHEDULED_TASK = 'scheduled_task',
  API_ACCESSED = 'api_accessed',
  ADMIN_ACTION = 'admin_action',
  SECURITY_ALERT = 'security_alert',
  SECURITY_BLOCKED = 'security_blocked',
  SECURITY_CONFIG_CHANGED = 'security_config_changed',
  
  // Additional actions for CRUD operations
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  
  // Additional actions for security configuration
  SECURITY_CHANGE = 'security_change',
  PERMISSION_CHANGE = 'permission_change'
}

// Audit event categories
export enum AuditCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  USER_MANAGEMENT = 'user_management',
  DATA_ACCESS = 'data_access',
  SYSTEM = 'system',
  SECURITY = 'security',
  CONFIGURATION = 'configuration',
  API = 'api',
  CONTENT = 'content',
  ADMIN = 'admin'
}

// Audit log entry structure
export interface AuditLogEntry {
  id: string;
  timestamp: number;
  userId: string | null;
  action: AuditAction;
  category: AuditCategory;
  resource: string;
  resourceId: string;
  details: any;
  clientInfo: {
    ip: string;
    userAgent: string;
    deviceId?: string;
  };
  meta: {
    immutableHash: string;
    previousEntryHash: string | null;
  };
}

// In-memory audit log storage (would use a database in production)
const auditLogs: AuditLogEntry[] = [];
let lastAuditHash: string | null = null;

/**
 * Create cryptographic hash for an audit entry
 */
function createAuditHash(entry: Omit<AuditLogEntry, "meta">): string {
  const entryWithoutMeta = JSON.stringify({
    id: entry.id,
    timestamp: entry.timestamp,
    userId: entry.userId,
    action: entry.action,
    category: entry.category,
    resource: entry.resource,
    resourceId: entry.resourceId,
    details: entry.details,
    clientInfo: entry.clientInfo
  });

  return createHash('sha256')
    .update(entryWithoutMeta)
    .update(lastAuditHash || 'initial')
    .digest('hex');
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15) + 
         Date.now().toString(36);
}

/**
 * Create a new audit log entry
 */
export function createAuditLog(
  action: AuditAction,
  category: AuditCategory,
  resource: string,
  details: any,
  request?: Request,
  resourceId?: string,
  userId?: string | null
): AuditLogEntry {
  // Create the base audit entry
  const entry: Omit<AuditLogEntry, "meta"> = {
    id: generateId(),
    timestamp: Date.now(),
    userId: userId ?? (request?.user as any)?.id ?? null,
    action,
    category,
    resource,
    resourceId: resourceId ?? '',
    details,
    clientInfo: {
      ip: request?.ip ?? '0.0.0.0',
      userAgent: request?.headers['user-agent'] ?? 'Unknown',
      deviceId: request?.headers['x-device-id'] as string | undefined
    }
  };

  // Create cryptographic hash to ensure data integrity
  const immutableHash = createAuditHash(entry);
  
  // Create the complete entry with metadata
  const completeEntry: AuditLogEntry = {
    ...entry,
    meta: {
      immutableHash,
      previousEntryHash: lastAuditHash
    }
  };
  
  // Store the entry and update the last hash
  auditLogs.push(completeEntry);
  lastAuditHash = immutableHash;
  
  // Log a security event for critical audit actions
  if (
    category === AuditCategory.SECURITY || 
    action === AuditAction.ACCESS_DENIED ||
    action === AuditAction.SECURITY_ALERT
  ) {
    logSecurityEvent({
      category: SecurityEventCategory.AUDIT,
      severity: SecurityEventSeverity.INFO,
      message: `Security audit: ${action} on ${resource}`,
      data: {
        auditId: entry.id,
        action,
        category,
        resource,
        userId: entry.userId
      }
    });
  }
  
  return completeEntry;
}

/**
 * Convenience function to log an audit event
 */
export function logAuditEvent(
  action: AuditAction,
  category: AuditCategory,
  resource: string,
  details: any,
  request?: Request,
  resourceId?: string,
  userId?: string | null
): AuditLogEntry {
  return createAuditLog(action, category, resource, details, request, resourceId, userId);
}

/**
 * Verify the integrity of the audit log
 */
export function verifyAuditLogIntegrity(): {
  valid: boolean;
  invalidEntries: string[];
} {
  const invalidEntries: string[] = [];
  let prevHash: string | null = null;
  
  for (let i = 0; i < auditLogs.length; i++) {
    const entry = auditLogs[i];
    
    // Check that previousEntryHash matches the previous entry's hash
    if (entry.meta.previousEntryHash !== prevHash) {
      invalidEntries.push(entry.id);
    }
    
    // Check that the hash is correct for the entry's content
    const entryWithoutMeta = { ...entry };
    delete (entryWithoutMeta as any).meta;
    
    const calculatedHash = createHash('sha256')
      .update(JSON.stringify(entryWithoutMeta))
      .update(prevHash || 'initial')
      .digest('hex');
      
    if (calculatedHash !== entry.meta.immutableHash) {
      invalidEntries.push(entry.id);
    }
    
    prevHash = entry.meta.immutableHash;
  }
  
  return {
    valid: invalidEntries.length === 0,
    invalidEntries
  };
}

/**
 * Filter audit logs
 */
export function filterAuditLogs(options: {
  userId?: string;
  action?: AuditAction;
  category?: AuditCategory;
  resource?: string;
  resourceId?: string;
  startTime?: number;
  endTime?: number;
  limit?: number;
  offset?: number;
}): AuditLogEntry[] {
  let filtered = [...auditLogs];
  
  // Apply filters
  if (options.userId) {
    filtered = filtered.filter(entry => entry.userId === options.userId);
  }
  
  if (options.action) {
    filtered = filtered.filter(entry => entry.action === options.action);
  }
  
  if (options.category) {
    filtered = filtered.filter(entry => entry.category === options.category);
  }
  
  if (options.resource) {
    filtered = filtered.filter(entry => entry.resource === options.resource);
  }
  
  if (options.resourceId) {
    filtered = filtered.filter(entry => entry.resourceId === options.resourceId);
  }
  
  if (options.startTime) {
    filtered = filtered.filter(entry => entry.timestamp >= options.startTime!);
  }
  
  if (options.endTime) {
    filtered = filtered.filter(entry => entry.timestamp <= options.endTime!);
  }
  
  // Sort by timestamp (newest first)
  filtered = filtered.sort((a, b) => b.timestamp - a.timestamp);
  
  // Apply pagination
  if (options.offset || options.limit) {
    const offset = options.offset || 0;
    const limit = options.limit || filtered.length;
    filtered = filtered.slice(offset, offset + limit);
  }
  
  return filtered;
}

/**
 * Get a specific audit log entry by ID
 */
export function getAuditLogById(id: string): AuditLogEntry | undefined {
  return auditLogs.find(entry => entry.id === id);
}

/**
 * Get audit activity by user
 */
export function getUserActivity(userId: string, limit: number = 10): AuditLogEntry[] {
  return filterAuditLogs({ userId, limit });
}

/**
 * Generate a compliance report
 */
export function generateComplianceReport(
  category: AuditCategory,
  startDate: Date,
  endDate: Date
): {
  reportId: string;
  generatedAt: number;
  category: AuditCategory;
  startDate: number;
  endDate: number;
  totalEvents: number;
  eventsByAction: Record<string, number>;
  eventsByResource: Record<string, number>;
  eventsByUser: Record<string, number>;
  data: AuditLogEntry[];
} {
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();
  
  const filteredLogs = filterAuditLogs({
    category,
    startTime,
    endTime
  });
  
  // Count events by type
  const eventsByAction: Record<string, number> = {};
  const eventsByResource: Record<string, number> = {};
  const eventsByUser: Record<string, number> = {};
  
  for (const entry of filteredLogs) {
    // Count by action
    eventsByAction[entry.action] = (eventsByAction[entry.action] || 0) + 1;
    
    // Count by resource
    eventsByResource[entry.resource] = (eventsByResource[entry.resource] || 0) + 1;
    
    // Count by user
    const userKey = entry.userId || 'anonymous';
    eventsByUser[userKey] = (eventsByUser[userKey] || 0) + 1;
  }
  
  return {
    reportId: generateId(),
    generatedAt: Date.now(),
    category,
    startDate: startTime,
    endDate: endTime,
    totalEvents: filteredLogs.length,
    eventsByAction,
    eventsByResource,
    eventsByUser,
    data: filteredLogs
  };
}

/**
 * Query audit logs with filtering options
 * This is an alias for filterAuditLogs to match the API used in routes
 */
export function queryAuditLogs(options: {
  userId?: string;
  action?: AuditAction;
  category?: AuditCategory;
  resource?: string;
  resourceId?: string;
  startTime?: number;
  endTime?: number;
  limit?: number;
  offset?: number;
}): AuditLogEntry[] {
  return filterAuditLogs(options);
}

/**
 * Export audit logs for compliance reporting
 */
export function exportAuditLogs(
  category: AuditCategory,
  startDate: Date,
  endDate: Date,
  format: 'json' | 'csv' = 'json'
): { data: string; filename: string } {
  const report = generateComplianceReport(category, startDate, endDate);
  
  if (format === 'csv') {
    // Convert to CSV format
    const headers = ['id', 'timestamp', 'userId', 'action', 'category', 'resource', 'resourceId'];
    const rows = [headers];
    
    for (const entry of report.data) {
      rows.push([
        entry.id,
        new Date(entry.timestamp).toISOString(),
        entry.userId || 'anonymous',
        entry.action,
        entry.category,
        entry.resource,
        entry.resourceId
      ]);
    }
    
    const csvContent = rows.map(row => row.join(',')).join('\n');
    return {
      data: csvContent,
      filename: `audit_${category}_${new Date().toISOString()}.csv`
    };
  }
  
  // Default to JSON format
  return {
    data: JSON.stringify(report, null, 2),
    filename: `audit_${category}_${new Date().toISOString()}.json`
  };
}

export default {
  AuditAction,
  AuditCategory,
  logAuditEvent,
  createAuditLog,
  verifyAuditLogIntegrity,
  filterAuditLogs,
  getAuditLogById,
  getUserActivity,
  generateComplianceReport,
  queryAuditLogs,
  exportAuditLogs
};