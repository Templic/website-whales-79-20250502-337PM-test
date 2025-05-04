/**
 * Threat Detection Service
 *
 * This module assesses the threat level of requests.
 * It helps make rate limiting decisions based on observed behavior.
 */

import { Request } from 'express';
import { log } from '../../../utils/logger';

/**
 * Pattern data structure for tracking irregular patterns
 */
interface PatternData {
  timestamp: number;
  count: number;
  lastRequestTime: number;
  minInterval: number;
  maxInterval: number;
  avgInterval: number;
  intervalSum: number;
  requestCount: number;
}

/**
 * Configuration for threat detection service
 */
export interface ThreatDetectionConfig {
  /**
   * Threshold for suspicious rate of requests per minute
   */
  requestRateThreshold?: number;
  
  /**
   * Number of recent requests to track
   */
  recentRequestsTracked?: number;
  
  /**
   * Time window for request tracking (ms)
   */
  timeWindowMs?: number;
  
  /**
   * Threshold for coefficient of variation in request timing
   */
  patternVariationThreshold?: number;
  
  /**
   * High risk paths regular expressions
   */
  highRiskPaths?: RegExp[];
  
  /**
   * Bad bot patterns
   */
  badBotPatterns?: RegExp[];
  
  /**
   * Penalty duration for detected threats (ms)
   */
  threatPenaltyDurationMs?: number;
}

/**
 * Threat tracker for an IP or user ID
 */
interface ThreatTracker {
  // Request timestamps (most recent first)
  requestTimestamps: number[];
  
  // Path counts
  pathCount: Map<string, number>;
  
  // Method counts
  methodCount: Map<string, number>;
  
  // Status code counts
  statusCount: Map<number, number>;
  
  // Pattern detection
  patterns: Map<string, PatternData>;
  
  // Error counts
  errorCount: number;
  
  // Last seen
  lastSeen: number;
  
  // Current threat level
  threatLevel: number;
  
  // Threat penalty expiration
  threatPenaltyExpiration: number;
  
  // Recent errors (time + path)
  recentErrors: Array<{ time: number, path: string }>;
  
  // Total requests
  totalRequests: number;
}

/**
 * Service for detecting threats in requests
 */
class ThreatDetectionService {
  // Config with defaults
  private config: Required<ThreatDetectionConfig> = {
    requestRateThreshold: 120, // requests per minute
    recentRequestsTracked: 100,
    timeWindowMs: 60000, // 1 minute
    patternVariationThreshold: 0.1, // 10% variation
    highRiskPaths: [
      /\/(admin|login|auth|register|reset-password|logout)/i,
      /\/(api\/v\d+\/)?(users?|auth|account)/i,
      /\.(php|aspx|jsp|cgi|env)/i
    ],
    badBotPatterns: [
      /sqlmap|nikto|dirbuster|nessus|acunetix|nmap|metasploit|gobuster|dirb|hydra|burpsuite|zap/i
    ],
    threatPenaltyDurationMs: 3600000 // 1 hour
  };
  
  // Trackers for IPs and users
  private ipTrackers = new Map<string, ThreatTracker>();
  private userTrackers = new Map<string, ThreatTracker>();
  
  // Cleanup interval
  private cleanupInterval: NodeJS.Timeout;
  
  constructor(config?: ThreatDetectionConfig) {
    // Merge config with defaults
    if (config) {
      this.config = { ...this.config, ...config };
    }
    
    // Start cleanup
    this.cleanupInterval = setInterval(() => this.cleanup(), 3600000); // Every hour
    
    // Log initialization
    log('Threat detection service initialized', 'security');
  }
  
  /**
   * Get threat level for a request (0-1)
   * 
   * @param req Express request
   * @param ip IP address
   * @param userId User ID
   * @returns Threat level (0-1, higher is more threatening)
   */
  public getThreatLevel(req: Request, ip: string, userId?: string | number): number {
    try {
      // Get trackers
      const ipTracker = this.getOrCreateTracker(ip, 'ip');
      const userTracker = userId ? this.getOrCreateTracker(userId.toString(), 'user') : null;
      
      // Get current time
      const now = Date.now();
      
      // Check for active penalty
      if (ipTracker.threatPenaltyExpiration > now) {
        return ipTracker.threatLevel;
      }
      
      if (userTracker && userTracker.threatPenaltyExpiration > now) {
        return userTracker.threatLevel;
      }
      
      // Record request
      this.recordRequest(req, ip, ipTracker);
      if (userTracker) {
        this.recordRequest(req, ip, userTracker);
      }
      
      // Calculate threat level
      let threatLevel = 0;
      
      // Add threat from IP
      threatLevel = Math.max(threatLevel, this.calculateThreatLevel(req, ipTracker));
      
      // Add threat from user
      if (userTracker) {
        threatLevel = Math.max(threatLevel, this.calculateThreatLevel(req, userTracker));
      }
      
      // Adjust for high-risk paths
      if (this.isHighRiskPath(req.path)) {
        threatLevel += 0.1;
      }
      
      // Adjust for suspicious user agent
      if (this.isSuspiciousUserAgent(req.headers['user-agent'] as string)) {
        threatLevel += 0.2;
      }
      
      // Cap and update trackers
      threatLevel = Math.min(1, threatLevel);
      
      // Update tracker threat levels
      ipTracker.threatLevel = threatLevel;
      if (userTracker) {
        userTracker.threatLevel = threatLevel;
      }
      
      return threatLevel;
    } catch (error) {
      log(`Error calculating threat level: ${error}`, 'security');
      
      // Safe default
      return 0;
    }
  }
  
  /**
   * Record successful request
   * 
   * @param ip IP address
   * @param userId User ID
   * @param path Request path
   * @param statusCode Response status code
   */
  public recordSuccess(ip: string, userId: string | number | undefined, path: string, statusCode: number): void {
    try {
      // Get trackers
      const ipTracker = this.getOrCreateTracker(ip, 'ip');
      const userTracker = userId ? this.getOrCreateTracker(userId.toString(), 'user') : null;
      
      // Update status counts
      ipTracker.statusCount.set(statusCode, (ipTracker.statusCount.get(statusCode) || 0) + 1);
      
      if (userTracker) {
        userTracker.statusCount.set(statusCode, (userTracker.statusCount.get(statusCode) || 0) + 1);
      }
    } catch (error) {
      log(`Error recording success: ${error}`, 'security');
    }
  }
  
  /**
   * Record error response
   * 
   * @param ip IP address
   * @param userId User ID
   * @param path Request path
   * @param statusCode Response status code
   * @param threatPenalty Whether to apply a threat penalty
   */
  public recordError(
    ip: string, 
    userId: string | number | undefined, 
    path: string, 
    statusCode: number,
    threatPenalty = false
  ): void {
    try {
      // Get trackers
      const ipTracker = this.getOrCreateTracker(ip, 'ip');
      const userTracker = userId ? this.getOrCreateTracker(userId.toString(), 'user') : null;
      
      // Update status counts
      ipTracker.statusCount.set(statusCode, (ipTracker.statusCount.get(statusCode) || 0) + 1);
      
      if (userTracker) {
        userTracker.statusCount.set(statusCode, (userTracker.statusCount.get(statusCode) || 0) + 1);
      }
      
      // Increment error count
      ipTracker.errorCount++;
      if (userTracker) {
        userTracker.errorCount++;
      }
      
      // Add to recent errors
      const timestamp = Date.now();
      ipTracker.recentErrors.push({ time: timestamp, path });
      if (userTracker) {
        userTracker.recentErrors.push({ time: timestamp, path });
      }
      
      // Trim recent errors
      if (ipTracker.recentErrors.length > 10) {
        ipTracker.recentErrors = ipTracker.recentErrors.slice(-10);
      }
      
      if (userTracker && userTracker.recentErrors.length > 10) {
        userTracker.recentErrors = userTracker.recentErrors.slice(-10);
      }
      
      // Apply threat penalty if requested
      if (threatPenalty) {
        this.applyThreatPenalty(ip, userId);
      }
    } catch (error) {
      log(`Error recording error: ${error}`, 'security');
    }
  }
  
  /**
   * Apply a threat penalty to an IP or user
   * 
   * @param ip IP address
   * @param userId User ID
   * @param threatLevel Custom threat level (0-1)
   */
  public applyThreatPenalty(ip: string, userId: string | number | undefined, threatLevel = 0.8): void {
    try {
      // Get trackers
      const ipTracker = this.getOrCreateTracker(ip, 'ip');
      const userTracker = userId ? this.getOrCreateTracker(userId.toString(), 'user') : null;
      
      // Calculate expiration
      const expiration = Date.now() + this.config.threatPenaltyDurationMs;
      
      // Apply penalty
      ipTracker.threatLevel = Math.max(ipTracker.threatLevel, threatLevel);
      ipTracker.threatPenaltyExpiration = expiration;
      
      if (userTracker) {
        userTracker.threatLevel = Math.max(userTracker.threatLevel, threatLevel);
        userTracker.threatPenaltyExpiration = expiration;
      }
      
      // Log penalty
      log(`Applied threat penalty (${threatLevel.toFixed(2)}) to IP ${ip}${userId ? ` and user ${userId}` : ''}`, 'security');
    } catch (error) {
      log(`Error applying threat penalty: ${error}`, 'security');
    }
  }
  
  /**
   * Remove threat penalty from an IP or user
   * 
   * @param ip IP address
   * @param userId User ID
   */
  public removeThreatPenalty(ip: string, userId: string | number | undefined): void {
    try {
      // Get trackers
      const ipTracker = this.ipTrackers.get(ip);
      const userTracker = userId ? this.userTrackers.get(userId.toString()) : null;
      
      // Remove penalties
      if (ipTracker) {
        ipTracker.threatLevel = 0;
        ipTracker.threatPenaltyExpiration = 0;
      }
      
      if (userTracker) {
        userTracker.threatLevel = 0;
        userTracker.threatPenaltyExpiration = 0;
      }
      
      // Log penalty removal
      log(`Removed threat penalty from IP ${ip}${userId ? ` and user ${userId}` : ''}`, 'security');
    } catch (error) {
      log(`Error removing threat penalty: ${error}`, 'security');
    }
  }
  
  /**
   * Get or create a tracker for an IP or user
   * 
   * @param key IP or user ID
   * @param type Tracker type
   * @returns Tracker
   */
  private getOrCreateTracker(key: string, type: 'ip' | 'user'): ThreatTracker {
    const map = type === 'ip' ? this.ipTrackers : this.userTrackers;
    
    // Get existing tracker
    let tracker = map.get(key);
    
    // Create if not exists
    if (!tracker) {
      tracker = {
        requestTimestamps: [],
        pathCount: new Map(),
        methodCount: new Map(),
        statusCount: new Map(),
        patterns: new Map(),
        errorCount: 0,
        lastSeen: Date.now(),
        threatLevel: 0,
        threatPenaltyExpiration: 0,
        recentErrors: [],
        totalRequests: 0
      };
      
      map.set(key, tracker);
    }
    
    return tracker;
  }
  
  /**
   * Record a request in a tracker
   * 
   * @param req Express request
   * @param ip IP address
   * @param tracker Tracker to update
   */
  private recordRequest(req: Request, ip: string, tracker: ThreatTracker): void {
    try {
      // Get current time
      const now = Date.now();
      
      // Update last seen
      tracker.lastSeen = now;
      
      // Increment total requests
      tracker.totalRequests++;
      
      // Add timestamp
      tracker.requestTimestamps.unshift(now);
      
      // Trim timestamps
      if (tracker.requestTimestamps.length > this.config.recentRequestsTracked) {
        tracker.requestTimestamps = tracker.requestTimestamps.slice(0, this.config.recentRequestsTracked);
      }
      
      // Update path count
      const path = req.path;
      tracker.pathCount.set(path, (tracker.pathCount.get(path) || 0) + 1);
      
      // Update method count
      const method = req.method;
      tracker.methodCount.set(method, (tracker.methodCount.get(method) || 0) + 1);
      
      // Update pattern data
      const patternKey = `${method}:${path}`;
      let patternData = tracker.patterns.get(patternKey);
      
      if (!patternData) {
        patternData = {
          timestamp: now,
          count: 0,
          lastRequestTime: now,
          minInterval: Number.MAX_SAFE_INTEGER,
          maxInterval: 0,
          avgInterval: 0,
          intervalSum: 0,
          requestCount: 0
        };
        
        tracker.patterns.set(patternKey, patternData);
      }
      
      // Update pattern data
      patternData.count++;
      
      // Calculate intervals
      if (patternData.lastRequestTime !== now) {
        const interval = now - patternData.lastRequestTime;
        
        // Update interval stats
        patternData.minInterval = Math.min(patternData.minInterval, interval);
        patternData.maxInterval = Math.max(patternData.maxInterval, interval);
        patternData.intervalSum += interval;
        patternData.requestCount++;
        patternData.avgInterval = patternData.intervalSum / patternData.requestCount;
      }
      
      // Update last request time
      patternData.lastRequestTime = now;
    } catch (error) {
      log(`Error recording request: ${error}`, 'security');
    }
  }
  
  /**
   * Calculate threat level from a tracker
   * 
   * @param req Express request
   * @param tracker Tracker to analyze
   * @returns Threat level (0-1)
   */
  private calculateThreatLevel(req: Request, tracker: ThreatTracker): number {
    try {
      let threatLevel = 0;
      const now = Date.now();
      
      // Check request rate
      const recentWindow = this.config.timeWindowMs;
      const recentTimestamps = tracker.requestTimestamps.filter(ts => ts > now - recentWindow);
      
      if (recentTimestamps.length > 0) {
        // Calculate request rate per minute
        const requestRate = (recentTimestamps.length / recentWindow) * 60000;
        
        // Add threat factor for high request rate
        if (requestRate > this.config.requestRateThreshold) {
          const rateFactor = Math.min(1, (requestRate - this.config.requestRateThreshold) / this.config.requestRateThreshold);
          threatLevel += rateFactor * 0.3;
        }
      }
      
      // Check for repeated patterns
      if (tracker.totalRequests >= 5) {
        // Get pattern for current request
        const patternKey = `${req.method}:${req.path}`;
        const patternData = tracker.patterns.get(patternKey);
        
        if (patternData && patternData.requestCount >= 3) {
          // Check for very regular patterns (suspicious automation)
          const intervalVariation = (patternData.maxInterval - patternData.minInterval) / patternData.avgInterval;
          
          if (intervalVariation < this.config.patternVariationThreshold) {
            threatLevel += 0.2;
          }
        }
      }
      
      // Check for high error rate
      const errorRate = tracker.errorCount / Math.max(1, tracker.totalRequests);
      if (errorRate > 0.2) {
        threatLevel += errorRate * 0.3;
      }
      
      // Check for path diversity
      const uniquePaths = tracker.pathCount.size;
      if (tracker.totalRequests > 10 && uniquePaths === 1) {
        // Single path repeated many times
        threatLevel += 0.1;
      }
      
      return threatLevel;
    } catch (error) {
      log(`Error calculating tracker threat level: ${error}`, 'security');
      
      // Safe default
      return 0;
    }
  }
  
  /**
   * Check if a path is high-risk
   * 
   * @param path Request path
   * @returns Whether it's high-risk
   */
  private isHighRiskPath(path: string): boolean {
    try {
      return this.config.highRiskPaths.some(pattern => pattern.test(path));
    } catch (error) {
      log(`Error checking high-risk path: ${error}`, 'security');
      
      return false;
    }
  }
  
  /**
   * Check if a user agent is suspicious
   * 
   * @param userAgent User agent string
   * @returns Whether it's suspicious
   */
  private isSuspiciousUserAgent(userAgent?: string): boolean {
    try {
      if (!userAgent) {
        // Missing user agent is suspicious
        return true;
      }
      
      // Check against bad bot patterns
      return this.config.badBotPatterns.some(pattern => pattern.test(userAgent));
    } catch (error) {
      log(`Error checking suspicious user agent: ${error}`, 'security');
      
      return false;
    }
  }
  
  /**
   * Clean up old trackers
   */
  private cleanup(): void {
    try {
      // Get current time
      const now = Date.now();
      
      // Clean up IP trackers
      for (const [ip, tracker] of this.ipTrackers.entries()) {
        // Remove if not seen in 24 hours and no active penalty
        if (now - tracker.lastSeen > 24 * 60 * 60 * 1000 && tracker.threatPenaltyExpiration < now) {
          this.ipTrackers.delete(ip);
        }
      }
      
      // Clean up user trackers
      for (const [userId, tracker] of this.userTrackers.entries()) {
        // Remove if not seen in 7 days and no active penalty
        if (now - tracker.lastSeen > 7 * 24 * 60 * 60 * 1000 && tracker.threatPenaltyExpiration < now) {
          this.userTrackers.delete(userId);
        }
      }
      
      // Log cleanup
      log(`Cleaned up threat detection trackers. Remaining: ${this.ipTrackers.size} IPs, ${this.userTrackers.size} users`, 'security');
    } catch (error) {
      log(`Error cleaning up threat detection: ${error}`, 'security');
    }
  }
  
  /**
   * Dispose of the service
   */
  public dispose(): void {
    clearInterval(this.cleanupInterval);
    this.ipTrackers.clear();
    this.userTrackers.clear();
  }
}

// Export singleton instance
export const threatDetectionService = new ThreatDetectionService();