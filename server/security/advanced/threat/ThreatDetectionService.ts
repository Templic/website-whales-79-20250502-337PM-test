/**
 * Threat Detection Service
 *
 * This module detects potential threats and computes threat levels.
 * It helps make security decisions for rate limiting.
 */

import { Request } from 'express';
import { log } from '../../../utils/logger';

/**
 * Threat entry
 */
interface ThreatEntry {
  /**
   * IP address
   */
  ip: string;
  
  /**
   * User ID (if available)
   */
  userId?: string | number;
  
  /**
   * Timestamp
   */
  timestamp: number;
  
  /**
   * Threat level (0-1, higher = more threatening)
   */
  threatLevel: number;
  
  /**
   * Reason for threat
   */
  reason: string;
}

/**
 * Error entry
 */
interface ErrorEntry {
  /**
   * IP address
   */
  ip: string;
  
  /**
   * User ID (if available)
   */
  userId?: string | number;
  
  /**
   * Path
   */
  path: string;
  
  /**
   * Status code
   */
  statusCode: number;
  
  /**
   * Is suspicious
   */
  isSuspicious: boolean;
  
  /**
   * Timestamp
   */
  timestamp: number;
}

/**
 * Threat detection options
 */
interface ThreatDetectionOptions {
  /**
   * Max IP errors before increasing threat
   */
  maxIpErrors?: number;
  
  /**
   * Max user errors before increasing threat
   */
  maxUserErrors?: number;
  
  /**
   * Decay rate for threats (per hour)
   */
  threatDecayRate?: number;
  
  /**
   * Storage time for errors (ms)
   */
  errorStorageTime?: number;
  
  /**
   * Storage time for threats (ms)
   */
  threatStorageTime?: number;
}

/**
 * Threat detection service
 */
class ThreatDetectionService {
  // Recent errors
  private recentErrors: Map<string, ErrorEntry[]> = new Map();
  
  // Detected threats
  private detectedThreats: Map<string, ThreatEntry> = new Map();
  
  // Last cleanup time
  private lastCleanup: number = Date.now();
  
  // Configuration
  private config: Required<ThreatDetectionOptions>;
  
  constructor(options: ThreatDetectionOptions = {}) {
    // Set configuration with defaults
    this.config = {
      maxIpErrors: options.maxIpErrors || 10,
      maxUserErrors: options.maxUserErrors || 5,
      threatDecayRate: options.threatDecayRate || 0.1,
      errorStorageTime: options.errorStorageTime || 60 * 60 * 1000, // 1 hour
      threatStorageTime: options.threatStorageTime || 24 * 60 * 60 * 1000 // 24 hours
    };
    
    log('Threat detection service initialized', 'security');
    
    // Setup cleanup interval
    setInterval(() => this.cleanup(), 10 * 60 * 1000); // 10 minutes
  }
  
  /**
   * Record an error
   * 
   * @param ip IP address
   * @param userId User ID (if available)
   * @param path Request path
   * @param statusCode HTTP status code
   * @param isSuspicious Whether the error is suspicious
   */
  public recordError(
    ip: string,
    userId: string | number | undefined,
    path: string,
    statusCode: number,
    isSuspicious: boolean
  ): void {
    try {
      // Create error entry
      const entry: ErrorEntry = {
        ip,
        userId,
        path,
        statusCode,
        isSuspicious,
        timestamp: Date.now()
      };
      
      // Add to IP errors
      const ipKey = `ip:${ip}`;
      const ipErrors = this.recentErrors.get(ipKey) || [];
      ipErrors.push(entry);
      this.recentErrors.set(ipKey, ipErrors);
      
      // Add to user errors if user ID available
      if (userId) {
        const userKey = `user:${userId}`;
        const userErrors = this.recentErrors.get(userKey) || [];
        userErrors.push(entry);
        this.recentErrors.set(userKey, userErrors);
      }
      
      // Check for threshold
      if (isSuspicious) {
        this.checkThresholds(ip, userId);
      }
    } catch (error) {
      log(`Error recording error: ${error}`, 'error');
    }
  }
  
  /**
   * Check error thresholds
   * 
   * @param ip IP address
   * @param userId User ID (if available)
   */
  private checkThresholds(ip: string, userId?: string | number): void {
    try {
      const now = Date.now();
      const timeLimit = now - 10 * 60 * 1000; // Last 10 minutes
      
      // Check IP errors
      const ipKey = `ip:${ip}`;
      const ipErrors = this.recentErrors.get(ipKey) || [];
      const recentIpErrors = ipErrors.filter(e => e.timestamp >= timeLimit);
      const suspiciousIpErrors = recentIpErrors.filter(e => e.isSuspicious);
      
      // Check if over threshold
      if (suspiciousIpErrors.length >= this.config.maxIpErrors) {
        // Calculate threat level based on error count
        const threatLevel = Math.min(0.7, 0.2 + (suspiciousIpErrors.length / this.config.maxIpErrors) * 0.5);
        
        // Record threat
        this.recordThreat(ip, userId, threatLevel, 'Too many suspicious errors');
      }
      
      // Check user errors
      if (userId) {
        const userKey = `user:${userId}`;
        const userErrors = this.recentErrors.get(userKey) || [];
        const recentUserErrors = userErrors.filter(e => e.timestamp >= timeLimit);
        const suspiciousUserErrors = recentUserErrors.filter(e => e.isSuspicious);
        
        // Check if over threshold
        if (suspiciousUserErrors.length >= this.config.maxUserErrors) {
          // Calculate threat level based on error count
          const threatLevel = Math.min(0.7, 0.2 + (suspiciousUserErrors.length / this.config.maxUserErrors) * 0.5);
          
          // Record threat
          this.recordThreat(ip, userId, threatLevel, 'Too many suspicious user errors');
        }
      }
    } catch (error) {
      log(`Error checking thresholds: ${error}`, 'error');
    }
  }
  
  /**
   * Record a threat
   * 
   * @param ip IP address
   * @param userId User ID (if available)
   * @param threatLevel Threat level (0-1)
   * @param reason Reason for threat
   */
  public recordThreat(
    ip: string,
    userId: string | number | undefined,
    threatLevel: number,
    reason: string
  ): void {
    try {
      const now = Date.now();
      
      // Create threat entry
      const entry: ThreatEntry = {
        ip,
        userId,
        timestamp: now,
        threatLevel,
        reason
      };
      
      // Record IP threat
      const ipKey = `ip:${ip}`;
      const existingIpThreat = this.detectedThreats.get(ipKey);
      
      if (existingIpThreat) {
        // Use higher threat level
        const newThreatLevel = Math.max(existingIpThreat.threatLevel, threatLevel);
        
        this.detectedThreats.set(ipKey, {
          ...entry,
          threatLevel: newThreatLevel
        });
      } else {
        this.detectedThreats.set(ipKey, entry);
      }
      
      // Record user threat if user ID available
      if (userId) {
        const userKey = `user:${userId}`;
        const existingUserThreat = this.detectedThreats.get(userKey);
        
        if (existingUserThreat) {
          // Use higher threat level
          const newThreatLevel = Math.max(existingUserThreat.threatLevel, threatLevel);
          
          this.detectedThreats.set(userKey, {
            ...entry,
            threatLevel: newThreatLevel
          });
        } else {
          this.detectedThreats.set(userKey, entry);
        }
      }
      
      // Log threat
      if (threatLevel >= 0.5) {
        log(`High threat detected (${threatLevel.toFixed(2)}): ${reason} from ${ip}${userId ? ` (user ${userId})` : ''}`, 'security');
      }
    } catch (error) {
      log(`Error recording threat: ${error}`, 'error');
    }
  }
  
  /**
   * Get threat level for a request
   * 
   * @param req Request
   * @param ip IP address
   * @param userId User ID (if available)
   * @returns Threat level (0-1)
   */
  public getThreatLevel(
    req: Request,
    ip: string,
    userId?: string | number
  ): number {
    try {
      // Apply threat decay
      this.applyThreatDecay();
      
      // Get IP threat
      const ipKey = `ip:${ip}`;
      const ipThreat = this.detectedThreats.get(ipKey);
      
      // Get user threat
      let userThreat: ThreatEntry | undefined;
      if (userId) {
        const userKey = `user:${userId}`;
        userThreat = this.detectedThreats.get(userKey);
      }
      
      // Use higher threat level
      const ipThreatLevel = ipThreat?.threatLevel || 0;
      const userThreatLevel = userThreat?.threatLevel || 0;
      
      return Math.max(ipThreatLevel, userThreatLevel);
    } catch (error) {
      log(`Error getting threat level: ${error}`, 'error');
      
      // Return safe default
      return 0;
    }
  }
  
  /**
   * Apply threat decay
   */
  private applyThreatDecay(): void {
    try {
      const now = Date.now();
      
      // Skip if less than 1 hour since last decay
      if (now - this.lastCleanup < 60 * 60 * 1000) {
        return;
      }
      
      // Calculate hours since last cleanup
      const hoursSinceLastCleanup = (now - this.lastCleanup) / (60 * 60 * 1000);
      
      // Update last cleanup
      this.lastCleanup = now;
      
      // Calculate decay amount
      const decayAmount = this.config.threatDecayRate * hoursSinceLastCleanup;
      
      // Apply decay to all threats
      for (const [key, threat] of this.detectedThreats.entries()) {
        // Calculate new threat level
        const newThreatLevel = Math.max(0, threat.threatLevel - decayAmount);
        
        if (newThreatLevel <= 0.01) {
          // Remove threat if below threshold
          this.detectedThreats.delete(key);
        } else {
          // Update threat level
          this.detectedThreats.set(key, {
            ...threat,
            threatLevel: newThreatLevel
          });
        }
      }
    } catch (error) {
      log(`Error applying threat decay: ${error}`, 'error');
    }
  }
  
  /**
   * Cleanup old entries
   */
  private cleanup(): void {
    try {
      const now = Date.now();
      
      // Clean up old errors
      for (const [key, errors] of this.recentErrors.entries()) {
        // Filter out old errors
        const newErrors = errors.filter(e => now - e.timestamp < this.config.errorStorageTime);
        
        if (newErrors.length === 0) {
          // Remove empty arrays
          this.recentErrors.delete(key);
        } else if (newErrors.length !== errors.length) {
          // Update with filtered errors
          this.recentErrors.set(key, newErrors);
        }
      }
      
      // Clean up old threats
      for (const [key, threat] of this.detectedThreats.entries()) {
        if (now - threat.timestamp > this.config.threatStorageTime) {
          this.detectedThreats.delete(key);
        }
      }
    } catch (error) {
      log(`Error cleaning up threat detection: ${error}`, 'error');
    }
  }
}

// Export singleton instance
export const threatDetectionService = new ThreatDetectionService();