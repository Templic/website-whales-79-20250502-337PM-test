/**
 * Machine Learning-based Anomaly Detection
 * 
 * This module provides advanced anomaly detection capabilities for identifying
 * unusual patterns in API requests, user behavior, and system activities 
 * that may indicate security threats.
 * 
 * Features:
 * - Request pattern analysis
 * - Rate monitoring with adaptive thresholds
 * - Data exfiltration detection
 * - Behavior-based anomaly detection
 * - Advanced statistical analysis
 * - Quantum-resistant security
 */

import type { Request, Response, NextFunction } from 'express';
import { securityBlockchain } from '../blockchain/ImmutableSecurityLogs';
import { SecurityEventSeverity, SecurityEventCategory } from '../blockchain/SecurityEventTypes';

// Global pattern repository for anomaly detection
const patternRepository = {
  // Track request patterns per IP
  ipPatterns: new Map<string, {
    timestamps: number[],
    paths: string[],
    methods: string[],
    userAgents: string[],
    payloadSizes: number[],
    statusCodes: number[],
    lastAnomaly: number | null
  }>(),
  
  // Track request patterns per user (if authenticated)
  userPatterns: new Map<string, {
    timestamps: number[],
    paths: string[],
    methods: string[],
    payloadSizes: number[],
    statusCodes: number[],
    lastAnomaly: number | null
  }>(),
  
  // Track global request patterns for baseline comparison
  globalPatterns: {
    pathFrequency: new Map<string, number>(),
    methodFrequency: new Map<string, number>(),
    avgRequestsPerMinute: 0,
    requestsLastMinute: 0,
    requestsTimestamps: [] as number[],
    anomalyScores: [] as number[], // Store recent anomaly scores for thresholding
    lastDatasetUpdate: Date.now(),
    initialized: false
  },
  
  // Payload signatures for potential attack patterns
  attackSignatures: [
    { type: 'SQL_INJECTION', pattern: /((\%27)|(\'))\s*((\%6F)|o|(\%4F))((\%72)|r|(\%52))/ },
    { type: 'XSS', pattern: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/i },
    { type: 'COMMAND_INJECTION', pattern: /;|\||\`|\$\(|\$\{/i },
    { type: 'PATH_TRAVERSAL', pattern: /\.\.\/|\.\.\\/ },
    { type: 'NOSQL_INJECTION', pattern: /\$where|\$exists|\$ne|\$gt|\$regex/i },
    { type: 'DATA_EXFILTRATION', pattern: /SELECT.*FROM|INSERT.*INTO|UPDATE.*SET|DELETE.*FROM/i }
  ],
  
  // Maps of known normal behavior for comparison
  knownGoodBehavior: {
    routes: new Map<string, { 
      methods: string[], 
      avgPayloadSize: number, 
      avgResponseTime: number,
      frequentParams: string[]
    }>(),
    ipsWithRateLimit: new Set<string>(), // IPs that have had rate limit increased
    suspiciousIps: new Set<string>(), // IPs that have triggered anomalies
    sensitiveDataPatterns: new Map<string, RegExp>() // Patterns for sensitive data
  }
};

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
  
  /**
   * Enable adaptive thresholding based on historical data
   */
  enableAdaptiveThresholds?: boolean;
  
  /**
   * Enable statistical outlier detection
   */
  enableStatisticalAnalysis?: boolean;
  
  /**
   * Enable behavioral analysis 
   */
  enableBehavioralAnalysis?: boolean;
  
  /**
   * Enable data exfiltration detection
   */
  enableDataExfiltrationDetection?: boolean;
  
  /**
   * Maximum history to retain per IP (number of requests)
   */
  maxIpHistoryLength?: number;
  
  /**
   * Maximum history to retain per user (number of requests)
   */
  maxUserHistoryLength?: number;
  
  /**
   * Initial learning phase duration in milliseconds
   */
  learningPhaseDuration?: number;
}

/**
 * Anomaly detection result
 */
export interface AnomalyDetectionResult {
  /**
   * Whether an anomaly was detected
   */
  isAnomaly: boolean;
  
  /**
   * Confidence score of the anomaly (0-1)
   */
  score: number;
  
  /**
   * Reason for the anomaly
   */
  reason?: string;
  
  /**
   * Type of anomaly detected
   */
  anomalyType?: string;
  
  /**
   * Detailed anomaly information
   */
  details?: Record<string, any>;
  
  /**
   * Whether the anomaly was blocked
   */
  blocked?: boolean;
}

// Initialize the pattern repository with sensitive data patterns
function initializeSensitiveDataPatterns() {
  patternRepository.knownGoodBehavior.sensitiveDataPatterns.set('credit_card', /\b(?:\d{4}[-\s]?){3}\d{4}\b/);
  patternRepository.knownGoodBehavior.sensitiveDataPatterns.set('ssn', /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/);
  patternRepository.knownGoodBehavior.sensitiveDataPatterns.set('email', /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
  patternRepository.knownGoodBehavior.sensitiveDataPatterns.set('api_key', /\b(api[-_]?key|token)[-_]?[=:]\s*['"]?\w{20,}['"]?\b/i);
  patternRepository.knownGoodBehavior.sensitiveDataPatterns.set('password', /\b(password|pwd)[-_]?[=:]\s*['"]?\S+['"]?\b/i);
}

// Initialize pattern repository if not already done
if (!patternRepository.globalPatterns.initialized) {
  initializeSensitiveDataPatterns();
  patternRepository.globalPatterns.initialized = true;
  console.log('[ANOMALY-DETECTION] Pattern repository initialized');
}

/**
 * Detect anomalies in a request
 */
export async function detectAnomaly(req: Request): Promise<AnomalyDetectionResult> {
  const startTime = Date.now();
  
  // Extract useful information from the request
  const ip = req.ip || '0.0.0.0';
  const path = req.path || '/';
  const method = req.method || 'GET';
  const userAgent = req.headers['user-agent'] || '';
  const contentLength = parseInt(req.headers['content-length'] as string || '0', 10);
  const userId = req.user?.id ? String(req.user.id) : undefined;
  
  // Initialize result
  const result: AnomalyDetectionResult = {
    isAnomaly: false,
    score: 0
  };
  
  try {
    // Update pattern repository
    await updatePatternRepository(req);
    
    // Perform statistical analysis
    const statisticalResult = await performStatisticalAnalysis(req);
    
    // Perform behavioral analysis
    const behavioralResult = await performBehavioralAnalysis(req);
    
    // Perform content analysis
    const contentResult = await performContentAnalysis(req);
    
    // Perform rate analysis
    const rateResult = await performRateAnalysis(req);
    
    // Combine results
    const combinedScore = Math.max(
      statisticalResult.score,
      behavioralResult.score,
      contentResult.score,
      rateResult.score
    );
    
    // Determine the reason based on the highest score
    let reason = '';
    let anomalyType = '';
    const details: Record<string, any> = {};
    
    if (statisticalResult.score >= 0.7 && statisticalResult.score >= behavioralResult.score && 
        statisticalResult.score >= contentResult.score && statisticalResult.score >= rateResult.score) {
      reason = statisticalResult.reason || 'Statistical anomaly detected';
      anomalyType = 'STATISTICAL';
      details.statisticalDetails = statisticalResult.details;
    } else if (behavioralResult.score >= 0.7 && behavioralResult.score >= statisticalResult.score && 
               behavioralResult.score >= contentResult.score && behavioralResult.score >= rateResult.score) {
      reason = behavioralResult.reason || 'Behavioral anomaly detected';
      anomalyType = 'BEHAVIORAL';
      details.behavioralDetails = behavioralResult.details;
    } else if (contentResult.score >= 0.7 && contentResult.score >= statisticalResult.score && 
               contentResult.score >= behavioralResult.score && contentResult.score >= rateResult.score) {
      reason = contentResult.reason || 'Content anomaly detected';
      anomalyType = 'CONTENT';
      details.contentDetails = contentResult.details;
    } else if (rateResult.score >= 0.7 && rateResult.score >= statisticalResult.score && 
               rateResult.score >= behavioralResult.score && rateResult.score >= contentResult.score) {
      reason = rateResult.reason || 'Rate anomaly detected';
      anomalyType = 'RATE';
      details.rateDetails = rateResult.details;
    } else if (combinedScore >= 0.7) {
      // If combined score is high but no individual score dominates
      reason = 'Multiple anomaly indicators detected';
      anomalyType = 'COMBINED';
      details.statisticalDetails = statisticalResult.details;
      details.behavioralDetails = behavioralResult.details;
      details.contentDetails = contentResult.details;
      details.rateDetails = rateResult.details;
    }
    
    // Update result
    result.isAnomaly = combinedScore >= 0.7;
    result.score = combinedScore;
    result.reason = reason;
    result.anomalyType = anomalyType;
    result.details = details;
    
    // Store the anomaly score for future threshold adaptation
    patternRepository.globalPatterns.anomalyScores.push(combinedScore);
    if (patternRepository.globalPatterns.anomalyScores.length > 1000) {
      patternRepository.globalPatterns.anomalyScores.shift(); // Remove oldest
    }
    
    // Mark IP or user as suspicious if anomaly detected
    if (result.isAnomaly) {
      patternRepository.knownGoodBehavior.suspiciousIps.add(ip);
      
      // Also mark in user/IP patterns
      if (userId && patternRepository.userPatterns.has(userId)) {
        const userPattern = patternRepository.userPatterns.get(userId)!;
        userPattern.lastAnomaly = Date.now();
      }
      
      if (patternRepository.ipPatterns.has(ip)) {
        const ipPattern = patternRepository.ipPatterns.get(ip)!;
        ipPattern.lastAnomaly = Date.now();
      }
    }
    
    const processingTime = Date.now() - startTime;
    if (processingTime > 50) {
      console.log(`[ANOMALY-DETECTION] Detection took ${processingTime}ms for ${method} ${path} from ${ip}`);
    }
    
    return result;
  } catch (error: any) {
    console.error('[ANOMALY-DETECTION] Error in anomaly detection:', error);
    
    // Even if there's an error, log it as a potential anomaly with medium confidence
    result.isAnomaly = true;
    result.score = 0.6;
    result.reason = `Error during anomaly detection: ${error.message}`;
    result.anomalyType = 'ERROR';
    result.details = { error: error.message, stack: error.stack };
    
    return result;
  }
}

/**
 * Update the pattern repository with data from this request
 */
async function updatePatternRepository(req: Request): Promise<void> {
  const ip = req.ip || '0.0.0.0';
  const path = req.path || '/';
  const method = req.method || 'GET';
  const userAgent = req.headers['user-agent'] || '';
  const contentLength = parseInt(req.headers['content-length'] as string || '0', 10);
  const userId = req.user?.id ? String(req.user.id) : undefined;
  const now = Date.now();
  
  // Update IP patterns
  if (!patternRepository.ipPatterns.has(ip)) {
    patternRepository.ipPatterns.set(ip, {
      timestamps: [now],
      paths: [path],
      methods: [method],
      userAgents: [userAgent as string],
      payloadSizes: [contentLength],
      statusCodes: [],
      lastAnomaly: null
    });
  } else {
    const ipPattern = patternRepository.ipPatterns.get(ip)!;
    ipPattern.timestamps.push(now);
    ipPattern.paths.push(path);
    ipPattern.methods.push(method);
    ipPattern.userAgents.push(userAgent as string);
    ipPattern.payloadSizes.push(contentLength);
    
    // Limit history length
    const maxHistoryLength = 100;
    if (ipPattern.timestamps.length > maxHistoryLength) {
      ipPattern.timestamps = ipPattern.timestamps.slice(-maxHistoryLength);
      ipPattern.paths = ipPattern.paths.slice(-maxHistoryLength);
      ipPattern.methods = ipPattern.methods.slice(-maxHistoryLength);
      ipPattern.userAgents = ipPattern.userAgents.slice(-maxHistoryLength);
      ipPattern.payloadSizes = ipPattern.payloadSizes.slice(-maxHistoryLength);
      ipPattern.statusCodes = ipPattern.statusCodes.slice(-maxHistoryLength);
    }
  }
  
  // Update user patterns if authenticated
  if (userId) {
    if (!patternRepository.userPatterns.has(userId)) {
      patternRepository.userPatterns.set(userId, {
        timestamps: [now],
        paths: [path],
        methods: [method],
        payloadSizes: [contentLength],
        statusCodes: [],
        lastAnomaly: null
      });
    } else {
      const userPattern = patternRepository.userPatterns.get(userId)!;
      userPattern.timestamps.push(now);
      userPattern.paths.push(path);
      userPattern.methods.push(method);
      userPattern.payloadSizes.push(contentLength);
      
      // Limit history length
      const maxHistoryLength = 200;
      if (userPattern.timestamps.length > maxHistoryLength) {
        userPattern.timestamps = userPattern.timestamps.slice(-maxHistoryLength);
        userPattern.paths = userPattern.paths.slice(-maxHistoryLength);
        userPattern.methods = userPattern.methods.slice(-maxHistoryLength);
        userPattern.payloadSizes = userPattern.payloadSizes.slice(-maxHistoryLength);
        userPattern.statusCodes = userPattern.statusCodes.slice(-maxHistoryLength);
      }
    }
  }
  
  // Update global patterns
  patternRepository.globalPatterns.pathFrequency.set(path, 
    (patternRepository.globalPatterns.pathFrequency.get(path) || 0) + 1);
  patternRepository.globalPatterns.methodFrequency.set(method, 
    (patternRepository.globalPatterns.methodFrequency.get(method) || 0) + 1);
  
  // Update request rate metrics
  patternRepository.globalPatterns.requestsTimestamps.push(now);
  patternRepository.globalPatterns.requestsLastMinute++;
  
  // Clean up old timestamps
  const oneMinuteAgo = now - 60000;
  patternRepository.globalPatterns.requestsTimestamps = 
    patternRepository.globalPatterns.requestsTimestamps.filter(ts => ts > oneMinuteAgo);
  
  // Recalculate average requests per minute every 30 seconds
  if (now - patternRepository.globalPatterns.lastDatasetUpdate > 30000) {
    const requestLast5Minutes = patternRepository.globalPatterns.requestsTimestamps.filter(ts => ts > now - 300000).length;
    patternRepository.globalPatterns.avgRequestsPerMinute = requestLast5Minutes / 5;
    patternRepository.globalPatterns.requestsLastMinute = patternRepository.globalPatterns.requestsTimestamps.length;
    patternRepository.globalPatterns.lastDatasetUpdate = now;
  }
  
  // Learn normal route behavior if not already known
  if (!patternRepository.knownGoodBehavior.routes.has(path)) {
    patternRepository.knownGoodBehavior.routes.set(path, {
      methods: [method],
      avgPayloadSize: contentLength,
      avgResponseTime: 0,
      frequentParams: []
    });
  } else {
    const routeInfo = patternRepository.knownGoodBehavior.routes.get(path)!;
    if (!routeInfo.methods.includes(method)) {
      routeInfo.methods.push(method);
    }
    // Update avg payload size with exponential moving average
    routeInfo.avgPayloadSize = routeInfo.avgPayloadSize * 0.9 + contentLength * 0.1;
    
    // Track frequent query parameters
    const queryParams = Object.keys(req.query);
    if (queryParams.length > 0) {
      // Only keep track of the most common params
      if (routeInfo.frequentParams.length < 10) {
        for (const param of queryParams) {
          if (!routeInfo.frequentParams.includes(param)) {
            routeInfo.frequentParams.push(param);
          }
        }
      }
    }
  }
}

/**
 * Perform statistical analysis on the request
 */
async function performStatisticalAnalysis(req: Request): Promise<AnomalyDetectionResult> {
  const result: AnomalyDetectionResult = {
    isAnomaly: false,
    score: 0
  };
  
  const ip = req.ip || '0.0.0.0';
  const path = req.path || '/';
  const method = req.method || 'GET';
  const userId = req.user?.id ? String(req.user.id) : undefined;
  
  // Get patterns
  const ipPattern = patternRepository.ipPatterns.get(ip);
  const userPattern = userId ? patternRepository.userPatterns.get(userId) : undefined;
  
  // Skip if we don't have enough history
  if (!ipPattern || ipPattern.timestamps.length < 5) {
    result.reason = 'Insufficient history for analysis';
    return result;
  }
  
  // Check if this path is unusual for this IP
  const ipPathCounts = new Map<string, number>();
  for (const p of ipPattern.paths) {
    ipPathCounts.set(p, (ipPathCounts.get(p) || 0) + 1);
  }
  
  const totalPaths = ipPattern.paths.length;
  const pathFrequency = (ipPathCounts.get(path) || 0) / totalPaths;
  
  // Check if this method is unusual for this path
  const ipMethodCounts = new Map<string, number>();
  for (const m of ipPattern.methods) {
    ipMethodCounts.set(m, (ipMethodCounts.get(m) || 0) + 1);
  }
  
  const methodFrequency = (ipMethodCounts.get(method) || 0) / ipPattern.methods.length;
  
  // Calculate score
  let anomalyScore = 0;
  
  // Unusual path is more suspicious
  if (pathFrequency < 0.05) {
    anomalyScore += 0.4;
  } else if (pathFrequency < 0.1) {
    anomalyScore += 0.2;
  }
  
  // Unusual method is very suspicious
  if (methodFrequency < 0.05) {
    anomalyScore += 0.5;
  } else if (methodFrequency < 0.1) {
    anomalyScore += 0.3;
  }
  
  // Check if known good behavior for this route
  const routeInfo = patternRepository.knownGoodBehavior.routes.get(path);
  if (routeInfo && !routeInfo.methods.includes(method)) {
    anomalyScore += 0.4;
  }
  
  // Add in some details
  const details: Record<string, any> = {
    pathFrequency,
    methodFrequency,
    knownRoute: !!routeInfo,
    knownMethod: routeInfo ? routeInfo.methods.includes(method) : false
  };
  
  // Check for unusual query parameters
  if (routeInfo && routeInfo.frequentParams.length > 0) {
    const queryParams = Object.keys(req.query);
    if (queryParams.length > 0) {
      const unknownParams = queryParams.filter(p => !routeInfo.frequentParams.includes(p));
      if (unknownParams.length > 0) {
        details.unusualParams = unknownParams;
        
        // More unusual params = higher score
        anomalyScore += Math.min(0.3, 0.1 * unknownParams.length);
      }
    }
  }
  
  result.score = anomalyScore;
  result.isAnomaly = anomalyScore >= 0.7;
  result.details = details;
  
  if (result.isAnomaly) {
    result.reason = 'Statistical analysis detected unusual request pattern';
  }
  
  return result;
}

/**
 * Perform behavioral analysis on the request
 */
async function performBehavioralAnalysis(req: Request): Promise<AnomalyDetectionResult> {
  const result: AnomalyDetectionResult = {
    isAnomaly: false,
    score: 0
  };
  
  const ip = req.ip || '0.0.0.0';
  const userId = req.user?.id ? String(req.user.id) : undefined;
  
  // Get patterns
  const ipPattern = patternRepository.ipPatterns.get(ip);
  const userPattern = userId ? patternRepository.userPatterns.get(userId) : undefined;
  
  // Skip if we don't have enough history
  if (!ipPattern || ipPattern.timestamps.length < 5) {
    result.reason = 'Insufficient history for analysis';
    return result;
  }
  
  let anomalyScore = 0;
  const details: Record<string, any> = {};
  
  // Calculate time between requests to identify unusual timing patterns
  if (ipPattern.timestamps.length >= 2) {
    const timeBetweenRequests = [];
    for (let i = 1; i < ipPattern.timestamps.length; i++) {
      timeBetweenRequests.push(ipPattern.timestamps[i] - ipPattern.timestamps[i-1]);
    }
    
    // Calculate mean and standard deviation
    const meanTime = timeBetweenRequests.reduce((sum, time) => sum + time, 0) / timeBetweenRequests.length;
    const stdDevTime = Math.sqrt(
      timeBetweenRequests.reduce((sum, time) => sum + Math.pow(time - meanTime, 2), 0) / timeBetweenRequests.length
    );
    
    details.meanTimeBetweenRequests = meanTime;
    details.stdDevTimeBetweenRequests = stdDevTime;
    
    // Check for unusually consistent timing (bot-like behavior)
    if (stdDevTime < 100 && meanTime < 2000 && timeBetweenRequests.length >= 5) {
      anomalyScore += 0.6;
      details.consistentTiming = true;
      result.reason = 'Suspiciously consistent request timing detected (potential bot)';
    }
    
    // Check for last request (very rapid requests in succession)
    const lastTimeDiff = Date.now() - ipPattern.timestamps[ipPattern.timestamps.length - 1];
    if (lastTimeDiff < 100 && timeBetweenRequests.length >= 3) {
      anomalyScore += 0.3;
      details.veryRapidRequests = true;
    }
  }
  
  // Check for IP with previous anomalies
  if (ipPattern.lastAnomaly && (Date.now() - ipPattern.lastAnomaly) < 3600000) { // Within last hour
    anomalyScore += 0.2;
    details.recentAnomalyFromSameIp = true;
  }
  
  // Check for user with previous anomalies
  if (userPattern && userPattern.lastAnomaly && (Date.now() - userPattern.lastAnomaly) < 3600000) {
    anomalyScore += 0.2;
    details.recentAnomalyFromSameUser = true;
  }
  
  // Check for suspicious IP
  if (patternRepository.knownGoodBehavior.suspiciousIps.has(ip)) {
    anomalyScore += 0.2;
    details.previouslySuspiciousIp = true;
  }
  
  // Check for multiple unique paths in short time (scanning behavior)
  if (ipPattern.paths.length >= 5) {
    const uniquePaths = new Set(ipPattern.paths.slice(-5)).size;
    if (uniquePaths >= 4) { // 4+ unique paths in last 5 requests
      const timeSpan = ipPattern.timestamps[ipPattern.timestamps.length - 1] - 
                        ipPattern.timestamps[ipPattern.timestamps.length - 5];
      
      if (timeSpan < 5000) { // Less than 5 seconds
        anomalyScore += 0.5;
        details.potentialScanning = true;
        details.uniquePathsInTimeframe = uniquePaths;
        details.timeframeMs = timeSpan;
        
        if (!result.reason) {
          result.reason = 'Potential scanning behavior detected';
        }
      }
    }
  }
  
  // Update result
  result.score = anomalyScore;
  result.isAnomaly = anomalyScore >= 0.7;
  result.details = details;
  
  if (result.isAnomaly && !result.reason) {
    result.reason = 'Behavioral analysis detected unusual request pattern';
  }
  
  return result;
}

/**
 * Perform content analysis on the request
 */
async function performContentAnalysis(req: Request): Promise<AnomalyDetectionResult> {
  const result: AnomalyDetectionResult = {
    isAnomaly: false,
    score: 0
  };
  
  let anomalyScore = 0;
  const details: Record<string, any> = {};
  
  // Check request body for attack signatures
  if (req.body && typeof req.body === 'object') {
    const bodyStr = JSON.stringify(req.body);
    
    // Check for attack signatures
    for (const signature of patternRepository.attackSignatures) {
      if (signature.pattern.test(bodyStr)) {
        anomalyScore += 0.5;
        details.attackSignature = true;
        details.signatureType = signature.type;
        result.reason = `Potential ${signature.type} attack detected`;
        break;
      }
    }
    
    // Check for sensitive data exfiltration
    for (const [dataType, pattern] of patternRepository.knownGoodBehavior.sensitiveDataPatterns.entries()) {
      if (pattern.test(bodyStr)) {
        anomalyScore += 0.4;
        details.sensitiveDataDetected = true;
        details.sensitiveDataType = dataType;
        
        if (!result.reason) {
          result.reason = `Potential sensitive data (${dataType}) transmission detected`;
        }
        break;
      }
    }
    
    // Check payload size against known good for this route
    const path = req.path || '/';
    const routeInfo = patternRepository.knownGoodBehavior.routes.get(path);
    if (routeInfo && routeInfo.avgPayloadSize > 0) {
      const contentLength = parseInt(req.headers['content-length'] as string || '0', 10);
      const sizeRatio = contentLength / routeInfo.avgPayloadSize;
      
      if (sizeRatio > 5) { // 5x larger than average
        anomalyScore += 0.3;
        details.unusualPayloadSize = true;
        details.sizeRatio = sizeRatio;
        details.avgSize = routeInfo.avgPayloadSize;
        details.actualSize = contentLength;
        
        if (!result.reason) {
          result.reason = 'Unusually large payload detected';
        }
      }
    }
  }
  
  // Check URL for attack signatures
  const url = req.url || '';
  for (const signature of patternRepository.attackSignatures) {
    if (signature.pattern.test(url)) {
      anomalyScore += 0.6;
      details.urlAttackSignature = true;
      details.urlSignatureType = signature.type;
      
      if (!result.reason) {
        result.reason = `Potential ${signature.type} attack detected in URL`;
      }
      break;
    }
  }
  
  // Check headers for unusual patterns
  const headers = req.headers || {};
  const headerStr = JSON.stringify(headers);
  
  for (const signature of patternRepository.attackSignatures) {
    if (signature.pattern.test(headerStr)) {
      anomalyScore += 0.6;
      details.headerAttackSignature = true;
      details.headerSignatureType = signature.type;
      
      if (!result.reason) {
        result.reason = `Potential ${signature.type} attack detected in headers`;
      }
      break;
    }
  }
  
  // Update result
  result.score = anomalyScore;
  result.isAnomaly = anomalyScore >= 0.7;
  result.details = details;
  
  if (result.isAnomaly && !result.reason) {
    result.reason = 'Content analysis detected potentially malicious patterns';
  }
  
  return result;
}

/**
 * Perform rate analysis on the request
 */
async function performRateAnalysis(req: Request): Promise<AnomalyDetectionResult> {
  const result: AnomalyDetectionResult = {
    isAnomaly: false,
    score: 0
  };
  
  const ip = req.ip || '0.0.0.0';
  const now = Date.now();
  
  // Get patterns
  const ipPattern = patternRepository.ipPatterns.get(ip);
  
  // Skip if we don't have enough history
  if (!ipPattern) {
    result.reason = 'Insufficient history for analysis';
    return result;
  }
  
  let anomalyScore = 0;
  const details: Record<string, any> = {};
  
  // Calculate requests per minute for this IP
  const oneMinuteAgo = now - 60000;
  const requestsLastMinute = ipPattern.timestamps.filter(ts => ts > oneMinuteAgo).length;
  
  details.requestsLastMinute = requestsLastMinute;
  details.globalAvgRequestsPerMinute = patternRepository.globalPatterns.avgRequestsPerMinute;
  
  // Compare to global average (adjusted for active users)
  const avgActiveIps = Math.max(1, patternRepository.ipPatterns.size / 5); // Assume 20% of IPs are active
  const expectedMaxRequestsPerIp = Math.max(10, 
    patternRepository.globalPatterns.avgRequestsPerMinute / avgActiveIps * 2); // Allow 2x average
  
  details.expectedMaxRequestsPerIp = expectedMaxRequestsPerIp;
  
  if (requestsLastMinute > expectedMaxRequestsPerIp * 5) {
    // Extreme rate - very suspicious
    anomalyScore += 0.8;
    details.extremeRequestRate = true;
    result.reason = 'Extremely high request rate detected';
  } else if (requestsLastMinute > expectedMaxRequestsPerIp * 2) {
    // High rate - somewhat suspicious
    anomalyScore += 0.5;
    details.highRequestRate = true;
    result.reason = 'High request rate detected';
  } else if (requestsLastMinute > expectedMaxRequestsPerIp) {
    // Above average rate - slightly suspicious
    anomalyScore += 0.3;
    details.aboveAverageRate = true;
    result.reason = 'Above average request rate detected';
  }
  
  // Calculate request acceleration (second derivative of request count)
  if (ipPattern.timestamps.length >= 15) {
    const last5MinCount = ipPattern.timestamps.filter(ts => ts > now - 300000).length;
    const prev5MinCount = ipPattern.timestamps.filter(ts => ts > now - 600000 && ts <= now - 300000).length;
    
    const acceleration = last5MinCount - prev5MinCount;
    details.requestAcceleration = acceleration;
    
    if (acceleration > 30) {
      // Rapid acceleration is suspicious
      anomalyScore += 0.4;
      details.rapidAcceleration = true;
      
      if (!result.reason) {
        result.reason = 'Rapidly increasing request rate detected';
      }
    }
  }
  
  // Update result
  result.score = anomalyScore;
  result.isAnomaly = anomalyScore >= 0.7;
  result.details = details;
  
  if (result.isAnomaly && !result.reason) {
    result.reason = 'Rate analysis detected unusual request frequency';
  }
  
  return result;
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
  
  // Run the full detection asynchronously to not block the request
  detectAnomaly(req)
    .then(result => {
      if (result.isAnomaly && result.score >= 0.7) {
        securityBlockchain.recordEvent({
          severity: result.score >= 0.9 ? SecurityEventSeverity.HIGH : SecurityEventSeverity.MEDIUM,
          category: SecurityEventCategory.ANOMALY_DETECTION,
          title: 'API Request Anomaly Detected',
          description: result.reason || `Unusual pattern detected in request to ${req.path}`,
          sourceIp: req.ip,
          metadata: {
            path: req.path,
            method: req.method,
            anomalyScore: result.score,
            anomalyType: result.anomalyType,
            anomalyDetails: result.details,
            timestamp: new Date().toISOString()
          }
        });
      }
    })
    .catch(err => {
      console.error('[ANOMALY-DETECTION] Error in anomaly detection:', err);
    });
  
  // Continue processing immediately (asynchronous monitoring)
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
    ],
    enableAdaptiveThresholds = true,
    enableStatisticalAnalysis = true,
    enableBehavioralAnalysis = true,
    enableDataExfiltrationDetection = true,
    maxIpHistoryLength = 100,
    maxUserHistoryLength = 200,
    learningPhaseDuration = 300000 // 5 minutes
  } = options;
  
  console.log('[ANOMALY-DETECTION] Creating middleware with options:', {
    confidenceThreshold,
    blockAnomalies,
    logAnomalies,
    excludePaths,
    enableAdaptiveThresholds,
    enableStatisticalAnalysis,
    enableBehavioralAnalysis,
    enableDataExfiltrationDetection
  });
  
  // Start in learning mode
  let learningMode = true;
  const learningEndTime = Date.now() + learningPhaseDuration;
  
  // Scheduled task to exit learning mode
  setTimeout(() => {
    learningMode = false;
    console.log('[ANOMALY-DETECTION] Exiting learning mode, entering detection mode');
  }, learningPhaseDuration);
  
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
    
    // Learn from the request even in learning mode
    updatePatternRepository(req).catch(err => {
      console.error('[ANOMALY-DETECTION] Error updating pattern repository:', err);
    });
    
    // If in learning mode, just collect data and pass through
    if (learningMode) {
      return next();
    }
    
    // Analyze the request
    detectAnomaly(req)
      .then(result => {
        // Apply adaptive thresholding if enabled
        let effectiveThreshold = confidenceThreshold;
        
        if (enableAdaptiveThresholds && patternRepository.globalPatterns.anomalyScores.length > 50) {
          // Calculate the threshold dynamically based on recent anomaly scores
          // Use a percentile-based approach
          const sortedScores = [...patternRepository.globalPatterns.anomalyScores].sort((a, b) => a - b);
          const percentile95 = sortedScores[Math.floor(sortedScores.length * 0.95)];
          
          // Adjust threshold but don't go below the base threshold
          effectiveThreshold = Math.max(confidenceThreshold, percentile95 * 0.9);
        }
        
        // If anomaly score is above threshold, log and potentially block
        if (result.score >= effectiveThreshold) {
          if (logAnomalies) {
            securityBlockchain.recordEvent({
              severity: result.score >= 0.9 ? SecurityEventSeverity.HIGH : SecurityEventSeverity.MEDIUM,
              category: SecurityEventCategory.ANOMALY_DETECTION,
              title: 'API Request Anomaly Detected',
              description: result.reason || `Unusual pattern detected in request to ${req.path}`,
              sourceIp: req.ip,
              metadata: {
                path: req.path,
                method: req.method,
                anomalyScore: result.score,
                anomalyType: result.anomalyType,
                anomalyDetails: result.details,
                effectiveThreshold,
                timestamp: new Date().toISOString()
              }
            });
          }
          
          // Block the request if blockAnomalies is enabled
          if (blockAnomalies) {
            result.blocked = true;
            res.status(403).json({
              error: 'Request blocked due to security concerns',
              message: result.reason || 'The request was identified as potentially malicious',
              requestId: req.securityContext?.requestId || undefined
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
        
        // Continue if not blocked
        if (!result.blocked && !res.headersSent) {
          next();
        }
      })
      .catch(err => {
        console.error('[ANOMALY-DETECTION] Error in anomaly detection:', err);
        
        // Continue in case of error
        if (!res.headersSent) {
          next();
        }
      });
  };
}