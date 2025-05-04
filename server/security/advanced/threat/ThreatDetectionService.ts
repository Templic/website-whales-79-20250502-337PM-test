/**
 * Threat Detection Service
 *
 * This service tracks security violations and detects threats.
 */

import { Request } from 'express';
import { log } from '../../../utils/logger';
import { recordAuditEvent } from '../../secureAuditTrail';

interface ThreatInfo {
  ip: string;
  identifier: string;
  timestamp: number;
  score: number;
  violations: number;
}

class ThreatDetectionService {
  private threats: Map<string, ThreatInfo> = new Map();
  private ipThreats: Map<string, number> = new Map();
  private identifierThreats: Map<string, number> = new Map();
  private lastCleanup: number = Date.now();
  private globalThreatLevel: number = 0;
  private threatCategory: string = 'low';
  
  constructor() {
    // Set up cleanup interval
    setInterval(() => this.clearOldThreats(), 60 * 60 * 1000); // Every hour
  }
  
  /**
   * Record a security violation
   * 
   * @param ip Client IP
   * @param identifier User identifier
   * @param score Threat score (0-1)
   */
  public recordViolation(ip: string, identifier: string, score: number = 1.0): void {
    try {
      // Get current time
      const now = Date.now();
      
      // Get or create threat info
      const key = `${ip}:${identifier}`;
      let threatInfo = this.threats.get(key);
      
      if (!threatInfo) {
        threatInfo = {
          ip,
          identifier,
          timestamp: now,
          score: 0,
          violations: 0
        };
        this.threats.set(key, threatInfo);
      }
      
      // Update threat info
      threatInfo.timestamp = now;
      threatInfo.score += score;
      threatInfo.violations++;
      
      // Update IP threats
      const ipScore = this.ipThreats.get(ip) || 0;
      this.ipThreats.set(ip, ipScore + score);
      
      // Update identifier threats
      const identifierScore = this.identifierThreats.get(identifier) || 0;
      this.identifierThreats.set(identifier, identifierScore + score);
      
      // Recalculate global threat level
      this.recalculateGlobalThreatLevel();
      
      // Log high threats
      if (threatInfo.score > 5.0) {
        // Record in audit trail
        recordAuditEvent({
          timestamp: new Date().toISOString(),
          action: 'THREAT_DETECTED',
          resource: 'system',
          result: 'warning',
          severity: 'warning',
          details: {
            ip,
            identifier,
            score: threatInfo.score,
            violations: threatInfo.violations
          }
        });
        
        log(`High threat detected: ${ip} (${identifier}) with score ${threatInfo.score.toFixed(2)}`, 'security');
      }
    } catch (error) {
      log(`Error recording threat: ${error}`, 'security');
    }
  }
  
  /**
   * Get threat level for a specific request/IP/user
   * 
   * @param req Express request
   * @param ip Client IP
   * @param userId User ID (optional)
   * @returns Threat level (0-1)
   */
  public getThreatLevel(req: Request, ip: string, userId?: string | number): number {
    try {
      // Calculate identifier
      const identifier = userId ? `user:${userId}` : `ip:${ip}`;
      
      // Get threat scores
      const ipScore = this.ipThreats.get(ip) || 0;
      const identifierScore = this.identifierThreats.get(identifier) || 0;
      
      // Calculate combined score (max of the two)
      const combinedScore = Math.max(ipScore, identifierScore);
      
      // Convert to threat level (0-1)
      const threatLevel = Math.min(1.0, combinedScore / 10.0);
      
      return threatLevel;
    } catch (error) {
      log(`Error getting threat level: ${error}`, 'security');
      
      // Default to low threat level on error
      return 0.1;
    }
  }
  
  /**
   * Get global threat level
   * 
   * @returns Global threat level (0-1)
   */
  public getGlobalThreatLevel(): number {
    return this.globalThreatLevel;
  }
  
  /**
   * Get threat category
   * 
   * @returns Threat category (low, medium, high, critical)
   */
  public getThreatCategory(): string {
    return this.threatCategory;
  }
  
  /**
   * Clear old threats
   */
  public clearOldThreats(): void {
    try {
      // Get current time
      const now = Date.now();
      
      // Check if it's time to clean up
      if (now - this.lastCleanup < 60 * 60 * 1000) { // Every hour
        return;
      }
      
      // Calculate cutoff time (24 hours ago)
      const cutoff = now - 24 * 60 * 60 * 1000;
      
      // Count before
      const countBefore = this.threats.size;
      
      // Clear IP and identifier threats
      this.ipThreats.clear();
      this.identifierThreats.clear();
      
      // Remove old threats and rebuild maps
      const keysToRemove: string[] = [];
      
      for (const [key, threat] of this.threats.entries()) {
        if (threat.timestamp < cutoff) {
          keysToRemove.push(key);
        } else {
          // Update IP threats
          const ipScore = this.ipThreats.get(threat.ip) || 0;
          this.ipThreats.set(threat.ip, ipScore + threat.score);
          
          // Update identifier threats
          const identifierScore = this.identifierThreats.get(threat.identifier) || 0;
          this.identifierThreats.set(threat.identifier, identifierScore + threat.score);
        }
      }
      
      // Remove old threats
      for (const key of keysToRemove) {
        this.threats.delete(key);
      }
      
      // Recalculate global threat level
      this.recalculateGlobalThreatLevel();
      
      // Log if we cleaned up a significant number of threats
      if (countBefore - this.threats.size > 10) {
        log(`Threat cleanup: ${countBefore - this.threats.size} threats removed`, 'security');
      }
      
      // Update last cleanup time
      this.lastCleanup = now;
    } catch (error) {
      log(`Error cleaning up threats: ${error}`, 'security');
    }
  }
  
  /**
   * Get threat statistics
   * 
   * @returns Threat statistics
   */
  public getStats(): any {
    try {
      // Calculate total threat score
      let totalScore = 0;
      let totalViolations = 0;
      
      for (const [, threat] of this.threats) {
        totalScore += threat.score;
        totalViolations += threat.violations;
      }
      
      // Get top IPs
      const topIps = Array.from(this.ipThreats.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([ip, score]) => ({ ip, score }));
      
      // Get top identifiers
      const topIdentifiers = Array.from(this.identifierThreats.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([identifier, score]) => ({ identifier, score }));
      
      // Return stats
      return {
        timestamp: new Date().toISOString(),
        totalThreats: this.threats.size,
        uniqueIps: this.ipThreats.size,
        uniqueIdentifiers: this.identifierThreats.size,
        totalScore,
        totalViolations,
        averageScore: this.threats.size > 0 ? totalScore / this.threats.size : 0,
        globalThreatLevel: this.globalThreatLevel,
        threatCategory: this.threatCategory,
        topIps,
        topIdentifiers
      };
    } catch (error) {
      log(`Error getting threat stats: ${error}`, 'security');
      
      return {
        timestamp: new Date().toISOString(),
        error: 'Failed to get threat stats'
      };
    }
  }
  
  /**
   * Recalculate global threat level
   */
  private recalculateGlobalThreatLevel(): void {
    try {
      if (this.threats.size === 0) {
        this.globalThreatLevel = 0;
        this.threatCategory = 'low';
        return;
      }
      
      // Calculate total score
      let totalScore = 0;
      
      for (const [, threat] of this.threats) {
        totalScore += threat.score;
      }
      
      // Calculate average score
      const averageScore = totalScore / this.threats.size;
      
      // Calculate global threat level (0-1)
      this.globalThreatLevel = Math.min(1.0, averageScore / 10.0);
      
      // Determine threat category
      if (this.globalThreatLevel < 0.25) {
        this.threatCategory = 'low';
      } else if (this.globalThreatLevel < 0.5) {
        this.threatCategory = 'medium';
      } else if (this.globalThreatLevel < 0.75) {
        this.threatCategory = 'high';
      } else {
        this.threatCategory = 'critical';
      }
    } catch (error) {
      log(`Error recalculating global threat level: ${error}`, 'security');
      
      // Reset to low on error
      this.globalThreatLevel = 0;
      this.threatCategory = 'low';
    }
  }
}

// Export singleton instance
export const threatDetectionService = new ThreatDetectionService();