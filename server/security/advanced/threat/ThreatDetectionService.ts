/**
 * Threat Detection Service
 *
 * This service provides threat detection capabilities for the rate limiting system.
 * It maintains a list of suspicious IPs and identifiers, calculates threat scores,
 * and provides a global threat level.
 */

import { Request } from 'express';
import { log } from '../../../utils/logger';
import { recordAuditEvent } from '../../secureAuditTrail';

// Interface for threat score data
interface ThreatData {
  score: number;           // Current threat score (0-1)
  violations: number;      // Number of violations
  lastViolation: number;   // Timestamp of last violation
  firstViolation: number;  // Timestamp of first violation
  ipAddress?: string;      // IP address (for identifiers)
  userId?: string | number; // User ID (for identifiers)
}

class ThreatDetectionService {
  // Map of IP addresses to threat scores
  private ipThreats: Map<string, ThreatData> = new Map();
  
  // Map of identifiers to threat scores
  private identifierThreats: Map<string, ThreatData> = new Map();
  
  // Cache for resolved threat levels
  private threatLevelCache: Map<string, { level: number, timestamp: number }> = new Map();
  
  // Global threat level (0-1)
  private globalThreatLevel: number = 0;
  
  // Last time global threat level was recalculated
  private lastGlobalUpdate: number = Date.now();
  
  // Maximum age of threat data (24 hours)
  private maxThreatAge: number = 24 * 60 * 60 * 1000;
  
  // Violation Threshold for recording in audit trail
  private auditThreshold: number = 5;
  
  constructor() {
    // Set up periodic cleanup
    setInterval(() => this.clearOldThreats(), 30 * 60 * 1000); // Every 30 minutes
    
    // Set up periodic global threat level recalculation
    setInterval(() => this.recalculateGlobalThreatLevel(), 5 * 60 * 1000); // Every 5 minutes
  }
  
  /**
   * Record a violation from a specific identifier
   * 
   * @param identifier The identifier that violated rate limits
   * @param ipAddress Optional IP address to associate with the violation
   * @param userId Optional user ID to associate with the violation
   */
  public recordViolation(
    identifier: string, 
    ipAddress?: string, 
    userId?: string | number
  ): void {
    try {
      const now = Date.now();
      
      // Extract IP address from identifier if not provided directly
      if (!ipAddress && identifier.startsWith('ip:')) {
        ipAddress = identifier.substring(3);
      }
      
      // Extract user ID from identifier if not provided directly
      if (!userId && identifier.startsWith('user:')) {
        userId = identifier.substring(5);
      }
      
      // Record threat data for the identifier
      let threatData = this.identifierThreats.get(identifier);
      if (!threatData) {
        threatData = {
          score: 0.1, // Start with a small score
          violations: 0,
          lastViolation: now,
          firstViolation: now,
          ipAddress,
          userId
        };
        this.identifierThreats.set(identifier, threatData);
      }
      
      // Update threat data
      threatData.violations++;
      threatData.lastViolation = now;
      
      // Increase score based on violation frequency
      const violationFrequency = now - threatData.firstViolation;
      const violationsPerHour = (threatData.violations * 3600000) / Math.max(1, violationFrequency);
      
      // Higher violation frequency = higher score
      if (violationsPerHour > 10) {
        // More than 10 violations per hour
        threatData.score = Math.min(1.0, threatData.score + 0.1);
      } else if (violationsPerHour > 5) {
        // 5-10 violations per hour
        threatData.score = Math.min(1.0, threatData.score + 0.05);
      } else {
        // Fewer than 5 violations per hour
        threatData.score = Math.min(1.0, threatData.score + 0.02);
      }
      
      // Record in IP threats if we have an IP
      if (ipAddress) {
        let ipThreatData = this.ipThreats.get(ipAddress);
        if (!ipThreatData) {
          ipThreatData = {
            score: 0.1,
            violations: 0,
            lastViolation: now,
            firstViolation: now,
            userId
          };
          this.ipThreats.set(ipAddress, ipThreatData);
        }
        
        // Update IP threat data
        ipThreatData.violations++;
        ipThreatData.lastViolation = now;
        
        // Use same scoring algorithm for IP
        const ipViolationFrequency = now - ipThreatData.firstViolation;
        const ipViolationsPerHour = (ipThreatData.violations * 3600000) / Math.max(1, ipViolationFrequency);
        
        if (ipViolationsPerHour > 10) {
          ipThreatData.score = Math.min(1.0, ipThreatData.score + 0.1);
        } else if (ipViolationsPerHour > 5) {
          ipThreatData.score = Math.min(1.0, ipThreatData.score + 0.05);
        } else {
          ipThreatData.score = Math.min(1.0, ipThreatData.score + 0.02);
        }
      }
      
      // Clear cache entry for this identifier
      this.threatLevelCache.delete(identifier);
      if (ipAddress) {
        this.threatLevelCache.delete(`ip:${ipAddress}`);
      }
      
      // Record significant threats in audit log
      if (threatData.violations >= this.auditThreshold) {
        recordAuditEvent({
          timestamp: new Date().toISOString(),
          action: 'THREAT_DETECTED',
          resource: 'rate-limiting',
          result: 'warning',
          severity: threatData.score > 0.5 ? 'warning' : 'info',
          details: {
            identifier,
            ipAddress,
            userId: userId?.toString(),
            violations: threatData.violations,
            threatScore: threatData.score,
            violationsPerHour: violationsPerHour
          }
        });
      }
      
      // Recalculate global threat level if needed
      const timeSinceLastUpdate = now - this.lastGlobalUpdate;
      if (timeSinceLastUpdate > 300000) { // 5 minutes
        this.recalculateGlobalThreatLevel();
      }
    } catch (error) {
      log(`Error recording threat violation: ${error}`, 'security');
    }
  }
  
  /**
   * Get the threat level for a specific request
   * 
   * @param req The Express request
   * @param ip IP address to check
   * @param userId Optional user ID to check
   * @returns Threat level (0-1)
   */
  public getThreatLevel(req: Request, ip: string, userId?: string | number): number {
    try {
      const now = Date.now();
      
      // Create identifier based on available information
      const identifier = userId ? `user:${userId}` : `ip:${ip}`;
      
      // Check cache first
      const cachedThreat = this.threatLevelCache.get(identifier);
      if (cachedThreat && now - cachedThreat.timestamp < 60000) { // 1 minute cache
        return cachedThreat.level;
      }
      
      // Start with a base threat level
      let threatLevel = 0;
      
      // Check identifier threat
      const identifierThreat = this.identifierThreats.get(identifier);
      if (identifierThreat) {
        threatLevel = Math.max(threatLevel, identifierThreat.score);
      }
      
      // Check IP threat
      const ipThreat = this.ipThreats.get(ip);
      if (ipThreat) {
        threatLevel = Math.max(threatLevel, ipThreat.score);
      }
      
      // Check request-specific factors that might indicate threats
      
      // Suspicious headers
      const userAgent = req.headers['user-agent'] || '';
      if (!userAgent) {
        threatLevel = Math.max(threatLevel, 0.3); // Missing user agent
      } else if (userAgent.length < 10) {
        threatLevel = Math.max(threatLevel, 0.2); // Very short user agent
      }
      
      const acceptHeader = req.headers['accept'] || '';
      if (!acceptHeader) {
        threatLevel = Math.max(threatLevel, 0.1); // Missing accept header
      }
      
      // Cache the result
      this.threatLevelCache.set(identifier, {
        level: threatLevel,
        timestamp: now
      });
      
      return threatLevel;
    } catch (error) {
      log(`Error getting threat level: ${error}`, 'security');
      return 0;
    }
  }
  
  /**
   * Get the global threat level for the system
   * 
   * @returns Global threat level (0-1)
   */
  public getGlobalThreatLevel(): number {
    return this.globalThreatLevel;
  }
  
  /**
   * Recalculate the global threat level
   */
  private recalculateGlobalThreatLevel(): void {
    try {
      const now = Date.now();
      
      // Skip if no threats
      if (this.identifierThreats.size === 0 && this.ipThreats.size === 0) {
        this.globalThreatLevel = 0;
        this.lastGlobalUpdate = now;
        return;
      }
      
      // Count active high threats (last hour)
      const oneHourAgo = now - 60 * 60 * 1000;
      let highThreatCount = 0;
      let totalThreatScore = 0;
      
      // Count identifier threats
      for (const [_, threat] of this.identifierThreats.entries()) {
        if (threat.lastViolation >= oneHourAgo) {
          totalThreatScore += threat.score;
          if (threat.score > 0.5) {
            highThreatCount++;
          }
        }
      }
      
      // Count IP threats
      for (const [_, threat] of this.ipThreats.entries()) {
        if (threat.lastViolation >= oneHourAgo) {
          // We don't add to totalThreatScore here to avoid double counting
          if (threat.score > 0.7) {
            highThreatCount++;
          }
        }
      }
      
      // Calculate average threat score
      const totalThreats = this.identifierThreats.size;
      const avgThreatScore = totalThreats > 0 ? totalThreatScore / totalThreats : 0;
      
      // Calculate global threat level based on high threats and average scores
      let newGlobalThreatLevel = 0;
      
      if (highThreatCount > 10) {
        // Many high threats, very concerning
        newGlobalThreatLevel = 0.8 + (Math.min(highThreatCount, 100) - 10) / 90 * 0.2;
      } else if (highThreatCount > 5) {
        // Several high threats, concerning
        newGlobalThreatLevel = 0.6 + (highThreatCount - 5) / 5 * 0.2;
      } else if (highThreatCount > 0) {
        // Some high threats
        newGlobalThreatLevel = 0.3 + highThreatCount / 5 * 0.3;
      } else {
        // No high threats, use average score
        newGlobalThreatLevel = avgThreatScore * 0.3;
      }
      
      // Smooth transitions by blending with previous value
      this.globalThreatLevel = this.globalThreatLevel * 0.7 + newGlobalThreatLevel * 0.3;
      
      // Update last update time
      this.lastGlobalUpdate = now;
      
      // Log global threat level changes
      if (Math.abs(this.globalThreatLevel - newGlobalThreatLevel) > 0.1) {
        log(`Global threat level updated: ${this.globalThreatLevel.toFixed(2)}`, 'security');
      }
    } catch (error) {
      log(`Error recalculating global threat level: ${error}`, 'security');
    }
  }
  
  /**
   * Clear old threat data
   */
  public clearOldThreats(): void {
    try {
      const now = Date.now();
      
      // Clear old identifier threats
      for (const [identifier, threat] of this.identifierThreats.entries()) {
        if (now - threat.lastViolation > this.maxThreatAge) {
          this.identifierThreats.delete(identifier);
        }
      }
      
      // Clear old IP threats
      for (const [ip, threat] of this.ipThreats.entries()) {
        if (now - threat.lastViolation > this.maxThreatAge) {
          this.ipThreats.delete(ip);
        }
      }
      
      // Clear old cache entries
      for (const [key, cache] of this.threatLevelCache.entries()) {
        if (now - cache.timestamp > 3600000) { // 1 hour
          this.threatLevelCache.delete(key);
        }
      }
      
      // Log cleanup
      log(`Cleared old threat data. Remaining: ${this.identifierThreats.size} identifiers, ${this.ipThreats.size} IPs`, 'security');
    } catch (error) {
      log(`Error clearing old threats: ${error}`, 'security');
    }
  }
  
  /**
   * Explicitly clear suspicious IPs that are older than the specified threshold
   * 
   * @param ageThresholdMs Age threshold in milliseconds (default: 6 hours)
   */
  public clearOldSuspiciousIps(ageThresholdMs: number = 6 * 60 * 60 * 1000): void {
    try {
      const now = Date.now();
      const threshold = ageThresholdMs || this.maxThreatAge / 4; // Default to 1/4 of max age
      
      // Track how many were cleared
      let clearedCount = 0;
      
      // Clear old IP threats
      for (const [ip, threat] of this.ipThreats.entries()) {
        if (now - threat.lastViolation > threshold) {
          this.ipThreats.delete(ip);
          this.threatLevelCache.delete(`ip:${ip}`);
          clearedCount++;
        }
      }
      
      // Only log if something was cleared
      if (clearedCount > 0) {
        log(`Cleared ${clearedCount} suspicious IPs older than ${threshold / 3600000} hours`, 'security');
      }
    } catch (error) {
      log(`Error clearing old suspicious IPs: ${error}`, 'security');
    }
  }
  
  /**
   * Get statistics about threats
   * 
   * @returns Statistics about threats
   */
  public getStats(): any {
    try {
      const now = Date.now();
      const last10Minutes = now - 10 * 60 * 1000;
      const lastHour = now - 60 * 60 * 1000;
      const last24Hours = now - 24 * 60 * 60 * 1000;
      
      let threats10m = 0;
      let threats1h = 0;
      let threats24h = 0;
      let highThreats = 0;
      
      // Count recent threats by time period
      for (const [_, threat] of this.identifierThreats.entries()) {
        if (threat.lastViolation >= last10Minutes) {
          threats10m++;
        }
        
        if (threat.lastViolation >= lastHour) {
          threats1h++;
        }
        
        if (threat.lastViolation >= last24Hours) {
          threats24h++;
        }
        
        if (threat.score > 0.7) {
          highThreats++;
        }
      }
      
      // Get top threats (highest scores)
      const topThreats = Array.from(this.identifierThreats.entries())
        .sort((a, b) => b[1].score - a[1].score)
        .slice(0, 10)
        .map(([identifier, threat]) => ({
          identifier,
          score: threat.score,
          violations: threat.violations,
          lastViolation: new Date(threat.lastViolation).toISOString(),
          ipAddress: threat.ipAddress
        }));
      
      // Return statistics
      return {
        timestamp: new Date().toISOString(),
        globalThreatLevel: this.globalThreatLevel,
        totalIdentifierThreats: this.identifierThreats.size,
        totalIpThreats: this.ipThreats.size,
        recentThreats: {
          last10Minutes: threats10m,
          lastHour: threats1h,
          last24Hours: threats24h
        },
        highThreats,
        topThreats
      };
    } catch (error) {
      log(`Error getting threat stats: ${error}`, 'security');
      
      return {
        timestamp: new Date().toISOString(),
        error: 'Failed to get threat stats'
      };
    }
  }
}

// Create a singleton instance
export const threatDetectionService = new ThreatDetectionService();