/**
 * Threat Database Service
 * 
 * Provides database persistence for threat-related data:
 * - Security threats storage and retrieval
 * - Detection rules management
 * - IP blocking persistence
 */

import { db } from '../../../db';
import { 
  securityThreats, 
  detectionRules, 
  blockedIps,
  SecurityThreat,
  DetectionRule,
  BlockedIp,
  InsertSecurityThreat,
  InsertDetectionRule,
  InsertBlockedIp
} from '../../../../shared/schema';
import { eq, and, sql, desc, asc, lt, gt, gte, lte, like } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// Type for threat detection data
export interface DetectedThreat extends Omit<InsertSecurityThreat, 'id'> {
  evidence?: Record<string, any>;
  action_taken?: Record<string, any>;
}

// Threat type enum
export type ThreatType = 
  'SQL_INJECTION' | 
  'XSS' | 
  'CSRF' | 
  'PATH_TRAVERSAL' | 
  'COMMAND_INJECTION' | 
  'FILE_UPLOAD' |
  'AUTHENTICATION_FAILURE' |
  'AUTHORIZATION_BYPASS' |
  'RATE_LIMIT_ABUSE' |
  'SUSPICIOUS_ACTIVITY' |
  'BRUTE_FORCE' |
  'DATA_LEAK' |
  'SUSPICIOUS_RESPONSE' |
  'PARAMETER_TAMPERING' |
  'API_ABUSE' |
  'OTHER';

// Threat severity enum
export type ThreatSeverity = 'low' | 'medium' | 'high' | 'critical';

// Date range parameters for queries
export interface DateRange {
  start?: Date;
  end?: Date;
}

// Filtering parameters for threat queries
export interface ThreatFilter {
  threatTypes?: ThreatType[];
  severities?: ThreatSeverity[];
  sourceIps?: string[];
  resolved?: boolean;
  dateRange?: DateRange;
  userId?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'severity' | 'threatType' | 'sourceIp';
  sortDirection?: 'asc' | 'desc';
}

// Filtering parameters for rule queries
export interface RuleFilter {
  threatTypes?: ThreatType[];
  severities?: ThreatSeverity[];
  enabled?: boolean;
  autoBlock?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'severity' | 'threatType' | 'created';
  sortDirection?: 'asc' | 'desc';
}

/**
 * Singleton service for handling threat database interactions
 */
class ThreatDatabaseService {
  /**
   * Report a security threat to the database
   * 
   * @param threat The threat to report
   * @returns The ID of the inserted threat
   */
  async reportThreat(threat: DetectedThreat): Promise<string> {
    const threatId = threat.threatId || uuidv4();
    
    try {
      // Insert the threat into the database
      await db.insert(securityThreats).values({
        ...threat,
        threatId,
        timestamp: new Date(),
        evidence: threat.evidence ? JSON.stringify(threat.evidence) : null,
        action_taken: threat.action_taken ? JSON.stringify(threat.action_taken) : null,
        resolved: false,
        isArchived: false
      });
      
      console.log(`[ThreatDB] Recorded threat ${threatId} (${threat.threatType}: ${threat.severity})`);
      return threatId;
    } catch (error) {
      console.error('Error reporting threat to database:', error);
      // Even if database insert fails, return ID so application can continue
      return threatId;
    }
  }
  
  /**
   * Get all recorded security threats with optional filtering
   * 
   * @param filter Filter parameters
   * @returns Array of security threats
   */
  async getThreats(filter: ThreatFilter = {}): Promise<SecurityThreat[]> {
    try {
      let query = db.select().from(securityThreats);
      
      // Apply filters
      const conditions = [];
      
      if (filter.resolved !== undefined) {
        conditions.push(eq(securityThreats.resolved, filter.resolved));
      }
      
      if (filter.userId) {
        conditions.push(eq(securityThreats.userId, filter.userId));
      }
      
      if (filter.threatTypes && filter.threatTypes.length > 0) {
        conditions.push(sql`${securityThreats.threatType} IN (${filter.threatTypes.join(',')})`);
      }
      
      if (filter.severities && filter.severities.length > 0) {
        conditions.push(sql`${securityThreats.severity} IN (${filter.severities.join(',')})`);
      }
      
      if (filter.sourceIps && filter.sourceIps.length > 0) {
        conditions.push(sql`${securityThreats.sourceIp} IN (${filter.sourceIps.join(',')})`);
      }
      
      if (filter.dateRange) {
        if (filter.dateRange.start) {
          conditions.push(gte(securityThreats.timestamp, filter.dateRange.start));
        }
        if (filter.dateRange.end) {
          conditions.push(lte(securityThreats.timestamp, filter.dateRange.end));
        }
      }
      
      // Apply all conditions
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      // Apply sorting
      if (filter.sortBy) {
        const sortColumn = {
          'timestamp': securityThreats.timestamp,
          'severity': securityThreats.severity,
          'threatType': securityThreats.threatType,
          'sourceIp': securityThreats.sourceIp
        }[filter.sortBy];
        
        if (sortColumn) {
          if (filter.sortDirection === 'asc') {
            query = query.orderBy(asc(sortColumn));
          } else {
            query = query.orderBy(desc(sortColumn));
          }
        }
      } else {
        // Default sort by timestamp desc
        query = query.orderBy(desc(securityThreats.timestamp));
      }
      
      // Apply pagination
      if (filter.limit) {
        query = query.limit(filter.limit);
      }
      
      if (filter.offset) {
        query = query.offset(filter.offset);
      }
      
      // Execute the query
      const threats = await query;
      
      // Parse JSON fields
      return threats.map(threat => ({
        ...threat,
        evidence: threat.evidence ? JSON.parse(threat.evidence as string) : null,
        action_taken: threat.action_taken ? JSON.parse(threat.action_taken as string) : null
      }));
    } catch (error) {
      console.error('Error getting threats from database:', error);
      return [];
    }
  }
  
  /**
   * Get a specific threat by ID
   * 
   * @param threatId The ID of the threat to retrieve
   * @returns The threat or null if not found
   */
  async getThreatById(threatId: string): Promise<SecurityThreat | null> {
    try {
      const threats = await db.select()
        .from(securityThreats)
        .where(eq(securityThreats.threatId, threatId))
        .limit(1);
      
      if (threats.length === 0) {
        return null;
      }
      
      const threat = threats[0];
      
      // Parse JSON fields
      return {
        ...threat,
        evidence: threat.evidence ? JSON.parse(threat.evidence as string) : null,
        action_taken: threat.action_taken ? JSON.parse(threat.action_taken as string) : null
      };
    } catch (error) {
      console.error(`Error getting threat ${threatId} from database:`, error);
      return null;
    }
  }
  
  /**
   * Mark a threat as resolved
   * 
   * @param threatId The ID of the threat to resolve
   * @param resolvedBy The ID of the user resolving the threat
   * @param notes Optional notes about resolution
   * @returns Whether the operation was successful
   */
  async resolveThreat(threatId: string, resolvedBy: string, notes?: string): Promise<boolean> {
    try {
      const actionTaken = {
        action: 'resolved',
        notes: notes || 'Marked as resolved',
        timestamp: new Date().toISOString()
      };
      
      await db.update(securityThreats)
        .set({
          resolved: true,
          resolvedBy,
          resolvedAt: new Date(),
          action_taken: JSON.stringify(actionTaken)
        })
        .where(eq(securityThreats.threatId, threatId));
      
      return true;
    } catch (error) {
      console.error(`Error resolving threat ${threatId}:`, error);
      return false;
    }
  }
  
  /**
   * Get threat count statistics
   * 
   * @param dateRange Optional date range for statistics
   * @returns Threat statistics by type and severity
   */
  async getThreatStats(dateRange?: DateRange): Promise<{
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    resolved: number;
    unresolved: number;
  }> {
    try {
      // Build conditions for date range filter
      const conditions = [];
      if (dateRange) {
        if (dateRange.start) {
          conditions.push(gte(securityThreats.timestamp, dateRange.start));
        }
        if (dateRange.end) {
          conditions.push(lte(securityThreats.timestamp, dateRange.end));
        }
      }
      
      // Get all threats that match conditions
      let query = db.select().from(securityThreats);
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      const threats = await query;
      
      // Calculate statistics
      const result = {
        total: threats.length,
        byType: {} as Record<string, number>,
        bySeverity: {} as Record<string, number>,
        resolved: 0,
        unresolved: 0
      };
      
      // Count by type and severity
      for (const threat of threats) {
        // Count by type
        if (!result.byType[threat.threatType]) {
          result.byType[threat.threatType] = 0;
        }
        result.byType[threat.threatType]++;
        
        // Count by severity
        if (!result.bySeverity[threat.severity]) {
          result.bySeverity[threat.severity] = 0;
        }
        result.bySeverity[threat.severity]++;
        
        // Count resolved/unresolved
        if (threat.resolved) {
          result.resolved++;
        } else {
          result.unresolved++;
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error getting threat statistics:', error);
      return {
        total: 0,
        byType: {},
        bySeverity: {},
        resolved: 0,
        unresolved: 0
      };
    }
  }
  
  /**
   * Create a new detection rule
   * 
   * @param rule The rule to create
   * @returns The ID of the created rule
   */
  async createRule(rule: Omit<InsertDetectionRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const ruleId = rule.ruleId || uuidv4();
    
    try {
      await db.insert(detectionRules).values({
        ...rule,
        ruleId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log(`[ThreatDB] Created rule ${ruleId}: ${rule.name}`);
      return ruleId;
    } catch (error) {
      console.error('Error creating detection rule:', error);
      return ruleId;
    }
  }
  
  /**
   * Update an existing detection rule
   * 
   * @param ruleId The ID of the rule to update
   * @param updates The fields to update
   * @returns Whether the operation was successful
   */
  async updateRule(ruleId: string, updates: Partial<Omit<DetectionRule, 'id' | 'ruleId' | 'createdAt'>>): Promise<boolean> {
    try {
      await db.update(detectionRules)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(detectionRules.ruleId, ruleId));
      
      return true;
    } catch (error) {
      console.error(`Error updating rule ${ruleId}:`, error);
      return false;
    }
  }
  
  /**
   * Delete a detection rule
   * 
   * @param ruleId The ID of the rule to delete
   * @returns Whether the operation was successful
   */
  async deleteRule(ruleId: string): Promise<boolean> {
    try {
      await db.delete(detectionRules)
        .where(eq(detectionRules.ruleId, ruleId));
      
      return true;
    } catch (error) {
      console.error(`Error deleting rule ${ruleId}:`, error);
      return false;
    }
  }
  
  /**
   * Get all detection rules with optional filtering
   * 
   * @param filter Filter parameters
   * @returns Array of detection rules
   */
  async getRules(filter: RuleFilter = {}): Promise<DetectionRule[]> {
    try {
      let query = db.select().from(detectionRules);
      
      // Apply filters
      const conditions = [];
      
      if (filter.enabled !== undefined) {
        conditions.push(eq(detectionRules.enabled, filter.enabled));
      }
      
      if (filter.autoBlock !== undefined) {
        conditions.push(eq(detectionRules.autoBlock, filter.autoBlock));
      }
      
      if (filter.threatTypes && filter.threatTypes.length > 0) {
        conditions.push(sql`${detectionRules.threatType} IN (${filter.threatTypes.join(',')})`);
      }
      
      if (filter.severities && filter.severities.length > 0) {
        conditions.push(sql`${detectionRules.severity} IN (${filter.severities.join(',')})`);
      }
      
      // Apply all conditions
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      // Apply sorting
      if (filter.sortBy) {
        const sortColumn = {
          'name': detectionRules.name,
          'severity': detectionRules.severity,
          'threatType': detectionRules.threatType,
          'created': detectionRules.createdAt
        }[filter.sortBy];
        
        if (sortColumn) {
          if (filter.sortDirection === 'asc') {
            query = query.orderBy(asc(sortColumn));
          } else {
            query = query.orderBy(desc(sortColumn));
          }
        }
      } else {
        // Default sort by name asc
        query = query.orderBy(asc(detectionRules.name));
      }
      
      // Apply pagination
      if (filter.limit) {
        query = query.limit(filter.limit);
      }
      
      if (filter.offset) {
        query = query.offset(filter.offset);
      }
      
      // Execute the query
      const rules = await query;
      return rules;
    } catch (error) {
      console.error('Error getting rules from database:', error);
      return [];
    }
  }
  
  /**
   * Block an IP address
   * 
   * @param ip The IP address to block
   * @param reason The reason for blocking
   * @param blockedBy The ID of the user who blocked the IP
   * @param duration Duration in seconds (optional, indefinite if not specified)
   * @returns Whether the operation was successful
   */
  async blockIp(ip: string, reason: string, duration?: number, blockedBy?: string): Promise<boolean> {
    try {
      // Calculate expiry time if duration is provided
      const expiresAt = duration ? new Date(Date.now() + duration * 1000) : null;
      
      // Check if IP is already blocked
      const existingBlocks = await db.select()
        .from(blockedIps)
        .where(eq(blockedIps.ip, ip))
        .limit(1);
      
      if (existingBlocks.length > 0) {
        // Update existing block
        await db.update(blockedIps)
          .set({
            reason,
            blockedBy: blockedBy || null,
            expiresAt,
            isActive: true
          })
          .where(eq(blockedIps.ip, ip));
      } else {
        // Create new block
        await db.insert(blockedIps).values({
          ip,
          reason,
          blockedBy: blockedBy || null,
          blockedAt: new Date(),
          expiresAt,
          isActive: true
        });
      }
      
      return true;
    } catch (error) {
      console.error(`Error blocking IP ${ip}:`, error);
      return false;
    }
  }
  
  /**
   * Unblock an IP address
   * 
   * @param ip The IP address to unblock
   * @returns Whether the operation was successful
   */
  async unblockIp(ip: string): Promise<boolean> {
    try {
      await db.update(blockedIps)
        .set({ isActive: false })
        .where(eq(blockedIps.ip, ip));
      
      return true;
    } catch (error) {
      console.error(`Error unblocking IP ${ip}:`, error);
      return false;
    }
  }
  
  /**
   * Check if an IP is blocked
   * 
   * @param ip The IP address to check
   * @returns Whether the IP is blocked
   */
  async isIpBlocked(ip: string): Promise<boolean> {
    try {
      // Get active blocks for this IP
      const blocks = await db.select()
        .from(blockedIps)
        .where(
          and(
            eq(blockedIps.ip, ip),
            eq(blockedIps.isActive, true),
            // Not expired or no expiry
            or(
              eq(blockedIps.expiresAt, null),
              gt(blockedIps.expiresAt, new Date())
            )
          )
        )
        .limit(1);
      
      return blocks.length > 0;
    } catch (error) {
      console.error(`Error checking if IP ${ip} is blocked:`, error);
      // Default to not blocked in case of error
      return false;
    }
  }
  
  /**
   * Get all blocked IPs
   * 
   * @param activeOnly Whether to only return active blocks
   * @param limit Maximum number of blocks to return
   * @param offset Offset for pagination
   * @returns Array of blocked IPs
   */
  async getBlockedIps(activeOnly = true, limit?: number, offset?: number): Promise<BlockedIp[]> {
    try {
      let query = db.select().from(blockedIps);
      
      if (activeOnly) {
        query = query.where(
          and(
            eq(blockedIps.isActive, true),
            // Not expired or no expiry
            or(
              eq(blockedIps.expiresAt, null),
              gt(blockedIps.expiresAt, new Date())
            )
          )
        );
      }
      
      // Sort by blocked date (most recent first)
      query = query.orderBy(desc(blockedIps.blockedAt));
      
      // Apply pagination
      if (limit) {
        query = query.limit(limit);
      }
      
      if (offset) {
        query = query.offset(offset);
      }
      
      return await query;
    } catch (error) {
      console.error('Error getting blocked IPs:', error);
      return [];
    }
  }
  
  /**
   * Clean up expired blocks
   * 
   * @returns Number of blocks cleaned up
   */
  async cleanupExpiredBlocks(): Promise<number> {
    try {
      const result = await db.update(blockedIps)
        .set({ isActive: false })
        .where(
          and(
            eq(blockedIps.isActive, true),
            lt(blockedIps.expiresAt, new Date())
          )
        );
      
      return result.rowCount || 0;
    } catch (error) {
      console.error('Error cleaning up expired blocks:', error);
      return 0;
    }
  }
  
  /**
   * Import default detection rules
   * 
   * @returns Whether the operation was successful
   */
  async importDefaultRules(): Promise<boolean> {
    try {
      const defaultRules: Omit<InsertDetectionRule, 'id' | 'createdAt' | 'updatedAt'>[] = [
        {
          ruleId: 'sql-injection-basic',
          name: 'Basic SQL Injection Detection',
          description: 'Detects common SQL injection patterns in request parameters',
          threatType: 'SQL_INJECTION',
          severity: 'high',
          pattern: "'\\s*(OR|AND)\\s+.*(--|#|'\\s*--)",
          threshold: null,
          timeWindow: null,
          autoBlock: true,
          autoNotify: true,
          enabled: true
        },
        {
          ruleId: 'xss-basic',
          name: 'Basic XSS Detection',
          description: 'Detects common cross-site scripting patterns',
          threatType: 'XSS',
          severity: 'medium',
          pattern: "<script>|javascript:|\\\\u003cscript|on(mouse|load|click)",
          threshold: null,
          timeWindow: null,
          autoBlock: true,
          autoNotify: true,
          enabled: true
        },
        {
          ruleId: 'path-traversal',
          name: 'Path Traversal Detection',
          description: 'Detects attempts to traverse directory paths',
          threatType: 'PATH_TRAVERSAL',
          severity: 'high',
          pattern: "\\.\\./|\\.\\./\\./|/\\.\\.\\.|\\\\\\.\\.\\\\",
          threshold: null,
          timeWindow: null,
          autoBlock: true,
          autoNotify: true,
          enabled: true
        },
        {
          ruleId: 'auth-brute-force',
          name: 'Authentication Brute Force',
          description: 'Detects multiple failed authentication attempts',
          threatType: 'BRUTE_FORCE',
          severity: 'medium',
          pattern: null,
          threshold: 5,
          timeWindow: 300, // 5 minutes
          autoBlock: true,
          autoNotify: true,
          enabled: true
        },
        {
          ruleId: 'rate-limit-abuse',
          name: 'Rate Limit Abuse',
          description: 'Detects attempts to bypass rate limits',
          threatType: 'RATE_LIMIT_ABUSE',
          severity: 'low',
          pattern: null,
          threshold: 10,
          timeWindow: 60, // 1 minute
          autoBlock: false,
          autoNotify: true,
          enabled: true
        }
      ];
      
      // Import each rule, skipping if it already exists
      for (const rule of defaultRules) {
        const existing = await db.select()
          .from(detectionRules)
          .where(eq(detectionRules.ruleId, rule.ruleId))
          .limit(1);
        
        if (existing.length === 0) {
          await this.createRule(rule);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error importing default rules:', error);
      return false;
    }
  }
}

// Export singleton instance
export const threatDatabaseService = new ThreatDatabaseService();