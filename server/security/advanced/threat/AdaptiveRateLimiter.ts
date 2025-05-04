/**
 * Adaptive Rate Limiter
 *
 * This module provides adaptive rate limiting based on system conditions.
 * It adjusts rate limits based on traffic patterns, system load, and threat levels.
 */

import { log } from '../../../utils/logger';
import { RateLimitContext } from './RateLimitContextBuilder';
import { RateLimitAnalytics } from './RateLimitAnalytics';

/**
 * Configuration for adaptive rate limiter
 */
export interface AdaptiveRateLimiterConfig {
  /**
   * Analytics instance for tracking metrics
   */
  analytics: RateLimitAnalytics;
  
  /**
   * Base multiplier when system is under normal conditions
   */
  baseMultiplier?: number;
  
  /**
   * Minimum multiplier to apply
   */
  minMultiplier?: number;
  
  /**
   * Maximum multiplier to apply
   */
  maxMultiplier?: number;
  
  /**
   * Threshold for high CPU usage (0-1)
   */
  highCpuThreshold?: number;
  
  /**
   * Adjustment factor for high CPU usage
   */
  cpuAdjustmentFactor?: number;
  
  /**
   * Threshold for high memory usage (0-1)
   */
  highMemoryThreshold?: number;
  
  /**
   * Adjustment factor for high memory usage
   */
  memoryAdjustmentFactor?: number;
  
  /**
   * Adjustment factor for high threat levels
   */
  threatAdjustmentFactor?: number;
  
  /**
   * Multiplier for authenticated users
   */
  authenticatedMultiplier?: number;
  
  /**
   * Additional multiplier for admin users
   */
  adminMultiplier?: number;
  
  /**
   * Adjustment factor for IP reputation
   */
  ipReputationFactor?: number;
  
  /**
   * Interval to check system load (ms)
   */
  loadCheckInterval?: number;
}

/**
 * System load metrics
 */
interface SystemLoadMetrics {
  /**
   * CPU usage (0-1)
   */
  cpuUsage: number;
  
  /**
   * Memory usage (0-1)
   */
  memoryUsage: number;
  
  /**
   * Last updated timestamp
   */
  lastUpdated: number;
}

/**
 * Adaptive rate limiter class
 */
export class AdaptiveRateLimiter {
  // Configuration
  private config: Required<AdaptiveRateLimiterConfig>;
  
  // Analytics
  private analytics: RateLimitAnalytics;
  
  // System load metrics
  private systemLoad: SystemLoadMetrics = {
    cpuUsage: 0,
    memoryUsage: 0,
    lastUpdated: 0
  };
  
  // Global adaptive multiplier (adjusted by system conditions)
  private globalAdaptiveMultiplier: number = 1.0;
  
  // Recent adaptations for tracking
  private recentAdaptations: Array<{
    timestamp: number;
    multiplier: number;
    reason: string;
  }> = [];
  
  // Interval for checking CPU load
  private cpuLoadInterval: NodeJS.Timeout;
  
  constructor(config: AdaptiveRateLimiterConfig) {
    // Set configuration with defaults
    this.config = {
      analytics: config.analytics,
      baseMultiplier: config.baseMultiplier || 1.0,
      minMultiplier: config.minMultiplier || 0.2,
      maxMultiplier: config.maxMultiplier || 2.0,
      highCpuThreshold: config.highCpuThreshold || 0.7,
      cpuAdjustmentFactor: config.cpuAdjustmentFactor || 0.5,
      highMemoryThreshold: config.highMemoryThreshold || 0.8,
      memoryAdjustmentFactor: config.memoryAdjustmentFactor || 0.7,
      threatAdjustmentFactor: config.threatAdjustmentFactor || 0.5,
      authenticatedMultiplier: config.authenticatedMultiplier || 1.2,
      adminMultiplier: config.adminMultiplier || 1.5,
      ipReputationFactor: config.ipReputationFactor || 0.5,
      loadCheckInterval: config.loadCheckInterval || 60000 // 1 minute
    };
    
    // Store analytics
    this.analytics = this.config.analytics;
    
    // Initialize system load
    this.updateSystemLoad();
    
    // Start load check interval
    this.cpuLoadInterval = setInterval(() => {
      this.updateSystemLoad();
      this.adjustGlobalMultiplier();
    }, this.config.loadCheckInterval);
    
    log('Adaptive rate limiter initialized', 'security');
  }
  
  /**
   * Get adaptive multiplier for a request
   * 
   * @param context Rate limit context
   * @returns Multiplier to apply
   */
  public getAdaptiveMultiplier(context: RateLimitContext): number {
    try {
      // Start with global adaptive multiplier
      let multiplier = this.globalAdaptiveMultiplier;
      
      // Apply context-specific adjustments
      
      // Adjust for authentication status
      if (context.authenticated) {
        multiplier *= this.config.authenticatedMultiplier;
      }
      
      // Adjust for role (admin gets higher multiplier)
      if (context.role === 'admin' || context.roleWeight <= 2) {
        multiplier *= this.config.adminMultiplier;
      }
      
      // Adjust for threat level
      if (context.threatLevel > 0) {
        // Higher threat level = lower multiplier
        multiplier *= (1 - (context.threatLevel * this.config.threatAdjustmentFactor));
      }
      
      // Adjust for blacklisted IPs
      if (context.isBlacklisted) {
        multiplier *= 0.1; // 90% reduction
      }
      
      // Adjust for whitelisted IPs
      if (context.isWhitelisted) {
        multiplier *= 2.0; // 100% increase
      }
      
      // Adjust for resource sensitivity
      multiplier *= Math.max(0.5, 1 - (context.resourceSensitivity - 1) * 0.1);
      
      // Ensure within bounds
      multiplier = Math.max(this.config.minMultiplier, Math.min(this.config.maxMultiplier, multiplier));
      
      return multiplier;
    } catch (error) {
      log(`Error calculating adaptive multiplier: ${error}`, 'error');
      
      // Return safe default
      return 1.0;
    }
  }
  
  /**
   * Update system load metrics
   */
  private updateSystemLoad(): void {
    try {
      // In a real implementation, this would use process metrics
      // For now, we'll simulate with some random values
      
      // Get CPU usage - in a real app, this would use an actual OS metrics API
      const prevCpuUsage = this.systemLoad.cpuUsage;
      
      // Simulated CPU usage - would be replaced with real metrics
      const cpuUsage = Math.min(0.3 + Math.random() * 0.2, 1.0);
      
      // Simulated memory usage - would be replaced with real metrics
      const memoryUsage = Math.min(0.4 + Math.random() * 0.2, 1.0);
      
      // Update system load
      this.systemLoad = {
        cpuUsage,
        memoryUsage,
        lastUpdated: Date.now()
      };
      
      // Log significant changes
      if (Math.abs(cpuUsage - prevCpuUsage) > 0.1) {
        log(`System CPU usage changed from ${(prevCpuUsage * 100).toFixed(1)}% to ${(cpuUsage * 100).toFixed(1)}%`, 'perf');
      }
    } catch (error) {
      log(`Error updating system load: ${error}`, 'error');
    }
  }
  
  /**
   * Adjust global adaptive multiplier based on system conditions
   */
  private adjustGlobalMultiplier(): void {
    try {
      // Store previous multiplier
      const previousMultiplier = this.globalAdaptiveMultiplier;
      
      // Start with base multiplier
      let multiplier = this.config.baseMultiplier;
      let reason = '';
      
      // Adjust for CPU usage
      if (this.systemLoad.cpuUsage > this.config.highCpuThreshold) {
        // High CPU usage = lower multiplier
        const cpuFactor = 1 - ((this.systemLoad.cpuUsage - this.config.highCpuThreshold) 
          / (1 - this.config.highCpuThreshold)) * this.config.cpuAdjustmentFactor;
        
        multiplier *= cpuFactor;
        reason = 'high CPU usage';
      }
      
      // Adjust for memory usage
      if (this.systemLoad.memoryUsage > this.config.highMemoryThreshold) {
        // High memory usage = lower multiplier
        const memoryFactor = 1 - ((this.systemLoad.memoryUsage - this.config.highMemoryThreshold) 
          / (1 - this.config.highMemoryThreshold)) * this.config.memoryAdjustmentFactor;
        
        multiplier *= memoryFactor;
        reason = reason ? `${reason} and high memory usage` : 'high memory usage';
      }
      
      // Ensure within bounds
      multiplier = Math.max(this.config.minMultiplier, Math.min(this.config.maxMultiplier, multiplier));
      
      // Update global multiplier
      this.globalAdaptiveMultiplier = multiplier;
      
      // Record adjustment if significant
      if (Math.abs(multiplier - previousMultiplier) > 0.1) {
        // Log adjustment
        log(`Adjusted global rate limit multiplier from ${previousMultiplier.toFixed(2)} to ${multiplier.toFixed(2)} due to ${reason}`, 'security');
        
        // Record for analytics
        this.recentAdaptations.push({
          timestamp: Date.now(),
          multiplier,
          reason
        });
        
        // Trim to last 100 adaptations
        if (this.recentAdaptations.length > 100) {
          this.recentAdaptations = this.recentAdaptations.slice(-100);
        }
      }
    } catch (error) {
      log(`Error adjusting global multiplier: ${error}`, 'error');
    }
  }
  
  /**
   * Get current system load
   * 
   * @returns System load metrics
   */
  public getSystemLoad(): SystemLoadMetrics {
    return { ...this.systemLoad };
  }
  
  /**
   * Get current global adaptive multiplier
   * 
   * @returns Global multiplier
   */
  public getGlobalMultiplier(): number {
    return this.globalAdaptiveMultiplier;
  }
  
  /**
   * Get recent adaptations
   * 
   * @param limit Max adaptations to return
   * @returns Recent adaptations
   */
  public getRecentAdaptations(limit = 10): Array<{
    timestamp: number;
    multiplier: number;
    reason: string;
  }> {
    return this.recentAdaptations.slice(-limit);
  }
  
  /**
   * Forcibly set global adaptive multiplier
   * 
   * @param multiplier New multiplier
   * @param reason Reason for change
   */
  public setGlobalMultiplier(multiplier: number, reason = 'manual adjustment'): void {
    // Ensure within bounds
    const boundedMultiplier = Math.max(
      this.config.minMultiplier,
      Math.min(this.config.maxMultiplier, multiplier)
    );
    
    // Set multiplier
    this.globalAdaptiveMultiplier = boundedMultiplier;
    
    // Record adjustment
    this.recentAdaptations.push({
      timestamp: Date.now(),
      multiplier: boundedMultiplier,
      reason
    });
    
    // Log adjustment
    log(`Manually set global rate limit multiplier to ${boundedMultiplier.toFixed(2)} (${reason})`, 'security');
  }
  
  /**
   * Dispose of limiter
   */
  public dispose(): void {
    clearInterval(this.cpuLoadInterval);
  }
}