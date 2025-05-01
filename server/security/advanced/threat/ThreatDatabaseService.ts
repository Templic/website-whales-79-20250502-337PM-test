/**
 * Threat Database Service
 * 
 * Provides database persistence for the threat detection system.
 * Handles CRUD operations for security threats, detection rules, and blocked IPs.
 */

import { db } from '../../../db';
import { 
  securityThreats, detectionRules, blockedIps,
  type SecurityThreat, type InsertSecurityThreat,
  type DetectionRule, type InsertDetectionRule,
  type BlockedIp, type InsertBlockedIp
} from '../../../../shared/schema';
import { eq, and, desc, gte, lte, count, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// Type definitions for service interfaces
export type ThreatType = 'sql_injection' | 'xss' | 'csrf' | 'brute_force' | 'rate_limit' | 'auth_bypass' | 'path_traversal' | 'malicious_file' | 'suspicious_activity' | 'data_leak' | 'unauthorized_access' | 'session_hijacking' | 'insider_threat' | 'ddos' | 'other';
export type ThreatSeverity = 'low' | 'medium' | 'high' | 'critical';

// Extend DetectedThreat type to match database schema
export interface DetectedThreat extends Omit<SecurityThreat, 'id'> {
  evidence?: Record<string, any>;
  actionTaken?: string[];
}

// Enums for rule configuration
export enum BlockAction {
  NONE = 'none',
  TEMPORARY = 'temporary',
  PERMANENT = 'permanent'
}

export class ThreatDatabaseService {
  /**
   * Save a detected threat to the database
   */
  async saveThreat(threat: DetectedThreat): Promise<SecurityThreat> {
    try {
      // Ensure threat has an ID
      if (!threat.threatId) {
        threat.threatId = `threat_${nanoid(12)}`;
      }

      const [savedThreat] = await db.insert(securityThreats).values({
        threatId: threat.threatId,
        timestamp: new Date(threat.timestamp || Date.now()),
        threatType: threat.threatType,
        severity: threat.severity,
        description: threat.description,
        sourceIp: threat.sourceIp,
        userId: threat.userId,
        requestPath: threat.requestPath,
        requestMethod: threat.requestMethod,
        evidence: threat.evidence as any,
        ruleId: threat.ruleId,
        actionTaken: threat.actionTaken as any,
        resolved: threat.resolved || false,
        resolvedBy: threat.resolvedBy,
        resolvedAt: threat.resolvedAt ? new Date(threat.resolvedAt) : null,
        isArchived: threat.isArchived || false
      }).returning();

      return savedThreat;
    } catch (error) {
      console.error("Error saving threat to database:", error);
      throw error;
    }
  }

  /**
   * Get threats from the database with pagination and filtering
   */
  async getThreats(
    options: {
      limit?: number, 
      offset?: number, 
      includeArchived?: boolean,
      fromDate?: Date,
      toDate?: Date,
      severity?: ThreatSeverity,
      threatType?: ThreatType,
      resolved?: boolean,
      sourceIp?: string,
      userId?: string
    } = {}
  ): Promise<SecurityThreat[]> {
    try {
      const { 
        limit = 100,
        offset = 0,
        includeArchived = false,
        fromDate,
        toDate,
        severity,
        threatType,
        resolved,
        sourceIp,
        userId
      } = options;

      // Build where conditions
      const conditions = [];

      if (!includeArchived) {
        conditions.push(eq(securityThreats.isArchived, false));
      }

      if (fromDate) {
        conditions.push(gte(securityThreats.timestamp, fromDate));
      }

      if (toDate) {
        conditions.push(lte(securityThreats.timestamp, toDate));
      }

      if (severity) {
        conditions.push(eq(securityThreats.severity, severity));
      }

      if (threatType) {
        conditions.push(eq(securityThreats.threatType, threatType));
      }

      if (resolved !== undefined) {
        conditions.push(eq(securityThreats.resolved, resolved));
      }

      if (sourceIp) {
        conditions.push(eq(securityThreats.sourceIp, sourceIp));
      }

      if (userId) {
        conditions.push(eq(securityThreats.userId, userId));
      }

      // Build query with where conditions
      const query = conditions.length > 0
        ? db.select().from(securityThreats).where(and(...conditions))
        : db.select().from(securityThreats);

      // Add ordering, limit and offset
      return await query
        .orderBy(desc(securityThreats.timestamp))
        .offset(offset)
        .limit(limit);
    } catch (error) {
      console.error("Error retrieving threats from database:", error);
      throw error;
    }
  }

  /**
   * Count threats based on criteria
   */
  async countThreats(
    options: {
      includeArchived?: boolean,
      fromDate?: Date,
      toDate?: Date,
      severity?: ThreatSeverity,
      threatType?: ThreatType,
      resolved?: boolean,
      sourceIp?: string,
      userId?: string
    } = {}
  ): Promise<number> {
    try {
      const { 
        includeArchived = false,
        fromDate,
        toDate,
        severity,
        threatType,
        resolved,
        sourceIp,
        userId
      } = options;

      // Build where conditions
      const conditions = [];

      if (!includeArchived) {
        conditions.push(eq(securityThreats.isArchived, false));
      }

      if (fromDate) {
        conditions.push(gte(securityThreats.timestamp, fromDate));
      }

      if (toDate) {
        conditions.push(lte(securityThreats.timestamp, toDate));
      }

      if (severity) {
        conditions.push(eq(securityThreats.severity, severity));
      }

      if (threatType) {
        conditions.push(eq(securityThreats.threatType, threatType));
      }

      if (resolved !== undefined) {
        conditions.push(eq(securityThreats.resolved, resolved));
      }

      if (sourceIp) {
        conditions.push(eq(securityThreats.sourceIp, sourceIp));
      }

      if (userId) {
        conditions.push(eq(securityThreats.userId, userId));
      }

      // Build query with where conditions
      const query = conditions.length > 0
        ? db.select({ count: count() }).from(securityThreats).where(and(...conditions))
        : db.select({ count: count() }).from(securityThreats);

      const result = await query;
      return result[0]?.count || 0;
    } catch (error) {
      console.error("Error counting threats:", error);
      return 0;
    }
  }

  /**
   * Get threat by ID
   */
  async getThreatById(threatId: string): Promise<SecurityThreat | undefined> {
    try {
      const [threat] = await db.select().from(securityThreats).where(eq(securityThreats.threatId, threatId));
      return threat;
    } catch (error) {
      console.error(`Error retrieving threat ${threatId}:`, error);
      return undefined;
    }
  }

  /**
   * Resolve a threat
   */
  async resolveThreat(threatId: string, resolvedBy: string): Promise<SecurityThreat | undefined> {
    try {
      const [updatedThreat] = await db.update(securityThreats)
        .set({
          resolved: true,
          resolvedBy,
          resolvedAt: new Date()
        })
        .where(eq(securityThreats.threatId, threatId))
        .returning();
      
      return updatedThreat;
    } catch (error) {
      console.error(`Error resolving threat ${threatId}:`, error);
      return undefined;
    }
  }

  /**
   * Archive a threat
   */
  async archiveThreat(threatId: string): Promise<SecurityThreat | undefined> {
    try {
      const [updatedThreat] = await db.update(securityThreats)
        .set({
          isArchived: true
        })
        .where(eq(securityThreats.threatId, threatId))
        .returning();
      
      return updatedThreat;
    } catch (error) {
      console.error(`Error archiving threat ${threatId}:`, error);
      return undefined;
    }
  }

  /**
   * Update a threat's action taken
   */
  async updateThreatAction(threatId: string, action: string): Promise<SecurityThreat | undefined> {
    try {
      // First get current threat to merge actions
      const [threat] = await db.select().from(securityThreats).where(eq(securityThreats.threatId, threatId));
      
      if (!threat) {
        return undefined;
      }

      // Update with merged actions
      const currentActions = (threat.actionTaken as string[]) || [];
      const newActions = [...currentActions, action];
      
      const [updatedThreat] = await db.update(securityThreats)
        .set({
          actionTaken: newActions as any
        })
        .where(eq(securityThreats.threatId, threatId))
        .returning();
      
      return updatedThreat;
    } catch (error) {
      console.error(`Error updating threat action for ${threatId}:`, error);
      return undefined;
    }
  }

  /**
   * Get threat statistics
   */
  async getThreatStatistics(): Promise<Record<string, any>> {
    try {
      // Last 24 hours
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      // Get totals by severity
      const severityCounts = await db
        .select({
          severity: securityThreats.severity,
          count: count()
        })
        .from(securityThreats)
        .where(gte(securityThreats.timestamp, last24Hours))
        .groupBy(securityThreats.severity);
      
      // Get totals by type
      const typeCounts = await db
        .select({
          type: securityThreats.threatType,
          count: count()
        })
        .from(securityThreats)
        .where(gte(securityThreats.timestamp, last24Hours))
        .groupBy(securityThreats.threatType);
      
      // Get resolved vs unresolved
      const resolutionStatus = await db
        .select({
          resolved: securityThreats.resolved,
          count: count()
        })
        .from(securityThreats)
        .where(gte(securityThreats.timestamp, last24Hours))
        .groupBy(securityThreats.resolved);
      
      // Format results
      const severityMap = severityCounts.reduce((acc, curr) => {
        acc[curr.severity] = curr.count;
        return acc;
      }, {} as Record<string, number>);
      
      const typeMap = typeCounts.reduce((acc, curr) => {
        acc[curr.type] = curr.count;
        return acc;
      }, {} as Record<string, number>);
      
      const resolvedCount = resolutionStatus.find(item => item.resolved)?.count || 0;
      const unresolvedCount = resolutionStatus.find(item => !item.resolved)?.count || 0;
      
      return {
        last24Hours: {
          critical: severityMap['critical'] || 0,
          high: severityMap['high'] || 0,
          medium: severityMap['medium'] || 0,
          low: severityMap['low'] || 0,
          byType: typeMap,
          resolved: resolvedCount,
          unresolved: unresolvedCount,
          total: resolvedCount + unresolvedCount
        }
      };
    } catch (error) {
      console.error("Error getting threat statistics:", error);
      return {};
    }
  }

  /**
   * Save a detection rule to the database
   */
  async saveRule(rule: Omit<DetectionRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<DetectionRule> {
    try {
      // Ensure rule has an ID
      if (!rule.ruleId) {
        rule.ruleId = `rule_${nanoid(12)}`;
      }

      const [savedRule] = await db.insert(detectionRules).values({
        ruleId: rule.ruleId,
        name: rule.name,
        description: rule.description,
        threatType: rule.threatType,
        severity: rule.severity,
        pattern: rule.pattern,
        threshold: rule.threshold,
        timeWindow: rule.timeWindow,
        autoBlock: rule.autoBlock || false,
        autoNotify: rule.autoNotify || false,
        enabled: rule.enabled !== undefined ? rule.enabled : true
      }).returning();

      return savedRule;
    } catch (error) {
      console.error("Error saving rule to database:", error);
      throw error;
    }
  }

  /**
   * Get all detection rules
   */
  async getRules(enabled?: boolean): Promise<DetectionRule[]> {
    try {
      if (enabled !== undefined) {
        return await db.select().from(detectionRules).where(eq(detectionRules.enabled, enabled));
      }
      return await db.select().from(detectionRules);
    } catch (error) {
      console.error("Error retrieving rules from database:", error);
      return [];
    }
  }

  /**
   * Get rule by ID
   */
  async getRuleById(ruleId: string): Promise<DetectionRule | undefined> {
    try {
      const [rule] = await db.select().from(detectionRules).where(eq(detectionRules.ruleId, ruleId));
      return rule;
    } catch (error) {
      console.error(`Error retrieving rule ${ruleId}:`, error);
      return undefined;
    }
  }

  /**
   * Update a rule
   */
  async updateRule(ruleId: string, updates: Partial<Omit<DetectionRule, 'id' | 'ruleId' | 'createdAt' | 'updatedAt'>>): Promise<DetectionRule | undefined> {
    try {
      // Add updated timestamp
      const updateData = {
        ...updates,
        updatedAt: new Date()
      };

      const [updatedRule] = await db.update(detectionRules)
        .set(updateData)
        .where(eq(detectionRules.ruleId, ruleId))
        .returning();
      
      return updatedRule;
    } catch (error) {
      console.error(`Error updating rule ${ruleId}:`, error);
      return undefined;
    }
  }

  /**
   * Delete a rule
   */
  async deleteRule(ruleId: string): Promise<boolean> {
    try {
      const result = await db.delete(detectionRules).where(eq(detectionRules.ruleId, ruleId));
      return true;
    } catch (error) {
      console.error(`Error deleting rule ${ruleId}:`, error);
      return false;
    }
  }

  /**
   * Enable/disable a rule
   */
  async setRuleEnabled(ruleId: string, enabled: boolean): Promise<DetectionRule | undefined> {
    try {
      const [updatedRule] = await db.update(detectionRules)
        .set({
          enabled,
          updatedAt: new Date()
        })
        .where(eq(detectionRules.ruleId, ruleId))
        .returning();
      
      return updatedRule;
    } catch (error) {
      console.error(`Error ${enabled ? 'enabling' : 'disabling'} rule ${ruleId}:`, error);
      return undefined;
    }
  }

  /**
   * Add a blocked IP
   */
  async addBlockedIp(ip: string, reason: string, blockedBy?: string, expiresAt?: Date): Promise<BlockedIp> {
    try {
      const [blockedIp] = await db.insert(blockedIps).values({
        ip,
        reason,
        blockedBy,
        expiresAt,
        isActive: true
      }).returning();

      return blockedIp;
    } catch (error) {
      console.error(`Error blocking IP ${ip}:`, error);
      throw error;
    }
  }

  /**
   * Get all blocked IPs
   */
  async getBlockedIps(activeOnly: boolean = true): Promise<BlockedIp[]> {
    try {
      // If activeOnly is true, also filter out expired blocks
      if (activeOnly) {
        const now = new Date();
        return await db.select().from(blockedIps).where(
          and(
            eq(blockedIps.isActive, true),
            // Either expiresAt is null (permanent block) or it's in the future
            sql`(${blockedIps.expiresAt} IS NULL OR ${blockedIps.expiresAt} > ${now})`
          )
        );
      }
      
      return await db.select().from(blockedIps);
    } catch (error) {
      console.error("Error retrieving blocked IPs from database:", error);
      return [];
    }
  }

  /**
   * Check if an IP is blocked
   */
  async isIpBlocked(ip: string): Promise<boolean> {
    try {
      const now = new Date();
      const [blockedIp] = await db.select().from(blockedIps).where(
        and(
          eq(blockedIps.ip, ip),
          eq(blockedIps.isActive, true),
          // Either expiresAt is null (permanent block) or it's in the future
          sql`(${blockedIps.expiresAt} IS NULL OR ${blockedIps.expiresAt} > ${now})`
        )
      );
      
      return !!blockedIp;
    } catch (error) {
      console.error(`Error checking if IP ${ip} is blocked:`, error);
      return false;
    }
  }

  /**
   * Unblock an IP
   */
  async unblockIp(ip: string): Promise<boolean> {
    try {
      await db.update(blockedIps)
        .set({
          isActive: false
        })
        .where(eq(blockedIps.ip, ip));
      
      return true;
    } catch (error) {
      console.error(`Error unblocking IP ${ip}:`, error);
      return false;
    }
  }

  /**
   * Clean up expired blocks
   */
  async cleanupExpiredBlocks(): Promise<number> {
    try {
      const now = new Date();
      const result = await db.update(blockedIps)
        .set({
          isActive: false
        })
        .where(
          and(
            eq(blockedIps.isActive, true),
            lte(blockedIps.expiresAt, now)
          )
        );
      
      // Return number of updated rows
      return result.rowCount || 0;
    } catch (error) {
      console.error("Error cleaning up expired blocks:", error);
      return 0;
    }
  }
}

// Create singleton instance
export const threatDbService = new ThreatDatabaseService();