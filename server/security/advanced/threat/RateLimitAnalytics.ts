/**
 * Rate Limit Analytics
 * 
 * Provides tools for analyzing rate limit data, including:
 * - Tracking rate limit violations
 * - Identifying potential attackers
 * - Generating reports on rate limiting effectiveness
 * - Providing insights to security monitoring systems
 */

import { TokenBucketRateLimiter } from './TokenBucketRateLimiter';

export interface RateLimitViolation {
  key: string;
  timestamp: number;
  count: number;
  firstViolation: number;
  lastViolation: number;
  paths: string[];
  ipAddress?: string;
  userId?: string;
  userAgent?: string;
}

export interface RateLimitReport {
  period: {
    start: number;
    end: number;
  };
  summary: {
    totalViolations: number;
    uniqueIps: number;
    uniqueUsers: number;
    topPaths: Array<{ path: string; count: number }>;
    potentialAttacks: number;
  };
  violations: RateLimitViolation[];
}

export class RateLimitAnalytics {
  private violationHistory: RateLimitViolation[] = [];
  private maxHistorySize: number;
  private limiters: Record<string, TokenBucketRateLimiter>;
  
  constructor(
    limiters: Record<string, TokenBucketRateLimiter>,
    maxHistorySize: number = 1000
  ) {
    this.limiters = limiters;
    this.maxHistorySize = maxHistorySize;
  }
  
  /**
   * Collect rate limit violations from all limiters
   */
  public collectViolations(): void {
    const now = Date.now();
    
    Object.entries(this.limiters).forEach(([limiterName, limiter]) => {
      const violations = limiter.getViolationStats();
      
      Object.entries(violations).forEach(([key, data]) => {
        // Extract IP and user ID from key if possible
        let ipAddress: string | undefined;
        let userId: string | undefined;
        
        if (key.startsWith('ip:')) {
          const parts = key.split(':');
          if (parts.length >= 2) {
            ipAddress = parts[1];
          }
        } else if (key.startsWith('user:')) {
          const parts = key.split(':');
          if (parts.length >= 2) {
            userId = parts[1];
          }
        }
        
        // Create violation record
        const violation: RateLimitViolation = {
          key,
          timestamp: now,
          count: data.count,
          firstViolation: data.firstViolation,
          lastViolation: data.lastViolation,
          paths: data.paths,
          ipAddress,
          userId
        };
        
        // Add to history
        this.violationHistory.push(violation);
      });
      
      // Reset violation stats to avoid duplicates in future collections
      limiter.resetViolationStats();
    });
    
    // Trim history if needed
    if (this.violationHistory.length > this.maxHistorySize) {
      this.violationHistory = this.violationHistory.slice(-this.maxHistorySize);
    }
  }
  
  /**
   * Generate a report for a specific time period
   * 
   * @param startTime Start timestamp (defaults to 1 hour ago)
   * @param endTime End timestamp (defaults to now)
   */
  public generateReport(startTime?: number, endTime?: number): RateLimitReport {
    const end = endTime || Date.now();
    const start = startTime || (end - 60 * 60 * 1000); // Default to 1 hour
    
    // Filter violations by time period
    const violations = this.violationHistory.filter(
      v => v.timestamp >= start && v.timestamp <= end
    );
    
    // Extract unique IPs and users
    const uniqueIps = new Set<string>();
    const uniqueUsers = new Set<string>();
    const pathCounts: Record<string, number> = {};
    
    violations.forEach(v => {
      if (v.ipAddress) uniqueIps.add(v.ipAddress);
      if (v.userId) uniqueUsers.add(v.userId);
      
      // Count paths
      v.paths.forEach(path => {
        pathCounts[path] = (pathCounts[path] || 0) + 1;
      });
    });
    
    // Sort paths by count
    const topPaths = Object.entries(pathCounts)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // Identify potential attacks (high violation counts or rapid succession)
    const potentialAttacks = violations.filter(v => {
      // More than 20 violations
      if (v.count > 20) return true;
      
      // More than 10 violations in less than 1 minute
      if (v.count > 10 && (v.lastViolation - v.firstViolation) < 60000) return true;
      
      return false;
    }).length;
    
    return {
      period: { start, end },
      summary: {
        totalViolations: violations.length,
        uniqueIps: uniqueIps.size,
        uniqueUsers: uniqueUsers.size,
        topPaths,
        potentialAttacks
      },
      violations
    };
  }
  
  /**
   * Get all violation data
   */
  public getAllViolations(): RateLimitViolation[] {
    return [...this.violationHistory];
  }
  
  /**
   * Get violations for a specific IP
   */
  public getViolationsForIp(ip: string): RateLimitViolation[] {
    return this.violationHistory.filter(v => v.ipAddress === ip);
  }
  
  /**
   * Get violations for a specific user
   */
  public getViolationsForUser(userId: string): RateLimitViolation[] {
    return this.violationHistory.filter(v => v.userId === userId);
  }
  
  /**
   * Get violations for a specific path
   */
  public getViolationsForPath(path: string): RateLimitViolation[] {
    return this.violationHistory.filter(v => v.paths.includes(path));
  }
  
  /**
   * Clear violation history
   */
  public clearHistory(): void {
    this.violationHistory = [];
  }
  
  /**
   * Identify potential attackers based on violation patterns
   */
  public identifyPotentialAttackers(): Array<{
    ipOrUser: string;
    violationCount: number;
    distinctPaths: number;
    lastViolation: number;
    threatScore: number;
  }> {
    // Group by IP or user ID
    const groupedByActor: Record<string, {
      violationCount: number;
      paths: Set<string>;
      lastViolation: number;
      violations: RateLimitViolation[];
    }> = {};
    
    this.violationHistory.forEach(v => {
      const actorId = v.userId || v.ipAddress || v.key;
      
      if (!groupedByActor[actorId]) {
        groupedByActor[actorId] = {
          violationCount: 0,
          paths: new Set<string>(),
          lastViolation: 0,
          violations: []
        };
      }
      
      const actor = groupedByActor[actorId];
      
      // Update stats
      actor.violationCount += v.count;
      v.paths.forEach(p => actor.paths.add(p));
      actor.lastViolation = Math.max(actor.lastViolation, v.lastViolation);
      actor.violations.push(v);
    });
    
    // Calculate threat score and filter significant threats
    return Object.entries(groupedByActor)
      .map(([ipOrUser, data]) => {
        // Calculate threat score (0-100)
        let threatScore = 0;
        
        // Factor 1: Number of violations (max 50 points)
        threatScore += Math.min(data.violationCount / 2, 50);
        
        // Factor 2: Distinct paths (max 30 points)
        // More distinct paths suggests scanning or broader attacks
        threatScore += Math.min(data.paths.size * 3, 30);
        
        // Factor 3: Recency (max 20 points)
        // More recent violations are more concerning
        const now = Date.now();
        const hoursSinceLastViolation = (now - data.lastViolation) / (60 * 60 * 1000);
        if (hoursSinceLastViolation < 1) {
          threatScore += 20; // Within the last hour
        } else if (hoursSinceLastViolation < 24) {
          threatScore += 10; // Within the last day
        } else if (hoursSinceLastViolation < 168) {
          threatScore += 5;  // Within the last week
        }
        
        return {
          ipOrUser,
          violationCount: data.violationCount,
          distinctPaths: data.paths.size,
          lastViolation: data.lastViolation,
          threatScore
        };
      })
      .filter(actor => actor.threatScore > 20) // Only include significant threats
      .sort((a, b) => b.threatScore - a.threatScore);
  }
}