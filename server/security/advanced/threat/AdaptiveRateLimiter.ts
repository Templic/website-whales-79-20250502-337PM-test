/**
 * Adaptive Rate Limiter
 *
 * This class provides adaptive rate limiting capabilities.
 * It adjusts rate limits based on system load, threat levels, and other factors.
 */

import { log } from '../../../utils/logger';
import { RateLimitContext } from './RateLimitContextBuilder';
import { RateLimitAnalytics } from './RateLimitAnalytics';
import { threatDetectionService } from './ThreatDetectionService';

/**
 * Configuration options for the adaptive rate limiter
 */
export interface AdaptiveRateLimiterOptions {
  /**
   * Minimum multiplier to apply during bursts (0.1-1.0)
   * Lower values = more restrictive during bursts
   */
  minBurstMultiplier?: number;
  
  /**
   * Maximum multiplier to apply during quiet periods (1.0-10.0)
   * Higher values = more relaxed during quiet periods
   */
  maxBurstMultiplier?: number;
  
  /**
   * Threshold for system load (0.0-1.0)
   * When system load exceeds this threshold, rate limits become more restrictive
   */
  systemLoadThreshold?: number;
  
  /**
   * Impact of threat level on rate limits (0.0-1.0)
   * Higher values = more impact from threat level
   */
  threatLevelImpact?: number;
  
  /**
   * Threshold for error rate (0.0-1.0)
   * When error rate exceeds this threshold, rate limits become more restrictive
   */
  errorRateThreshold?: number;
  
  /**
   * Interval between adjustments in ms
   */
  adjustmentInterval?: number;
  
  /**
   * Analytics instance for error rate calculation
   */
  analytics?: RateLimitAnalytics;
}

/**
 * Provides adaptive rate limiting capabilities
 */
export class AdaptiveRateLimiter {
  private options: AdaptiveRateLimiterOptions;
  private resourceTypeMultipliers: Map<string, number> = new Map();
  private lastAdjustment: number = Date.now();
  private globalMultiplier: number = 1.0;
  private errorRates: Map<string, number> = new Map();
  private lastSystemLoad: number = 0;
  
  constructor(options: AdaptiveRateLimiterOptions = {}) {
    // Set options with defaults
    this.options = {
      minBurstMultiplier: options.minBurstMultiplier || 0.5,
      maxBurstMultiplier: options.maxBurstMultiplier || 2.0,
      systemLoadThreshold: options.systemLoadThreshold || 0.7,
      threatLevelImpact: options.threatLevelImpact || 0.5,
      errorRateThreshold: options.errorRateThreshold || 0.05,
      adjustmentInterval: options.adjustmentInterval || 60 * 1000, // 1 minute
      analytics: options.analytics
    };
    
    // Initialize resource type multipliers
    this.resourceTypeMultipliers.set('auth', 1.0);
    this.resourceTypeMultipliers.set('admin', 1.0);
    this.resourceTypeMultipliers.set('security', 1.0);
    this.resourceTypeMultipliers.set('user', 1.0);
    this.resourceTypeMultipliers.set('api', 1.0);
    this.resourceTypeMultipliers.set('static', 1.0);
    this.resourceTypeMultipliers.set('public', 1.0);
    
    // Set up adjustment interval
    setInterval(() => this.adjustRateLimits(), this.options.adjustmentInterval);
    
    // Log initialization
    log('Adaptive rate limiter initialized', 'security');
  }
  
  /**
   * Get adaptive multiplier based on context
   * 
   * @param context Rate limit context
   * @returns Adaptive multiplier
   */
  public getAdaptiveMultiplier(context: RateLimitContext): number {
    try {
      // Start with global multiplier
      let multiplier = this.globalMultiplier;
      
      // Apply resource type multiplier
      const resourceTypeMultiplier = this.resourceTypeMultipliers.get(context.resourceType) || 1.0;
      multiplier *= resourceTypeMultiplier;
      
      // Adjust for authenticated users
      if (context.authenticated) {
        multiplier *= 1.2; // 20% boost for authenticated users
      }
      
      // Reduce for blacklisted IPs
      if (context.isBlacklisted) {
        multiplier *= 0.1; // 90% reduction for blacklisted
      }
      
      // Reduce based on threat level
      if (context.threatLevel > 0) {
        const threatAdjustment = 1.0 - (context.threatLevel * this.options.threatLevelImpact!);
        multiplier *= threatAdjustment;
      }
      
      // Boost for good bots
      if (context.isGoodBot) {
        multiplier *= 1.5; // 50% boost for good bots
      }
      
      // Severe restriction for bad bots
      if (context.isBadBot) {
        multiplier *= 0.2; // 80% reduction for bad bots
      }
      
      // Apply privilege-based multiplier based on role weight
      // Lower weight = higher privilege = higher multiplier
      if (context.roleWeight < 10) {
        // Calculate privilege multiplier (e.g., admins get higher multiplier)
        const privilegeMultiplier = 1.0 + ((10 - context.roleWeight) / 10.0);
        multiplier *= privilegeMultiplier;
      }
      
      // Clamp multiplier between min and max
      multiplier = Math.max(
        this.options.minBurstMultiplier!, 
        Math.min(this.options.maxBurstMultiplier!, multiplier)
      );
      
      return multiplier;
    } catch (error) {
      log(`Error calculating adaptive multiplier: ${error}`, 'security');
      
      // Return neutral multiplier on error
      return 1.0;
    }
  }
  
  /**
   * Force recalculation of adaptive factors
   */
  public forceRecalculation(): void {
    try {
      this.adjustRateLimits();
      log('Forced recalculation of adaptive rate limits', 'security');
    } catch (error) {
      log(`Error forcing recalculation: ${error}`, 'security');
    }
  }
  
  /**
   * Get current adjustment metrics
   * 
   * @returns Adjustment metrics
   */
  public getAdjustmentMetrics(): any {
    try {
      return {
        globalMultiplier: this.globalMultiplier,
        resourceTypeMultipliers: Object.fromEntries(this.resourceTypeMultipliers),
        errorRates: Object.fromEntries(this.errorRates),
        systemLoad: this.lastSystemLoad,
        globalThreatLevel: threatDetectionService.getGlobalThreatLevel(),
        threatCategory: threatDetectionService.getThreatCategory(),
        lastAdjustment: new Date(this.lastAdjustment).toISOString()
      };
    } catch (error) {
      log(`Error getting adjustment metrics: ${error}`, 'security');
      
      return {
        error: 'Failed to get adjustment metrics',
        timestamp: new Date().toISOString()
      };
    }
  }
  
  /**
   * Adjust rate limits based on system conditions
   */
  private adjustRateLimits(): void {
    try {
      // Get current time
      const now = Date.now();
      
      // Check if it's time to adjust
      if (now - this.lastAdjustment < this.options.adjustmentInterval!) {
        return;
      }
      
      // Get system load (approximated for Replit)
      const systemLoad = this.estimateSystemLoad();
      this.lastSystemLoad = systemLoad;
      
      // Get global threat level
      const threatLevel = threatDetectionService.getGlobalThreatLevel();
      
      // Calculate global multiplier
      let newGlobalMultiplier = 1.0;
      
      // Adjust for system load
      if (systemLoad > this.options.systemLoadThreshold!) {
        // Reduce capacity when system load is high
        const loadFactor = 1.0 - ((systemLoad - this.options.systemLoadThreshold!) / (1.0 - this.options.systemLoadThreshold!));
        newGlobalMultiplier *= Math.max(0.5, loadFactor);
      } else {
        // Increase capacity when system load is low
        const loadBoost = 1.0 + ((this.options.systemLoadThreshold! - systemLoad) / this.options.systemLoadThreshold!);
        newGlobalMultiplier *= Math.min(1.5, loadBoost);
      }
      
      // Adjust for threat level
      if (threatLevel > 0) {
        const threatFactor = 1.0 - (threatLevel * this.options.threatLevelImpact!);
        newGlobalMultiplier *= threatFactor;
      }
      
      // Get error rates if analytics are available
      if (this.options.analytics) {
        const report = this.options.analytics.generateReport();
        
        if (report && report.summary) {
          // Get global error rate
          const globalErrorRate = report.summary.violationRate || 0;
          
          // Store global error rate
          this.errorRates.set('global', globalErrorRate);
          
          // Adjust global multiplier based on error rate
          if (globalErrorRate > this.options.errorRateThreshold!) {
            const errorFactor = 1.0 - ((globalErrorRate - this.options.errorRateThreshold!) / (1.0 - this.options.errorRateThreshold!));
            newGlobalMultiplier *= Math.max(0.5, errorFactor);
          }
          
          // Adjust resource type multipliers based on error rates
          if (report.requestsByResourceType) {
            for (const { resourceType, count } of report.requestsByResourceType) {
              // Get violations for this resource type
              const violations = report.topEndpoints?.find(e => e.endpoint.includes(`/${resourceType}/`))?.count || 0;
              
              // Calculate error rate
              const typeErrorRate = count > 0 ? violations / count : 0;
              
              // Store error rate
              this.errorRates.set(resourceType, typeErrorRate);
              
              // Get current multiplier
              const currentMultiplier = this.resourceTypeMultipliers.get(resourceType) || 1.0;
              
              // Calculate new multiplier
              let newMultiplier = currentMultiplier;
              
              if (typeErrorRate > this.options.errorRateThreshold!) {
                // Reduce multiplier when error rate is high
                const typeFactor = 1.0 - ((typeErrorRate - this.options.errorRateThreshold!) / (1.0 - this.options.errorRateThreshold!));
                newMultiplier *= Math.max(0.5, typeFactor);
              } else {
                // Increase multiplier when error rate is low
                const typeBoost = 1.0 + ((this.options.errorRateThreshold! - typeErrorRate) / this.options.errorRateThreshold!);
                newMultiplier *= Math.min(1.5, typeBoost);
              }
              
              // Clamp multiplier
              newMultiplier = Math.max(
                this.options.minBurstMultiplier!, 
                Math.min(this.options.maxBurstMultiplier!, newMultiplier)
              );
              
              // Update multiplier (with dampening to avoid oscillation)
              this.resourceTypeMultipliers.set(
                resourceType, 
                currentMultiplier * 0.7 + newMultiplier * 0.3
              );
            }
          }
        }
      }
      
      // Clamp global multiplier
      newGlobalMultiplier = Math.max(
        this.options.minBurstMultiplier!, 
        Math.min(this.options.maxBurstMultiplier!, newGlobalMultiplier)
      );
      
      // Update global multiplier (with dampening to avoid oscillation)
      this.globalMultiplier = this.globalMultiplier * 0.7 + newGlobalMultiplier * 0.3;
      
      // Update last adjustment time
      this.lastAdjustment = now;
      
      // Log adjustment
      if (Math.abs(this.globalMultiplier - 1.0) > 0.1) {
        log(`Adaptive rate limits adjusted: global multiplier = ${this.globalMultiplier.toFixed(2)}`, 'security');
      }
    } catch (error) {
      log(`Error adjusting rate limits: ${error}`, 'security');
    }
  }
  
  /**
   * Estimate system load
   * 
   * @returns Estimated system load (0-1)
   */
  private estimateSystemLoad(): number {
    try {
      // On Replit, we don't have direct access to system metrics
      // We'll use a simple heuristic based on response times
      
      // Start with a base load of 0.2 (Replit VMs usually have some baseline load)
      let estimatedLoad = 0.2;
      
      // If the global threat level is high, assume higher load
      const threatLevel = threatDetectionService.getGlobalThreatLevel();
      if (threatLevel > 0.5) {
        estimatedLoad += 0.2;
      }
      
      // If we have analytics, estimate load based on request volume
      if (this.options.analytics) {
        const report = this.options.analytics.generateReport();
        if (report && report.summary) {
          // Use request count as a proxy for load
          // Assume a high load after 10,000 requests since last adjustment
          const requestCount = report.summary.totalRequests || 0;
          const requestsPerSecond = requestCount / (this.options.adjustmentInterval! / 1000);
          
          // Add load based on requests per second
          // Assuming 100 req/s is high load for a Replit app
          const requestLoad = Math.min(0.5, requestsPerSecond / 100);
          estimatedLoad += requestLoad;
        }
      }
      
      // Clamp load between 0 and 1
      return Math.max(0, Math.min(1, estimatedLoad));
    } catch (error) {
      log(`Error estimating system load: ${error}`, 'security');
      
      // Return moderate load on error
      return 0.5;
    }
  }
}