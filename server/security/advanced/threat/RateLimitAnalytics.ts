/**
 * Rate Limit Analytics
 *
 * This class tracks and analyzes rate limiting events to provide insights
 * into system usage, potential attacks, and rate limiting effectiveness.
 */

import { RateLimitContext } from './RateLimitContextBuilder';
import { log } from '../../../utils/logger';
import { recordAuditEvent } from '../../secureAuditTrail';

// Define a rate limit violation record
interface RateLimitViolation {
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

// Define resource usage stats
interface ResourceUsageStats {
  totalRequests: number;
  recentRequests: number; // Last 5 minutes
  averageRequestsPerMinute: number;
  peakRequestsPerMinute: number;
  lastPeakTimestamp: string;
}

export class RateLimitAnalytics {
  private violations: RateLimitViolation[] = [];
  private resourceStats: Map<string, ResourceUsageStats> = new Map();
  private requestCounts: Map<string, number[]> = new Map();
  private minuteTimestamps: number[] = [];
  private lastAnalysisTime: number = Date.now();
  private suspiciousIps: Set<string> = new Set();
  private suspiciousIdentifiers: Set<string> = new Set();
  private requestTrends: number[] = Array(60).fill(0); // Last 60 minutes
  private violationTrends: number[] = Array(60).fill(0); // Last 60 minutes
  
  constructor() {
    // Initialize minute timestamps array for tracking request rates
    const now = Date.now();
    this.minuteTimestamps = Array(60).fill(0).map((_, i) => now - (59 - i) * 60000);
    
    // Set up periodic analysis
    setInterval(() => this.analyzeViolations(), 5 * 60 * 1000); // Every 5 minutes
  }
  
  /**
   * Record a rate limit violation
   * 
   * @param violation The violation to record
   */
  public recordViolation(violation: RateLimitViolation): void {
    try {
      // Add to violations array
      this.violations.push(violation);
      
      // Trim violations array if it gets too large
      if (this.violations.length > 1000) {
        this.violations = this.violations.slice(-1000);
      }
      
      // Update violation trends
      const minuteIndex = Math.floor((Date.now() - this.minuteTimestamps[0]) / 60000);
      if (minuteIndex >= 0 && minuteIndex < 60) {
        this.violationTrends[minuteIndex]++;
      }
      
      // Add to suspicious sets if high cost or high threat level
      if (violation.cost > 5 || violation.context.threatLevel > 0.7) {
        this.suspiciousIps.add(violation.ip);
        this.suspiciousIdentifiers.add(violation.identifier);
      }
      
      // Record in audit trail for high-severity violations
      if (violation.context.threatLevel > 0.8 || violation.context.resourceSensitivity > 3.0) {
        recordAuditEvent({
          timestamp: violation.timestamp,
          action: 'RATE_LIMIT_VIOLATION',
          resource: violation.endpoint,
          result: 'warning',
          severity: 'info',
          details: {
            ip: violation.ip,
            identifier: violation.identifier,
            method: violation.method,
            threatLevel: violation.context.threatLevel,
            resourceType: violation.context.resourceType
          }
        });
      }
    } catch (error) {
      log(`Error recording rate limit violation: ${error}`, 'security');
    }
  }
  
  /**
   * Track a successful request
   * 
   * @param resourceType The type of resource accessed
   */
  public trackRequest(resourceType: string): void {
    try {
      // Get current minute
      const now = Date.now();
      const currentMinute = Math.floor(now / 60000);
      
      // Update resource stats
      let stats = this.resourceStats.get(resourceType);
      if (!stats) {
        stats = {
          totalRequests: 0,
          recentRequests: 0,
          averageRequestsPerMinute: 0,
          peakRequestsPerMinute: 0,
          lastPeakTimestamp: new Date().toISOString()
        };
        this.resourceStats.set(resourceType, stats);
      }
      
      // Update total and recent counts
      stats.totalRequests++;
      stats.recentRequests++;
      
      // Update request counts for trend tracking
      let minuteCounts = this.requestCounts.get(resourceType);
      if (!minuteCounts) {
        minuteCounts = Array(60).fill(0);
        this.requestCounts.set(resourceType, minuteCounts);
      }
      
      // Update the current minute's count
      const minuteIndex = Math.floor((now - this.minuteTimestamps[0]) / 60000);
      if (minuteIndex >= 0 && minuteIndex < 60) {
        minuteCounts[minuteIndex]++;
        this.requestTrends[minuteIndex]++;
      }
      
      // Update overall request trends
      this.updateRequestTrends(now);
    } catch (error) {
      log(`Error tracking request: ${error}`, 'security');
    }
  }
  
  /**
   * Update request trends with the current timestamp
   * 
   * @param now Current timestamp
   */
  private updateRequestTrends(now: number): void {
    // Check if we need to roll forward the minute window
    const currentMinute = Math.floor(now / 60000);
    const lastStoredMinute = Math.floor(this.minuteTimestamps[59] / 60000);
    
    if (currentMinute > lastStoredMinute) {
      // Calculate how many minutes to roll forward
      const minutesToAdd = currentMinute - lastStoredMinute;
      
      // Roll the arrays forward
      if (minutesToAdd >= 60) {
        // Clear all if more than 60 minutes have passed
        this.minuteTimestamps = Array(60).fill(0).map((_, i) => currentMinute * 60000 - (59 - i) * 60000);
        this.requestTrends = Array(60).fill(0);
        this.violationTrends = Array(60).fill(0);
        
        // Reset all request counts
        for (const [resourceType, counts] of this.requestCounts.entries()) {
          this.requestCounts.set(resourceType, Array(60).fill(0));
        }
      } else {
        // Shift arrays by the number of minutes to add
        for (let i = 0; i < minutesToAdd; i++) {
          // Shift minute timestamps
          this.minuteTimestamps.shift();
          this.minuteTimestamps.push(this.minuteTimestamps[58] + 60000);
          
          // Shift request trends
          this.requestTrends.shift();
          this.requestTrends.push(0);
          
          // Shift violation trends
          this.violationTrends.shift();
          this.violationTrends.push(0);
          
          // Shift all resource request counts
          for (const [resourceType, counts] of this.requestCounts.entries()) {
            counts.shift();
            counts.push(0);
            this.requestCounts.set(resourceType, counts);
          }
        }
      }
    }
  }
  
  /**
   * Analyze rate limit violations to identify patterns and potential attacks
   */
  private analyzeViolations(): void {
    try {
      const now = Date.now();
      
      // Skip if no violations since last analysis
      if (this.violations.length === 0 || this.lastAnalysisTime >= now) {
        return;
      }
      
      // Filter to recent violations (last 5 minutes)
      const fiveMinutesAgo = now - 5 * 60 * 1000;
      const recentViolations = this.violations.filter(v => 
        new Date(v.timestamp).getTime() > fiveMinutesAgo
      );
      
      // Skip if no recent violations
      if (recentViolations.length === 0) {
        return;
      }
      
      // Group by IP and endpoint
      const ipCounts: Record<string, number> = {};
      const endpointCounts: Record<string, number> = {};
      
      for (const violation of recentViolations) {
        // Count by IP
        ipCounts[violation.ip] = (ipCounts[violation.ip] || 0) + 1;
        
        // Count by endpoint
        endpointCounts[violation.endpoint] = (endpointCounts[violation.endpoint] || 0) + 1;
      }
      
      // Identify suspicious IPs (more than 10 violations in 5 minutes)
      for (const [ip, count] of Object.entries(ipCounts)) {
        if (count > 10) {
          this.suspiciousIps.add(ip);
          
          // Record suspicious activity
          recordAuditEvent({
            timestamp: new Date().toISOString(),
            action: 'SUSPICIOUS_RATE_ACTIVITY',
            resource: 'rate-limiting',
            result: 'warning',
            severity: 'alert',
            details: {
              ip,
              violationCount: count,
              timeFrameMinutes: 5
            }
          });
        }
      }
      
      // Update resource stats to remove old "recent" counts
      for (const [resourceType, stats] of this.resourceStats.entries()) {
        // Calculate recent requests (last 5 minutes)
        let recentCount = 0;
        const counts = this.requestCounts.get(resourceType);
        
        if (counts) {
          // Sum the last 5 minutes of counts
          for (let i = Math.max(0, counts.length - 5); i < counts.length; i++) {
            recentCount += counts[i];
          }
        }
        
        // Update stats
        stats.recentRequests = recentCount;
        
        // Calculate average requests per minute (from recent data)
        const totalRecentCounts = counts ? counts.reduce((a, b) => a + b, 0) : 0;
        stats.averageRequestsPerMinute = totalRecentCounts / 60;
        
        // Update peak if necessary
        const currentMinuteCounts = counts ? counts[counts.length - 1] : 0;
        if (currentMinuteCounts > stats.peakRequestsPerMinute) {
          stats.peakRequestsPerMinute = currentMinuteCounts;
          stats.lastPeakTimestamp = new Date().toISOString();
        }
        
        // Update in the map
        this.resourceStats.set(resourceType, stats);
      }
      
      // Update last analysis time
      this.lastAnalysisTime = now;
    } catch (error) {
      log(`Error analyzing rate limit violations: ${error}`, 'security');
    }
  }
  
  /**
   * Store violations to a persistent store and clear old ones
   */
  public storeViolations(): void {
    try {
      // For now, this is a placeholder for future implementation
      // In a real system, this would store violations to a database
      
      // Analyze violations before storing
      this.analyzeViolations();
      
      // Remove old violations (older than 1 hour)
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      this.violations = this.violations.filter(v => 
        new Date(v.timestamp).getTime() > oneHourAgo
      );
      
      log(`Stored ${this.violations.length} recent rate limit violations`, 'security');
    } catch (error) {
      log(`Error storing rate limit violations: ${error}`, 'security');
    }
  }
  
  /**
   * Generate a report of rate limiting activity
   * 
   * @returns Rate limiting activity report
   */
  public generateReport(): any {
    try {
      // Ensure data is up to date
      this.analyzeViolations();
      
      // Get recent violations (last hour)
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      const recentViolations = this.violations.filter(v => 
        new Date(v.timestamp).getTime() > oneHourAgo
      );
      
      // Group violations by resource type
      const resourceViolations: Record<string, number> = {};
      
      for (const violation of recentViolations) {
        const resourceType = violation.context.resourceType;
        resourceViolations[resourceType] = (resourceViolations[resourceType] || 0) + 1;
      }
      
      // Calculate error rate (violations / total requests) for each resource
      const resourceErrorRates: Record<string, number> = {};
      let globalErrorRate = 0;
      let totalRequests = 0;
      let totalViolations = 0;
      
      for (const [resourceType, stats] of this.resourceStats.entries()) {
        totalRequests += stats.totalRequests;
        const violations = resourceViolations[resourceType] || 0;
        totalViolations += violations;
        
        if (stats.totalRequests > 0) {
          resourceErrorRates[resourceType] = violations / stats.totalRequests;
        } else {
          resourceErrorRates[resourceType] = 0;
        }
      }
      
      if (totalRequests > 0) {
        globalErrorRate = totalViolations / totalRequests;
      }
      
      // Generate the report
      return {
        timestamp: new Date().toISOString(),
        summary: {
          totalViolations: this.violations.length,
          recentViolations: recentViolations.length,
          suspiciousUsers: this.suspiciousIdentifiers.size,
          suspiciousIps: this.suspiciousIps.size,
          globalErrorRate,
          suspiciousRequestRate: this.suspiciousIdentifiers.size > 0 ? 
            recentViolations.length / this.suspiciousIdentifiers.size : 0
        },
        resourceTypes: Object.keys(this.resourceStats).map(type => ({
          type,
          totalRequests: this.resourceStats.get(type)?.totalRequests || 0,
          recentRequests: this.resourceStats.get(type)?.recentRequests || 0,
          averageRequestsPerMinute: this.resourceStats.get(type)?.averageRequestsPerMinute || 0,
          peakRequestsPerMinute: this.resourceStats.get(type)?.peakRequestsPerMinute || 0,
          violations: resourceViolations[type] || 0,
          errorRate: resourceErrorRates[type] || 0
        })),
        suspiciousUsers: Array.from(this.suspiciousIdentifiers).slice(0, 50), // Limit to 50
        suspiciousIps: Array.from(this.suspiciousIps).slice(0, 50), // Limit to 50
        trends: {
          requests: this.requestTrends,
          violations: this.violationTrends,
          timePoints: this.minuteTimestamps.map(ts => new Date(ts).toISOString())
        }
      };
    } catch (error) {
      log(`Error generating rate limit report: ${error}`, 'security');
      
      return {
        timestamp: new Date().toISOString(),
        error: 'Failed to generate report'
      };
    }
  }
}