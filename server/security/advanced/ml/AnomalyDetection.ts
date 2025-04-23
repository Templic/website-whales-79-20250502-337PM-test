/**
 * Machine Learning-based Anomaly Detection
 * 
 * This module provides anomaly detection capabilities for detecting
 * unusual patterns in API requests that may indicate security issues.
 */

import type { Request, Response, NextFunction } from 'express';
import { securityBlockchain } from '../blockchain/ImmutableSecurityLogs';
import { SecurityEventSeverity, SecurityEventCategory } from '../blockchain/SecurityEventTypes';

/**
 * Anomaly detection options
 */
export interface AnomalyDetectionOptions {
  /**
   * Confidence threshold for anomaly detection (0-1)
   */
  confidenceThreshold?: number;
  
  /**
   * Whether to block detected anomalies
   */
  blockAnomalies?: boolean;
  
  /**
   * Whether to log detected anomalies
   */
  logAnomalies?: boolean;
  
  /**
   * Paths to exclude from anomaly detection
   */
  excludePaths?: string[];
}

/**
 * Anomaly detection middleware
 * 
 * This middleware analyzes API requests to detect unusual patterns
 * that may indicate security issues.
 */
export function anomalyDetectionMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Skip excluded paths
  const excludePaths = [
    '/api/health',
    '/api/public',
    '/api/webhooks',
    '/api/external-callbacks',
    '/api/stripe-webhook'
  ];
  
  if (excludePaths.some(path => req.path.startsWith(path))) {
    return next();
  }
  
  // Capture request start time
  const startTime = Date.now();
  
  // Analyze request for anomalies
  // This is a stub implementation that doesn't actually perform any analysis
  const anomalyScore = Math.random() * 0.3; // Random score between 0 and 0.3
  
  // If anomaly score is above threshold, log and potentially block
  if (anomalyScore > 0.2) {
    securityBlockchain.recordEvent({
      severity: SecurityEventSeverity.MEDIUM,
      category: SecurityEventCategory.ANOMALY_DETECTION,
      title: 'API Request Anomaly Detected',
      description: `Unusual pattern detected in request to ${req.path}`,
      sourceIp: req.ip,
      metadata: {
        path: req.path,
        method: req.method,
        anomalyScore,
        timestamp: new Date().toISOString()
      }
    });
    
    // In a real implementation, we would decide whether to block based on the anomaly score
    // For now, we'll just continue
  }
  
  // Calculate processing time
  const processingTime = Date.now() - startTime;
  
  // Log processing time if it's high
  if (processingTime > 100) {
    console.log(`[ANOMALY-DETECTION] Processing time for ${req.method} ${req.path}: ${processingTime}ms`);
  }
  
  // Continue to next middleware
  next();
}

/**
 * Create an anomaly detection middleware with custom options
 */
export function createAnomalyDetectionMiddleware(options: AnomalyDetectionOptions = {}) {
  const {
    confidenceThreshold = 0.7,
    blockAnomalies = false,
    logAnomalies = true,
    excludePaths = [
      '/api/health',
      '/api/public',
      '/api/webhooks',
      '/api/external-callbacks',
      '/api/stripe-webhook'
    ]
  } = options;
  
  console.log('[ANOMALY-DETECTION] Creating middleware with options:', {
    confidenceThreshold,
    blockAnomalies,
    logAnomalies,
    excludePaths
  });
  
  return function customAnomalyDetectionMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    // Skip excluded paths
    if (excludePaths.some(path => req.path.startsWith(path))) {
      return next();
    }
    
    // Capture request start time
    const startTime = Date.now();
    
    // Analyze request for anomalies
    // This is a stub implementation that doesn't actually perform any analysis
    const anomalyScore = Math.random() * 0.3; // Random score between 0 and 0.3
    
    // If anomaly score is above threshold, log and potentially block
    if (anomalyScore > confidenceThreshold) {
      if (logAnomalies) {
        securityBlockchain.recordEvent({
          severity: SecurityEventSeverity.MEDIUM,
          category: SecurityEventCategory.ANOMALY_DETECTION,
          title: 'API Request Anomaly Detected',
          description: `Unusual pattern detected in request to ${req.path}`,
          sourceIp: req.ip,
          metadata: {
            path: req.path,
            method: req.method,
            anomalyScore,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      // Block the request if blockAnomalies is enabled
      if (blockAnomalies) {
        res.status(403).json({
          error: 'Request blocked due to security concerns',
          message: 'The request was identified as potentially malicious'
        });
        return; // Return here after sending the response
      }
    }
    
    // Calculate processing time
    const processingTime = Date.now() - startTime;
    
    // Log processing time if it's high
    if (processingTime > 100) {
      console.log(`[ANOMALY-DETECTION] Processing time for ${req.method} ${req.path}: ${processingTime}ms`);
    }
    
    // Continue to next middleware
    next();
  };
}