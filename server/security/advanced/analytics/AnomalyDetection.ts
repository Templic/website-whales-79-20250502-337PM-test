/**
 * Machine Learning-Based Anomaly Detection
 * 
 * This module implements sophisticated anomaly detection capabilities
 * to identify unusual patterns in API usage and user behavior.
 */

import { EventEmitter } from 'events';
import { AnomalyDetectionConfig } from '../config/SecurityConfig';

/**
 * Feature vector for machine learning model
 */
interface FeatureVector {
  /**
   * Unique identifier for this vector
   */
  id: string;
  
  /**
   * Timestamp when this vector was created
   */
  timestamp: Date;
  
  /**
   * Feature values
   */
  features: number[];
  
  /**
   * Labels for each feature
   */
  featureLabels: string[];
  
  /**
   * Associated metadata
   */
  metadata: Record<string, any>;
}

/**
 * Request feature extraction result
 */
export interface RequestFeatures {
  /**
   * Unique identifier for the request
   */
  requestId: string;
  
  /**
   * User ID if authenticated
   */
  userId?: string | number;
  
  /**
   * IP address
   */
  ip: string;
  
  /**
   * URL path
   */
  path: string;
  
  /**
   * HTTP method
   */
  method: string;
  
  /**
   * Request body size in bytes
   */
  bodySize: number;
  
  /**
   * Number of parameters in the request
   */
  parameterCount: number;
  
  /**
   * Request timing information
   */
  timing: {
    /**
     * Time of day (0-24 hours)
     */
    hourOfDay: number;
    
    /**
     * Day of week (0-6, 0 is Sunday)
     */
    dayOfWeek: number;
    
    /**
     * Time between requests from same user/IP
     */
    timeSinceLastRequest?: number;
  };
  
  /**
   * Original request metadata
   */
  metadata: {
    /**
     * Request headers
     */
    headers: Record<string, string>;
    
    /**
     * User agent
     */
    userAgent: string;
    
    /**
     * Request timestamp
     */
    timestamp: Date;
    
    /**
     * Request context identifier
     */
    contextId: string;
  };
}

/**
 * Anomaly detection result
 */
export interface AnomalyResult {
  /**
   * Unique identifier for the request
   */
  requestId: string;
  
  /**
   * Whether this request is anomalous
   */
  isAnomaly: boolean;
  
  /**
   * Anomaly score (0-1, higher means more anomalous)
   */
  anomalyScore: number;
  
  /**
   * Confidence in the anomaly detection (0-1)
   */
  confidence: number;
  
  /**
   * Feature contribution to anomaly
   */
  featureContributions: Array<{
    /**
     * Feature name
     */
    feature: string;
    
    /**
     * Feature contribution to anomaly score (0-1)
     */
    contribution: number;
    
    /**
     * Feature value
     */
    value: number;
    
    /**
     * Expected value range
     */
    expectedRange: {
      min: number;
      max: number;
    };
  }>;
  
  /**
   * When the anomaly was detected
   */
  timestamp: Date;
  
  /**
   * Original request features
   */
  requestFeatures: RequestFeatures;
}

/**
 * User behavior profile
 */
interface UserBehaviorProfile {
  /**
   * User identifier
   */
  userId: string | number;
  
  /**
   * Features characterizing normal behavior
   */
  normalBehavior: {
    /**
     * Common IP addresses
     */
    ips: string[];
    
    /**
     * Common user agents
     */
    userAgents: string[];
    
    /**
     * Common request paths
     */
    commonPaths: string[];
    
    /**
     * Time patterns
     */
    timingPatterns: {
      /**
       * Active hours (0-23)
       */
      activeHours: number[];
      
      /**
       * Active days (0-6)
       */
      activeDays: number[];
    };
    
    /**
     * Request frequency (requests per hour)
     */
    requestFrequency: number;
  };
  
  /**
   * When the profile was last updated
   */
  lastUpdated: Date;
  
  /**
   * Number of requests used to build the profile
   */
  requestCount: number;
}

/**
 * Simple ML model for anomaly detection
 */
class AnomalyDetectionModel {
  private featureVectors: FeatureVector[] = [];
  private featureMeans: number[] = [];
  private featureStdDevs: number[] = [];
  private userProfiles: Map<string, UserBehaviorProfile> = new Map();
  private modelTrained: boolean = false;
  private dimensions: number = 0;
  private readonly maxVectors: number = 10000;
  private readonly anomalyThreshold: number;
  
  /**
   * Create a new anomaly detection model
   */
  constructor(anomalyThreshold: number = 0.85) {
    this.anomalyThreshold = anomalyThreshold;
  }
  
  /**
   * Add a feature vector to the model
   */
  public addFeatureVector(vector: FeatureVector): void {
    // Initialize dimensions if this is the first vector
    if (this.dimensions === 0) {
      this.dimensions = vector.features.length;
      this.featureMeans = new Array(this.dimensions).fill(0);
      this.featureStdDevs = new Array(this.dimensions).fill(1);
    }
    
    // Ensure vector has the right dimensions
    if (vector.features.length !== this.dimensions) {
      throw new Error(`Feature vector has wrong dimensions: ${vector.features.length}, expected ${this.dimensions}`);
    }
    
    // Add to collection
    this.featureVectors.push(vector);
    
    // Update user profile if applicable
    if (vector.metadata.userId) {
      this.updateUserProfile(vector);
    }
    
    // Limit the number of vectors
    if (this.featureVectors.length > this.maxVectors) {
      this.featureVectors.shift();
    }
    
    // Flag model as untrained
    this.modelTrained = false;
  }
  
  /**
   * Train the model on collected data
   */
  public train(): void {
    if (this.featureVectors.length < 10) {
      console.warn('[AnomalyDetection] Not enough data to train model');
      return;
    }
    
    console.log(`[AnomalyDetection] Training model on ${this.featureVectors.length} vectors`);
    
    // Calculate feature means
    this.featureMeans = new Array(this.dimensions).fill(0);
    
    for (const vector of this.featureVectors) {
      for (let i = 0; i < this.dimensions; i++) {
        this.featureMeans[i] += vector.features[i];
      }
    }
    
    for (let i = 0; i < this.dimensions; i++) {
      this.featureMeans[i] /= this.featureVectors.length;
    }
    
    // Calculate feature standard deviations
    this.featureStdDevs = new Array(this.dimensions).fill(0);
    
    for (const vector of this.featureVectors) {
      for (let i = 0; i < this.dimensions; i++) {
        const diff = vector.features[i] - this.featureMeans[i];
        this.featureStdDevs[i] += diff * diff;
      }
    }
    
    for (let i = 0; i < this.dimensions; i++) {
      this.featureStdDevs[i] = Math.sqrt(this.featureStdDevs[i] / this.featureVectors.length);
      // Avoid division by zero
      if (this.featureStdDevs[i] === 0) {
        this.featureStdDevs[i] = 1;
      }
    }
    
    this.modelTrained = true;
    console.log('[AnomalyDetection] Model training complete');
  }
  
  /**
   * Detect anomalies in a feature vector
   */
  public detectAnomaly(vector: FeatureVector): AnomalyResult {
    // Train model if needed
    if (!this.modelTrained) {
      this.train();
    }
    
    // Ensure vector has the right dimensions
    if (vector.features.length !== this.dimensions) {
      throw new Error(`Feature vector has wrong dimensions: ${vector.features.length}, expected ${this.dimensions}`);
    }
    
    // Calculate z-scores for each feature
    const zScores: number[] = [];
    for (let i = 0; i < this.dimensions; i++) {
      const zScore = (vector.features[i] - this.featureMeans[i]) / this.featureStdDevs[i];
      zScores.push(zScore);
    }
    
    // Calculate anomaly score
    let anomalyScore = 0;
    let totalWeight = 0;
    
    const featureContributions: AnomalyResult['featureContributions'] = [];
    
    for (let i = 0; i < this.dimensions; i++) {
      // Convert z-score to absolute distance
      const distance = Math.abs(zScores[i]);
      
      // Weight more extreme values higher
      const weight = Math.pow(distance, 2);
      
      // Calculate contribution to overall score
      const contribution = Math.min(1, distance / 3); // Scale to 0-1
      
      // Add to total
      anomalyScore += contribution * weight;
      totalWeight += weight;
      
      // Record feature contribution
      featureContributions.push({
        feature: vector.featureLabels[i] || `feature_${i}`,
        contribution,
        value: vector.features[i],
        expectedRange: {
          min: this.featureMeans[i] - 2 * this.featureStdDevs[i],
          max: this.featureMeans[i] + 2 * this.featureStdDevs[i]
        }
      });
    }
    
    // Normalize anomaly score
    if (totalWeight > 0) {
      anomalyScore /= totalWeight;
    }
    
    // Scale to 0-1
    anomalyScore = Math.min(1, Math.max(0, anomalyScore));
    
    // Calculate confidence based on amount of training data
    const confidence = Math.min(1, this.featureVectors.length / 1000);
    
    // Sort feature contributions by contribution
    featureContributions.sort((a, b) => b.contribution - a.contribution);
    
    // Create result
    const isAnomaly = anomalyScore >= this.anomalyThreshold;
    
    // Add to model if not an anomaly
    if (!isAnomaly) {
      this.addFeatureVector(vector);
    }
    
    return {
      requestId: vector.id,
      isAnomaly,
      anomalyScore,
      confidence,
      featureContributions,
      timestamp: new Date(),
      requestFeatures: vector.metadata as unknown as RequestFeatures
    };
  }
  
  /**
   * Update user behavior profile
   */
  private updateUserProfile(vector: FeatureVector): void {
    const userId = vector.metadata.userId;
    
    if (!userId) {
      return;
    }
    
    // Get or create user profile
    const existingProfile = this.userProfiles.get(userId.toString());
    let profile: UserBehaviorProfile;
    
    if (existingProfile) {
      profile = existingProfile;
    } else {
      profile = {
        userId,
        normalBehavior: {
          ips: [],
          userAgents: [],
          commonPaths: [],
          timingPatterns: {
            activeHours: Array(24).fill(0),
            activeDays: Array(7).fill(0)
          },
          requestFrequency: 0
        },
        lastUpdated: new Date(),
        requestCount: 0
      };
    }
    
    // Update profile with new data
    const ip = vector.metadata.ip;
    const userAgent = vector.metadata.userAgent;
    const path = vector.metadata.path;
    const date = new Date(vector.timestamp);
    
    // Update IPs (keep up to 5)
    if (ip && !profile.normalBehavior.ips.includes(ip)) {
      profile.normalBehavior.ips.push(ip);
      if (profile.normalBehavior.ips.length > 5) {
        profile.normalBehavior.ips.shift();
      }
    }
    
    // Update user agents (keep up to 3)
    if (userAgent && !profile.normalBehavior.userAgents.includes(userAgent)) {
      profile.normalBehavior.userAgents.push(userAgent);
      if (profile.normalBehavior.userAgents.length > 3) {
        profile.normalBehavior.userAgents.shift();
      }
    }
    
    // Update common paths (keep up to 20)
    if (path && !profile.normalBehavior.commonPaths.includes(path)) {
      profile.normalBehavior.commonPaths.push(path);
      if (profile.normalBehavior.commonPaths.length > 20) {
        profile.normalBehavior.commonPaths.shift();
      }
    }
    
    // Update timing patterns
    const hour = date.getHours();
    const day = date.getDay();
    
    profile.normalBehavior.timingPatterns.activeHours[hour]++;
    profile.normalBehavior.timingPatterns.activeDays[day]++;
    
    // Update request frequency
    const newRequestCount = profile.requestCount + 1;
    const timeDiff = (date.getTime() - profile.lastUpdated.getTime()) / (1000 * 60 * 60); // hours
    
    if (timeDiff > 0) {
      // Update using exponential moving average
      const alpha = 0.1; // Smoothing factor
      profile.normalBehavior.requestFrequency = 
        (1 - alpha) * profile.normalBehavior.requestFrequency + 
        alpha * (1 / timeDiff);
    }
    
    // Update metadata
    profile.lastUpdated = date;
    profile.requestCount = newRequestCount;
    
    // Store updated profile
    this.userProfiles.set(userId.toString(), profile);
  }
  
  /**
   * Get user behavior profile
   */
  public getUserProfile(userId: string | number): UserBehaviorProfile | null {
    return this.userProfiles.get(userId.toString()) || null;
  }
  
  /**
   * Get model statistics
   */
  public getModelStats(): Record<string, any> {
    return {
      vectorCount: this.featureVectors.length,
      userProfileCount: this.userProfiles.size,
      featureDimensions: this.dimensions,
      trained: this.modelTrained,
      anomalyThreshold: this.anomalyThreshold
    };
  }
}

/**
 * Machine learning-based anomaly detection
 */
export class AnomalyDetection extends EventEmitter {
  private config: AnomalyDetectionConfig;
  private model: AnomalyDetectionModel;
  private featureExtractors: Map<string, (req: any) => any> = new Map();
  private recentAnomalies: AnomalyResult[] = [];
  private readonly maxRecentAnomalies: number = 100;
  private retrainInterval: NodeJS.Timeout | null = null;
  
  /**
   * Create a new anomaly detection system
   */
  constructor(config: AnomalyDetectionConfig = {}) {
    super();
    this.config = this.getDefaultConfig(config);
    this.model = new AnomalyDetectionModel(this.config.modelParams?.anomalyThreshold);
    
    // Register default feature extractors
    this.registerDefaultFeatureExtractors();
  }
  
  /**
   * Initialize the anomaly detection system
   */
  public async initialize(): Promise<void> {
    console.log('[AnomalyDetection] Initializing anomaly detection system');
    
    // Set up scheduled model retraining
    this.setupRetraining();
    
    console.log('[AnomalyDetection] Anomaly detection system initialized');
  }
  
  /**
   * Analyze a request for anomalies
   */
  public analyzeRequest(req: any, context?: any): AnomalyResult {
    // Extract features from request
    const requestFeatures = this.extractFeatures(req, context);
    
    // Convert to feature vector
    const featureVector = this.createFeatureVector(requestFeatures);
    
    // Run anomaly detection
    const result = this.model.detectAnomaly(featureVector);
    
    // Record if anomalous
    if (result.isAnomaly) {
      this.recordAnomaly(result);
    }
    
    return result;
  }
  
  /**
   * Get recent anomalies
   */
  public getRecentAnomalies(): AnomalyResult[] {
    return [...this.recentAnomalies];
  }
  
  /**
   * Get user behavior profile
   */
  public getUserProfile(userId: string | number): Record<string, any> | null {
    return this.model.getUserProfile(userId);
  }
  
  /**
   * Register a custom feature extractor
   */
  public registerFeatureExtractor(name: string, extractor: (req: any) => any): void {
    this.featureExtractors.set(name, extractor);
    console.log(`[AnomalyDetection] Registered feature extractor: ${name}`);
  }
  
  /**
   * Force model retraining
   */
  public retrain(): void {
    console.log('[AnomalyDetection] Manually triggering model retraining');
    this.model.train();
  }
  
  /**
   * Get model statistics
   */
  public getModelStats(): Record<string, any> {
    return this.model.getModelStats();
  }
  
  /**
   * Clean shutdown
   */
  public async shutdown(): Promise<void> {
    console.log('[AnomalyDetection] Shutting down anomaly detection system');
    
    // Stop retraining interval
    if (this.retrainInterval) {
      clearInterval(this.retrainInterval);
      this.retrainInterval = null;
    }
    
    // Final model training
    this.model.train();
    
    // Clear anomalies
    this.recentAnomalies = [];
    
    // Remove event listeners
    this.removeAllListeners();
    
    console.log('[AnomalyDetection] Anomaly detection system shut down');
  }
  
  /**
   * Merge configuration with defaults
   */
  private getDefaultConfig(config: AnomalyDetectionConfig): AnomalyDetectionConfig {
    return {
      enabled: config.enabled !== undefined ? config.enabled : true,
      modelParams: {
        learningRate: config.modelParams?.learningRate || 0.01,
        timeWindow: config.modelParams?.timeWindow || 60,
        anomalyThreshold: config.modelParams?.anomalyThreshold || 0.85
      },
      retrainInterval: config.retrainInterval || 24
    };
  }
  
  /**
   * Set up scheduled model retraining
   */
  private setupRetraining(): void {
    const intervalHours = this.config.retrainInterval || 24;
    console.log(`[AnomalyDetection] Setting up model retraining every ${intervalHours} hours`);
    
    this.retrainInterval = setInterval(() => {
      console.log('[AnomalyDetection] Performing scheduled model retraining');
      this.model.train();
    }, intervalHours * 60 * 60 * 1000);
  }
  
  /**
   * Register default feature extractors
   */
  private registerDefaultFeatureExtractors(): void {
    // Standard request features
    this.registerFeatureExtractor('standard', (req: any) => {
      const ip = req.ip || req.connection?.remoteAddress || '0.0.0.0';
      const path = req.originalUrl || req.url || '/';
      const method = req.method || 'GET';
      const userAgent = req.headers?.['user-agent'] || '';
      const contentLength = req.headers?.['content-length'] ? parseInt(req.headers['content-length']) : 0;
      
      // Count parameters in query and body
      const queryParams = req.query ? Object.keys(req.query).length : 0;
      const bodyParams = req.body ? Object.keys(req.body).length : 0;
      
      // Timestamp and timing features
      const timestamp = new Date();
      const hourOfDay = timestamp.getHours();
      const dayOfWeek = timestamp.getDay();
      
      return {
        requestId: req.id || Math.random().toString(36).substring(2, 15),
        userId: req.user?.id || req.session?.user?.id,
        ip,
        path,
        method,
        bodySize: contentLength,
        parameterCount: queryParams + bodyParams,
        timing: {
          hourOfDay,
          dayOfWeek
        },
        metadata: {
          headers: req.headers || {},
          userAgent,
          timestamp,
          contextId: req.contextId || null,
          ip,
          path,
          method
        }
      };
    });
  }
  
  /**
   * Extract features from a request
   */
  private extractFeatures(req: any, context?: any): RequestFeatures {
    // Get standard features
    const standardExtractor = this.featureExtractors.get('standard');
    if (!standardExtractor) {
      throw new Error('Standard feature extractor not found');
    }
    
    const features = standardExtractor(req);
    
    // Add context information if available
    if (context) {
      features.contextId = context.id || null;
      features.metadata.contextId = context.id || null;
    }
    
    // Apply custom extractors
    for (const [name, extractor] of this.featureExtractors.entries()) {
      if (name !== 'standard') {
        try {
          const customFeatures = extractor(req);
          Object.assign(features, customFeatures);
        } catch (error) {
          console.error(`[AnomalyDetection] Error in feature extractor ${name}:`, error);
        }
      }
    }
    
    return features;
  }
  
  /**
   * Create a feature vector from request features
   */
  private createFeatureVector(features: RequestFeatures): FeatureVector {
    const featureValues = [];
    const featureLabels = [];
    
    // Request method
    const methodValue = this.encodeMethod(features.method);
    featureValues.push(methodValue);
    featureLabels.push('request_method');
    
    // Request path
    const pathFeatures = this.encodePath(features.path);
    featureValues.push(...pathFeatures);
    featureLabels.push('path_length', 'path_segments', 'path_depth');
    
    // Request body size
    featureValues.push(this.normalizeBodySize(features.bodySize));
    featureLabels.push('body_size');
    
    // Parameter count
    featureValues.push(this.normalizeParameterCount(features.parameterCount));
    featureLabels.push('parameter_count');
    
    // Timing features
    featureValues.push(features.timing.hourOfDay / 24);
    featureLabels.push('hour_of_day');
    
    featureValues.push(features.timing.dayOfWeek / 7);
    featureLabels.push('day_of_week');
    
    if (features.timing.timeSinceLastRequest !== undefined) {
      featureValues.push(this.normalizeTimeDelta(features.timing.timeSinceLastRequest));
      featureLabels.push('time_since_last_request');
    } else {
      // Use a default value
      featureValues.push(0.5);
      featureLabels.push('time_since_last_request');
    }
    
    return {
      id: features.requestId,
      timestamp: features.metadata.timestamp,
      features: featureValues,
      featureLabels,
      metadata: features
    };
  }
  
  /**
   * Encode HTTP method
   */
  private encodeMethod(method: string): number {
    // Normalize to uppercase
    const normalizedMethod = method.toUpperCase();
    
    // Assign values based on frequency and risk
    switch (normalizedMethod) {
      case 'GET':
        return 0.1;
      case 'POST':
        return 0.3;
      case 'PUT':
        return 0.5;
      case 'DELETE':
        return 0.7;
      case 'PATCH':
        return 0.6;
      case 'HEAD':
        return 0.2;
      case 'OPTIONS':
        return 0.15;
      default:
        return 0.9; // Unknown methods are highly suspicious
    }
  }
  
  /**
   * Encode path features
   */
  private encodePath(path: string): number[] {
    // Remove query string
    const pathOnly = path.split('?')[0];
    
    // Normalize path
    const normalizedPath = pathOnly.endsWith('/') && pathOnly.length > 1
      ? pathOnly.slice(0, -1)
      : pathOnly;
    
    // Extract features
    const length = normalizedPath.length;
    const segments = normalizedPath.split('/').filter(s => s.length > 0);
    const depth = segments.length;
    
    // Normalize
    const normalizedLength = Math.min(length / 100, 1.0);
    const normalizedSegments = Math.min(segments.length / 10, 1.0);
    const normalizedDepth = Math.min(depth / 5, 1.0);
    
    return [normalizedLength, normalizedSegments, normalizedDepth];
  }
  
  /**
   * Normalize body size
   */
  private normalizeBodySize(size: number): number {
    // Normalize based on typical API payloads
    // 0 = empty, 1 = very large (>1MB)
    if (size === 0) {
      return 0;
    }
    
    return Math.min(size / (1024 * 1024), 1.0);
  }
  
  /**
   * Normalize parameter count
   */
  private normalizeParameterCount(count: number): number {
    // Normalize based on typical API calls
    // 0 = no parameters, 1 = 20+ parameters
    return Math.min(count / 20, 1.0);
  }
  
  /**
   * Normalize time delta
   */
  private normalizeTimeDelta(seconds: number): number {
    // Normalize time delta, with very small or very large values being more suspicious
    
    if (seconds < 0.1) {
      // Very rapid requests are suspicious
      return 0.9;
    }
    
    if (seconds < 1) {
      // Fast requests may be suspicious
      return 0.7;
    }
    
    if (seconds > 86400) {
      // Very long time between requests (>1 day)
      return 0.6;
    }
    
    // Normal range: 1s to 1 day, map to 0.1-0.5
    return 0.1 + (0.4 * (1 - Math.min(seconds / 86400, 1)));
  }
  
  /**
   * Record an anomaly
   */
  private recordAnomaly(anomaly: AnomalyResult): void {
    this.recentAnomalies.unshift(anomaly);
    
    // Limit size
    if (this.recentAnomalies.length > this.maxRecentAnomalies) {
      this.recentAnomalies.pop();
    }
    
    // Emit event
    this.emit('anomaly:detected', anomaly);
    
    console.log(`[AnomalyDetection] Anomaly detected (score: ${anomaly.anomalyScore.toFixed(2)}) for request ${anomaly.requestId}`);
  }
}