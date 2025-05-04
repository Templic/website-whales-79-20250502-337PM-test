/**
 * Adaptive Rate Limiter
 *
 * This class provides dynamic adjustment of rate limits based on system conditions.
 * It can scale rate limits up or down based on:
 * 1. System load (CPU, memory usage)
 * 2. Global security threat level
 * 3. Error rates and request patterns
 */

import os from 'os';
import { RateLimitContext } from './RateLimitContextBuilder';
import { RateLimitAnalytics } from './RateLimitAnalytics';
import { threatDetectionService } from './ThreatDetectionService';
import { log } from '../../../utils/logger';

// Configuration for the adaptive rate limiter
export interface AdaptiveRateLimiterConfig {
  minBurstMultiplier: number;       // Minimum multiplier (tight limits)
  maxBurstMultiplier: number;       // Maximum multiplier (relaxed limits)
  systemLoadThreshold: number;      // CPU load threshold (0-1)
  threatLevelImpact: number;        // How much threat level affects limits
  errorRateThreshold: number;       // Error rate threshold (0-1)
  adjustmentInterval: number;       // Milliseconds between adjustments
  analytics?: RateLimitAnalytics;   // Analytics instance
}

export class AdaptiveRateLimiter {
  private config: AdaptiveRateLimiterConfig;
  private lastAdjustmentTime: number = Date.now();
  private systemLoadFactor: number = 1.0;
  private threatFactor: number = 1.0;
  private errorRateFactor: number = 1.0;
  private effectiveMultipliers: Map<string, number> = new Map();
  private analytics?: RateLimitAnalytics;
  
  constructor(config: {
    minBurstMultiplier?: number,
    maxBurstMultiplier?: number,
    systemLoadThreshold?: number,
    threatLevelImpact?: number,
    errorRateThreshold?: number,
    adjustmentInterval?: number,
    analytics?: RateLimitAnalytics
  }) {
    // Set default configuration
    this.config = {
      minBurstMultiplier: config.minBurstMultiplier ?? 0.5,
      maxBurstMultiplier: config.maxBurstMultiplier ?? 2.0,
      systemLoadThreshold: config.systemLoadThreshold ?? 0.7,
      threatLevelImpact: config.threatLevelImpact ?? 0.5,
      errorRateThreshold: config.errorRateThreshold ?? 0.05,
      adjustmentInterval: config.adjustmentInterval ?? 60000, // 1 minute
      analytics: config.analytics
    };
    
    // Store analytics instance
    this.analytics = this.config.analytics;
    
    // Initialize with a factor of 1.0 (neutral)
    this.systemLoadFactor = 1.0;
    this.threatFactor = 1.0;
    this.errorRateFactor = 1.0;
    
    // Schedule periodic adjustments
    this.scheduleAdjustments();
  }
  
  /**
   * Get the adaptive multiplier for a context
   * 
   * @param context The rate limiting context
   * @returns Multiplier to apply to rate limits
   */
  public getAdaptiveMultiplier(context: RateLimitContext): number {
    try {
      // Check if it's time to adjust factors
      this.checkAndAdjustFactors();
      
      // Start with the base multiplier
      let multiplier = 1.0;
      
      // Apply system load factor
      multiplier *= this.systemLoadFactor;
      
      // Apply threat factor adjustment
      const threatFactor = this.getThreatFactorForContext(context);
      multiplier *= threatFactor;
      
      // Apply error rate factor
      multiplier *= this.errorRateFactor;
      
      // Apply context-specific factors
      
      // Higher role weights get more capacity (higher multiplier)
      if (context.roleWeight < 1.0) {
        // Admin/moderator roles
        multiplier *= (2.0 - context.roleWeight);
      } else if (context.roleWeight > 1.0) {
        // Anonymous users
        multiplier /= context.roleWeight;
      }
      
      // Adjust based on resource sensitivity (inverse relationship)
      if (context.resourceSensitivity > 1.0) {
        // More sensitive resources get tighter limits
        multiplier /= Math.sqrt(context.resourceSensitivity);
      }
      
      // Clamp to configured range
      multiplier = Math.max(
        this.config.minBurstMultiplier, 
        Math.min(this.config.maxBurstMultiplier, multiplier)
      );
      
      // Cache the effective multiplier for this resource type
      this.effectiveMultipliers.set(context.resourceType, multiplier);
      
      return multiplier;
    } catch (error) {
      log(`Error getting adaptive multiplier: ${error}`, 'security');
      return 1.0; // Neutral factor on error
    }
  }
  
  /**
   * Force recalculation of adaptive factors
   */
  public forceRecalculation(): void {
    try {
      this.adjustFactors();
      this.lastAdjustmentTime = Date.now();
    } catch (error) {
      log(`Error forcing recalculation: ${error}`, 'security');
    }
  }
  
  /**
   * Get the current adjustment metrics
   * 
   * @returns Current metrics for the adaptive rate limiter
   */
  public getAdjustmentMetrics(): any {
    // Convert effectiveMultipliers map to a plain object
    const multipliers: Record<string, number> = {};
    for (const [resourceType, multiplier] of this.effectiveMultipliers.entries()) {
      multipliers[resourceType] = multiplier;
    }
    
    return {
      systemLoadFactor: this.systemLoadFactor,
      threatFactor: this.threatFactor,
      errorRateFactor: this.errorRateFactor,
      effectiveMultipliers: multipliers,
      config: {
        minBurstMultiplier: this.config.minBurstMultiplier,
        maxBurstMultiplier: this.config.maxBurstMultiplier,
        systemLoadThreshold: this.config.systemLoadThreshold,
        threatLevelImpact: this.config.threatLevelImpact,
        errorRateThreshold: this.config.errorRateThreshold,
        adjustmentInterval: this.config.adjustmentInterval
      },
      lastAdjustment: new Date(this.lastAdjustmentTime).toISOString()
    };
  }
  
  /**
   * Schedule periodic adjustments
   */
  private scheduleAdjustments(): void {
    setInterval(() => {
      try {
        this.adjustFactors();
      } catch (error) {
        log(`Error in scheduled adjustment: ${error}`, 'security');
      }
    }, this.config.adjustmentInterval);
  }
  
  /**
   * Check if it's time to adjust and do so if necessary
   */
  private checkAndAdjustFactors(): void {
    const now = Date.now();
    if (now - this.lastAdjustmentTime >= this.config.adjustmentInterval) {
      try {
        this.adjustFactors();
        this.lastAdjustmentTime = now;
      } catch (error) {
        log(`Error adjusting factors: ${error}`, 'security');
      }
    }
  }
  
  /**
   * Adjust all factors based on current conditions
   */
  private adjustFactors(): void {
    // Adjust based on system load
    this.adjustSystemLoadFactor();
    
    // Adjust based on global threat level
    this.adjustThreatFactor();
    
    // Adjust based on error rates
    this.adjustErrorRateFactor();
    
    // Log the adjustment
    log(`Adjusted rate limit factors: system=${this.systemLoadFactor.toFixed(2)}, threat=${this.threatFactor.toFixed(2)}, error=${this.errorRateFactor.toFixed(2)}`, 'security');
  }
  
  /**
   * Adjust the system load factor based on CPU and memory usage
   */
  private adjustSystemLoadFactor(): void {
    try {
      // Get CPU load (last 1 minute average)
      const cpuLoad = os.loadavg()[0] / os.cpus().length;
      
      // Get memory usage
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const memoryUsage = 1 - (freeMemory / totalMemory);
      
      // Use the higher of the two as the load indicator
      const systemLoad = Math.max(cpuLoad, memoryUsage);
      
      // Adjust the factor based on load
      if (systemLoad >= this.config.systemLoadThreshold) {
        // System is under load, tighten rate limits
        const loadRatio = (systemLoad - this.config.systemLoadThreshold) / 
                         (1 - this.config.systemLoadThreshold);
        
        // Scale from 1.0 down to minBurstMultiplier as load increases
        this.systemLoadFactor = 1.0 - (loadRatio * (1.0 - this.config.minBurstMultiplier));
      } else {
        // System has capacity, can be more lenient
        const loadRatio = systemLoad / this.config.systemLoadThreshold;
        
        // Scale from maxBurstMultiplier down to 1.0 as load approaches threshold
        this.systemLoadFactor = this.config.maxBurstMultiplier - 
                               (loadRatio * (this.config.maxBurstMultiplier - 1.0));
      }
      
      // Clamp to configured range
      this.systemLoadFactor = Math.max(
        this.config.minBurstMultiplier, 
        Math.min(this.config.maxBurstMultiplier, this.systemLoadFactor)
      );
      
      // Log CPU and memory metrics periodically
      if (globalThis.DEBUG || Math.random() < 0.1) { // Log ~10% of the time
        log(`System metrics - CPU: ${(cpuLoad * 100).toFixed(1)}%, Memory: ${(memoryUsage * 100).toFixed(1)}%, Rate limit factor: ${this.systemLoadFactor.toFixed(2)}`, 'security');
      }
    } catch (error) {
      log(`Error adjusting system load factor: ${error}`, 'security');
      
      // Reset to neutral on error
      this.systemLoadFactor = 1.0;
    }
  }
  
  /**
   * Adjust the threat factor based on global security threat level
   */
  private adjustThreatFactor(): void {
    try {
      // Get the global threat level from the threat detection service
      const globalThreatLevel = threatDetectionService.getGlobalThreatLevel();
      
      // Scale inversely - higher threat means lower factor (tighter limits)
      const threatImpact = globalThreatLevel * this.config.threatLevelImpact;
      this.threatFactor = 1.0 - threatImpact;
      
      // Clamp to configured range
      this.threatFactor = Math.max(
        this.config.minBurstMultiplier, 
        Math.min(this.config.maxBurstMultiplier, this.threatFactor)
      );
      
      // Log threat level periodically
      if (globalThis.DEBUG || Math.random() < 0.1) { // Log ~10% of the time
        log(`Global threat level: ${globalThreatLevel.toFixed(2)}, Threat factor: ${this.threatFactor.toFixed(2)}`, 'security');
      }
    } catch (error) {
      log(`Error adjusting threat factor: ${error}`, 'security');
      
      // Reset to neutral on error
      this.threatFactor = 1.0;
    }
  }
  
  /**
   * Adjust the error rate factor based on recent rate limit violations
   */
  private adjustErrorRateFactor(): void {
    try {
      // Skip if analytics not available
      if (!this.analytics) {
        this.errorRateFactor = 1.0;
        return;
      }
      
      // Get a report from analytics
      const report = this.analytics.generateReport();
      
      // Check the global error rate
      const errorRate = report.summary.globalErrorRate || 0;
      
      // Adjust factor based on error rate
      if (errorRate >= this.config.errorRateThreshold) {
        // High error rate, tighten limits
        const errorRatio = (errorRate - this.config.errorRateThreshold) / 
                          (1 - this.config.errorRateThreshold);
        
        // Scale from 1.0 down to minBurstMultiplier as error rate increases
        this.errorRateFactor = 1.0 - (errorRatio * (1.0 - this.config.minBurstMultiplier));
      } else {
        // Low error rate, can be more lenient
        const errorRatio = errorRate / this.config.errorRateThreshold;
        
        // Scale from maxBurstMultiplier down to 1.0 as error rate approaches threshold
        this.errorRateFactor = this.config.maxBurstMultiplier - 
                             (errorRatio * (this.config.maxBurstMultiplier - 1.0));
      }
      
      // Clamp to configured range
      this.errorRateFactor = Math.max(
        this.config.minBurstMultiplier, 
        Math.min(this.config.maxBurstMultiplier, this.errorRateFactor)
      );
      
      // Log error rate periodically
      if (globalThis.DEBUG || Math.random() < 0.1) { // Log ~10% of the time
        log(`Error rate: ${(errorRate * 100).toFixed(2)}%, Error rate factor: ${this.errorRateFactor.toFixed(2)}`, 'security');
      }
    } catch (error) {
      log(`Error adjusting error rate factor: ${error}`, 'security');
      
      // Reset to neutral on error
      this.errorRateFactor = 1.0;
    }
  }
  
  /**
   * Get a threat factor specific to the given context
   * 
   * @param context The rate limiting context
   * @returns A context-specific threat factor
   */
  private getThreatFactorForContext(context: RateLimitContext): number {
    try {
      // Start with the global threat factor
      let contextThreatFactor = this.threatFactor;
      
      // Adjust based on the context's own threat level
      if (context.threatLevel > 0) {
        // Higher threat level means lower factor (tighter limits)
        const threatImpact = context.threatLevel * this.config.threatLevelImpact;
        contextThreatFactor *= (1.0 - threatImpact);
      }
      
      // Clamp to configured range
      return Math.max(
        this.config.minBurstMultiplier, 
        Math.min(this.config.maxBurstMultiplier, contextThreatFactor)
      );
    } catch (error) {
      log(`Error getting context threat factor: ${error}`, 'security');
      return this.threatFactor; // Fall back to global threat factor
    }
  }
}