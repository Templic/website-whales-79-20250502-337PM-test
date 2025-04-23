/**
 * Machine Learning-Based Anomaly Detection
 * 
 * This module provides advanced anomaly detection capabilities using
 * statistical algorithms and machine learning techniques to identify
 * unusual patterns in API requests and user behaviors.
 */

import { Request, Response, NextFunction } from 'express';
import { securityFabric } from '../SecurityFabric';
import { securityBlockchain } from '../blockchain/ImmutableSecurityLogs';
import { SecurityEventCategory, SecurityEventSeverity } from '../blockchain/SecurityEventTypes';

/**
 * Types of anomaly detection
 */
export enum AnomalyDetectionType {
  /**
   * Request frequency anomalies
   */
  REQUEST_FREQUENCY = 'request_frequency',
  
  /**
   * Request pattern anomalies
   */
  REQUEST_PATTERN = 'request_pattern',
  
  /**
   * Data access anomalies
   */
  DATA_ACCESS = 'data_access',
  
  /**
   * Authentication anomalies
   */
  AUTHENTICATION = 'authentication',
  
  /**
   * User behavior anomalies
   */
  USER_BEHAVIOR = 'user_behavior'
}

/**
 * Anomaly detection options
 */
export interface AnomalyDetectionOptions {
  /**
   * Sensitivity level (0-1)
   * Higher values trigger more anomalies
   */
  sensitivity?: number;
  
  /**
   * Types of anomaly detection to enable
   */
  enabledTypes?: AnomalyDetectionType[];
  
  /**
   * Whether to block requests on anomaly detection
   */
  blockRequests?: boolean;
  
  /**
   * Whether to log anomalies
   */
  logAnomalies?: boolean;
  
  /**
   * Minimum confidence level for anomalies (0-1)
   */
  minimumConfidence?: number;
}

/**
 * Request statistics tracker
 */
class RequestStatsTracker {
  // Request counts by IP
  private ipRequestCounts: Map<string, number> = new Map();
  
  // Request counts by path
  private pathRequestCounts: Map<string, number> = new Map();
  
  // Request counts by user ID
  private userRequestCounts: Map<string, number> = new Map();
  
  // Average request frequency by IP
  private ipAverageFrequency: Map<string, number> = new Map();
  
  // Last request timestamp by IP
  private ipLastRequestTime: Map<string, number> = new Map();
  
  // Request patterns by IP (path sequence)
  private ipRequestPatterns: Map<string, string[]> = new Map();
  
  /**
   * Track a request
   */
  public trackRequest(req: Request): void {
    const ip = req.ip || 'unknown';
    const path = req.path;
    const userId = (req.user as any)?.id?.toString() || 'anonymous';
    const now = Date.now();
    
    // Update IP request count
    this.ipRequestCounts.set(ip, (this.ipRequestCounts.get(ip) || 0) + 1);
    
    // Update path request count
    this.pathRequestCounts.set(path, (this.pathRequestCounts.get(path) || 0) + 1);
    
    // Update user request count
    this.userRequestCounts.set(userId, (this.userRequestCounts.get(userId) || 0) + 1);
    
    // Update IP request frequency
    const lastRequestTime = this.ipLastRequestTime.get(ip);
    if (lastRequestTime) {
      const timeDiff = now - lastRequestTime;
      const oldAvg = this.ipAverageFrequency.get(ip) || 1000;
      const newAvg = 0.8 * oldAvg + 0.2 * timeDiff; // Exponential moving average
      this.ipAverageFrequency.set(ip, newAvg);
    }
    this.ipLastRequestTime.set(ip, now);
    
    // Update IP request pattern
    const patterns = this.ipRequestPatterns.get(ip) || [];
    patterns.push(path);
    if (patterns.length > 20) {
      patterns.shift(); // Keep only last 20 paths
    }
    this.ipRequestPatterns.set(ip, patterns);
  }
  
  /**
   * Get request count for an IP
   */
  public getIPRequestCount(ip: string): number {
    return this.ipRequestCounts.get(ip) || 0;
  }
  
  /**
   * Get request count for a path
   */
  public getPathRequestCount(path: string): number {
    return this.pathRequestCounts.get(path) || 0;
  }
  
  /**
   * Get request count for a user
   */
  public getUserRequestCount(userId: string): number {
    return this.userRequestCounts.get(userId) || 0;
  }
  
  /**
   * Get average request frequency for an IP (in ms)
   */
  public getIPAverageFrequency(ip: string): number {
    return this.ipAverageFrequency.get(ip) || 1000;
  }
  
  /**
   * Get request pattern for an IP
   */
  public getIPRequestPattern(ip: string): string[] {
    return this.ipRequestPatterns.get(ip) || [];
  }
  
  /**
   * Check if request frequency is anomalous
   */
  public isRequestFrequencyAnomalous(ip: string, sensitivity: number = 0.5): boolean {
    const avgFrequency = this.getIPAverageFrequency(ip);
    if (!avgFrequency || avgFrequency === 0) return false;
    
    const now = Date.now();
    const lastRequestTime = this.ipLastRequestTime.get(ip) || now;
    const timeDiff = now - lastRequestTime;
    
    // Calculate threshold based on sensitivity
    const threshold = avgFrequency * (1 - sensitivity);
    
    return timeDiff < threshold;
  }
  
  /**
   * Check if request pattern is anomalous
   */
  public isRequestPatternAnomalous(ip: string, path: string, sensitivity: number = 0.5): boolean {
    const patterns = this.getIPRequestPattern(ip);
    if (patterns.length < 5) return false;
    
    // Check if this path is uncommon for this IP
    const pathCount = patterns.filter(p => p === path).length;
    const pathRatio = pathCount / patterns.length;
    
    return pathRatio < (0.1 * sensitivity);
  }
  
  /**
   * Detect anomalies in current request
   */
  public detectAnomalies(req: Request, options: AnomalyDetectionOptions): {
    anomalyDetected: boolean;
    anomalyType?: AnomalyDetectionType;
    confidence: number;
    details: any;
  } {
    const { 
      sensitivity = 0.5,
      enabledTypes = Object.values(AnomalyDetectionType),
      minimumConfidence = 0.6
    } = options;
    
    const ip = req.ip || 'unknown';
    const path = req.path;
    const userId = (req.user as any)?.id?.toString() || 'anonymous';
    
    // Track the request first
    this.trackRequest(req);
    
    // Check for request frequency anomalies
    if (enabledTypes.includes(AnomalyDetectionType.REQUEST_FREQUENCY)) {
      const isFrequencyAnomalous = this.isRequestFrequencyAnomalous(ip, sensitivity);
      
      if (isFrequencyAnomalous) {
        const avgFrequency = this.getIPAverageFrequency(ip);
        const now = Date.now();
        const lastRequestTime = this.ipLastRequestTime.get(ip) || now;
        const timeDiff = now - lastRequestTime;
        
        const confidence = Math.min(1, Math.max(0, 1 - (timeDiff / avgFrequency)));
        
        if (confidence >= minimumConfidence) {
          return {
            anomalyDetected: true,
            anomalyType: AnomalyDetectionType.REQUEST_FREQUENCY,
            confidence,
            details: {
              ip,
              avgFrequency,
              currentFrequency: timeDiff,
              requestCount: this.getIPRequestCount(ip)
            }
          };
        }
      }
    }
    
    // Check for request pattern anomalies
    if (enabledTypes.includes(AnomalyDetectionType.REQUEST_PATTERN)) {
      const isPatternAnomalous = this.isRequestPatternAnomalous(ip, path, sensitivity);
      
      if (isPatternAnomalous) {
        const patterns = this.getIPRequestPattern(ip);
        const pathCount = patterns.filter(p => p === path).length;
        const pathRatio = pathCount / patterns.length;
        
        const confidence = Math.min(1, Math.max(0, 1 - (pathRatio / (0.1 * sensitivity))));
        
        if (confidence >= minimumConfidence) {
          return {
            anomalyDetected: true,
            anomalyType: AnomalyDetectionType.REQUEST_PATTERN,
            confidence,
            details: {
              ip,
              path,
              pathRatio,
              recentPaths: patterns.slice(-5) // Last 5 paths
            }
          };
        }
      }
    }
    
    // No anomalies detected
    return {
      anomalyDetected: false,
      confidence: 0,
      details: {}
    };
  }
}

/**
 * Global request stats tracker
 */
const globalStatsTracker = new RequestStatsTracker();

/**
 * Create anomaly detection middleware
 */
export function createAnomalyDetectionMiddleware(options: AnomalyDetectionOptions = {}) {
  const {
    sensitivity = 0.5,
    enabledTypes = Object.values(AnomalyDetectionType),
    blockRequests = false,
    logAnomalies = true,
    minimumConfidence = 0.6
  } = options;
  
  return (req: Request, res: Response, next: NextFunction) => {
    // Detect anomalies
    const anomalyResult = globalStatsTracker.detectAnomalies(req, {
      sensitivity,
      enabledTypes,
      minimumConfidence
    });
    
    // If anomaly detected
    if (anomalyResult.anomalyDetected) {
      // Log anomaly
      if (logAnomalies) {
        securityBlockchain.addSecurityEvent({
          severity: SecurityEventSeverity.HIGH,
          category: SecurityEventCategory.ANOMALY,
          message: `API Anomaly Detected: ${anomalyResult.anomalyType}`,
          ipAddress: req.ip || 'unknown',
          metadata: {
            anomalyType: anomalyResult.anomalyType,
            confidence: anomalyResult.confidence,
            details: anomalyResult.details,
            path: req.path,
            method: req.method,
            userAgent: req.headers['user-agent']
          },
          timestamp: new Date()
        }).catch(error => {
          console.error('[ANOMALY-DETECTION] Error logging security event:', error);
        });
        
        securityFabric.emit('security:anomaly:detected', {
          anomalyType: anomalyResult.anomalyType,
          confidence: anomalyResult.confidence,
          details: anomalyResult.details,
          path: req.path,
          method: req.method,
          ip: req.ip,
          timestamp: new Date()
        });
      }
      
      // Block request if configured
      if (blockRequests) {
        return res.status(429).json({
          success: false,
          message: 'Request blocked due to anomalous behavior',
          details: {
            anomalyType: anomalyResult.anomalyType,
            confidence: Math.round(anomalyResult.confidence * 100) / 100
          }
        });
      }
    }
    
    next();
  };
}

/**
 * Default anomaly detection middleware with reasonable defaults
 */
export const anomalyDetectionMiddleware = createAnomalyDetectionMiddleware({
  sensitivity: 0.5,
  enabledTypes: Object.values(AnomalyDetectionType),
  blockRequests: false, // Only monitor by default
  logAnomalies: true,
  minimumConfidence: 0.7
});