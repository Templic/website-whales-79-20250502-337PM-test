/**
 * Threat Detection Service
 *
 * This module detects potential threats and computes threat levels.
 * It helps make security decisions for rate limiting.
 */

import { Request } from 'express';
import { log } from '../../../utils/logger';

/**
 * Detection context for scanning requests
 */
export interface DetectionContext {
  ip: string;
  path: string;
  method: string;
  params: Record<string, any>;
  headers: Record<string, string>;
  body?: any;
  data?: {
    query?: Record<string, any>;
    [key: string]: any;
  };
}

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
   * Scan a request for potential threats
   * 
   * @param context Detection context
   * @returns Array of detected threats or null if no threats
   */
  public scanRequest(context: DetectionContext): any[] | null {
    try {
      // Basic checks for common attack patterns
      const threats = [];
      
      // Check for SQL injection
      if (this.hasSqlInjection(context)) {
        threats.push({
          type: 'SQL_INJECTION',
          severity: 'high',
          description: 'Potential SQL injection attempt',
          details: {
            detectedIn: 'params or query',
            sampleData: this.getSuspiciousParamData(context)
          },
          includeBody: false,
          autoBlock: true
        });
      }
      
      // Check for XSS
      if (this.hasXssAttack(context)) {
        threats.push({
          type: 'XSS',
          severity: 'medium',
          description: 'Potential XSS attempt',
          details: {
            detectedIn: 'params or query',
            sampleData: this.getSuspiciousParamData(context)
          },
          includeBody: false,
          autoBlock: false
        });
      }
      
      // Check for path traversal
      if (this.hasPathTraversal(context)) {
        threats.push({
          type: 'PATH_TRAVERSAL',
          severity: 'high',
          description: 'Potential path traversal attempt',
          details: {
            detectedIn: 'path or params',
            path: context.path
          },
          includeBody: false,
          autoBlock: true
        });
      }
      
      // For demonstration, log all scan results
      if (process.env.DEBUG_SECURITY === 'true' && threats.length > 0) {
        log(`Threat scan detected ${threats.length} threats from IP ${context.ip}`, 'security');
      }
      
      return threats.length > 0 ? threats : null;
    } catch (error) {
      log(`Error scanning request for threats: ${error}`, 'error');
      return null;
    }
  }
  
  /**
   * Check for SQL injection patterns
   */
  private hasSqlInjection(context: DetectionContext): boolean {
    // Simple SQL injection patterns
    const sqlInjectionPatterns = [
      /'\s*or\s*'1'\s*=\s*'1/i,
      /'\s*or\s*1\s*=\s*1/i,
      /'\s*;\s*drop\s+table/i,
      /'\s*;\s*select\s+/i,
      /union\s+select/i,
      /exec\s*\(/i,
      /\/\*.*\*\//
    ];
    
    return this.checkPatterns(context, sqlInjectionPatterns);
  }
  
  /**
   * Check for XSS attack patterns
   */
  private hasXssAttack(context: DetectionContext): boolean {
    // Simple XSS patterns
    const xssPatterns = [
      /<script.*>.*<\/script>/i,
      /javascript:/i,
      /onerror=/i,
      /onload=/i,
      /onclick=/i,
      /alert\s*\(/i,
      /eval\s*\(/i
    ];
    
    return this.checkPatterns(context, xssPatterns);
  }
  
  /**
   * Check for path traversal attempts
   */
  private hasPathTraversal(context: DetectionContext): boolean {
    // Path traversal patterns
    const pathTraversalPatterns = [
      /\.\.\//,
      /\.\.\\\\/, 
      /%2e%2e%2f/i, 
      /%252e%252e%252f/i,
      /etc\/passwd/i,
      /win\.ini/i
    ];
    
    // First check the path itself
    if (pathTraversalPatterns.some(pattern => pattern.test(context.path))) {
      return true;
    }
    
    return this.checkPatterns(context, pathTraversalPatterns);
  }
  
  /**
   * Check patterns against request data
   */
  private checkPatterns(context: DetectionContext, patterns: RegExp[]): boolean {
    // Check URL parameters
    for (const key in context.params) {
      const value = context.params[key];
      if (typeof value === 'string' && patterns.some(pattern => pattern.test(value))) {
        return true;
      }
    }
    
    // Check query parameters
    if (context.data?.query) {
      for (const key in context.data.query) {
        const value = context.data.query[key];
        if (typeof value === 'string' && patterns.some(pattern => pattern.test(value))) {
          return true;
        }
      }
    }
    
    // Check body if available (and not too large)
    if (context.body && typeof context.body === 'object') {
      const bodyStr = JSON.stringify(context.body);
      if (bodyStr.length < 10000 && patterns.some(pattern => pattern.test(bodyStr))) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Get suspicious parameter data for logging
   */
  private getSuspiciousParamData(context: DetectionContext): Record<string, any> {
    const result: Record<string, any> = {};
    
    // Include the most important context data for investigation
    if (context.params && Object.keys(context.params).length > 0) {
      result.params = context.params;
    }
    
    if (context.data?.query && Object.keys(context.data.query).length > 0) {
      result.query = context.data.query;
    }
    
    return result;
  }
  
  /**
   * Report a detected threat
   * 
   * @param threatInfo Threat information
   * @returns Generated threat ID or null if error
   */
  public reportThreat(threatInfo: {
    threatType: string;
    severity: string;
    sourceIp: string;
    description: string;
    evidence?: any;
  }): string | null {
    try {
      // Log the threat
      log(`Threat reported: ${threatInfo.description} (${threatInfo.threatType}, severity: ${threatInfo.severity}) from ${threatInfo.sourceIp}`, 'security');
      
      // Record as a threat in our system
      this.recordThreat(
        threatInfo.sourceIp, 
        undefined, // userId is not provided
        threatInfo.severity === 'high' || threatInfo.severity === 'critical' ? 0.8 : 0.5,
        threatInfo.description
      );
      
      // Generate a unique ID for this threat
      const threatId = `threat-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
      
      // Return the threat ID
      return threatId;
    } catch (error) {
      log(`Error reporting threat: ${error}`, 'error');
      return null;
    }
  }
  
  /**
   * Block an IP
   * 
   * @param ip IP address to block
   * @param reason Reason for blocking
   * @param durationSeconds Duration in seconds to block
   */
  public blockIp(ip: string, reason: string, durationSeconds: number): void {
    log(`Blocking IP ${ip} for ${durationSeconds} seconds. Reason: ${reason}`, 'security');
    // This would typically interact with a database or external system
    // For now, we'll just log it
  }
  
  /**
   * Check if an IP is blocked
   */
  public isIpBlocked(ip: string): Promise<boolean> {
    // This would typically check a database or external system
    // For now, return false (not blocked)
    return Promise.resolve(false);
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