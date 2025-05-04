/**
 * Adaptive Rate Limiter
 *
 * This class dynamically adjusts rate limits based on system conditions and security threat levels.
 * It can tighten limits during high load or security incidents, and relax them during normal operation.
 */

import { RateLimitContext } from './RateLimitContextBuilder';
import { RateLimitAnalytics } from './RateLimitAnalytics';

export interface AdaptiveRateLimiterConfig {
  minBurstMultiplier: number;
  maxBurstMultiplier: number;
  systemLoadThreshold: number;
  threatLevelImpact: number;
  errorRateThreshold: number;
  adjustmentInterval: number;
  analytics: RateLimitAnalytics;
}

export class AdaptiveRateLimiter {
  private config: AdaptiveRateLimiterConfig;
  private lastAdjustmentTime: number;
  private currentAdjustments: Map<string, number>;
  private systemLoadFactor: number;
  private threatFactor: number;
  private errorRateFactor: number;
  
  constructor(config: AdaptiveRateLimiterConfig) {
    this.config = {
      minBurstMultiplier: 0.5,
      maxBurstMultiplier: 3.0,
      systemLoadThreshold: 0.75,
      threatLevelImpact: 0.5,
      errorRateThreshold: 0.1,
      adjustmentInterval: 60000, // 1 minute
      analytics: config.analytics,
      ...config
    };
    
    this.lastAdjustmentTime = Date.now();
    this.currentAdjustments = new Map();
    this.systemLoadFactor = 1.0;
    this.threatFactor = 1.0;
    this.errorRateFactor = 1.0;
  }
  
  /**
   * Get the adaptive multiplier for a given context
   * 
   * @param context The rate limit context
   * @returns The multiplier to apply to the rate limit
   */
  public getAdaptiveMultiplier(context: RateLimitContext): number {
    // Check if we need to recalculate global factors
    this.updateGlobalFactorsIfNeeded();
    
    // Start with the global factors
    let multiplier = this.systemLoadFactor * this.threatFactor * this.errorRateFactor;
    
    // Get any specific adjustment for this resource type
    const resourceTypeAdjustment = this.currentAdjustments.get(context.resourceType) || 1.0;
    multiplier *= resourceTypeAdjustment;
    
    // Adjust based on the specific threat level for this context
    if (context.threatLevel > 0) {
      const threatAdjustment = 1.0 - (context.threatLevel * this.config.threatLevelImpact);
      multiplier *= Math.max(0.1, threatAdjustment); // Ensure at least 10% capacity
    }
    
    // Apply per-user adjustments for authenticated users
    if (context.authenticated && context.userId) {
      const userKey = `user:${context.userId}`;
      const userAdjustment = this.currentAdjustments.get(userKey) || 1.0;
      multiplier *= userAdjustment;
    }
    
    // Ensure the multiplier is within bounds
    return Math.max(
      this.config.minBurstMultiplier,
      Math.min(this.config.maxBurstMultiplier, multiplier)
    );
  }
  
  /**
   * Update the global factors if needed based on the adjustment interval
   */
  private updateGlobalFactorsIfNeeded(): void {
    const now = Date.now();
    
    // Only update at most once per adjustment interval
    if (now - this.lastAdjustmentTime >= this.config.adjustmentInterval) {
      this.updateSystemLoadFactor();
      this.updateThreatFactor();
      this.updateErrorRateFactor();
      this.updateResourceTypeAdjustments();
      this.lastAdjustmentTime = now;
    }
  }
  
  /**
   * Update the system load factor based on current system load
   */
  private updateSystemLoadFactor(): void {
    // Get the current system load (0-1)
    const systemLoad = this.getCurrentSystemLoad();
    
    // Calculate the factor - linear reduction as load approaches threshold
    if (systemLoad > this.config.systemLoadThreshold) {
      // Above threshold - reduce capacity
      const overageRatio = (systemLoad - this.config.systemLoadThreshold) / 
        (1 - this.config.systemLoadThreshold);
      
      // Scale down as load increases above threshold
      this.systemLoadFactor = 1.0 - (overageRatio * 0.5);
    } else {
      // Below threshold - potentially increase capacity
      const headroomRatio = (this.config.systemLoadThreshold - systemLoad) / 
        this.config.systemLoadThreshold;
      
      // Scale up slightly when load is well below threshold
      this.systemLoadFactor = 1.0 + (headroomRatio * 0.2);
    }
    
    // Ensure the factor is within bounds
    this.systemLoadFactor = Math.max(0.5, Math.min(1.2, this.systemLoadFactor));
  }
  
  /**
   * Update the threat factor based on current threat level
   */
  private updateThreatFactor(): void {
    // Get the current global threat level (0-1)
    const globalThreatLevel = this.getGlobalThreatLevel();
    
    // Calculate the factor - exponential reduction as threat level increases
    if (globalThreatLevel > 0.1) {
      // Above minimal threshold - reduce capacity
      this.threatFactor = 1.0 - (Math.pow(globalThreatLevel, 1.5) * 0.6);
    } else {
      // Below minimal threshold - normal capacity
      this.threatFactor = 1.0;
    }
    
    // Ensure the factor is within bounds
    this.threatFactor = Math.max(0.4, Math.min(1.0, this.threatFactor));
  }
  
  /**
   * Update the error rate factor based on current error rates
   */
  private updateErrorRateFactor(): void {
    // Get the current error rate (0-1)
    const errorRate = this.getGlobalErrorRate();
    
    // Calculate the factor - linear reduction as error rate increases
    if (errorRate > this.config.errorRateThreshold) {
      // Above threshold - reduce capacity
      const overageRatio = (errorRate - this.config.errorRateThreshold) / 
        (1 - this.config.errorRateThreshold);
      
      // Scale down as error rate increases above threshold
      this.errorRateFactor = 1.0 - (overageRatio * 0.4);
    } else {
      // Below threshold - normal capacity
      this.errorRateFactor = 1.0;
    }
    
    // Ensure the factor is within bounds
    this.errorRateFactor = Math.max(0.6, Math.min(1.0, this.errorRateFactor));
  }
  
  /**
   * Update adjustments for different resource types
   */
  private updateResourceTypeAdjustments(): void {
    // Get analytics about recent violations by resource type
    const analytics = this.config.analytics.getResourceTypeViolations();
    
    // Reset existing resource type adjustments
    this.currentAdjustments = new Map();
    
    // Calculate new adjustments based on violation rates
    for (const [resourceType, violationRate] of Object.entries(analytics.violationRatesByType)) {
      if (violationRate > 0.1) {
        // Higher violation rates lead to lower multipliers
        const adjustment = 1.0 - (violationRate * 0.6);
        this.currentAdjustments.set(resourceType, Math.max(0.4, adjustment));
      }
    }
    
    // Special handling for any suspicious users
    const suspiciousUsers = this.config.analytics.getSuspiciousUsers();
    
    for (const user of suspiciousUsers) {
      // Apply a significant reduction to suspicious users
      this.currentAdjustments.set(`user:${user.userId}`, 0.3);
    }
  }
  
  /**
   * Get the current system load
   * 
   * @returns A value between 0 and 1 representing system load
   */
  private getCurrentSystemLoad(): number {
    // Check if we have real metrics from the system monitor
    if (global.systemMetrics && typeof global.systemMetrics.cpuUsage === 'number') {
      return global.systemMetrics.cpuUsage / 100;
    }
    
    // Fallback to random value for this example
    // In a real system, this would be replaced with actual system metrics
    return Math.random() * 0.7;
  }
  
  /**
   * Get the current global threat level
   * 
   * @returns A value between 0 and 1 representing threat level
   */
  private getGlobalThreatLevel(): number {
    // Check if we have threat metrics
    if (global.securityMetrics && typeof global.securityMetrics.threatLevel === 'number') {
      return global.securityMetrics.threatLevel / 100;
    }
    
    // Get from threat detection service if available
    const threatDetectionService = global.threatDetectionService;
    if (threatDetectionService && typeof threatDetectionService.getGlobalThreatLevel === 'function') {
      return threatDetectionService.getGlobalThreatLevel();
    }
    
    // Fallback to analytics-based estimation
    const suspiciousRequests = this.config.analytics.getSuspiciousRequestRate();
    return Math.min(1.0, suspiciousRequests * 5);
  }
  
  /**
   * Get the current global error rate
   * 
   * @returns A value between 0 and 1 representing error rate
   */
  private getGlobalErrorRate(): number {
    // Check if we have error metrics
    if (global.applicationMetrics && typeof global.applicationMetrics.errorRate === 'number') {
      return global.applicationMetrics.errorRate;
    }
    
    // Use analytics data
    return this.config.analytics.getGlobalErrorRate();
  }
  
  /**
   * Get the current adjustment metrics
   * 
   * @returns An object with all the current metrics and adjustments
   */
  public getAdjustmentMetrics() {
    return {
      systemLoadFactor: this.systemLoadFactor,
      threatFactor: this.threatFactor,
      errorRateFactor: this.errorRateFactor,
      lastAdjustmentTime: this.lastAdjustmentTime,
      resourceTypeAdjustments: Object.fromEntries(this.currentAdjustments),
      effectiveMultipliers: {
        normal: this.systemLoadFactor * this.threatFactor * this.errorRateFactor,
        auth: this.getAdaptiveMultiplier({ resourceType: 'auth' } as RateLimitContext),
        admin: this.getAdaptiveMultiplier({ resourceType: 'admin' } as RateLimitContext),
        security: this.getAdaptiveMultiplier({ resourceType: 'security' } as RateLimitContext),
        api: this.getAdaptiveMultiplier({ resourceType: 'api' } as RateLimitContext),
        public: this.getAdaptiveMultiplier({ resourceType: 'public' } as RateLimitContext)
      }
    };
  }
  
  /**
   * Force an immediate recalculation of all factors
   */
  public forceRecalculation(): void {
    this.updateSystemLoadFactor();
    this.updateThreatFactor();
    this.updateErrorRateFactor();
    this.updateResourceTypeAdjustments();
    this.lastAdjustmentTime = Date.now();
  }
}