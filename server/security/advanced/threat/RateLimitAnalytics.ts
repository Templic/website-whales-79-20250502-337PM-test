/**
 * Rate Limit Analytics
 *
 * This class provides analytics for the rate limiting system.
 * It tracks request patterns, violations, and generates reports.
 */

import { log } from '../../../utils/logger';
import { recordAuditEvent } from '../../secureAuditTrail';

// Interface for a rate limit violation
interface RateLimitViolation {
  timestamp: string;
  ip: string;
  identifier: string;
  endpoint: string;
  method: string;
  tier: string;
  cost: number;
  context: any;
  adaptiveMultiplier: number;
}

export class RateLimitAnalytics {
  private violations: RateLimitViolation[] = [];
  private requestCounts: Map<string, number> = new Map();
  private resourceTypeCounts: Map<string, number> = new Map();
  private lastCleanup: number = Date.now();
  private maxViolations: number = 1000; // Max violations to store in memory
  private maxAge: number = 24 * 60 * 60 * 1000; // 24 hours
  
  constructor() {
    // Set up cleanup interval
    setInterval(() => this.cleanup(), 60 * 60 * 1000); // Every hour
  }
  
  /**
   * Record a rate limit violation
   * 
   * @param violation Violation details
   */
  public recordViolation(violation: RateLimitViolation): void {
    try {
      // Add to violations array
      this.violations.push(violation);
      
      // Increment violation count for this endpoint
      const endpoint = violation.endpoint;
      this.incrementEndpointViolation(endpoint);
      
      // Increment violation count for this resource type
      const resourceType = violation.context?.resourceType || 'unknown';
      this.incrementResourceTypeViolation(resourceType);
      
      // Record significant violations in audit log
      if (violation.context?.riskLevel > 0.7 || violation.context?.threatLevel > 0.7) {
        recordAuditEvent({
          timestamp: new Date().toISOString(),
          action: 'RATE_LIMIT_VIOLATION',
          resource: violation.endpoint,
          result: 'blocked',
          severity: 'info',
          details: {
            ip: violation.ip,
            identifier: violation.identifier,
            method: violation.method,
            tier: violation.tier,
            cost: violation.cost,
            resourceType: resourceType,
            riskLevel: violation.context?.riskLevel,
            threatLevel: violation.context?.threatLevel
          }
        });
      }
      
      // Check if we need to clean up
      if (this.violations.length > this.maxViolations) {
        this.cleanup();
      }
    } catch (error) {
      log(`Error recording rate limit violation: ${error}`, 'security');
    }
  }
  
  /**
   * Track a successful request
   * 
   * @param resourceType Resource type
   */
  public trackRequest(resourceType: string): void {
    try {
      // Increment request count for this resource type
      const count = this.resourceTypeCounts.get(resourceType) || 0;
      this.resourceTypeCounts.set(resourceType, count + 1);
    } catch (error) {
      log(`Error tracking request: ${error}`, 'security');
    }
  }
  
  /**
   * Generate a report of rate limit analytics
   * 
   * @returns Report of rate limit analytics
   */
  public generateReport(): any {
    try {
      // Get recent violations (last hour)
      const now = Date.now();
      const oneHourAgo = now - 60 * 60 * 1000;
      const recentViolations = this.violations.filter(v => new Date(v.timestamp).getTime() >= oneHourAgo);
      
      // Calculate total request count
      let totalRequests = 0;
      for (const count of this.resourceTypeCounts.values()) {
        totalRequests += count;
      }
      
      // Calculate total violations
      const totalViolations = this.violations.length;
      
      // Calculate global error rate
      const globalErrorRate = totalRequests > 0 ? totalViolations / (totalRequests + totalViolations) : 0;
      
      // Get top violated endpoints
      const endpointViolations: Record<string, number> = {};
      for (const v of recentViolations) {
        endpointViolations[v.endpoint] = (endpointViolations[v.endpoint] || 0) + 1;
      }
      
      // Sort endpoints by violation count
      const topEndpoints = Object.entries(endpointViolations)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([endpoint, count]) => ({ endpoint, count }));
      
      // Calculate per-resource type statistics
      const resourceTypes = Array.from(this.resourceTypeCounts.entries())
        .map(([type, count]) => {
          const violationCount = this.getResourceTypeViolationCount(type);
          const errorRate = count > 0 ? violationCount / (count + violationCount) : 0;
          
          return {
            type,
            requests: count,
            violations: violationCount,
            errorRate
          };
        })
        .sort((a, b) => b.violations - a.violations);
      
      // Return the report
      return {
        timestamp: new Date().toISOString(),
        summary: {
          totalRequests,
          totalViolations,
          recentViolations: recentViolations.length,
          globalErrorRate
        },
        topEndpoints,
        resourceTypes,
        lastCleanup: new Date(this.lastCleanup).toISOString()
      };
    } catch (error) {
      log(`Error generating analytics report: ${error}`, 'security');
      
      return {
        timestamp: new Date().toISOString(),
        error: 'Failed to generate analytics report'
      };
    }
  }
  
  /**
   * Clean up old violations
   */
  private cleanup(): void {
    try {
      const now = Date.now();
      const cutoff = now - this.maxAge;
      
      // Remove old violations
      this.violations = this.violations.filter(v => {
        const timestamp = new Date(v.timestamp).getTime();
        return timestamp >= cutoff;
      });
      
      // Update last cleanup time
      this.lastCleanup = now;
      
      log(`Rate limit analytics cleanup: ${this.violations.length} violations remaining`, 'security');
    } catch (error) {
      log(`Error cleaning up rate limit violations: ${error}`, 'security');
    }
  }
  
  /**
   * Increment violation count for an endpoint
   * 
   * @param endpoint Endpoint that was violated
   */
  private incrementEndpointViolation(endpoint: string): void {
    // Track most specific endpoint first
    const count = this.requestCounts.get(endpoint) || 0;
    this.requestCounts.set(endpoint, count + 1);
    
    // Also track the API path more generally if it's an API
    if (endpoint.startsWith('/api/')) {
      const apiPath = endpoint.split('/').slice(0, 3).join('/');
      const apiCount = this.requestCounts.get(apiPath) || 0;
      this.requestCounts.set(apiPath, apiCount + 1);
    }
  }
  
  /**
   * Increment violation count for a resource type
   * 
   * @param resourceType Resource type that was violated
   */
  private incrementResourceTypeViolation(resourceType: string): void {
    const key = `violation:${resourceType}`;
    const count = this.resourceTypeCounts.get(key) || 0;
    this.resourceTypeCounts.set(key, count + 1);
  }
  
  /**
   * Get violation count for a resource type
   * 
   * @param resourceType Resource type
   * @returns Violation count
   */
  private getResourceTypeViolationCount(resourceType: string): number {
    const key = `violation:${resourceType}`;
    return this.resourceTypeCounts.get(key) || 0;
  }
}