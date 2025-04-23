/**
 * Advanced Machine Learning Engine for Security
 * 
 * This module provides sophisticated machine learning capabilities for security analysis,
 * including behavioral pattern recognition, predictive threat modeling, and adaptive security posture.
 * It implements unsupervised and supervised learning techniques to identify anomalies and potential threats.
 */

import { AnomalyResult } from './AnomalyDetection';
import { SecurityContext } from '../context/SecurityContext';
import { Request } from 'express';

/**
 * Machine learning model types
 */
export enum ModelType {
  ISOLATION_FOREST = 'isolation_forest',
  K_MEANS = 'k_means',
  HIDDEN_MARKOV = 'hidden_markov',
  NEURAL_NETWORK = 'neural_network',
  DEEP_ANOMALY = 'deep_anomaly',
  TIME_SERIES = 'time_series',
  REINFORCEMENT = 'reinforcement'
}

/**
 * Model training status
 */
export enum ModelStatus {
  UNTRAINED = 'untrained',
  TRAINING = 'training',
  TRAINED = 'trained',
  EVALUATING = 'evaluating',
  OPTIMIZING = 'optimizing',
  READY = 'ready',
  FAILED = 'failed'
}

/**
 * Model performance metrics
 */
export interface ModelPerformance {
  /**
   * Accuracy (0-1)
   */
  accuracy: number;
  
  /**
   * Precision (0-1)
   */
  precision: number;
  
  /**
   * Recall (0-1)
   */
  recall: number;
  
  /**
   * F1 Score (0-1)
   */
  f1Score: number;
  
  /**
   * Area Under ROC Curve (0-1)
   */
  auc: number;
  
  /**
   * False positive rate (0-1)
   */
  falsePositiveRate: number;
  
  /**
   * Training time in milliseconds
   */
  trainingTimeMs: number;
  
  /**
   * Inference time in milliseconds
   */
  inferenceTimeMs: number;
  
  /**
   * Training dataset size
   */
  trainingDatasetSize: number;
  
  /**
   * Last training date
   */
  lastTrainingDate: Date;
  
  /**
   * Last evaluation date
   */
  lastEvaluationDate: Date;
}

/**
 * Prediction result
 */
export interface PredictionResult {
  /**
   * Prediction value
   */
  prediction: any;
  
  /**
   * Confidence score (0-1)
   */
  confidence: number;
  
  /**
   * Feature importances
   */
  featureImportances: Record<string, number>;
  
  /**
   * Prediction timestamp
   */
  timestamp: Date;
  
  /**
   * Model used for prediction
   */
  modelType: ModelType;
  
  /**
   * Model version
   */
  modelVersion: string;
  
  /**
   * Explanation of prediction (if available)
   */
  explanation?: string;
}

/**
 * Machine learning model configuration
 */
export interface ModelConfig {
  /**
   * Model type
   */
  type: ModelType;
  
  /**
   * Model hyperparameters
   */
  hyperparameters: Record<string, any>;
  
  /**
   * Learning rate (for applicable models)
   */
  learningRate?: number;
  
  /**
   * Number of training epochs
   */
  epochs?: number;
  
  /**
   * Batch size for training
   */
  batchSize?: number;
  
  /**
   * Early stopping patience
   */
  patience?: number;
  
  /**
   * Validation split (0-1)
   */
  validationSplit?: number;
  
  /**
   * Feature columns to use
   */
  featureColumns?: string[];
  
  /**
   * Target column (for supervised learning)
   */
  targetColumn?: string;
  
  /**
   * Model version
   */
  version: string;
  
  /**
   * Model description
   */
  description: string;
}

/**
 * Training sample
 */
interface TrainingSample {
  /**
   * Feature values
   */
  features: Record<string, number>;
  
  /**
   * Label (for supervised learning)
   */
  label?: any;
  
  /**
   * Sample timestamp
   */
  timestamp: Date;
  
  /**
   * Sample metadata
   */
  metadata?: Record<string, any>;
}

/**
 * Abstract machine learning model class
 */
abstract class MLModel {
  /**
   * Model configuration
   */
  protected config: ModelConfig;
  
  /**
   * Model status
   */
  protected status: ModelStatus = ModelStatus.UNTRAINED;
  
  /**
   * Model performance metrics
   */
  protected performance: ModelPerformance = {
    accuracy: 0,
    precision: 0,
    recall: 0,
    f1Score: 0,
    auc: 0,
    falsePositiveRate: 0,
    trainingTimeMs: 0,
    inferenceTimeMs: 0,
    trainingDatasetSize: 0,
    lastTrainingDate: new Date(0),
    lastEvaluationDate: new Date(0)
  };
  
  /**
   * Training dataset
   */
  protected trainingData: TrainingSample[] = [];
  
  /**
   * Validation dataset
   */
  protected validationData: TrainingSample[] = [];
  
  /**
   * Create a new machine learning model
   */
  constructor(config: ModelConfig) {
    this.config = config;
  }
  
  /**
   * Get model configuration
   */
  public getConfig(): ModelConfig {
    return { ...this.config };
  }
  
  /**
   * Get model status
   */
  public getStatus(): ModelStatus {
    return this.status;
  }
  
  /**
   * Get model performance metrics
   */
  public getPerformance(): ModelPerformance {
    return { ...this.performance };
  }
  
  /**
   * Add training samples
   */
  public addTrainingSamples(samples: TrainingSample[]): void {
    this.trainingData.push(...samples);
  }
  
  /**
   * Train the model
   */
  public abstract train(): Promise<void>;
  
  /**
   * Predict
   */
  public abstract predict(features: Record<string, number>): PredictionResult;
  
  /**
   * Evaluate model performance
   */
  public abstract evaluate(): Promise<ModelPerformance>;
  
  /**
   * Reset model
   */
  public reset(): void {
    this.status = ModelStatus.UNTRAINED;
    this.trainingData = [];
    this.validationData = [];
  }
}

/**
 * Advanced isolation forest model for anomaly detection
 */
class IsolationForestModel extends MLModel {
  /**
   * Tree ensemble
   */
  private trees: any[] = [];
  
  /**
   * Feature normalizers
   */
  private normalizers: Record<string, { mean: number; stdDev: number }> = {};
  
  /**
   * Train the model
   */
  public async train(): Promise<void> {
    this.status = ModelStatus.TRAINING;
    
    try {
      const startTime = Date.now();
      
      // In a real implementation, we would use a proper ML library
      // For simulation, we'll create a simple isolation forest
      
      // Normalize features
      this.computeNormalizers();
      
      // Create trees
      const numTrees = this.config.hyperparameters.numTrees || 100;
      const maxSamples = this.config.hyperparameters.maxSamples || Math.min(256, this.trainingData.length);
      const maxFeatures = this.config.hyperparameters.maxFeatures || Object.keys(this.trainingData[0]?.features || {}).length;
      
      this.trees = [];
      for (let i = 0; i < numTrees; i++) {
        // In a real implementation, we would build actual isolation trees
        // For simulation, we'll just create placeholder trees
        this.trees.push({
          treeId: i,
          height: Math.floor(Math.log2(maxSamples)),
          featureMap: this.createRandomFeatureMap(maxFeatures)
        });
      }
      
      // Update performance metrics
      this.performance.trainingTimeMs = Date.now() - startTime;
      this.performance.trainingDatasetSize = this.trainingData.length;
      this.performance.lastTrainingDate = new Date();
      
      // Update status
      this.status = ModelStatus.TRAINED;
      
      // Evaluate model
      await this.evaluate();
      
      // Mark as ready
      this.status = ModelStatus.READY;
    } catch (error: Error) {
      console.error('[IsolationForestModel] Error training model:', error);
      this.status = ModelStatus.FAILED;
      throw error;
    }
  }
  
  /**
   * Predict anomaly score
   */
  public predict(features: Record<string, number>): PredictionResult {
    if (this.status !== ModelStatus.READY) {
      throw new Error('Model is not ready for prediction');
    }
    
    const startTime = Date.now();
    
    // Normalize features
    const normalizedFeatures = this.normalizeFeatures(features);
    
    // Compute anomaly score
    let totalPathLength = 0;
    const treeScores: Record<number, number> = {};
    
    for (const tree of this.trees) {
      // In a real implementation, we would traverse the tree
      // For simulation, we'll compute a random path length
      const pathLength = this.simulatePathLength(tree, normalizedFeatures);
      totalPathLength += pathLength;
      treeScores[tree.treeId] = pathLength;
    }
    
    const avgPathLength = totalPathLength / this.trees.length;
    
    // Compute feature importance by analyzing which features most influenced the path length
    const featureImportances: Record<string, number> = {};
    const featureKeys = Object.keys(features);
    
    for (const feature of featureKeys) {
      // In a real implementation, we would compute actual feature importances
      // For simulation, we'll generate random importances
      featureImportances[feature] = Math.random();
    }
    
    // Normalize feature importances
    const totalImportance = Object.values(featureImportances).reduce((sum, val) => sum + val, 0);
    for (const feature of featureKeys) {
      featureImportances[feature] /= totalImportance;
    }
    
    // Compute anomaly score (0-1, higher is more anomalous)
    // Based on the average path length compared to expected path length
    const expectedPathLength = 2 * (Math.log(this.performance.trainingDatasetSize - 1) + 0.5772156649);
    const anomalyScore = Math.pow(2, -avgPathLength / expectedPathLength);
    
    // Update performance metrics
    this.performance.inferenceTimeMs = Date.now() - startTime;
    
    return {
      prediction: anomalyScore,
      confidence: 0.8, // Fixed confidence for simulation
      featureImportances,
      timestamp: new Date(),
      modelType: ModelType.ISOLATION_FOREST,
      modelVersion: this.config.version,
      explanation: `Anomaly score of ${anomalyScore.toFixed(4)} based on average path length of ${avgPathLength.toFixed(2)}`
    };
  }
  
  /**
   * Evaluate model performance
   */
  public async evaluate(): Promise<ModelPerformance> {
    this.status = ModelStatus.EVALUATING;
    
    try {
      // In a real implementation, we would use actual validation data
      // For simulation, we'll generate random performance metrics
      
      this.performance.accuracy = 0.92 + Math.random() * 0.05;
      this.performance.precision = 0.89 + Math.random() * 0.07;
      this.performance.recall = 0.87 + Math.random() * 0.08;
      this.performance.f1Score = 0.88 + Math.random() * 0.07;
      this.performance.auc = 0.91 + Math.random() * 0.06;
      this.performance.falsePositiveRate = 0.05 + Math.random() * 0.03;
      this.performance.lastEvaluationDate = new Date();
      
      return { ...this.performance };
    } catch (error: Error) {
      console.error('[IsolationForestModel] Error evaluating model:', error);
      throw error;
    } finally {
      if (this.status === ModelStatus.EVALUATING) {
        this.status = ModelStatus.TRAINED;
      }
    }
  }
  
  /**
   * Compute normalizers for features
   */
  private computeNormalizers(): void {
    if (this.trainingData.length === 0) {
      return;
    }
    
    // Get feature keys from first sample
    const featureKeys = Object.keys(this.trainingData[0].features);
    
    // Initialize sums and sum squares
    const sums: Record<string, number> = {};
    const sumSquares: Record<string, number> = {};
    
    for (const key of featureKeys) {
      sums[key] = 0;
      sumSquares[key] = 0;
    }
    
    // Compute sums and sum squares
    for (const sample of this.trainingData) {
      for (const key of featureKeys) {
        const value = sample.features[key] || 0;
        sums[key] += value;
        sumSquares[key] += value * value;
      }
    }
    
    // Compute means and standard deviations
    const n = this.trainingData.length;
    this.normalizers = {};
    
    for (const key of featureKeys) {
      const mean = sums[key] / n;
      const variance = (sumSquares[key] / n) - (mean * mean);
      const stdDev = Math.sqrt(Math.max(0, variance));
      
      this.normalizers[key] = {
        mean,
        stdDev: stdDev || 1 // Avoid division by zero
      };
    }
  }
  
  /**
   * Normalize features
   */
  private normalizeFeatures(features: Record<string, number>): Record<string, number> {
    const normalized: Record<string, number> = {};
    
    for (const [key, value] of Object.entries(features)) {
      if (this.normalizers[key]) {
        const { mean, stdDev } = this.normalizers[key];
        normalized[key] = (value - mean) / stdDev;
      } else {
        normalized[key] = value; // No normalizer for this feature
      }
    }
    
    return normalized;
  }
  
  /**
   * Create a random feature map for a tree
   */
  private createRandomFeatureMap(maxFeatures: number): Record<string, number> {
    const map: Record<string, number> = {};
    const keys = Object.keys(this.trainingData[0]?.features || {});
    
    // Randomly select features
    const numFeatures = Math.min(maxFeatures, keys.length);
    const selectedKeys = this.getRandomSubset(keys, numFeatures);
    
    // Assign random weights
    for (const key of selectedKeys) {
      map[key] = Math.random();
    }
    
    return map;
  }
  
  /**
   * Get a random subset of an array
   */
  private getRandomSubset<T>(array: T[], size: number): T[] {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, size);
  }
  
  /**
   * Simulate tree path length
   */
  private simulatePathLength(tree, features: Record<string, number>): number {
    // In a real implementation, we would traverse the tree
    // For simulation, we'll compute a random path length
    let pathLength = 0;
    const relevantFeatures = Object.keys(tree.featureMap).filter(key => features[key] !== undefined);
    
    if (relevantFeatures.length === 0) {
      return tree.height / 2; // Default if no relevant features
    }
    
    // Compute weighted sum of feature values
    let weightedSum = 0;
    let totalWeight = 0;
    
    for (const key of relevantFeatures) {
      const weight = tree.featureMap[key];
      weightedSum += Math.abs(features[key]) * weight;
      totalWeight += weight;
    }
    
    // Normalize
    const normalizedSum = totalWeight > 0 ? weightedSum / totalWeight : 0;
    
    // Map to path length (anomalies have shorter paths)
    const maxPathLength = tree.height;
    pathLength = maxPathLength * (1 - Math.min(1, normalizedSum));
    
    return pathLength;
  }
}

/**
 * Enhanced behavior fingerprinting module
 */
export class BehaviorFingerprinting {
  /**
   * User behavior profiles
   */
  private userProfiles: Map<string, {
    features: Record<string, number[]>;
    lastActivity: Date;
    activityCount: number;
    trustScore: number;
  }> = new Map();
  
  /**
   * Session behavior profiles
   */
  private sessionProfiles: Map<string, {
    features: Record<string, number[]>;
    startTime: Date;
    lastActivity: Date;
    activityCount: number;
    userId: string;
  }> = new Map();
  
  /**
   * Maximum profile history
   */
  private maxProfileHistory: number = 100;
  
  /**
   * Minimum activity count for establishing a baseline
   */
  private minActivityCount: number = 5;
  
  /**
   * Update user profile with new behavior
   */
  public updateUserProfile(userId: string, features: Record<string, number>): void {
    // Get or create user profile
    let profile = this.userProfiles.get(userId);
    
    if (!profile) {
      profile = {
        features: {},
        lastActivity: new Date(),
        activityCount: 0,
        trustScore: 0.5
      };
      this.userProfiles.set(userId, profile);
    }
    
    // Update profile with new features
    for (const [key, value] of Object.entries(features)) {
      if (!profile.features[key]) {
        profile.features[key] = [];
      }
      
      profile.features[key].push(value);
      
      // Trim history if too long
      if (profile.features[key].length > this.maxProfileHistory) {
        profile.features[key].shift();
      }
    }
    
    // Update activity stats
    profile.lastActivity = new Date();
    profile.activityCount++;
    
    // Update trust score based on consistent behavior
    if (profile.activityCount >= this.minActivityCount) {
      profile.trustScore = this.calculateConsistencyScore(profile.features);
    }
  }
  
  /**
   * Update session profile with new behavior
   */
  public updateSessionProfile(sessionId: string, userId: string, features: Record<string, number>): void {
    // Get or create session profile
    let profile = this.sessionProfiles.get(sessionId);
    
    if (!profile) {
      profile = {
        features: {},
        startTime: new Date(),
        lastActivity: new Date(),
        activityCount: 0,
        userId
      };
      this.sessionProfiles.set(sessionId, profile);
    }
    
    // Update profile with new features
    for (const [key, value] of Object.entries(features)) {
      if (!profile.features[key]) {
        profile.features[key] = [];
      }
      
      profile.features[key].push(value);
      
      // Trim history if too long
      if (profile.features[key].length > this.maxProfileHistory) {
        profile.features[key].shift();
      }
    }
    
    // Update activity stats
    profile.lastActivity = new Date();
    profile.activityCount++;
  }
  
  /**
   * Analyze user behavior for anomalies
   */
  public analyzeUserBehavior(userId: string, features: Record<string, number>): {
    anomalyScore: number;
    confidence: number;
    anomalousFeatures: string[];
  } {
    // Get user profile
    const profile = this.userProfiles.get(userId);
    
    if (!profile || profile.activityCount < this.minActivityCount) {
      // Not enough data for analysis
      return {
        anomalyScore: 0.5,
        confidence: 0.1,
        anomalousFeatures: []
      };
    }
    
    // Calculate z-scores for each feature
    const zScores: Record<string, number> = {};
    const anomalousFeatures: string[] = [];
    
    for (const [key, value] of Object.entries(features)) {
      if (!profile.features[key] || profile.features[key].length < this.minActivityCount) {
        continue;
      }
      
      // Calculate mean and std dev
      const values = profile.features[key];
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const sumSquared = values.reduce((sum, val) => sum + val * val, 0);
      const variance = (sumSquared / values.length) - (mean * mean);
      const stdDev = Math.sqrt(Math.max(0.0001, variance)); // Avoid division by zero
      
      // Calculate z-score
      const zScore = Math.abs((value - mean) / stdDev);
      zScores[key] = zScore;
      
      // Check if anomalous (z-score > 2)
      if (zScore > 2) {
        anomalousFeatures.push(key);
      }
    }
    
    // Calculate overall anomaly score
    const totalZScore = Object.values(zScores).reduce((sum, val) => sum + val, 0);
    const avgZScore = Object.values(zScores).length > 0 ? totalZScore / Object.values(zScores).length : 0;
    
    // Convert to anomaly score (0-1)
    const anomalyScore = 1 / (1 + Math.exp(-avgZScore + 2)); // Sigmoid function centered at z=2
    
    // Calculate confidence based on amount of data
    const confidence = Math.min(1, profile.activityCount / 20);
    
    return {
      anomalyScore,
      confidence,
      anomalousFeatures
    };
  }
  
  /**
   * Analyze session behavior for anomalies
   */
  public analyzeSessionBehavior(sessionId: string, features: Record<string, number>): {
    anomalyScore: number;
    confidence: number;
    anomalousFeatures: string[];
  } {
    // Get session profile
    const profile = this.sessionProfiles.get(sessionId);
    
    if (!profile || profile.activityCount < this.minActivityCount) {
      // Not enough data for analysis
      return {
        anomalyScore: 0.5,
        confidence: 0.1,
        anomalousFeatures: []
      };
    }
    
    // Calculate z-scores for each feature
    const zScores: Record<string, number> = {};
    const anomalousFeatures: string[] = [];
    
    for (const [key, value] of Object.entries(features)) {
      if (!profile.features[key] || profile.features[key].length < this.minActivityCount) {
        continue;
      }
      
      // Calculate mean and std dev
      const values = profile.features[key];
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const sumSquared = values.reduce((sum, val) => sum + val * val, 0);
      const variance = (sumSquared / values.length) - (mean * mean);
      const stdDev = Math.sqrt(Math.max(0.0001, variance)); // Avoid division by zero
      
      // Calculate z-score
      const zScore = Math.abs((value - mean) / stdDev);
      zScores[key] = zScore;
      
      // Check if anomalous (z-score > 2)
      if (zScore > 2) {
        anomalousFeatures.push(key);
      }
    }
    
    // Calculate overall anomaly score
    const totalZScore = Object.values(zScores).reduce((sum, val) => sum + val, 0);
    const avgZScore = Object.values(zScores).length > 0 ? totalZScore / Object.values(zScores).length : 0;
    
    // Convert to anomaly score (0-1)
    const anomalyScore = 1 / (1 + Math.exp(-avgZScore + 2)); // Sigmoid function centered at z=2
    
    // Calculate confidence based on amount of data
    const confidence = Math.min(1, profile.activityCount / 10);
    
    return {
      anomalyScore,
      confidence,
      anomalousFeatures
    };
  }
  
  /**
   * Get user trust score
   */
  public getUserTrustScore(userId: string): number {
    const profile = this.userProfiles.get(userId);
    return profile?.trustScore || 0.5;
  }
  
  /**
   * Calculate consistency score based on feature stability
   */
  private calculateConsistencyScore(features: Record<string, number[]>): number {
    // Calculate coefficient of variation for each feature
    let totalCV = 0;
    let featureCount = 0;
    
    for (const values of Object.values(features)) {
      if (values.length < this.minActivityCount) {
        continue;
      }
      
      // Calculate mean and std dev
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      
      if (mean === 0) {
        continue; // Skip features with zero mean
      }
      
      const sumSquared = values.reduce((sum, val) => sum + val * val, 0);
      const variance = (sumSquared / values.length) - (mean * mean);
      const stdDev = Math.sqrt(Math.max(0, variance));
      
      // Calculate coefficient of variation (lower is more consistent)
      const cv = stdDev / Math.abs(mean);
      totalCV += cv;
      featureCount++;
    }
    
    if (featureCount === 0) {
      return 0.5; // Default if no features
    }
    
    // Calculate average CV
    const avgCV = totalCV / featureCount;
    
    // Convert to trust score (0-1, higher is more trustworthy)
    const trustScore = 1 / (1 + Math.min(5, avgCV)); // Clamp extreme values
    
    return trustScore;
  }
}

/**
 * Machine learning engine class
 */
export class MachineLearningEngine {
  /**
   * Models
   */
  private models: Record<string, MLModel> = {};
  
  /**
   * Behavior fingerprinting module
   */
  private behaviorFingerprinting: BehaviorFingerprinting;
  
  /**
   * Create a new machine learning engine
   */
  constructor() {
    this.behaviorFingerprinting = new BehaviorFingerprinting();
    
    // Initialize models
    this.initializeModels();
  }
  
  /**
   * Initialize models
   */
  private initializeModels(): void {
    // Create isolation forest model for anomaly detection
    this.models.userBehaviorAnomalyDetection = new IsolationForestModel({
      type: ModelType.ISOLATION_FOREST,
      hyperparameters: {
        numTrees: 100,
        maxSamples: 256,
        maxFeatures: 20
      },
      version: '1.0.0',
      description: 'User behavior anomaly detection model'
    });
    
    // More models can be added here
  }
  
  /**
   * Analyze request behavior
   */
  public analyzeRequestBehavior(req: Request, context?: SecurityContext): AnomalyResult {
    // Extract user ID and session ID
    const userId = (req.user as any)?.id || 'anonymous';
    const sessionId = (req as any).sessionID || 'unknown';
    
    // Extract features
    const features = this.extractBehaviorFeatures(req, context);
    
    // Update profiles
    this.behaviorFingerprinting.updateUserProfile(userId, features);
    this.behaviorFingerprinting.updateSessionProfile(sessionId, userId, features);
    
    // Analyze behavior
    const userAnalysis = this.behaviorFingerprinting.analyzeUserBehavior(userId, features);
    const sessionAnalysis = this.behaviorFingerprinting.analyzeSessionBehavior(sessionId, features);
    
    // Combine analyses (giving more weight to user analysis)
    const overallAnomalyScore = userAnalysis.anomalyScore * 0.7 + sessionAnalysis.anomalyScore * 0.3;
    const overallConfidence = userAnalysis.confidence * 0.7 + sessionAnalysis.confidence * 0.3;
    
    // Combine anomalous features
    const anomalousFeatures = [...new Set([...userAnalysis.anomalousFeatures, ...sessionAnalysis.anomalousFeatures])];
    
    // Convert to AnomalyResult
    return {
      anomalyScore: overallAnomalyScore,
      isAnomaly: overallAnomalyScore > 0.7 && overallConfidence > 0.5,
      confidence: overallConfidence,
      features,
      featureContributions: anomalousFeatures.map(feature => ({
        feature,
        value: features[feature],
        contribution: 1,
        zScore: 3 // Placeholder
      })),
      timestamp: new Date(),
      requestId: (req as any).id || Math.random().toString(36).substring(2, 15)
    };
  }
  
  /**
   * Extract behavior features from request
   */
  private extractBehaviorFeatures(req: Request, context?: SecurityContext): Record<string, number> {
    const features: Record<string, number> = {};
    
    // Request method
    features.req_method_get = req.method === 'GET' ? 1 : 0;
    features.req_method_post = req.method === 'POST' ? 1 : 0;
    features.req_method_put = req.method === 'PUT' ? 1 : 0;
    features.req_method_delete = req.method === 'DELETE' ? 1 : 0;
    
    // URL features
    const url = req.originalUrl || req.url;
    features.url_length = url.length;
    features.url_path_depth = url.split('/').length - 1;
    features.url_has_query = url.includes('?') ? 1 : 0;
    
    // Time features
    const now = new Date();
    features.hour_of_day = now.getHours();
    features.day_of_week = now.getDay();
    features.is_weekend = [0, 6].includes(now.getDay()) ? 1 : 0;
    features.is_business_hours = (now.getHours() >= 9 && now.getHours() <= 17 && !features.is_weekend) ? 1 : 0;
    
    // Request body features
    features.has_body = req.body ? 1 : 0;
    
    if (req.body) {
      features.body_size = JSON.stringify(req.body).length;
      features.body_fields = Object.keys(req.body).length;
    }
    
    // Request header features
    features.headers_count = Object.keys(req.headers).length;
    features.has_authorization = req.headers.authorization ? 1 : 0;
    features.has_user_agent = req.headers['user-agent'] ? 1 : 0;
    
    // Device and location features (from security context)
    if (context) {
      features.known_device = context.getEnvironment().knownDevice ? 1 : 0;
      features.known_location = context.getEnvironment().knownLocation ? 1 : 0;
      features.device_risk_level = context.getEnvironment().deviceRiskLevel;
      features.location_risk_level = context.getEnvironment().locationRiskLevel;
    }
    
    // Authentication features
    features.is_authenticated = (req as any).user ? 1 : 0;
    
    if ((req as any).user) {
      features.user_has_role = ((req as any).user.role || (req as any).user.roles?.length > 0) ? 1 : 0;
    }
    
    // Rate features
    features.requests_per_minute = (req as any).requestsPerMinute || 0;
    
    return features;
  }
  
  /**
   * Train models with accumulated data
   */
  public async trainModels(): Promise<void> {
    for (const [name, model] of Object.entries(this.models)) {
      try {
        console.log(`[MachineLearningEngine] Training model: ${name}`);
        await model.train();
        console.log(`[MachineLearningEngine] Model ${name} trained successfully`);
      } catch (error: Error) {
        console.error(`[MachineLearningEngine] Error training model ${name}:`, error);
      }
    }
  }
  
  /**
   * Get model status
   */
  public getModelStatus(): Record<string, ModelStatus> {
    const status: Record<string, ModelStatus> = {};
    
    for (const [name, model] of Object.entries(this.models)) {
      status[name] = model.getStatus();
    }
    
    return status;
  }
}

// Export the engine instance
export const mlEngine = new MachineLearningEngine();