/**
 * Rate Limit Analytics
 *
 * This class tracks and analyzes rate limit violations to provide insights
 * for the adaptive rate limiter and security monitoring.
 */

import { RateLimitContext } from './RateLimitContextBuilder';
import { recordAuditEvent } from '../../secureAuditTrail';

// Define violation data structure
export interface RateLimitViolation {
  timestamp: string;
  ip: string;
  identifier: string;
  endpoint: string;
  method: string;
  tier: string;
  cost: number;
  context: RateLimitContext;
  adaptiveMultiplier?: number;
}

// Define suspicious user
export interface SuspiciousUser {
  userId: string | number;
  violationCount: number;
  lastViolation: string;
  violationRate: number;
}

export class RateLimitAnalytics {
  private violations: RateLimitViolation[] = [];
  private violationHistory: Map<string, number[]> = new Map();
  private requestCounts: Map<string, number> = new Map();
  private errorCounts: Map<string, number> = new Map();
  private lastAuditTime: number = Date.now();
  private auditInterval: number = 300000; // 5 minutes
  private maxViolationsStored: number = 1000;
  private violationThreshold: number = 10;
  
  constructor() {
    // Set up periodic violation storage
    setInterval(() => {
      this.storeViolations();
    }, this.auditInterval);
  }
  
  /**
   * Record a rate limit violation
   * 
   * @param violation The violation details
   */
  public recordViolation(violation: RateLimitViolation): void {
    // Add to in-memory store
    this.violations.push(violation);
    
    // Ensure we don't exceed the maximum number of violations to store
    if (this.violations.length > this.maxViolationsStored) {
      this.violations.shift();
    }
    
    // Track violation count by identifier
    const identifier = violation.identifier;
    const pastHour = Date.now() - 3600000;
    
    // Initialize if new
    if (!this.violationHistory.has(identifier)) {
      this.violationHistory.set(identifier, []);
    }
    
    // Record this violation timestamp
    const timestamps = this.violationHistory.get(identifier) || [];
    timestamps.push(Date.now());
    
    // Remove timestamps older than 1 hour
    const recentTimestamps = timestamps.filter(time => time > pastHour);
    this.violationHistory.set(identifier, recentTimestamps);
    
    // Check for suspicious activity that should trigger an immediate alert
    if (recentTimestamps.length >= this.violationThreshold) {
      this.alertSuspiciousActivity(violation, recentTimestamps.length);
    }
  }
  
  /**
   * Store violations for long-term analysis and reporting
   */
  public storeViolations(): void {
    const now = Date.now();
    
    // Skip if we don't have any new violations or if it's too soon
    if (this.violations.length === 0 || now - this.lastAuditTime < this.auditInterval) {
      return;
    }
    
    try {
      // Group violations by type for summary
      const violationsByType: Record<string, number> = {};
      const violationsByIp: Record<string, number> = {};
      const violationsByEndpoint: Record<string, number> = {};
      
      this.violations.forEach(violation => {
        // Count by resource type
        const type = violation.context.resourceType;
        violationsByType[type] = (violationsByType[type] || 0) + 1;
        
        // Count by IP
        violationsByIp[violation.ip] = (violationsByIp[violation.ip] || 0) + 1;
        
        // Count by endpoint
        violationsByEndpoint[violation.endpoint] = (violationsByEndpoint[violation.endpoint] || 0) + 1;
      });
      
      // Get the top offenders
      const topIps = Object.entries(violationsByIp)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([ip, count]) => ({ ip, count }));
        
      const topEndpoints = Object.entries(violationsByEndpoint)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([endpoint, count]) => ({ endpoint, count }));
      
      // Create a summary for the audit log
      const summary = {
        timestamp: new Date().toISOString(),
        totalViolations: this.violations.length,
        violationsByType,
        topIps,
        topEndpoints,
        periodMinutes: Math.round((now - this.lastAuditTime) / 60000)
      };
      
      // Record in the security audit trail
      recordAuditEvent({
        timestamp: new Date().toISOString(),
        action: 'RATE_LIMIT_SUMMARY',
        resource: 'rate-limiting',
        result: 'info',
        severity: this.violations.length > 100 ? 'warning' : 'info',
        details: summary
      });
      
      // Store detailed violation data for later analysis if needed
      // This could write to a database or file for long-term storage
      
      // Clear the in-memory violations after storage
      this.violations = [];
      this.lastAuditTime = now;
    } catch (error) {
      console.error('[RateLimit] Error storing rate limit violations:', error);
    }
  }
  
  /**
   * Track a successful request (non-rate-limited)
   * 
   * @param resourceType The type of resource being accessed
   */
  public trackRequest(resourceType: string): void {
    this.requestCounts.set(
      resourceType,
      (this.requestCounts.get(resourceType) || 0) + 1
    );
  }
  
  /**
   * Track an error response
   * 
   * @param resourceType The type of resource that returned an error
   */
  public trackError(resourceType: string): void {
    this.errorCounts.set(
      resourceType,
      (this.errorCounts.get(resourceType) || 0) + 1
    );
  }
  
  /**
   * Get violation data for resource types
   * 
   * @returns Violation statistics by resource type
   */
  public getResourceTypeViolations() {
    const violationsByType: Record<string, number> = {};
    const requestsByType: Record<string, number> = {};
    const violationRatesByType: Record<string, number> = {};
    
    // Convert maps to records for easier access
    for (const [type, count] of this.requestCounts.entries()) {
      requestsByType[type] = count;
    }
    
    // Count violations by resource type
    this.violations.forEach(violation => {
      const type = violation.context.resourceType;
      violationsByType[type] = (violationsByType[type] || 0) + 1;
    });
    
    // Calculate violation rates
    for (const type in violationsByType) {
      const requests = requestsByType[type] || 0;
      const violations = violationsByType[type] || 0;
      
      // Calculate rate, avoiding division by zero
      violationRatesByType[type] = requests > 0 ? violations / requests : 0;
    }
    
    return {
      violationsByType,
      requestsByType,
      violationRatesByType
    };
  }
  
  /**
   * Get a list of suspicious users based on violation patterns
   * 
   * @returns Array of suspicious users
   */
  public getSuspiciousUsers(): SuspiciousUser[] {
    const result: SuspiciousUser[] = [];
    const pastHour = Date.now() - 3600000;
    
    // Group violations by user ID
    const userViolations: Record<string, RateLimitViolation[]> = {};
    
    this.violations.forEach(violation => {
      if (violation.context.userId) {
        const userId = String(violation.context.userId);
        userViolations[userId] = userViolations[userId] || [];
        userViolations[userId].push(violation);
      }
    });
    
    // Check the violation history map for high-frequency offenders
    for (const [identifier, timestamps] of this.violationHistory.entries()) {
      // Only check user identifiers
      if (!identifier.startsWith('user:')) continue;
      
      // Get the user ID from the identifier
      const userId = identifier.split(':')[1];
      
      // Get recent violation count
      const recentTimestamps = timestamps.filter(time => time > pastHour);
      
      // If this user has enough recent violations, mark as suspicious
      if (recentTimestamps.length >= this.violationThreshold) {
        // Find the most recent violation
        const mostRecent = Math.max(...recentTimestamps);
        
        result.push({
          userId,
          violationCount: recentTimestamps.length,
          lastViolation: new Date(mostRecent).toISOString(),
          violationRate: recentTimestamps.length / 60 // Per minute
        });
      }
    }
    
    return result;
  }
  
  /**
   * Get the global rate of suspicious requests
   * 
   * @returns A ratio of suspicious to total requests
   */
  public getSuspiciousRequestRate(): number {
    // Calculate total requests across all types
    let totalRequests = 0;
    for (const count of this.requestCounts.values()) {
      totalRequests += count;
    }
    
    // Calculate suspicious requests (those with high violation rates)
    const suspiciousUsers = this.getSuspiciousUsers();
    const suspiciousViolations = suspiciousUsers.reduce(
      (sum, user) => sum + user.violationCount,
      0
    );
    
    // Calculate rate, avoiding division by zero
    return totalRequests > 0 ? suspiciousViolations / totalRequests : 0;
  }
  
  /**
   * Get the global error rate
   * 
   * @returns A ratio of errors to total requests
   */
  public getGlobalErrorRate(): number {
    // Calculate total requests across all types
    let totalRequests = 0;
    for (const count of this.requestCounts.values()) {
      totalRequests += count;
    }
    
    // Calculate total errors across all types
    let totalErrors = 0;
    for (const count of this.errorCounts.values()) {
      totalErrors += count;
    }
    
    // Calculate rate, avoiding division by zero
    return totalRequests > 0 ? totalErrors / totalRequests : 0;
  }
  
  /**
   * Get the number of violations for a specific identifier
   * 
   * @param identifier The identifier to check
   * @returns The number of recent violations
   */
  public getViolationCount(identifier: string): number {
    const timestamps = this.violationHistory.get(identifier) || [];
    const pastHour = Date.now() - 3600000;
    return timestamps.filter(time => time > pastHour).length;
  }
  
  /**
   * Alert about suspicious activity
   * 
   * @param violation The latest violation
   * @param count The number of recent violations
   */
  private alertSuspiciousActivity(violation: RateLimitViolation, count: number): void {
    try {
      // Record in the security audit trail
      recordAuditEvent({
        timestamp: new Date().toISOString(),
        action: 'RATE_LIMIT_ALERT',
        resource: 'rate-limiting',
        result: 'alert',
        severity: count > 20 ? 'warning' : 'info',
        details: {
          identifier: violation.identifier,
          ip: violation.ip,
          endpoint: violation.endpoint,
          method: violation.method,
          violationCount: count,
          tier: violation.tier,
          resourceType: violation.context.resourceType
        }
      });
    } catch (error) {
      console.error('[RateLimit] Error recording rate limit alert:', error);
    }
  }
  
  /**
   * Generate a comprehensive report on rate limiting activity
   * 
   * @returns A detailed report of rate limiting activity
   */
  public generateReport() {
    const now = Date.now();
    const pastHour = now - 3600000;
    const pastDay = now - 86400000;
    
    // Calculate recent violations
    const recentViolations = this.violations.filter(
      v => new Date(v.timestamp).getTime() > pastHour
    );
    
    // Get suspicious users
    const suspiciousUsers = this.getSuspiciousUsers();
    
    // Get resource type info
    const resourceTypeData = this.getResourceTypeViolations();
    
    // Calculate violation trends by counting from the violation history
    const violationTrends: Record<string, number[]> = {
      '10min': Array(6).fill(0),
      '1hour': Array(6).fill(0),
      '24hour': Array(24).fill(0)
    };
    
    // Aggregate all timestamps for trend analysis
    const allTimestamps: number[] = [];
    for (const timestamps of this.violationHistory.values()) {
      allTimestamps.push(...timestamps);
    }
    
    // Calculate trends
    allTimestamps.forEach(timestamp => {
      // For 10-minute intervals (last hour)
      if (timestamp > pastHour) {
        const minutesAgo = Math.floor((now - timestamp) / (10 * 60000));
        if (minutesAgo < 6) {
          violationTrends['10min'][minutesAgo]++;
        }
      }
      
      // For 10-minute intervals (last hour)
      if (timestamp > pastHour) {
        const minutesAgo = Math.floor((now - timestamp) / (10 * 60000));
        if (minutesAgo < 6) {
          violationTrends['1hour'][minutesAgo]++;
        }
      }
      
      // For 1-hour intervals (last day)
      if (timestamp > pastDay) {
        const hoursAgo = Math.floor((now - timestamp) / 3600000);
        if (hoursAgo < 24) {
          violationTrends['24hour'][hoursAgo]++;
        }
      }
    });
    
    return {
      summary: {
        totalViolations: this.violations.length,
        recentViolations: recentViolations.length,
        suspiciousUsers: suspiciousUsers.length,
        globalErrorRate: this.getGlobalErrorRate(),
        suspiciousRequestRate: this.getSuspiciousRequestRate()
      },
      resourceTypes: resourceTypeData,
      suspiciousUsers: suspiciousUsers.slice(0, 10), // Top 10 only
      trends: violationTrends,
      timestamp: new Date().toISOString()
    };
  }
}