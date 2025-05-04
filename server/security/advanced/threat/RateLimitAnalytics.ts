/**
 * Rate Limit Analytics
 *
 * This class tracks rate limit violations and generates reports.
 */

import { log } from '../../../utils/logger';
import { RateLimitContext } from './RateLimitContextBuilder';
import { recordAuditEvent } from '../../secureAuditTrail';

// Violation interface
export interface RateLimitViolation {
  timestamp: string;
  ip: string;
  identifier: string;
  endpoint: string;
  method: string;
  tier: string;
  cost: number;
  context: RateLimitContext;
  adaptiveMultiplier: number;
}

// Analytics storage
export class RateLimitAnalytics {
  private violations: RateLimitViolation[] = [];
  private violationsByIp: Map<string, number> = new Map();
  private violationsByIdentifier: Map<string, number> = new Map();
  private violationsByEndpoint: Map<string, number> = new Map();
  private requestsByResourceType: Map<string, number> = new Map();
  private totalRequests: number = 0;
  private lastCleanup: number = Date.now();
  private logStream: any = null;
  
  constructor() {
    // Set up clean up interval
    setInterval(() => this.cleanup(), 24 * 60 * 60 * 1000); // Every 24 hours
  }
  
  /**
   * Record a rate limit violation
   * 
   * @param violation Rate limit violation
   */
  public recordViolation(violation: RateLimitViolation): void {
    try {
      // Add to violations array
      this.violations.push(violation);
      
      // Update violation counts
      this.incrementViolation(this.violationsByIp, violation.ip);
      this.incrementViolation(this.violationsByIdentifier, violation.identifier);
      this.incrementViolation(this.violationsByEndpoint, violation.endpoint);
      
      // Log the violation
      if (this.logStream) {
        this.logStream.write(`Violation: ${violation.ip} (${violation.identifier}) exceeded rate limit for ${violation.endpoint} (${violation.method})\n`);
      }
      
      // Record in audit trail if first violation for this IP/endpoint combo
      const violationKey = `${violation.ip}:${violation.endpoint}`;
      if (!this.violationsByIp.has(violationKey) || this.violationsByIp.get(violationKey) === 1) {
        recordAuditEvent({
          timestamp: violation.timestamp,
          action: 'RATE_LIMIT_EXCEEDED',
          resource: violation.endpoint,
          result: 'blocked',
          severity: 'warning',
          details: {
            ip: violation.ip,
            identifier: violation.identifier,
            endpoint: violation.endpoint,
            method: violation.method,
            tier: violation.tier
          }
        });
      }
      
      // Log if this IP is showing a pattern of violations
      const ipViolations = this.violationsByIp.get(violation.ip) || 0;
      if (ipViolations >= 10) {
        log(`High violation count from IP ${violation.ip}: ${ipViolations} violations`, 'security');
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
      // Increment request count
      this.totalRequests++;
      
      // Increment resource type count
      this.incrementViolation(this.requestsByResourceType, resourceType);
    } catch (error) {
      log(`Error tracking request: ${error}`, 'security');
    }
  }
  
  /**
   * Set log stream
   * 
   * @param stream Log stream
   */
  public setLogStream(stream: any): void {
    this.logStream = stream;
  }
  
  /**
   * Generate an analytics report
   * 
   * @returns Analytics report
   */
  public generateReport(): any {
    try {
      // Calculate violation rate
      const violationRate = this.totalRequests > 0 
        ? this.violations.length / this.totalRequests 
        : 0;
      
      // Get top violating IPs
      const topViolatingIps = Array.from(this.violationsByIp.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([ip, count]) => ({ ip, count }));
      
      // Get top violating identifiers
      const topViolatingIdentifiers = Array.from(this.violationsByIdentifier.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([identifier, count]) => ({ identifier, count }));
      
      // Get top violated endpoints
      const topViolatedEndpoints = Array.from(this.violationsByEndpoint.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([endpoint, count]) => ({ endpoint, count }));
      
      // Get request breakdown by resource type
      const requestsByResourceType = Array.from(this.requestsByResourceType.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([resourceType, count]) => ({ 
          resourceType, 
          count,
          percentage: this.totalRequests > 0 
            ? (count / this.totalRequests) * 100 
            : 0
        }));
      
      // Calculate global error rate
      const globalErrorRate = this.totalRequests > 0 
        ? this.violations.length / this.totalRequests 
        : 0;
      
      // Create return object
      return {
        timestamp: new Date().toISOString(),
        summary: {
          totalViolations: this.violations.length,
          totalRequests: this.totalRequests,
          violationRate,
          globalErrorRate,
          uniqueIps: this.violationsByIp.size,
          uniqueEndpoints: this.violationsByEndpoint.size
        },
        topViolators: topViolatingIps,
        topIdentifiers: topViolatingIdentifiers,
        topEndpoints: topViolatedEndpoints,
        requestsByResourceType,
        recentViolations: this.violations.slice(-10).map(v => ({
          timestamp: v.timestamp,
          ip: v.ip,
          endpoint: v.endpoint,
          method: v.method,
          tier: v.tier
        }))
      };
    } catch (error) {
      log(`Error generating rate limit analytics report: ${error}`, 'security');
      
      return {
        timestamp: new Date().toISOString(),
        error: 'Failed to generate analytics report'
      };
    }
  }
  
  /**
   * Clean up old data
   */
  private cleanup(): void {
    try {
      // Calculate cut-off time (7 days)
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      const cutoffTime = cutoff.toISOString();
      
      // Track number of violations before cleanup
      const beforeCount = this.violations.length;
      
      // Filter out old violations
      this.violations = this.violations.filter(v => v.timestamp >= cutoffTime);
      
      // Rebuild violation counts
      this.violationsByIp.clear();
      this.violationsByIdentifier.clear();
      this.violationsByEndpoint.clear();
      
      for (const violation of this.violations) {
        this.incrementViolation(this.violationsByIp, violation.ip);
        this.incrementViolation(this.violationsByIdentifier, violation.identifier);
        this.incrementViolation(this.violationsByEndpoint, violation.endpoint);
      }
      
      // Reset total requests if cleanup is substantial
      if (beforeCount - this.violations.length > 1000) {
        // If we cleared a lot of violations, also reset request counts for accuracy
        this.requestsByResourceType.clear();
        this.totalRequests = 0;
      }
      
      // Log cleanup
      log(`Rate limit analytics cleanup: Removed ${beforeCount - this.violations.length} old violations`, 'security');
      
      // Update last cleanup time
      this.lastCleanup = Date.now();
    } catch (error) {
      log(`Error cleaning up rate limit analytics: ${error}`, 'security');
    }
  }
  
  /**
   * Increment a violation counter
   * 
   * @param map Map to update
   * @param key Key to increment
   */
  private incrementViolation(map: Map<string, number>, key: string): void {
    const count = map.get(key) || 0;
    map.set(key, count + 1);
  }
}