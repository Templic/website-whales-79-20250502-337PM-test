/**
 * Adaptive Rate Limiter
 *
 * This module adjusts rate limits based on current system conditions.
 * It can scale limits up or down based on load, time of day, etc.
 */

import { log } from '../../../utils/logger';
import { RateLimitContext } from './RateLimitContextBuilder';
import { RateLimitAnalytics } from './RateLimitAnalytics';
import os from 'os';

/**
 * Configuration for adaptive rate limiter
 */
export interface AdaptiveRateLimiterConfig {
  /**
   * Analytics instance to use
   */
  analytics: RateLimitAnalytics;
  
  /**
   * Minimum multiplier for burst capacity
   */
  minBurstMultiplier?: number;
  
  /**
   * Maximum multiplier for burst capacity
   */
  maxBurstMultiplier?: number;
  
  /**
   * How much to scale down during high load (0-1)
   */
  highLoadScaleFactor?: number;
  
  /**
   * How much to scale up during low load (1+)
   */
  lowLoadScaleFactor?: number;
  
  /**
   * CPU threshold for high load (0-1)
   */
  highLoadThreshold?: number;
  
  /**
   * CPU threshold for low load (0-1)
   */
  lowLoadThreshold?: number;
  
  /**
   * Time window for CPU monitoring in milliseconds
   */
  loadWindowMs?: number;
  
  /**
   * Scale factor for low activity hours (1+)
   */
  offHoursScaleFactor?: number;
  
  /**
   * Start hour for low activity period (0-23)
   */
  offHoursStart?: number;
  
  /**
   * End hour for low activity period (0-23)
   */
  offHoursEnd?: number;
  
  /**
   * Scale factor for high reputation users (1+)
   */
  goodReputationFactor?: number;
  
  /**
   * Scale factor for low reputation users (0-1)
   */
  badReputationFactor?: number;
}

/**
 * Adaptively adjusts rate limits based on various factors
 */
export class AdaptiveRateLimiter {
  private config: Required<AdaptiveRateLimiterConfig>;
  private cpuLoadHistory: number[] = [];
  private cpuLoadInterval: NodeJS.Timeout;
  private currentSystemMultiplier: number = 1.0;
  private analytics: RateLimitAnalytics;

  constructor(config: AdaptiveRateLimiterConfig) {
    // Set defaults
    this.config = {
      analytics: config.analytics,
      minBurstMultiplier: config.minBurstMultiplier || 0.5,
      maxBurstMultiplier: config.maxBurstMultiplier || 2.0,
      highLoadScaleFactor: config.highLoadScaleFactor || 0.5,
      lowLoadScaleFactor: config.lowLoadScaleFactor || 1.5,
      highLoadThreshold: config.highLoadThreshold || 0.8,
      lowLoadThreshold: config.lowLoadThreshold || 0.2,
      loadWindowMs: config.loadWindowMs || 60000, // 1 minute
      offHoursScaleFactor: config.offHoursScaleFactor || 1.5,
      offHoursStart: config.offHoursStart || 22, // 10 PM
      offHoursEnd: config.offHoursEnd || 6, // 6 AM
      goodReputationFactor: config.goodReputationFactor || 1.5,
      badReputationFactor: config.badReputationFactor || 0.5
    };
    
    this.analytics = this.config.analytics;
    
    // Start CPU monitoring
    this.startCpuMonitoring();
    
    log('Adaptive rate limiter initialized', 'security');
  }
  
  /**
   * Get adaptive multiplier for a context
   * 
   * @param context Rate limit context
   * @returns Multiplier to apply to rate limit
   */
  public getAdaptiveMultiplier(context: RateLimitContext): number {
    try {
      // Start with system load multiplier
      let multiplier = this.currentSystemMultiplier;
      
      // Adjust for resource sensitivity
      multiplier *= this.getResourceSensitivityFactor(context.resourceSensitivity);
      
      // Adjust for authentication status
      if (context.authenticated) {
        multiplier *= 1.2; // Authenticated users get 20% more capacity
      }
      
      // Adjust for user role
      multiplier *= this.getRoleMultiplier(context.roleWeight);
      
      // Adjust for time of day
      multiplier *= this.getTimeOfDayMultiplier();
      
      // Adjust for known good/bad bots
      if (context.isGoodBot) {
        multiplier *= 1.5; // Good bots get 50% more capacity
      }
      
      if (context.isBadBot) {
        multiplier *= 0.2; // Bad bots get 80% less capacity
      }
      
      // Adjust for blacklisted IPs
      if (context.isBlacklisted) {
        multiplier *= 0.1; // Blacklisted IPs get 90% less capacity
      }
      
      // Adjust for threat level
      multiplier *= (1 - context.threatLevel * 0.8); // High threat = lower capacity
      
      // Cap the multiplier
      multiplier = Math.max(this.config.minBurstMultiplier, Math.min(this.config.maxBurstMultiplier, multiplier));
      
      return multiplier;
    } catch (error) {
      log(`Error calculating adaptive multiplier: ${error}`, 'security');
      
      // Return safe default
      return 1.0;
    }
  }
  
  /**
   * Start monitoring CPU load
   */
  private startCpuMonitoring(): void {
    // Track CPU load
    this.updateCpuLoad();
    
    // Set up periodic monitoring
    this.cpuLoadInterval = setInterval(() => {
      this.updateCpuLoad();
    }, 5000); // Every 5 seconds
  }
  
  /**
   * Update CPU load average
   */
  private updateCpuLoad(): void {
    try {
      // Get current CPU load average (1 minute)
      const loadAvg = os.loadavg()[0];
      const cpuCount = os.cpus().length;
      
      // Calculate relative load (0-1)
      const relativeLoad = Math.min(1, loadAvg / cpuCount);
      
      // Add to history
      this.cpuLoadHistory.push(relativeLoad);
      
      // Keep only recent history
      const historySize = Math.ceil(this.config.loadWindowMs / 5000);
      if (this.cpuLoadHistory.length > historySize) {
        this.cpuLoadHistory = this.cpuLoadHistory.slice(-historySize);
      }
      
      // Calculate average load
      const avgLoad = this.cpuLoadHistory.reduce((sum, load) => sum + load, 0) / this.cpuLoadHistory.length;
      
      // Update system multiplier based on load
      if (avgLoad >= this.config.highLoadThreshold) {
        // High load: Scale down
        this.currentSystemMultiplier = this.config.highLoadScaleFactor;
      } else if (avgLoad <= this.config.lowLoadThreshold) {
        // Low load: Scale up
        this.currentSystemMultiplier = this.config.lowLoadScaleFactor;
      } else {
        // Normal load: Linear interpolation
        const loadRange = this.config.highLoadThreshold - this.config.lowLoadThreshold;
        const normalizedLoad = (avgLoad - this.config.lowLoadThreshold) / loadRange;
        this.currentSystemMultiplier = this.config.lowLoadScaleFactor - 
          normalizedLoad * (this.config.lowLoadScaleFactor - this.config.highLoadScaleFactor);
      }
      
      // Log significant changes
      if (this.cpuLoadHistory.length === 1 || Math.abs(this.cpuLoadHistory[this.cpuLoadHistory.length - 2] - relativeLoad) > 0.2) {
        log(`CPU load: ${(relativeLoad * 100).toFixed(2)}%, system multiplier: ${this.currentSystemMultiplier.toFixed(2)}`, 'perf');
      }
    } catch (e) {
      log(`Error updating CPU load: ${e}`, 'security');
      
      // Safe default
      this.currentSystemMultiplier = 1.0;
    }
  }
  
  /**
   * Get resource sensitivity factor
   * 
   * @param sensitivity Resource sensitivity (1-5)
   * @returns Multiplier
   */
  private getResourceSensitivityFactor(sensitivity: number): number {
    // More sensitive resources get lower multipliers
    switch (sensitivity) {
      case 1:
        return 1.2; // Low sensitivity
      case 2:
        return 1.0; // Normal sensitivity
      case 3:
        return 0.8; // Medium sensitivity
      case 4:
        return 0.6; // High sensitivity
      case 5:
        return 0.4; // Very high sensitivity
      default:
        return 1.0;
    }
  }
  
  /**
   * Get multiplier based on role weight
   * 
   * @param roleWeight Role weight (lower = more privileged)
   * @returns Multiplier
   */
  private getRoleMultiplier(roleWeight: number): number {
    // Higher roles get higher multipliers
    if (roleWeight <= 2) {
      return 2.0; // Admin/superuser
    } else if (roleWeight <= 5) {
      return 1.5; // Staff/moderator
    } else if (roleWeight <= 7) {
      return 1.2; // Premium user
    } else {
      return 1.0; // Regular/guest user
    }
  }
  
  /**
   * Get time of day multiplier
   * 
   * @returns Multiplier
   */
  private getTimeOfDayMultiplier(): number {
    // Higher multiplier during off-hours (less traffic expected)
    const hour = new Date().getHours();
    
    // Check if current hour is within off-hours
    if (
      (this.config.offHoursStart > this.config.offHoursEnd && (hour >= this.config.offHoursStart || hour < this.config.offHoursEnd)) ||
      (this.config.offHoursStart <= this.config.offHoursEnd && hour >= this.config.offHoursStart && hour < this.config.offHoursEnd)
    ) {
      return this.config.offHoursScaleFactor;
    }
    
    return 1.0;
  }
  
  /**
   * Stop monitoring and clean up
   */
  public dispose(): void {
    if (this.cpuLoadInterval) {
      clearInterval(this.cpuLoadInterval);
    }
  }
}