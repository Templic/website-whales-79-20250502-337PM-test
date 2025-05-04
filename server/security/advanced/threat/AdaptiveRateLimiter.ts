/**
 * Adaptive Rate Limiter
 *
 * This class dynamically adjusts rate limit parameters based on
 * system load, threat levels, and other factors.
 */

import { log } from '../../../utils/logger';
import { RateLimitContext } from './RateLimitContextBuilder';
import { RateLimitAnalytics } from './RateLimitAnalytics';
import { threatDetectionService } from './ThreatDetectionService';

// Interface for configuration
export interface AdaptiveRateLimiterConfig {
  minBurstMultiplier: number;
  maxBurstMultiplier: number;
  systemLoadThreshold: number;
  threatLevelImpact: number;
  errorRateThreshold: number;
  adjustmentInterval: number; // in ms
  analytics?: RateLimitAnalytics;
}

export class AdaptiveRateLimiter {
  private config: AdaptiveRateLimiterConfig;
  private systemLoadFactor: number = 1.0;
  private threatFactor: number = 1.0;
  private errorRateFactor: number = 1.0;
  private lastAdjustment: number = Date.now();
  private adaptiveMultiplierCache: Map<string, number> = new Map();
  private analytics?: RateLimitAnalytics;
  
  constructor(config: AdaptiveRateLimiterConfig) {
    this.config = {
      minBurstMultiplier: config.minBurstMultiplier || 0.5,
      maxBurstMultiplier: config.maxBurstMultiplier || 2.0,
      systemLoadThreshold: config.systemLoadThreshold || 0.7,
      threatLevelImpact: config.threatLevelImpact || 0.5,
      errorRateThreshold: config.errorRateThreshold || 0.05,
      adjustmentInterval: config.adjustmentInterval || 60000 // 1 minute
    };
    
    this.analytics = config.analytics;
    
    // Set up periodic adjustment
    setInterval(() => this.recalculateFactors(), this.config.adjustmentInterval);
  }
  
  /**
   * Get adaptive multiplier for a context
   * 
   * @param context Rate limit context
   * @returns Adaptive multiplier
   */
  public getAdaptiveMultiplier(context: RateLimitContext): number {
    try {
      // Check if we have a cached multiplier for this resource type
      const resourceType = context.resourceType;
      if (this.adaptiveMultiplierCache.has(resourceType)) {
        return this.adaptiveMultiplierCache.get(resourceType) || 1.0;
      }
      
      // Calculate and cache the multiplier
      const multiplier = this.calculateAdaptiveMultiplier(context);
      this.adaptiveMultiplierCache.set(resourceType, multiplier);
      
      return multiplier;
    } catch (error) {
      log(`Error getting adaptive multiplier: ${error}`, 'security');
      
      // Return a neutral multiplier on error
      return 1.0;
    }
  }
  
  /**
   * Force recalculation of adaptive factors
   */
  public forceRecalculation(): void {
    // Clear the cache
    this.adaptiveMultiplierCache.clear();
    
    // Recalculate the factors
    this.recalculateFactors();
    
    log('Adaptive rate limiter factors recalculated', 'security');
  }
  
  /**
   * Get current adjustment metrics
   * 
   * @returns Adjustment metrics
   */
  public getAdjustmentMetrics(): any {
    return {
      timestamp: new Date().toISOString(),
      systemLoadFactor: this.systemLoadFactor,
      threatFactor: this.threatFactor,
      errorRateFactor: this.errorRateFactor,
      effectiveMultiplierRange: {
        min: this.config.minBurstMultiplier,
        max: this.config.maxBurstMultiplier
      },
      resourceTypeMultipliers: Object.fromEntries(this.adaptiveMultiplierCache)
    };
  }
  
  /**
   * Recalculate adaptive factors
   */
  private recalculateFactors(): void {
    try {
      // Get current time
      const now = Date.now();
      
      // Check if it's time to recalculate
      if (now - this.lastAdjustment < this.config.adjustmentInterval) {
        return;
      }
      
      // Update system load factor
      this.systemLoadFactor = this.calculateSystemLoadFactor();
      
      // Update threat factor
      this.threatFactor = this.calculateThreatFactor();
      
      // Update error rate factor
      this.errorRateFactor = this.calculateErrorRateFactor();
      
      // Clear the cache
      this.adaptiveMultiplierCache.clear();
      
      // Update last adjustment time
      this.lastAdjustment = now;
    } catch (error) {
      log(`Error recalculating adaptive factors: ${error}`, 'security');
    }
  }
  
  /**
   * Calculate adaptive multiplier for a context
   * 
   * @param context Rate limit context
   * @returns Adaptive multiplier
   */
  private calculateAdaptiveMultiplier(context: RateLimitContext): number {
    // Start with the system load factor
    let multiplier = this.systemLoadFactor;
    
    // Adjust for threat factor
    multiplier *= this.threatFactor;
    
    // Adjust for error rate factor
    multiplier *= this.errorRateFactor;
    
    // Adjust for resource sensitivity
    multiplier *= Math.pow(0.9, context.resourceSensitivity - 1);
    
    // Adjust for user role
    multiplier *= Math.pow(1.1, context.roleWeight);
    
    // Adjust for threat level of the request
    const threatAdjustment = 1 - (context.threatLevel * this.config.threatLevelImpact);
    multiplier *= threatAdjustment;
    
    // Clamp to allowed range
    return Math.max(
      this.config.minBurstMultiplier,
      Math.min(this.config.maxBurstMultiplier, multiplier)
    );
  }
  
  /**
   * Calculate system load factor
   * 
   * @returns System load factor
   */
  private calculateSystemLoadFactor(): number {
    try {
      // Calculate CPU load (simplified)
      const cpuLoad = this.getCpuLoad();
      
      // Calculate memory load (simplified)
      const memoryLoad = this.getMemoryLoad();
      
      // Combine loads (weighted average)
      const systemLoad = (cpuLoad * 0.7) + (memoryLoad * 0.3);
      
      // Below threshold: increase capacity, above threshold: decrease capacity
      if (systemLoad < this.config.systemLoadThreshold) {
        // System load is good, increase capacity
        const loadRatio = systemLoad / this.config.systemLoadThreshold;
        return Math.min(this.config.maxBurstMultiplier, 1 + (1 - loadRatio) * 0.5);
      } else {
        // System load is high, decrease capacity
        const overloadRatio = (systemLoad - this.config.systemLoadThreshold) / 
                              (1 - this.config.systemLoadThreshold);
        return Math.max(this.config.minBurstMultiplier, 1 - overloadRatio * 0.5);
      }
    } catch (error) {
      log(`Error calculating system load factor: ${error}`, 'security');
      
      // Return a neutral factor on error
      return 1.0;
    }
  }
  
  /**
   * Calculate threat factor
   * 
   * @returns Threat factor
   */
  private calculateThreatFactor(): number {
    try {
      // Get global threat level
      const globalThreatLevel = threatDetectionService.getGlobalThreatLevel();
      
      // Calculate factor (higher threat = lower capacity)
      return Math.max(
        this.config.minBurstMultiplier,
        1 - (globalThreatLevel * this.config.threatLevelImpact)
      );
    } catch (error) {
      log(`Error calculating threat factor: ${error}`, 'security');
      
      // Return a neutral factor on error
      return 1.0;
    }
  }
  
  /**
   * Calculate error rate factor
   * 
   * @returns Error rate factor
   */
  private calculateErrorRateFactor(): number {
    try {
      // Calculate error rate (if analytics is available)
      if (this.analytics) {
        const report = this.analytics.generateReport();
        const globalErrorRate = report.summary?.globalErrorRate || 0;
        
        // Calculate factor (higher error rate = lower capacity)
        if (globalErrorRate > this.config.errorRateThreshold) {
          const overErrorRatio = (globalErrorRate - this.config.errorRateThreshold) / 
                                 (0.5 - this.config.errorRateThreshold); // Cap at 50% error rate
          return Math.max(
            this.config.minBurstMultiplier,
            1 - overErrorRatio * 0.3
          );
        } else {
          // Error rate is acceptable, slight increase in capacity
          return Math.min(
            this.config.maxBurstMultiplier,
            1 + (this.config.errorRateThreshold - globalErrorRate) * 0.1
          );
        }
      }
      
      // No analytics available
      return 1.0;
    } catch (error) {
      log(`Error calculating error rate factor: ${error}`, 'security');
      
      // Return a neutral factor on error
      return 1.0;
    }
  }
  
  /**
   * Get CPU load
   * 
   * @returns CPU load (0-1)
   */
  private getCpuLoad(): number {
    try {
      // Try to get from global metrics if available
      // @ts-ignore
      if (globalThis.__metrics && globalThis.__metrics.cpu) {
        // @ts-ignore
        return globalThis.__metrics.cpu.load / 100;
      }
      
      // Fallback: return a moderate value
      return 0.5;
    } catch (error) {
      // Return a moderate value on error
      return 0.5;
    }
  }
  
  /**
   * Get memory load
   * 
   * @returns Memory load (0-1)
   */
  private getMemoryLoad(): number {
    try {
      // Try to get from global metrics if available
      // @ts-ignore
      if (globalThis.__metrics && globalThis.__metrics.memory) {
        // @ts-ignore
        return globalThis.__metrics.memory.usedPercent / 100;
      }
      
      // Fallback: get from Node process
      if (process && process.memoryUsage) {
        const usage = process.memoryUsage();
        // Calculate as used / (used + free)
        // @ts-ignore
        if (globalThis.__metrics && globalThis.__metrics.memory && globalThis.__metrics.memory.free !== undefined) {
          // @ts-ignore
          const free = globalThis.__metrics.memory.free;
          const used = usage.heapUsed + usage.external;
          return used / (used + free);
        }
        
        // Approximate based on heap usage
        return usage.heapUsed / usage.heapTotal;
      }
      
      // Fallback: return a moderate value
      return 0.5;
    } catch (error) {
      // Return a moderate value on error
      return 0.5;
    }
  }
}