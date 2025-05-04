/**
 * Threat Detection Service
 *
 * This service identifies and tracks suspicious activity
 * to inform rate limiting decisions.
 */

import { Request } from 'express';
import { log } from '../../../utils/logger';
import { getClientIp, getIpSubnet } from '../../../utils/ip-utils';
import { recordAuditEvent } from '../../secureAuditTrail';

// Threat level thresholds
const THREAT_LEVEL_LOW = 0.3;
const THREAT_LEVEL_MEDIUM = 0.6;
const THREAT_LEVEL_HIGH = 0.8;

// Violation decay time (ms)
const VIOLATION_DECAY_TIME = 1 * 60 * 60 * 1000; // 1 hour

class ThreatDetectionService {
  private ipViolations: Map<string, { count: number, timestamp: number }> = new Map();
  private identifierViolations: Map<string, { count: number, timestamp: number }> = new Map();
  private subnets: Map<string, { count: number, timestamp: number }> = new Map();
  private recentThreats: string[] = [];
  private lastCleanup: number = Date.now();
  private systemStartTime: number = Date.now();
  
  constructor() {
    // Set up cleanup interval
    setInterval(() => this.cleanupOldThreats(), 15 * 60 * 1000); // Every 15 minutes
  }
  
  /**
   * Record a violation by an IP address
   * 
   * @param ip IP address
   * @param identifier User identifier
   * @param severity Violation severity
   */
  public recordViolation(ip: string, identifier: string, severity: number = 1): void {
    try {
      // Record IP violation
      this.recordIpViolation(ip, severity);
      
      // Record identifier violation
      this.recordIdentifierViolation(identifier, severity);
      
      // Record subnet violation
      const subnet = getIpSubnet(ip);
      this.recordSubnetViolation(subnet, severity);
      
      // Add to recent threats if severe enough
      if (severity >= 1.5) {
        this.addRecentThreat(ip);
      }
      
      // Log significant violations
      if (severity >= 2) {
        log(`Significant security violation by ${ip} (${identifier}), severity ${severity}`, 'security');
        
        // Record in audit trail
        recordAuditEvent({
          timestamp: new Date().toISOString(),
          action: 'THREAT_DETECTED',
          resource: identifier,
          result: 'blocked',
          severity: 'warning',
          details: {
            ip,
            identifier,
            threatLevel: this.calculateThreatLevel(ip, identifier),
            violationCount: this.getIpViolationCount(ip),
            severity
          }
        });
      }
    } catch (error) {
      log(`Error recording violation: ${error}`, 'security');
    }
  }
  
  /**
   * Get the threat level for a request
   * 
   * @param req Express request
   * @param ip IP address
   * @param userId User ID
   * @returns Threat level (0-1)
   */
  public getThreatLevel(req: Request, ip?: string, userId?: string | number): number {
    try {
      // Get IP from request if not provided
      const clientIp = ip || getClientIp(req);
      
      // Get identifier from user ID or IP
      const identifier = userId ? `user:${userId}` : `ip:${clientIp}`;
      
      // Calculate threat level
      return this.calculateThreatLevel(clientIp, identifier);
    } catch (error) {
      log(`Error getting threat level: ${error}`, 'security');
      
      // Return low threat level on error
      return 0.1;
    }
  }
  
  /**
   * Calculate the threat level for an IP and identifier
   * 
   * @param ip IP address
   * @param identifier User identifier
   * @returns Threat level (0-1)
   */
  public calculateThreatLevel(ip: string, identifier: string): number {
    try {
      // Get violation counts
      const ipViolations = this.getIpViolationCount(ip);
      const identifierViolations = this.getIdentifierViolationCount(identifier);
      const subnet = getIpSubnet(ip);
      const subnetViolations = this.getSubnetViolationCount(subnet);
      
      // Calculate age factors (newer violations are more significant)
      const ipAge = this.getViolationAge(ip, true);
      const identifierAge = this.getViolationAge(identifier, false);
      
      // Age factor reduces the impact of old violations
      const ipAgeFactor = Math.max(0.1, 1 - ipAge / VIOLATION_DECAY_TIME);
      const identifierAgeFactor = Math.max(0.1, 1 - identifierAge / VIOLATION_DECAY_TIME);
      
      // Calculate individual threat scores
      const ipThreat = Math.min(1, ipViolations * 0.1) * ipAgeFactor;
      const identifierThreat = Math.min(1, identifierViolations * 0.1) * identifierAgeFactor;
      const subnetThreat = Math.min(0.5, subnetViolations * 0.02);
      
      // Combine the scores (IP has most weight, subnet has least)
      let threatLevel = ipThreat * 0.6 + identifierThreat * 0.3 + subnetThreat * 0.1;
      
      // Recent threats get a boost
      if (this.isRecentThreat(ip)) {
        threatLevel = Math.min(1, threatLevel + 0.2);
      }
      
      // Cap and return
      return Math.min(1, Math.max(0, threatLevel));
    } catch (error) {
      log(`Error calculating threat level: ${error}`, 'security');
      
      // Return moderate threat level on error
      return 0.5;
    }
  }
  
  /**
   * Get the global threat level for the system
   * 
   * @returns Global threat level (0-1)
   */
  public getGlobalThreatLevel(): number {
    try {
      // Calculate total violations in the last hour
      const now = Date.now();
      const oneHourAgo = now - 60 * 60 * 1000;
      
      let recentViolations = 0;
      let totalIps = 0;
      
      // Count recent IP violations
      for (const [, data] of this.ipViolations) {
        if (data.timestamp >= oneHourAgo) {
          recentViolations += data.count;
          totalIps++;
        }
      }
      
      // Calculate threat density (violations per IP)
      const threatDensity = totalIps > 0 ? recentViolations / totalIps : 0;
      
      // Calculate system uptime in hours
      const uptimeHours = (now - this.systemStartTime) / (60 * 60 * 1000);
      
      // Adjust for system uptime (newer systems are more sensitive)
      const uptimeFactor = Math.min(1, Math.max(0.1, uptimeHours / 24));
      
      // Calculate global threat level
      let globalThreat = Math.min(1, threatDensity * 0.1) * uptimeFactor;
      
      // Boost if there are many high-threat IPs
      const highThreatCount = this.countHighThreatIps();
      if (highThreatCount > 3) {
        globalThreat = Math.min(1, globalThreat + (highThreatCount - 3) * 0.05);
      }
      
      return Math.min(1, Math.max(0, globalThreat));
    } catch (error) {
      log(`Error calculating global threat level: ${error}`, 'security');
      
      // Return low threat level on error
      return 0.1;
    }
  }
  
  /**
   * Clean up old threat data
   */
  public clearOldThreats(): void {
    try {
      const now = Date.now();
      const cutoff = now - VIOLATION_DECAY_TIME;
      
      // Clean up IP violations
      for (const [ip, data] of this.ipViolations.entries()) {
        if (data.timestamp < cutoff) {
          this.ipViolations.delete(ip);
        }
      }
      
      // Clean up identifier violations
      for (const [identifier, data] of this.identifierViolations.entries()) {
        if (data.timestamp < cutoff) {
          this.identifierViolations.delete(identifier);
        }
      }
      
      // Clean up subnet violations
      for (const [subnet, data] of this.subnets.entries()) {
        if (data.timestamp < cutoff) {
          this.subnets.delete(subnet);
        }
      }
      
      // Clean up recent threats (keep only the most recent 100)
      if (this.recentThreats.length > 100) {
        this.recentThreats = this.recentThreats.slice(-100);
      }
      
      // Update last cleanup time
      this.lastCleanup = now;
      
      log(`Threat detection cleanup: ${this.ipViolations.size} IPs, ${this.identifierViolations.size} identifiers, ${this.subnets.size} subnets`, 'security');
    } catch (error) {
      log(`Error cleaning up threats: ${error}`, 'security');
    }
  }
  
  /**
   * Get statistics about threat detection
   * 
   * @returns Threat detection statistics
   */
  public getStats(): any {
    try {
      // Calculate global threat level
      const globalThreatLevel = this.getGlobalThreatLevel();
      
      // Get threat level category
      let threatCategory = 'low';
      if (globalThreatLevel >= THREAT_LEVEL_HIGH) {
        threatCategory = 'high';
      } else if (globalThreatLevel >= THREAT_LEVEL_MEDIUM) {
        threatCategory = 'medium';
      } else if (globalThreatLevel >= THREAT_LEVEL_LOW) {
        threatCategory = 'low';
      } else {
        threatCategory = 'minimal';
      }
      
      // Calculate total violations
      let totalViolations = 0;
      for (const [, data] of this.ipViolations) {
        totalViolations += data.count;
      }
      
      // Get high threat IPs
      const highThreatIps = this.getHighThreatIps();
      
      // Get top threats
      const topThreats = Array.from(this.ipViolations.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 10)
        .map(([ip, data]) => ({
          ip,
          violationCount: data.count,
          lastViolation: new Date(data.timestamp).toISOString(),
          threatLevel: this.calculateThreatLevel(ip, `ip:${ip}`)
        }));
      
      // Return the stats
      return {
        timestamp: new Date().toISOString(),
        globalThreatLevel,
        threatCategory,
        totalViolations,
        uniqueIps: this.ipViolations.size,
        uniqueIdentifiers: this.identifierViolations.size,
        uniqueSubnets: this.subnets.size,
        recentThreats: this.recentThreats.length,
        highThreats: highThreatIps.length,
        topThreats,
        lastCleanup: new Date(this.lastCleanup).toISOString()
      };
    } catch (error) {
      log(`Error getting threat detection stats: ${error}`, 'security');
      
      return {
        timestamp: new Date().toISOString(),
        error: 'Failed to get threat detection stats'
      };
    }
  }
  
  /**
   * Record an IP violation
   * 
   * @param ip IP address
   * @param severity Violation severity
   */
  private recordIpViolation(ip: string, severity: number): void {
    const now = Date.now();
    const existingViolation = this.ipViolations.get(ip);
    
    if (existingViolation) {
      // Update existing record
      this.ipViolations.set(ip, {
        count: existingViolation.count + (severity || 1),
        timestamp: now
      });
    } else {
      // Create new record
      this.ipViolations.set(ip, {
        count: severity || 1,
        timestamp: now
      });
    }
  }
  
  /**
   * Record an identifier violation
   * 
   * @param identifier User identifier
   * @param severity Violation severity
   */
  private recordIdentifierViolation(identifier: string, severity: number): void {
    const now = Date.now();
    const existingViolation = this.identifierViolations.get(identifier);
    
    if (existingViolation) {
      // Update existing record
      this.identifierViolations.set(identifier, {
        count: existingViolation.count + (severity || 1),
        timestamp: now
      });
    } else {
      // Create new record
      this.identifierViolations.set(identifier, {
        count: severity || 1,
        timestamp: now
      });
    }
  }
  
  /**
   * Record a subnet violation
   * 
   * @param subnet IP subnet
   * @param severity Violation severity
   */
  private recordSubnetViolation(subnet: string, severity: number): void {
    const now = Date.now();
    const existingViolation = this.subnets.get(subnet);
    
    if (existingViolation) {
      // Update existing record
      this.subnets.set(subnet, {
        count: existingViolation.count + (severity || 1),
        timestamp: now
      });
    } else {
      // Create new record
      this.subnets.set(subnet, {
        count: severity || 1,
        timestamp: now
      });
    }
  }
  
  /**
   * Add an IP to recent threats
   * 
   * @param ip IP address
   */
  private addRecentThreat(ip: string): void {
    // Add to recent threats if not already there
    if (!this.recentThreats.includes(ip)) {
      this.recentThreats.push(ip);
      
      // Trim if too many
      if (this.recentThreats.length > 100) {
        this.recentThreats.shift();
      }
    }
  }
  
  /**
   * Check if an IP is a recent threat
   * 
   * @param ip IP address
   * @returns Whether the IP is a recent threat
   */
  private isRecentThreat(ip: string): boolean {
    return this.recentThreats.includes(ip);
  }
  
  /**
   * Get IP violation count
   * 
   * @param ip IP address
   * @returns Violation count
   */
  private getIpViolationCount(ip: string): number {
    const violation = this.ipViolations.get(ip);
    return violation ? violation.count : 0;
  }
  
  /**
   * Get identifier violation count
   * 
   * @param identifier User identifier
   * @returns Violation count
   */
  private getIdentifierViolationCount(identifier: string): number {
    const violation = this.identifierViolations.get(identifier);
    return violation ? violation.count : 0;
  }
  
  /**
   * Get subnet violation count
   * 
   * @param subnet IP subnet
   * @returns Violation count
   */
  private getSubnetViolationCount(subnet: string): number {
    const violation = this.subnets.get(subnet);
    return violation ? violation.count : 0;
  }
  
  /**
   * Get age of a violation
   * 
   * @param key IP or identifier
   * @param isIp Whether this is an IP (true) or identifier (false)
   * @returns Age in milliseconds
   */
  private getViolationAge(key: string, isIp: boolean): number {
    const map = isIp ? this.ipViolations : this.identifierViolations;
    const violation = map.get(key);
    
    if (violation) {
      return Date.now() - violation.timestamp;
    }
    
    return VIOLATION_DECAY_TIME; // Max age if not found
  }
  
  /**
   * Count how many IPs have a high threat level
   * 
   * @returns Count of high threat IPs
   */
  private countHighThreatIps(): number {
    return this.getHighThreatIps().length;
  }
  
  /**
   * Get IPs with a high threat level
   * 
   * @returns Array of high threat IPs
   */
  private getHighThreatIps(): string[] {
    const highThreatIps: string[] = [];
    
    for (const [ip] of this.ipViolations) {
      const threatLevel = this.calculateThreatLevel(ip, `ip:${ip}`);
      
      if (threatLevel >= THREAT_LEVEL_HIGH) {
        highThreatIps.push(ip);
      }
    }
    
    return highThreatIps;
  }
}

// Create and export a singleton instance
export const threatDetectionService = new ThreatDetectionService();