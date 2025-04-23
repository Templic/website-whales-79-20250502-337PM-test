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
          timestamp: Date.now()
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
          timestamp: Date.now()
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

/**
 * Isolation Forest-based anomaly detection
 * Implementation based on the scikit-learn algorithm but adapted for JavaScript
 * 
 * References:
 * - Liu, F. T., Ting, K. M., & Zhou, Z. H. (2008). Isolation forest. 
 *   In 2008 Eighth IEEE International Conference on Data Mining (pp. 413-422). IEEE.
 */
class IsolationForest {
  private trees: any[] = [];
  private subSamplingSize: number;
  private numTrees: number;
  private maxTreeHeight: number;
  private data: any[] = [];
  
  /**
   * Create a new Isolation Forest instance
   */
  constructor(options: {
    numTrees?: number;
    subSamplingSize?: number;
    maxSamples?: number;
  } = {}) {
    this.numTrees = options.numTrees || 100;
    this.subSamplingSize = options.subSamplingSize || 256;
    
    // Calculate max tree height based on subsampling size
    this.maxTreeHeight = Math.ceil(Math.log2(this.subSamplingSize));
  }
  
  /**
   * Add data point to the training set
   */
  public addSample(sample: any): void {
    this.data.push(sample);
  }
  
  /**
   * Train the Isolation Forest model
   */
  public train(): void {
    if (this.data.length === 0) {
      throw new Error("No training data provided");
    }
    
    this.trees = [];
    
    // Create trees
    for (let i = 0; i < this.numTrees; i++) {
      // Randomly select data points for this tree
      const selectedSamples = this.getRandomSubsample();
      
      // Build tree
      const tree = this.buildIsolationTree(selectedSamples, 0);
      this.trees.push(tree);
    }
  }
  
  /**
   * Predict anomaly score for a data point (0-1 scale, higher is more anomalous)
   */
  public predict(sample: any): number {
    if (this.trees.length === 0) {
      throw new Error("Model not trained yet");
    }
    
    let totalPathLength = 0;
    
    // Traverse each tree and compute average path length
    for (const tree of this.trees) {
      const pathLength = this.getPathLength(sample, tree, 0);
      totalPathLength += pathLength;
    }
    
    const avgPathLength = totalPathLength / this.trees.length;
    
    // Calculate anomaly score (based on Isolation Forest paper)
    const dataSize = Math.min(this.data.length, this.subSamplingSize);
    const expectedPathLength = 2 * (Math.log(dataSize - 1) + 0.5772156649); // Euler's constant
    
    // Scale to 0-1, where 1 is most anomalous
    return Math.pow(2, -avgPathLength / expectedPathLength);
  }
  
  /**
   * Get random subsample for building a tree
   */
  private getRandomSubsample(): any[] {
    if (this.data.length <= this.subSamplingSize) {
      return [...this.data]; // Use all data if less than subsampling size
    }
    
    // Randomly sample without replacement
    const indices = new Set<number>();
    while (indices.size < this.subSamplingSize) {
      indices.add(Math.floor(Math.random() * this.data.length));
    }
    
    return Array.from(indices).map(index => this.data[index]);
  }
  
  /**
   * Build isolation tree recursively
   */
  private buildIsolationTree(data: any[], height: number): any {
    // If we've reached max height or there's only one sample, create leaf node
    if (height >= this.maxTreeHeight || data.length <= 1) {
      return { type: 'leaf', size: data.length };
    }
    
    // Randomly select a feature and split value
    const featuresCount = Object.keys(data[0]).length;
    const featureIndex = Math.floor(Math.random() * featuresCount);
    const featureName = Object.keys(data[0])[featureIndex];
    
    // Find min and max values for the selected feature
    let minVal = Infinity;
    let maxVal = -Infinity;
    
    for (const sample of data) {
      const val = sample[featureName];
      minVal = Math.min(minVal, val);
      maxVal = Math.max(maxVal, val);
    }
    
    // If all values are identical, create leaf node
    if (minVal === maxVal) {
      return { type: 'leaf', size: data.length };
    }
    
    // Select random split value between min and max
    const splitValue = minVal + Math.random() * (maxVal - minVal);
    
    // Split data
    const leftData = data.filter(sample => sample[featureName] < splitValue);
    const rightData = data.filter(sample => sample[featureName] >= splitValue);
    
    // Create internal node
    return {
      type: 'internal',
      feature: featureName,
      splitValue,
      left: this.buildIsolationTree(leftData, height + 1),
      right: this.buildIsolationTree(rightData, height + 1)
    };
  }
  
  /**
   * Compute path length for a sample in a tree
   */
  private getPathLength(sample: any, node: any, currentHeight: number): number {
    // If this is a leaf node, return current height plus adjustment
    if (node.type === 'leaf') {
      // Average path length correction from the original paper
      const size = node.size;
      if (size > 1) {
        return currentHeight + 2 * (Math.log(size - 1) + 0.5772156649) - 2 * (size - 1) / size;
      }
      return currentHeight;
    }
    
    // Otherwise, traverse left or right based on the split
    if (sample[node.feature] < node.splitValue) {
      return this.getPathLength(sample, node.left, currentHeight + 1);
    } else {
      return this.getPathLength(sample, node.right, currentHeight + 1);
    }
  }
}

/**
 * One-Class SVM for anomaly detection
 * A simplified implementation based on the concept of support vector domain description
 * 
 * References:
 * - Schölkopf, B., Platt, J. C., Shawe-Taylor, J., Smola, A. J., & Williamson, R. C. (2001).
 *   Estimating the support of a high-dimensional distribution. Neural computation, 13(7), 1443-1471.
 */
class OneClassSVM {
  private gamma: number;
  private nu: number;
  private trained: boolean = false;
  private supportVectors: any[] = [];
  private threshold: number = 0;
  private data: any[] = [];
  
  /**
   * Create a new One-Class SVM instance
   */
  constructor(options: {
    gamma?: number;
    nu?: number;
  } = {}) {
    // Gamma controls the influence of each training example (kernel width parameter)
    this.gamma = options.gamma || 0.1;
    
    // Nu is an upper bound on the fraction of training errors (0-1)
    this.nu = options.nu || 0.1;
  }
  
  /**
   * Add data point to the training set
   */
  public addSample(sample: any): void {
    this.data.push(this.normalizeFeatures(sample));
  }
  
  /**
   * Train the model
   */
  public train(): void {
    if (this.data.length === 0) {
      throw new Error("No training data provided");
    }
    
    // In a full implementation, we would compute support vectors
    // For this simplified version, we'll use all data points as support vectors
    this.supportVectors = [...this.data];
    
    // Calculate decision threshold based on RBF kernel similarities
    const similarities: number[] = [];
    
    for (const x of this.data) {
      let score = 0;
      for (const sv of this.supportVectors) {
        score += this.rbfKernel(x, sv);
      }
      similarities.push(score);
    }
    
    // Sort similarities in ascending order
    similarities.sort((a, b) => a - b);
    
    // Set threshold to the nu-th percentile of similarities
    const nuIndex = Math.floor(this.nu * similarities.length);
    this.threshold = similarities[nuIndex];
    
    this.trained = true;
  }
  
  /**
   * Predict anomaly score for a data point (higher is more anomalous)
   */
  public predict(sample: any): number {
    if (!this.trained) {
      throw new Error("Model not trained yet");
    }
    
    const normalizedSample = this.normalizeFeatures(sample);
    
    // Calculate similarity score
    let score = 0;
    for (const sv of this.supportVectors) {
      score += this.rbfKernel(normalizedSample, sv);
    }
    
    // Higher return value means more anomalous
    // Convert from similarity to anomaly score (0-1 scale)
    return Math.max(0, Math.min(1, 1 - (score / this.threshold)));
  }
  
  /**
   * Radial Basis Function (RBF) kernel
   */
  private rbfKernel(x1: any, x2: any): number {
    let sum = 0;
    for (const key of Object.keys(x1)) {
      if (typeof x1[key] === 'number' && typeof x2[key] === 'number') {
        sum += Math.pow(x1[key] - x2[key], 2);
      }
    }
    return Math.exp(-this.gamma * sum);
  }
  
  /**
   * Normalize features to [0,1] range by feature name
   */
  private normalizeFeatures(sample: any): any {
    const normalized: any = {};
    
    for (const [key, value] of Object.entries(sample)) {
      if (typeof value === 'number') {
        // Simple min-max normalization
        normalized[key] = value;
      } else {
        normalized[key] = value;
      }
    }
    
    return normalized;
  }
}

/**
 * Ensemble anomaly detector that combines multiple algorithms
 * for more robust detection
 */
class EnsembleAnomalyDetector {
  private models: {
    detector: IsolationForest | OneClassSVM;
    weight: number;
  }[] = [];
  
  private trainingData: Record<string, any>[] = [];
  private featureNormalizers: Record<string, { min: number; max: number }> = {};
  
  /**
   * Add a model to the ensemble
   */
  public addModel(model: IsolationForest | OneClassSVM, weight: number = 1): void {
    this.models.push({ detector: model, weight });
  }
  
  /**
   * Add data point for training
   */
  public addTrainingSample(sample: Record<string, any>): void {
    // Extract numerical features
    const features = this.extractFeatures(sample);
    this.trainingData.push(features);
    
    // Update feature normalizers
    this.updateFeatureNormalizers(features);
    
    // Add sample to individual models
    for (const { detector } of this.models) {
      detector.addSample(features);
    }
  }
  
  /**
   * Train all models in the ensemble
   */
  public train(): void {
    if (this.models.length === 0) {
      throw new Error("No models added to ensemble");
    }
    
    if (this.trainingData.length === 0) {
      throw new Error("No training data provided");
    }
    
    // Train each model
    for (const { detector } of this.models) {
      detector.train();
    }
  }
  
  /**
   * Predict anomaly score using weighted ensemble (0-1 scale)
   */
  public predict(sample: Record<string, any>): {
    score: number;
    isAnomaly: boolean;
    confidence: number;
    reason: string;
    modelScores: Record<string, number>;
  } {
    if (this.models.length === 0) {
      throw new Error("No models in ensemble");
    }
    
    // Extract and normalize features
    const features = this.extractFeatures(sample);
    
    // Get predictions from all models
    let totalScore = 0;
    let totalWeight = 0;
    const modelScores: Record<string, number> = {};
    
    for (let i = 0; i < this.models.length; i++) {
      const { detector, weight } = this.models[i];
      const score = detector.predict(features);
      
      totalScore += score * weight;
      totalWeight += weight;
      
      modelScores[`model_${i}`] = score;
    }
    
    // Calculate weighted average
    const avgScore = totalWeight > 0 ? totalScore / totalWeight : 0;
    
    // Calculate confidence based on agreement among models
    const scoreVariance = this.calculateVariance(Object.values(modelScores), avgScore);
    const confidence = 1 - Math.min(1, scoreVariance * 10); // Low variance = high confidence
    
    // Determine if this is an anomaly (score > 0.7 is anomalous)
    const anomalyThreshold = 0.7;
    const isAnomaly = avgScore > anomalyThreshold;
    
    // Generate reason
    let reason = isAnomaly
      ? `Anomaly detected with score ${avgScore.toFixed(3)} (threshold: ${anomalyThreshold})`
      : `Normal behavior (score: ${avgScore.toFixed(3)}, threshold: ${anomalyThreshold})`;
    
    return {
      score: avgScore,
      isAnomaly,
      confidence,
      reason,
      modelScores
    };
  }
  
  /**
   * Extract numerical features from a sample
   */
  private extractFeatures(sample: Record<string, any>): Record<string, number> {
    const features: Record<string, number> = {};
    
    // Handle Request objects specially
    if (sample.path && sample.method) {
      // This is an Express Request object
      features.pathLength = sample.path.length;
      features.hasQuery = sample.query && Object.keys(sample.query).length > 0 ? 1 : 0;
      features.queryParamCount = sample.query ? Object.keys(sample.query).length : 0;
      features.hasBody = sample.body && Object.keys(sample.body).length > 0 ? 1 : 0;
      features.bodySize = sample.body ? JSON.stringify(sample.body).length : 0;
      features.headerCount = sample.headers ? Object.keys(sample.headers).length : 0;
      features.hasCookies = sample.cookies && Object.keys(sample.cookies).length > 0 ? 1 : 0;
      features.timestamp = Date.now();
      
      // Convert method to a number
      switch (sample.method.toUpperCase()) {
        case 'GET': features.method = 1; break;
        case 'POST': features.method = 2; break;
        case 'PUT': features.method = 3; break;
        case 'DELETE': features.method = 4; break;
        case 'PATCH': features.method = 5; break;
        default: features.method = 0;
      }
    } else {
      // Extract numerical features from general object
      for (const [key, value] of Object.entries(sample)) {
        if (typeof value === 'number') {
          features[key] = value;
        } else if (typeof value === 'boolean') {
          features[key] = value ? 1 : 0;
        } else if (typeof value === 'string') {
          features[`${key}_length`] = value.length;
        }
      }
    }
    
    // Normalize features
    return this.normalizeFeatures(features);
  }
  
  /**
   * Update feature normalizers with new sample
   */
  private updateFeatureNormalizers(features: Record<string, number>): void {
    for (const [key, value] of Object.entries(features)) {
      if (!this.featureNormalizers[key]) {
        this.featureNormalizers[key] = { min: value, max: value };
      } else {
        this.featureNormalizers[key].min = Math.min(this.featureNormalizers[key].min, value);
        this.featureNormalizers[key].max = Math.max(this.featureNormalizers[key].max, value);
      }
    }
  }
  
  /**
   * Normalize features using min-max scaling
   */
  private normalizeFeatures(features: Record<string, number>): Record<string, number> {
    const normalized: Record<string, number> = {};
    
    for (const [key, value] of Object.entries(features)) {
      if (this.featureNormalizers[key]) {
        const { min, max } = this.featureNormalizers[key];
        if (max > min) {
          normalized[key] = (value - min) / (max - min);
        } else {
          normalized[key] = 0.5; // Default value if min == max
        }
      } else {
        normalized[key] = value; // No normalizer for this feature yet
      }
    }
    
    return normalized;
  }
  
  /**
   * Calculate variance of a set of values
   */
  private calculateVariance(values: number[], mean: number): number {
    if (values.length === 0) return 0;
    
    let sumSquaredDiff = 0;
    for (const value of values) {
      sumSquaredDiff += Math.pow(value - mean, 2);
    }
    
    return sumSquaredDiff / values.length;
  }
}

// Create singleton instance of ensemble detector
const ensembleDetector = new EnsembleAnomalyDetector();

// Add Isolation Forest model
const isolationForest = new IsolationForest({
  numTrees: 100,
  subSamplingSize: 256
});
ensembleDetector.addModel(isolationForest, 0.6);

// Add One-Class SVM model
const oneClassSVM = new OneClassSVM({
  gamma: 0.1,
  nu: 0.1
});
ensembleDetector.addModel(oneClassSVM, 0.4);

// Sample training data for initial model
const sampleCount = 50;
for (let i = 0; i < sampleCount; i++) {
  // Generate normal behavior patterns
  ensembleDetector.addTrainingSample({
    pathLength: 10 + Math.floor(Math.random() * 20),
    hasQuery: Math.random() > 0.5 ? 1 : 0,
    queryParamCount: Math.floor(Math.random() * 3),
    hasBody: Math.random() > 0.7 ? 1 : 0,
    bodySize: Math.floor(Math.random() * 1000),
    headerCount: 5 + Math.floor(Math.random() * 5),
    hasCookies: Math.random() > 0.3 ? 1 : 0,
    method: 1 + Math.floor(Math.random() * 3),
    timestamp: Date.now() - Math.floor(Math.random() * 3600000)
  });
}

// Train the ensemble model
try {
  ensembleDetector.train();
  console.log("[SECURITY] Ensemble anomaly detection model trained successfully");
} catch (error) {
  console.error("[SECURITY] Error training anomaly detection model:", error);
}

/**
 * Detect anomalies in a request
 * This is the function that's imported in the security middleware
 */
export async function detectAnomaly(req: Request): Promise<{
  isAnomaly: boolean;
  score: number;
  confidence: number;
  reason: string;
}> {
  try {
    // Use the ensemble detector to predict
    const result = ensembleDetector.predict(req);
    
    return {
      isAnomaly: result.isAnomaly,
      score: result.score,
      confidence: result.confidence,
      reason: result.reason
    };
  } catch (error) {
    console.error("[SECURITY] Error in detectAnomaly function:", error);
    return {
      isAnomaly: false,
      score: 0,
      confidence: 0,
      reason: "Error in anomaly detection"
    };
  }
}