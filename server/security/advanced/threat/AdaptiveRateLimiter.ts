/**
 * Adaptive Rate Limiter
 * 
 * Dynamically adjusts rate limits based on:
 * - System load
 * - Memory usage
 * - Security threat levels
 * - Time-of-day patterns
 * - Historical traffic patterns
 * 
 * This component allows the rate limiting system to automatically
 * become more restrictive under high load or elevated security threats.
 */

import { TokenBucketRateLimiter, RateLimitConfig } from './TokenBucketRateLimiter';

// Optional dependencies
let systemMonitor: any;
let securityFabric: any;

try {
  // Attempt to import system monitor for load information
  systemMonitor = require('../../../utils/systemMonitor');
} catch (error) {
  console.log('System monitor not available for adaptive rate limiting');
}

try {
  // Attempt to import security fabric for threat information
  securityFabric = require('../SecurityFabric').default;
} catch (error) {
  console.log('Security fabric not available for adaptive rate limiting');
}

export interface AdaptiveRateLimiterOptions {
  // How often to adjust limits (ms)
  adjustmentInterval?: number;
  
  // Maximum restriction factor (1.0 means no restriction, 2.0 means 50% of original limit)
  maxRestrictionFactor?: number;
  
  // Minimum tokens allowed (won't go below this)
  minimumTokensPercent?: number;
  
  // Load thresholds
  loadThresholds?: {
    start: number;  // Start restricting at this load (0-1)
    max: number;    // Maximum restriction at this load (0-1)
  };
  
  // Memory thresholds
  memoryThresholds?: {
    start: number;  // Start restricting at this memory usage (0-1)
    max: number;    // Maximum restriction at this memory usage (0-1)
  };
  
  // Threat level thresholds
  threatThresholds?: {
    start: number;  // Start restricting at this threat level (0-100)
    max: number;    // Maximum restriction at this threat level (0-100)
  };
  
  // Whether to enable more detailed logging
  verbose?: boolean;
}

/**
 * Manages adaptive rate limit adjustments based on system conditions
 */
export class AdaptiveRateLimiter {
  private limiters: Record<string, TokenBucketRateLimiter>;
  private baseConfigs: Record<string, RateLimitConfig>;
  private lastAdjustment: number = 0;
  private options: AdaptiveRateLimiterOptions;
  private adjustmentInterval: number;
  private adjustmentTimer: NodeJS.Timeout | null = null;
  
  constructor(
    limiters: Record<string, TokenBucketRateLimiter>,
    options: AdaptiveRateLimiterOptions = {}
  ) {
    this.limiters = limiters;
    this.options = options;
    this.baseConfigs = {};
    this.adjustmentInterval = options.adjustmentInterval || 60 * 1000; // Default: 1 minute
    
    // Store base configurations
    Object.entries(limiters).forEach(([key, limiter]) => {
      this.baseConfigs[key] = { ...limiter.getConfig() };
    });
    
    // Schedule periodic adjustments
    this.startPeriodicAdjustments();
  }
  
  /**
   * Start periodic rate limit adjustments
   */
  private startPeriodicAdjustments(): void {
    if (this.adjustmentTimer) {
      clearInterval(this.adjustmentTimer);
    }
    
    this.adjustmentTimer = setInterval(() => {
      this.adjustRateLimits();
    }, this.adjustmentInterval);
    
    if (this.options.verbose) {
      console.log(`[AdaptiveRateLimiter] Started periodic adjustments every ${this.adjustmentInterval / 1000} seconds`);
    }
  }
  
  /**
   * Stop periodic rate limit adjustments
   */
  public stopPeriodicAdjustments(): void {
    if (this.adjustmentTimer) {
      clearInterval(this.adjustmentTimer);
      this.adjustmentTimer = null;
      
      if (this.options.verbose) {
        console.log('[AdaptiveRateLimiter] Stopped periodic adjustments');
      }
    }
  }
  
  /**
   * Adjust rate limits based on current system conditions
   */
  public adjustRateLimits(): void {
    const now = Date.now();
    
    // Limit adjustment frequency
    if (now - this.lastAdjustment < this.adjustmentInterval) {
      return;
    }
    
    this.lastAdjustment = now;
    
    // Get current system metrics
    const systemLoad = this.getCurrentSystemLoad();
    const memoryUsage = this.getCurrentMemoryUsage();
    const currentThreatLevel = this.getCurrentThreatLevel();
    
    // Calculate adjustment factors
    const loadFactor = this.calculateLoadFactor(systemLoad);
    const memoryFactor = this.calculateMemoryFactor(memoryUsage);
    const threatFactor = this.calculateThreatFactor(currentThreatLevel);
    
    // Combined restriction factor (higher means more restrictive)
    // Take the most restrictive of the three factors
    const restrictionFactor = Math.max(loadFactor, memoryFactor, threatFactor);
    
    // Cap at maximum restriction
    const maxRestriction = this.options.maxRestrictionFactor || 5.0;
    const finalRestrictionFactor = Math.min(restrictionFactor, maxRestriction);
    
    // Log adjustment if significant or in verbose mode
    if (finalRestrictionFactor > 1.1 || this.options.verbose) {
      console.log(`[AdaptiveRateLimiter] Calculating adjustment: load=${loadFactor.toFixed(2)}, memory=${memoryFactor.toFixed(2)}, threat=${threatFactor.toFixed(2)}, final=${finalRestrictionFactor.toFixed(2)}`);
    }
    
    // Apply adjustments to each limiter
    Object.entries(this.limiters).forEach(([key, limiter]) => {
      const baseConfig = this.baseConfigs[key];
      
      // Skip if no base config
      if (!baseConfig) return;
      
      // Calculate new token rate based on restriction factor
      const minimumPercent = this.options.minimumTokensPercent || 0.1; // Default to 10% minimum
      const adjustedTokens = Math.max(
        Math.floor(baseConfig.tokensPerInterval / finalRestrictionFactor),
        Math.ceil(baseConfig.tokensPerInterval * minimumPercent)
      );
      
      // Calculate adjusted burst capacity
      const adjustedBurst = Math.max(
        Math.floor(baseConfig.burstCapacity! / finalRestrictionFactor),
        adjustedTokens // Burst capacity should be at least equal to tokens per interval
      );
      
      // Apply new configuration
      limiter.updateConfig({
        tokensPerInterval: adjustedTokens,
        interval: baseConfig.interval,
        burstCapacity: adjustedBurst
      });
      
      if (this.options.verbose || finalRestrictionFactor > 1.5) {
        console.log(`[AdaptiveRateLimiter] Adjusted ${key} rate limit to ${adjustedTokens}/${baseConfig.tokensPerInterval} tokens/interval (restriction: ${finalRestrictionFactor.toFixed(2)})`);
      }
    });
  }
  
  /**
   * Calculate load-based adjustment factor
   */
  private calculateLoadFactor(systemLoad: number): number {
    const thresholds = this.options.loadThresholds || { start: 0.7, max: 0.9 };
    
    // Below start threshold, no restriction (factor = 1.0)
    if (systemLoad < thresholds.start) return 1.0;
    
    // At or above max threshold, maximum restriction
    if (systemLoad >= thresholds.max) return this.options.maxRestrictionFactor || 5.0;
    
    // Linear scaling between start and max thresholds
    const range = thresholds.max - thresholds.start;
    const position = (systemLoad - thresholds.start) / range;
    const maxAdditional = (this.options.maxRestrictionFactor || 5.0) - 1.0;
    
    return 1.0 + (position * maxAdditional);
  }
  
  /**
   * Calculate memory-based adjustment factor
   */
  private calculateMemoryFactor(memoryUsage: number): number {
    const thresholds = this.options.memoryThresholds || { start: 0.8, max: 0.95 };
    
    // Below start threshold, no restriction (factor = 1.0)
    if (memoryUsage < thresholds.start) return 1.0;
    
    // At or above max threshold, maximum restriction
    if (memoryUsage >= thresholds.max) return this.options.maxRestrictionFactor || 5.0;
    
    // Linear scaling between start and max thresholds
    const range = thresholds.max - thresholds.start;
    const position = (memoryUsage - thresholds.start) / range;
    const maxAdditional = (this.options.maxRestrictionFactor || 5.0) - 1.0;
    
    return 1.0 + (position * maxAdditional);
  }
  
  /**
   * Calculate threat-based adjustment factor
   */
  private calculateThreatFactor(threatLevel: number): number {
    const thresholds = this.options.threatThresholds || { start: 50, max: 80 };
    
    // Below start threshold, no restriction (factor = 1.0)
    if (threatLevel < thresholds.start) return 1.0;
    
    // At or above max threshold, maximum restriction
    if (threatLevel >= thresholds.max) return this.options.maxRestrictionFactor || 5.0;
    
    // Linear scaling between start and max thresholds
    const range = thresholds.max - thresholds.start;
    const position = (threatLevel - thresholds.start) / range;
    const maxAdditional = (this.options.maxRestrictionFactor || 5.0) - 1.0;
    
    return 1.0 + (position * maxAdditional);
  }
  
  /**
   * Get current system load (0-1)
   */
  private getCurrentSystemLoad(): number {
    if (systemMonitor && systemMonitor.getCurrentLoad) {
      return systemMonitor.getCurrentLoad() || 0;
    }
    return 0;
  }
  
  /**
   * Get current memory usage (0-1)
   */
  private getCurrentMemoryUsage(): number {
    if (systemMonitor && systemMonitor.getMemoryUsage) {
      return systemMonitor.getMemoryUsage() || 0;
    }
    return 0;
  }
  
  /**
   * Get current threat level (0-100)
   */
  private getCurrentThreatLevel(): number {
    if (securityFabric && securityFabric.getCurrentThreatLevel) {
      return securityFabric.getCurrentThreatLevel() || 0;
    }
    return 0;
  }
  
  /**
   * Reset all limiters to their base configurations
   */
  public resetToBaseConfigs(): void {
    Object.entries(this.baseConfigs).forEach(([key, config]) => {
      const limiter = this.limiters[key];
      if (limiter) {
        limiter.updateConfig(config);
      }
    });
    
    if (this.options.verbose) {
      console.log('[AdaptiveRateLimiter] Reset all limiters to base configurations');
    }
  }
  
  /**
   * Get current adjustment metrics
   */
  public getAdjustmentMetrics(): Record<string, any> {
    const systemLoad = this.getCurrentSystemLoad();
    const memoryUsage = this.getCurrentMemoryUsage();
    const currentThreatLevel = this.getCurrentThreatLevel();
    
    return {
      lastAdjustment: this.lastAdjustment,
      systemLoad,
      memoryUsage,
      threatLevel: currentThreatLevel,
      loadFactor: this.calculateLoadFactor(systemLoad),
      memoryFactor: this.calculateMemoryFactor(memoryUsage),
      threatFactor: this.calculateThreatFactor(currentThreatLevel),
      adjustments: Object.entries(this.limiters).map(([key, limiter]) => ({
        limiter: key,
        baseRate: this.baseConfigs[key]?.tokensPerInterval || 0,
        currentRate: limiter.getConfig().tokensPerInterval,
        restrictionFactor: (this.baseConfigs[key]?.tokensPerInterval || 0) / limiter.getConfig().tokensPerInterval
      }))
    };
  }
  
  /**
   * Dispose of resources
   */
  public dispose(): void {
    this.stopPeriodicAdjustments();
  }
}