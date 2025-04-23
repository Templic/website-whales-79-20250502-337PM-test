/**
 * ML-Based Anomaly Detection
 * 
 * This module provides anomaly detection capabilities for security-related
 * operations using machine learning techniques.
 */

import { ImmutableSecurityLogger, SecurityEventType } from '../blockchain/SecurityLogger';
import { Request, Response, NextFunction } from 'express';

const logger = new ImmutableSecurityLogger('ANOMALY-DETECTION');

/**
 * Result of an anomaly detection operation
 */
export interface AnomalyDetectionResult {
  isAnomaly: boolean;
  score: number;
  confidence: number;
  reason: string;
}

/**
 * Detect anomalies in security-related operations
 * 
 * @param operationType The type of operation being monitored
 * @param features Features to analyze for anomalies
 * @returns Anomaly detection result
 */
export function detectAnomaly(
  operationType: string,
  features: Record<string, any>
): AnomalyDetectionResult {
  try {
    logger.info(`Running anomaly detection for ${operationType}`, {
      features,
      timestamp: Date.now()
    });
    
    // In a real implementation, this would use machine learning models
    // For now, we're using simple rules-based detection
    
    // Simulate analyzing the features
    const result = analyzeFeatures(operationType, features);
    
    // Log the result
    if (result.isAnomaly) {
      logger.warn(`Anomaly detected in ${operationType}`, {
        anomalyScore: result.score,
        confidence: result.confidence,
        reason: result.reason,
        features,
        timestamp: Date.now(),
        eventType: SecurityEventType.ANOMALY_DETECTED
      });
    } else {
      logger.debug(`No anomalies detected in ${operationType}`, {
        features,
        timestamp: Date.now()
      });
    }
    
    return result;
  } catch (error) {
    logger.error(`Error during anomaly detection for ${operationType}`, {
      error: (error as Error).message,
      features,
      timestamp: Date.now()
    });
    
    return {
      isAnomaly: false,
      score: 0,
      confidence: 0,
      reason: `Error during detection: ${(error as Error).message}`
    };
  }
}

/**
 * Analyze features to detect anomalies
 * 
 * @param operationType Type of operation being analyzed
 * @param features Features to analyze
 * @returns Anomaly detection result
 */
function analyzeFeatures(
  operationType: string,
  features: Record<string, any>
): AnomalyDetectionResult {
  // This is a placeholder for actual ML-based detection
  // In a real implementation, this would use trained models
  
  // Check for suspicious timing
  if (features.duration && typeof features.duration === 'number') {
    const expectedDuration = getExpectedDuration(operationType);
    const deviation = Math.abs(features.duration - expectedDuration);
    const maxDeviation = expectedDuration * 0.5; // 50% deviation threshold
    
    if (deviation > maxDeviation) {
      return {
        isAnomaly: true,
        score: deviation / expectedDuration,
        confidence: 0.8,
        reason: `Abnormal operation duration: ${features.duration}ms vs expected ${expectedDuration}ms`
      };
    }
  }
  
  // Check for algorithm mismatches
  if (features.algorithm && operationType === 'ENCRYPTION') {
    const expectedAlgorithm = 'LATTICE_NTRU';
    if (features.algorithm !== expectedAlgorithm) {
      return {
        isAnomaly: true,
        score: 0.7,
        confidence: 0.9,
        reason: `Unexpected algorithm: ${features.algorithm} vs expected ${expectedAlgorithm}`
      };
    }
  }
  
  // Check for unexpected data sizes
  if (features.dataLength && features.ciphertextLength) {
    const ratio = features.ciphertextLength / features.dataLength;
    const expectedRatio = getExpectedRatio(operationType);
    const deviation = Math.abs(ratio - expectedRatio);
    
    if (deviation > 0.5) {
      return {
        isAnomaly: true,
        score: deviation,
        confidence: 0.7,
        reason: `Unexpected data size ratio: ${ratio.toFixed(2)} vs expected ${expectedRatio.toFixed(2)}`
      };
    }
  }
  
  // Check for time-based anomalies
  if (features.timestamp && features.signatureTimestamp) {
    const timeDiff = features.timestamp - features.signatureTimestamp;
    // If verification happens too long after signature creation (>30 days)
    if (timeDiff > 30 * 24 * 60 * 60 * 1000) {
      return {
        isAnomaly: true,
        score: 0.6,
        confidence: 0.6,
        reason: `Verification time too far from signature creation: ${timeDiff}ms`
      };
    }
  }
  
  // No anomalies detected
  return {
    isAnomaly: false,
    score: 0,
    confidence: 1.0,
    reason: "No anomalies detected"
  };
}

/**
 * Get expected duration for an operation type
 */
function getExpectedDuration(operationType: string): number {
  // Placeholder values, would be determined by baseline measurements
  const durations: Record<string, number> = {
    'KEY_GENERATION': 500,
    'ENCRYPTION': 50,
    'DECRYPTION': 75,
    'SIGNATURE': 100,
    'SIGNATURE_VERIFICATION': 30,
    'RANGE_PROOF': 150
  };
  
  return durations[operationType] || 100; // Default to 100ms
}

/**
 * Get expected ratio between input and output data
 */
function getExpectedRatio(operationType: string): number {
  // Placeholder values, would be determined by analysis
  const ratios: Record<string, number> = {
    'ENCRYPTION': 1.2, // Ciphertext slightly larger than plaintext
    'SIGNATURE': 0.5, // Signature typically smaller than message
    'RANGE_PROOF': 2.0 // Range proofs typically larger than the value
  };
  
  return ratios[operationType] || 1.0; // Default to 1.0
}

/**
 * Express middleware for API request anomaly detection
 * 
 * This middleware analyzes incoming API requests for anomalies and
 * logs suspicious patterns that might indicate security issues.
 * 
 * @param req Express request object
 * @param res Express response object
 * @param next Express next function
 */
export function anomalyDetectionMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Store start time to measure request duration
  const startTime = Date.now();
  
  // Collect features for anomaly detection
  const features: Record<string, any> = {
    method: req.method,
    path: req.path,
    clientIp: req.ip,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
    bodySize: req.body ? JSON.stringify(req.body).length : 0,
    querySize: req.query ? Object.keys(req.query).length : 0,
    timestamp: startTime
  };
  
  // Intercept response to analyze it after processing
  const originalSend = res.send;
  res.send = function(body: any): Response {
    // Restore original function
    res.send = originalSend;
    
    // Calculate request duration
    const duration = Date.now() - startTime;
    
    // Add response features
    features.duration = duration;
    features.statusCode = res.statusCode;
    features.responseSize = typeof body === 'string' ? body.length : 
                           (body ? JSON.stringify(body).length : 0);
                           
    // Perform anomaly detection
    const apiOperationType = `API_${req.method}_${req.path.split('/')[1] || 'root'}`;
    const result = detectAnomaly(apiOperationType, features);
    
    // If an anomaly is detected, log it with detailed information
    if (result.isAnomaly) {
      logger.warn(`API anomaly detected: ${result.reason}`, {
        request: {
          method: req.method,
          path: req.path,
          query: req.query,
          headers: req.headers,
          // Don't log sensitive body information
          bodyKeys: req.body ? Object.keys(req.body) : []
        },
        response: {
          statusCode: res.statusCode,
          duration,
          // Don't log sensitive response information
          size: features.responseSize
        },
        anomaly: {
          score: result.score,
          confidence: result.confidence,
          reason: result.reason
        },
        timestamp: Date.now(),
        eventType: SecurityEventType.API_ANOMALY
      });
    }
    
    // Send the original response
    return originalSend.call(this, body);
  };
  
  // Continue with request processing
  next();
}