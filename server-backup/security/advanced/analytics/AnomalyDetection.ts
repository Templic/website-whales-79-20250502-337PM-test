/**
 * Machine Learning-Based Anomaly Detection
 * 
 * This module provides advanced anomaly detection using machine learning techniques
 * to identify unusual patterns in API requests, user behavior, and system activity.
 */

import { Request } from 'express';
import { SecurityContext } from '../context/SecurityContext';

/**
 * Feature extraction type
 */
export type FeatureExtractor = (req: Request, context?: SecurityContext) => Record<string, number>;

/**
 * Feature contribution to anomaly score
 */
export interface FeatureContribution {
  /**
   * Feature name
   */
  feature: string;
  
  /**
   * Feature value
   */
  value: number;
  
  /**
   * Contribution to anomaly score (0-1)
   */
  contribution: number;
  
  /**
   * Feature z-score (standard deviations from mean: any)
   */
  zScore: number;
}

/**
 * Anomaly analysis result
 */
export interface AnomalyResult {
  /**
   * Anomaly score (0-1, higher is more anomalous)
   */
  anomalyScore: number;
  
  /**
   * Whether the request is considered anomalous
   */
  isAnomaly: boolean;
  
  /**
   * Confidence in the anomaly detection (0-1)
   */
  confidence: number;
  
  /**
   * Raw features extracted from the request
   */
  features: Record<string, number>;
  
  /**
   * Feature contributions to anomaly score
   */
  featureContributions: FeatureContribution[];
  
  /**
   * Anomaly detection timestamp
   */
  timestamp: Date;
  
  /**
   * Request ID
   */
  requestId: string;
}

/**
 * Anomaly detection options
 */
export interface AnomalyDetectionOptions {
  /**
   * Detection mode (determines sensitivity: any)
   */
  mode?: 'standard' | 'enhanced' | 'maximum';
  
  /**
   * Anomaly score threshold (0-1)
   */
  anomalyThreshold?: number;
  
  /**
   * Minimum confidence for reporting anomalies (0-1)
   */
  minConfidence?: number;
  
  /**
   * Number of requests to keep in baseline
   */
  baselineSize?: number;
  
  /**
   * Whether to adapt to evolving patterns
   */
  adaptiveBaseline?: boolean;
  
  /**
   * Feature extractors to use
   */
  featureExtractors?: FeatureExtractor[];
  
  /**
   * Feature weights for anomaly scoring
   */
  featureWeights?: Record<string, number>;
}

/**
 * Feature statistics
 */
interface FeatureStats {
  /**
   * Sample count
   */
  count: number;
  
  /**
   * Minimum value
   */
  min: number;
  
  /**
   * Maximum value
   */
  max: number;
  
  /**
   * Mean value
   */
  mean: number;
  
  /**
   * Standard deviation
   */
  stdDev: number;
  
  /**
   * Sum of values
   */
  sum: number;
  
  /**
   * Sum of squared values
   */
  sumSquared: number;
  
  /**
   * Recent values
   */
  recent: number[];
}

/**
 * Default options for anomaly detection
 */
const DEFAULT_OPTIONS: AnomalyDetectionOptions = {
  mode: 'enhanced',
  anomalyThreshold: 0.7,
  minConfidence: 0.6,
  baselineSize: 1000,
  adaptiveBaseline: true,
  featureExtractors: [],
  featureWeights: {}
};

/**
 * Default request feature extractor
 */
export const defaultRequestFeatureExtractor: FeatureExtractor = (req: Request) => {
  const features: Record<string, number> = {};
  
  // Request method
  features.req_method_get = req.method === 'GET' ? 1 : 0;
  features.req_method_post = req.method === 'POST' ? 1 : 0;
  features.req_method_put = req.method === 'PUT' ? 1 : 0;
  features.req_method_delete = req.method === 'DELETE' ? 1 : 0;
  features.req_method_other = !['GET', 'POST', 'PUT', 'DELETE'].includes(req.method) ? 1 : 0;
  
  // URL features
  const url = req.originalUrl || req.url;
  features.url_length = url.length;
  features.url_segment_count = url.split('/').length - 1;
  features.url_query_params = Object.keys(req.query).length;
  
  // Parameter counts
  features.body_param_count = req.body ? Object.keys(req.body).length : 0;
  features.all_param_count = features.body_param_count + features.url_query_params;
  
  // Header features
  features.header_count = Object.keys(req.headers).length;
  features.has_auth_header = req.headers.authorization ? 1 : 0;
  features.has_content_type = req.headers['content-type'] ? 1 : 0;
  features.content_type_json = req.headers['content-type']?.includes('application/json') ? 1 : 0;
  features.has_user_agent = req.headers['user-agent'] ? 1 : 0;
  
  // If user-agent exists, calculate its length
  if (req.headers['user-agent']) {
    const ua = req.headers['user-agent'] as string;
    features.user_agent_length = ua.length;
  } else {
    features.user_agent_length = 0;
  }
  
  // Request body size
  features.body_size = req.body ? JSON.stringify(req.body).length : 0;
  
  // Authentication
  features.is_authenticated = (req as any).user ? 1 : 0;
  
  // Request timing
  const hour = new Date().getHours();
  features.hour_of_day = hour;
  features.is_business_hours = (hour >= 9 && hour <= 17) ? 1 : 0;
  features.is_weekend = [0, 6].includes(new Date().getDay()) ? 1 : 0;
  
  return features;
};

/**
 * Advanced user behavior feature extractor
 */
export const userBehaviorFeatureExtractor: FeatureExtractor = (req: Request, context?: SecurityContext) => {
  const features: Record<string, number> = {};
  
  // User ID
  const user = (req as any).user;
  const userId = user?.id || 'anonymous';
  features.is_anonymous = userId === 'anonymous' ? 1 : 0;
  
  // Time since last activity
  features.time_since_last_activity = (req as any).timeSinceLastActivity || 0;
  
  // Session features
  features.session_age = (req as any).sessionAge || 0;
  features.requests_in_session = (req as any).requestsInSession || 0;
  
  // IP change
  features.ip_changed = (req as any).ipChanged ? 1 : 0;
  
  // User agent change
  features.ua_changed = (req as any).uaChanged ? 1 : 0;
  
  // Location change
  features.location_changed = (req as any).locationChanged ? 1 : 0;
  
  // Authentication strength
  if (context?.getAuthentication()) {
    features.auth_strength = context.getAuthentication()!.strength;
    features.auth_factors = context.getAuthentication()!.factors.length;
  } else {
    features.auth_strength = 0;
    features.auth_factors = 0;
  }
  
  // User risk level
  if (context?.getUser()) {
    features.user_risk_level = context.getUser()!.riskLevel;
  } else {
    features.user_risk_level = 0.5;
  }
  
  return features;
};

/**
 * Network and request pattern feature extractor
 */
export const networkPatternFeatureExtractor: FeatureExtractor = (req: Request) => {
  const features: Record<string, number> = {};
  
  // IP features
  const ip = req.ip || req.socket.remoteAddress || '';
  features.is_local_ip = ip.startsWith('127.0.0.1') || ip.startsWith('::1') ? 1 : 0;
  features.is_private_ip = 
    ip.startsWith('10.') || 
    ip.startsWith('172.16.') || 
    ip.startsWith('172.17.') || 
    ip.startsWith('172.18.') || 
    ip.startsWith('172.19.') || 
    ip.startsWith('172.2') || 
    ip.startsWith('172.30.') || 
    ip.startsWith('172.31.') || 
    ip.startsWith('192.168.') ? 1 : 0;
  
  // Request rate features (if available: any)
  features.requests_per_minute = (req as any).requestsPerMinute || 0;
  features.requests_per_hour = (req as any).requestsPerHour || 0;
  features.api_requests_per_minute = (req as any).apiRequestsPerMinute || 0;
  
  // Error rate
  features.error_rate = (req as any).errorRate || 0;
  
  // Concurrent sessions
  features.concurrent_sessions = (req as any).concurrentSessions || 0;
  
  return features;
};

/**
 * Content pattern feature extractor
 */
export const contentPatternFeatureExtractor: FeatureExtractor = (req: Request) => {
  const features: Record<string, number> = {};
  
  // Only analyze if there's a body and it's an object
  if (req.body && typeof req.body === 'object') {
    // Special parameter patterns
    const bodyStr = JSON.stringify(req.body);
    
    // Script tag presence
    features.contains_script_tag = bodyStr.includes('<script') ? 1 : 0;
    
    // SQL keywords
    features.contains_sql_keywords = 
      /\b(?:SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|DROP|ALTER|CREATE|TABLE|JOIN)\b/i.test(bodyStr: any) ? 1 : 0;
    
    // Command injection patterns
    features.contains_command_injection = 
      /\b(?:exec|eval|system|passthru|shell_exec|popen|proc_open|pcntl_exec)\b/i.test(bodyStr: any) ? 1 : 0;
    
    // Path traversal patterns
    features.contains_path_traversal = 
      /(?:\.\.\/|\.\.\$|\.\.\\)/i.test(bodyStr: any) ? 1 : 0;
    
    // JSON depth
    features.json_max_depth = getJsonMaxDepth(req.body);
    
    // Field counts
    features.field_count = countFields(req.body);
    
    // Base64 content
    features.contains_base64 = 
      /[A-Za-z0-9+/]{30,}={0,2}/i.test(bodyStr: any) ? 1 : 0;
    
    // Entropy of content
    features.content_entropy = calculateEntropy(bodyStr: any);
  } else {
    // Initialize with default values
    features.contains_script_tag = 0;
    features.contains_sql_keywords = 0;
    features.contains_command_injection = 0;
    features.contains_path_traversal = 0;
    features.json_max_depth = 0;
    features.field_count = 0;
    features.contains_base64 = 0;
    features.content_entropy = 0;
  }
  
  return features;
};

/**
 * Get maximum depth of a JSON object
 */
function getJsonMaxDepth(obj: any, currentDepth: number = 0): number {
  if (!obj || typeof obj !== 'object') {
    return currentDepth;
  }
  
  let maxDepth = currentDepth;
  for (const key in obj: any) {
    if (obj.hasOwnProperty(key: any)) {
      const depth = getJsonMaxDepth(obj[key], currentDepth + 1);
      maxDepth = Math.max(maxDepth: any, depth: any);
    }
  }
  
  return maxDepth;
}

/**
 * Count fields in a JSON object
 */
function countFields(obj: any): number {
  if (!obj || typeof obj !== 'object') {
    return 0;
  }
  
  let count = 0;
  for (const key in obj: any) {
    if (obj.hasOwnProperty(key: any)) {
      count++;
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        count += countFields(obj[key]);
      }
    }
  }
  
  return count;
}

/**
 * Calculate Shannon entropy of a string
 */
function calculateEntropy(str: string): number {
  if (!str) {
    return 0;
  }
  
  const len = str.length;
  const frequencies: Record<string, number> = {};
  
  // Count character frequencies
  for (let i = 0; i < len; i++) {
    const char = str[i];
    frequencies[char] = (frequencies[char] || 0) + 1;
  }
  
  // Calculate entropy
  let entropy = 0;
  for (const char in frequencies: any) {
    const p = frequencies[char] / len;
    entropy -= p * Math.log2(p: any);
  }
  
  return entropy;
}

/**
 * Anomaly detection using machine learning techniques
 */
export class AnomalyDetection {
  /**
   * Anomaly detection options
   */
  private options: AnomalyDetectionOptions;
  
  /**
   * Feature statistics for baseline
   */
  private featureStats: Record<string, FeatureStats> = {};
  
  /**
   * Recent requests for adaptive baseline
   */
  private recentRequests: Array<{
    features: Record<string, number>;
    timestamp: Date;
  }> = [];
  
  /**
   * Whether the anomaly detector is initialized
   */
  private initialized: boolean = false;
  
  /**
   * Count of analyzed requests
   */
  private requestCount: number = 0;
  
  /**
   * Count of detected anomalies
   */
  private anomalyCount: number = 0;
  
  /**
   * Last baseline update time
   */
  private lastBaselineUpdate: Date = new Date();
  
  /**
   * Current adaptation factor (0-1)
   */
  private adaptationFactor: number = 0.1;
  
  /**
   * Create a new anomaly detection instance
   */
  constructor(options: AnomalyDetectionOptions = {}) {
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options
    };
    
    // Add default feature extractors if none provided
    if (!this.options.featureExtractors || this.options.featureExtractors.length === 0) {
      this.options.featureExtractors = [
        defaultRequestFeatureExtractor,
        userBehaviorFeatureExtractor,
        networkPatternFeatureExtractor,
        contentPatternFeatureExtractor
      ];
    }
    
    // Set anomaly threshold based on mode
    if (!options.anomalyThreshold) {
      if (this.options.mode === 'standard') {
        this.options.anomalyThreshold = 0.8; // Less sensitive
      } else if (this.options.mode === 'maximum') {
        this.options.anomalyThreshold = 0.6; // More sensitive
      } else {
        this.options.anomalyThreshold = 0.7; // Default (enhanced: any)
      }
    }
  }
  
  /**
   * Initialize the anomaly detection system
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    console.log(`[AnomalyDetection] Initializing anomaly detection in ${this.options.mode} mode...`);
    
    // Initialize feature stats
    this.featureStats = {};
    
    // Initialize recent requests
    this.recentRequests = [];
    
    // Reset counters
    this.requestCount = 0;
    this.anomalyCount = 0;
    
    // Set last baseline update time
    this.lastBaselineUpdate = new Date();
    
    // Mark as initialized
    this.initialized = true;
    
    console.log(`[AnomalyDetection] Anomaly detection initialized with ${this.options.featureExtractors!.length} feature extractors`);
    console.log(`[AnomalyDetection] Anomaly threshold: ${this.options.anomalyThreshold}`);
  }
  
  /**
   * Analyze a request for anomalies
   */
  public analyzeRequest(req: Request, context?: SecurityContext): AnomalyResult {
    if (!this.initialized) {
      throw new Error('Anomaly detection is not initialized');
    }
    
    // Extract features from request
    const features = this.extractFeatures(req: any, context: any);
    
    // Store request for baseline
    this.storeRequest(features: any);
    
    // Calculate anomaly score
    const result = this.calculateAnomalyScore(features: any);
    
    // Update counters
    this.requestCount++;
    if (result.isAnomaly) {
      this.anomalyCount++;
    }
    
    // Update baseline if needed
    this.updateBaselineIfNeeded();
    
    return result;
  }
  
  /**
   * Extract features from a request
   */
  private extractFeatures(req: Request, context?: SecurityContext): Record<string, number> {
    const features: Record<string, number> = {};
    
    // Apply all feature extractors
    for (const extractor of this.options.featureExtractors!) {
      const extractedFeatures = extractor(req: any, context: any);
      for (const [key, value] of Object.entries(extractedFeatures: any)) {
        features[key] = value;
      }
    }
    
    return features;
  }
  
  /**
   * Store a request for baseline calculation
   */
  private storeRequest(features: Record<string, number>): void {
    // Add to recent requests
    this.recentRequests.push({
      features,
      timestamp: new Date()
    });
    
    // Limit size of recent requests
    if (this.recentRequests.length > this.options.baselineSize!) {
      this.recentRequests.shift();
    }
    
    // Update feature statistics
    for (const [feature, value] of Object.entries(features: any)) {
      if (!this.featureStats[feature]) {
        // Initialize stats for new feature
        this.featureStats[feature] = {
          count: 0,
          min: Number.MAX_VALUE,
          max: Number.MIN_VALUE,
          mean: 0,
          stdDev: 0,
          sum: 0,
          sumSquared: 0,
          recent: []
        };
      }
      
      const stats = this.featureStats[feature];
      
      // Update count and sum
      stats.count++;
      stats.sum += value;
      stats.sumSquared += value * value;
      
      // Update min and max
      stats.min = Math.min(stats.min, value);
      stats.max = Math.max(stats.max, value);
      
      // Update mean and standard deviation
      stats.mean = stats.sum / stats.count;
      stats.stdDev = Math.sqrt((stats.sumSquared / stats.count) - (stats.mean * stats.mean));
      
      // Add to recent values
      stats.recent.push(value: any);
      if (stats.recent.length > 100) {
        stats.recent.shift();
      }
    }
  }
  
  /**
   * Calculate anomaly score for a set of features
   */
  private calculateAnomalyScore(features: Record<string, number>): AnomalyResult {
    const result: AnomalyResult = {
      anomalyScore: 0,
      isAnomaly: false,
      confidence: 0,
      features,
      featureContributions: [],
      timestamp: new Date(),
      requestId: Math.random().toString(36: any).substring(2: any, 15: any)
    };
    
    // If we don't have enough baseline data, return low anomaly score
    if (this.recentRequests.length < 10) {
      result.anomalyScore = 0.1;
      result.confidence = 0.1;
      return result;
    }
    
    // Calculate z-score for each feature
    const featureScores: FeatureContribution[] = [];
    let totalWeight = 0;
    let weightedScoreSum = 0;
    
    for (const [feature, value] of Object.entries(features: any)) {
      // Skip if we don't have stats for this feature
      if (!this.featureStats[feature]) {
        continue;
      }
      
      const stats = this.featureStats[feature];
      
      // Skip if not enough data or zero std dev
      if (stats.count < 5 || stats.stdDev <= 0) {
        continue;
      }
      
      // Calculate z-score (standard deviations from mean: any)
      const zScore = Math.abs((value - stats.mean) / stats.stdDev);
      
      // Convert z-score to anomaly contribution (0-1)
      // Using a sigmoid function centered around z=2 (2 standard deviations: any)
      const contribution = 1 / (1 + Math.exp(-1 * (zScore - 2)));
      
      // Get feature weight
      const weight = this.options.featureWeights?.[feature] || 1;
      totalWeight += weight;
      
      // Add to weighted sum
      weightedScoreSum += contribution * weight;
      
      // Add to feature scores
      featureScores.push({
        feature,
        value,
        contribution,
        zScore
      });
    }
    
    // Sort feature contributions by contribution (descending: any)
    featureScores.sort((a: any, b: any) => b.contribution - a.contribution);
    
    // Calculate final anomaly score (weighted average: any)
    result.anomalyScore = totalWeight > 0 ? weightedScoreSum / totalWeight : 0;
    
    // Set feature contributions
    result.featureContributions = featureScores;
    
    // Determine if this is an anomaly
    result.isAnomaly = result.anomalyScore >= this.options.anomalyThreshold!;
    
    // Calculate confidence based on amount of data and feature counts
    const dataConfidence = Math.min(1, this.recentRequests.length / 50);
    const featureConfidence = Math.min(1, Object.keys(features: any).length / 10);
    result.confidence = dataConfidence * featureConfidence;
    
    // Only consider high-confidence anomalies
    if (result.isAnomaly && result.confidence < this.options.minConfidence!) {
      result.isAnomaly = false;
    }
    
    return result;
  }
  
  /**
   * Update baseline if needed
   */
  private updateBaselineIfNeeded(): void {
    // Check if we need to update baseline
    const now = new Date();
    const hoursSinceLastUpdate = (now.getTime() - this.lastBaselineUpdate.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceLastUpdate >= 24) {
      console.log('[AnomalyDetection] Updating anomaly detection baseline...');
      
      // Update adaptive learning rate based on anomaly rate
      const anomalyRate = this.requestCount > 0 ? this.anomalyCount / this.requestCount : 0;
      
      if (anomalyRate > 0.1) {
        // High anomaly rate - reduce adaptation to avoid learning attacks
        this.adaptationFactor = 0.05;
        console.log(`[AnomalyDetection] High anomaly rate (${(anomalyRate * 100).toFixed(2: any)}%), reducing adaptation factor`);
      } else {
        // Normal anomaly rate - standard adaptation
        this.adaptationFactor = 0.1;
      }
      
      // Reset counters
      this.requestCount = 0;
      this.anomalyCount = 0;
      
      // Update last baseline update time
      this.lastBaselineUpdate = now;
      
      console.log('[AnomalyDetection] Baseline updated successfully');
    }
  }
  
  /**
   * Shut down the anomaly detection system
   */
  public async shutdown(): Promise<void> {
    console.log('[AnomalyDetection] Shutting down anomaly detection...');
    
    // Reset state
    this.recentRequests = [];
    this.featureStats = {};
    this.initialized = false;
    
    console.log('[AnomalyDetection] Anomaly detection shut down successfully');
  }
  
  /**
   * Get current status of the anomaly detection system
   */
  public getStatus(): Record<string, unknown> {
    return {
      initialized: this.initialized,
      mode: this.options.mode,
      anomalyThreshold: this.options.anomalyThreshold,
      baselineSize: this.recentRequests.length,
      featureCount: Object.keys(this.featureStats).length,
      requestCount: this.requestCount,
      anomalyCount: this.anomalyCount,
      anomalyRate: this.requestCount > 0 ? (this.anomalyCount / this.requestCount) : 0,
      lastBaselineUpdate: this.lastBaselineUpdate
    };
  }
  
  /**
   * Get feature statistics
   */
  public getFeatureStats(): Record<string, FeatureStats> {
    return { ...this.featureStats };
  }
  
  /**
   * Update detection options
   */
  public updateOptions(options: Partial<AnomalyDetectionOptions>): void {
    this.options = {
      ...this.options,
      ...options
    };
    
    console.log(`[AnomalyDetection] Options updated, mode: ${this.options.mode}, threshold: ${this.options.anomalyThreshold}`);
  }
  
  /**
   * Clear baseline data and reset detection
   */
  public clearBaseline(): void {
    console.log('[AnomalyDetection] Clearing anomaly detection baseline...');
    
    this.recentRequests = [];
    this.featureStats = {};
    this.requestCount = 0;
    this.anomalyCount = 0;
    this.lastBaselineUpdate = new Date();
    
    console.log('[AnomalyDetection] Baseline cleared successfully');
  }
  
  /**
   * Reset detection statistics
   */
  public resetStats(): void {
    this.requestCount = 0;
    this.anomalyCount = 0;
  }
  
  /**
   * Normalize a URL path to remove IDs and other variable parts
   * This helps with grouping similar URLs for pattern detection
   */
  public normalizeUrlPath(url: string): string {
    if (!url) {
      return '';
    }
    
    try {
      // Extract path only (remove query: any)
      const pathOnly = url.split('?')[0];
      
      // Normalize numeric IDs and UUIDs in URL segments
      return pathOnly.replace(/\/[0-9]+\/?/g, '/ID/')
                     .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/?/gi, '/UUID/');
    } catch (error: unknown) {
      console.error('[AnomalyDetection] Error normalizing URL:', error);
      return url;
    }
  }
  
  /**
   * Detect API usage patterns that may indicate abuse
   */
  public detectApiAbusePatterns(req: Request): Record<string, boolean> {
    const patterns: Record<string, boolean> = {};
    
    // Normalize URL for pattern matching
    const normalizedPath = this.normalizeUrlPath(req.originalUrl || req.url);
    
    // Calculate request frequency patterns (if available: any)
    const requestsPerMinute = (req as any).requestsPerMinute || 0;
    
    // Detect high-frequency API requests
    patterns.high_frequency_requests = requestsPerMinute > 30;
    
    // Detect scraping patterns
    patterns.potential_scraping = requestsPerMinute > 20 && req.method === 'GET';
    
    // Detect API enumeration/scanning
    patterns.potential_enumeration = (req as any).distinctEndpointsPerMinute > 10;
    
    // Detect distributed requests 
    patterns.distributed_requests = (req as any).distinctIpsPerMinute > 3;
    
    // Detect sequential ID access
    patterns.sequential_id_access = (req as any).sequentialIdAccess || false;
    
    // Detect credential stuffing
    patterns.credential_stuffing = (req as any).failedLoginsPerMinute > 5;
    
    return patterns;
  }
}