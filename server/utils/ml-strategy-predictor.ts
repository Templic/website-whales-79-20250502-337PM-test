/**
 * Machine Learning Strategy Predictor
 * 
 * This module provides ML-powered prediction of the most effective fix strategy
 * for TypeScript errors based on historical data. It's a key component of
 * Phase 4 of the TypeScript Error Management System.
 * 
 * Features:
 * - Learns from historical fix success/failure patterns
 * - Extracts features from error contexts and messages
 * - Predicts the most likely successful strategy for a given error
 * - Provides confidence scores for predictions
 * - Self-improves based on fix outcomes
 * 
 * @module ml-strategy-predictor
 */

import * as fs from 'fs';
import * as path from 'path';
import { db } from '../db';
import { errorFixes, typeScriptErrors, errorPatterns } from '@shared/schema';
import { and, eq, sql, desc, asc, count } from 'drizzle-orm';
import { logger } from '../logger';
import { BaseFixStrategy } from './fix-strategy-factory';

// Types for ML prediction
export interface ErrorFeatures {
  errorCode: string;
  errorCategory: string;
  errorSeverity: string;
  messageFeatures: Record<string, number>;
  contextFeatures: Record<string, number>;
  filePathComponents: string[];
  dependenciesCount: number;
  fileSize: number;
}

export interface StrategyPrediction {
  strategyId: string;
  confidence: number;
  alternativeStrategies: Array<{
    strategyId: string;
    confidence: number;
  }>;
  reasons: string[];
}

export interface TrainingSample {
  errorFeatures: ErrorFeatures;
  successfulStrategy: string;
  fixId: number;
  outcome: 'success' | 'partial' | 'failure';
}

export interface ModelPerformance {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  confusionMatrix: Record<string, Record<string, number>>;
  dataPoints: number;
}

/**
 * The ML Strategy Predictor class
 */
export class MLStrategyPredictor {
  private modelPath: string;
  private vocabularyPath: string;
  private model: any; // Will use a simple model initially, can be enhanced later
  private vocabulary: Set<string>;
  private strategySuccessRates: Map<string, { success: number; total: number }>;
  private featureImportance: Map<string, number>;
  private initialized: boolean = false;

  constructor(modelPath?: string) {
    this.modelPath = modelPath || path.join(process.cwd(), 'data', 'ml-models', 'strategy-predictor.json');
    this.vocabularyPath = path.join(process.cwd(), 'data', 'ml-models', 'feature-vocabulary.json');
    this.vocabulary = new Set<string>();
    this.strategySuccessRates = new Map<string, { success: number; total: number }>();
    this.featureImportance = new Map<string, number>();
  }

  /**
   * Initialize the predictor
   */
  public async initialize(): Promise<void> {
    try {
      // Create model directory if it doesn't exist
      const modelDir = path.dirname(this.modelPath);
      if (!fs.existsSync(modelDir)) {
        fs.mkdirSync(modelDir, { recursive: true });
      }

      // Load model if it exists, otherwise create a new one
      if (fs.existsSync(this.modelPath)) {
        const modelData = JSON.parse(fs.readFileSync(this.modelPath, 'utf-8'));
        this.model = modelData.model;
        logger.info(`ML Strategy Predictor model loaded from ${this.modelPath}`);
      } else {
        // Initialize with empty model
        this.model = {
          strategies: {},
          featureWeights: {},
          version: '1.0.0',
          trainingIterations: 0,
          lastUpdated: new Date().toISOString()
        };
        logger.info(`ML Strategy Predictor initialized with empty model`);
      }

      // Load vocabulary if it exists
      if (fs.existsSync(this.vocabularyPath)) {
        const vocabularyData = JSON.parse(fs.readFileSync(this.vocabularyPath, 'utf-8'));
        this.vocabulary = new Set<string>(vocabularyData);
        logger.info(`Vocabulary loaded with ${this.vocabulary.size} features`);
      }

      // Calculate strategy success rates from database
      await this.calculateStrategySuccessRates();
      
      this.initialized = true;
      logger.info('ML Strategy Predictor initialization complete');
    } catch (error) {
      logger.error(`Failed to initialize ML Strategy Predictor: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Calculate the success rates for each strategy using historical data
   */
  private async calculateStrategySuccessRates(): Promise<void> {
    try {
      // Get strategy success rates from database
      const results = await db.select({
        strategyId: errorFixes.strategy_id,
        success: sql<number>`SUM(CASE WHEN ${errorFixes.success} = true THEN 1 ELSE 0 END)`,
        total: sql<number>`COUNT(*)`
      })
      .from(errorFixes)
      .groupBy(errorFixes.strategy_id);

      // Update strategy success rates
      this.strategySuccessRates.clear();
      results.forEach(result => {
        if (result.strategyId) {
          this.strategySuccessRates.set(result.strategyId, {
            success: Number(result.success),
            total: Number(result.total)
          });
        }
      });

      logger.info(`Calculated success rates for ${this.strategySuccessRates.size} strategies`);
    } catch (error) {
      logger.error(`Failed to calculate strategy success rates: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Predict the best strategy for fixing a TypeScript error
   */
  public async predictStrategy(error: any, availableStrategies: string[]): Promise<StrategyPrediction> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Extract features from error
      const features = await this.extractFeatures(error);
      
      // Simple placeholder logic - will be replaced with actual ML model
      // This is a naive implementation that will be enhanced
      // with proper machine learning algorithms in the future
      const predictions: Record<string, number> = {};
      
      // Calculate scores for each available strategy
      for (const strategyId of availableStrategies) {
        const baseScore = this.calculateStrategyBaseScore(strategyId, features);
        const historyBoost = this.calculateHistoryBoost(strategyId, features.errorCode);
        const similarityScore = this.calculateSimilarityScore(strategyId, features);
        
        // Weighted combination of scores
        predictions[strategyId] = 0.5 * baseScore + 0.3 * historyBoost + 0.2 * similarityScore;
      }
      
      // Sort strategies by scores
      const sortedStrategies = Object.entries(predictions)
        .sort(([, scoreA], [, scoreB]) => scoreB - scoreA);
      
      // Select the best strategy and calculate confidence
      const bestStrategy = sortedStrategies[0]?.[0] || availableStrategies[0];
      const bestScore = sortedStrategies[0]?.[1] || 0.5;
      
      // Calculate confidence based on relative scores
      const totalScore = sortedStrategies.reduce((sum, [, score]) => sum + score, 0);
      const confidence = totalScore > 0 ? bestScore / totalScore : 0.5;
      
      // Generate alternative strategies
      const alternatives = sortedStrategies.slice(1, 4).map(([strategyId, score]) => ({
        strategyId,
        confidence: totalScore > 0 ? score / totalScore : 0.2
      }));
      
      // Generate reasons for the prediction
      const reasons = this.generateReasons(bestStrategy, features);
      
      return {
        strategyId: bestStrategy,
        confidence: Math.min(0.95, confidence), // Cap confidence at 0.95
        alternativeStrategies: alternatives,
        reasons
      };
    } catch (error) {
      logger.error(`Strategy prediction failed: ${error instanceof Error ? error.message : String(error)}`);
      
      // Fallback to strategy with highest success rate
      const bestStrategy = this.getFallbackStrategy(availableStrategies);
      
      return {
        strategyId: bestStrategy,
        confidence: 0.3, // Low confidence for fallback
        alternativeStrategies: [],
        reasons: ['Prediction failed, using fallback strategy based on general success rates.']
      };
    }
  }

  /**
   * Extract features from a TypeScript error
   */
  private async extractFeatures(error: any): Promise<ErrorFeatures> {
    // Basic implementation - will be enhanced in the future
    const messageTokens = this.tokenize(error.message || '');
    const contextTokens = this.tokenize(error.context || '');
    
    const messageFeatures: Record<string, number> = {};
    messageTokens.forEach(token => {
      messageFeatures[token] = (messageFeatures[token] || 0) + 1;
    });
    
    const contextFeatures: Record<string, number> = {};
    contextTokens.forEach(token => {
      contextFeatures[token] = (contextFeatures[token] || 0) + 1;
    });
    
    // Update vocabulary
    messageTokens.forEach(token => this.vocabulary.add(token));
    contextTokens.forEach(token => this.vocabulary.add(token));
    
    // Extract file path components
    const filePath = error.file_path || '';
    const filePathComponents = filePath.split(/[\/\\]/).filter(Boolean);
    
    return {
      errorCode: error.code || '',
      errorCategory: error.category || 'unknown',
      errorSeverity: error.severity || 'medium',
      messageFeatures,
      contextFeatures,
      filePathComponents,
      dependenciesCount: error.dependencies?.length || 0,
      fileSize: error.file_size || 0
    };
  }

  /**
   * Train the model on historical data
   */
  public async train(options?: { batchSize?: number, iterations?: number }): Promise<ModelPerformance> {
    if (!this.initialized) {
      await this.initialize();
    }

    const batchSize = options?.batchSize || 100;
    const iterations = options?.iterations || 1;
    
    try {
      // Get historical fix data in batches
      let offset = 0;
      let trainingSamples: TrainingSample[] = [];
      
      while (true) {
        const results = await db.select({
          errorId: errorFixes.error_id,
          fixId: errorFixes.id,
          strategyId: errorFixes.strategy_id,
          success: errorFixes.success,
          errorCategory: sql`(SELECT category FROM typescript_errors WHERE id = ${errorFixes.error_id})`,
          errorSeverity: sql`(SELECT severity FROM typescript_errors WHERE id = ${errorFixes.error_id})`,
          errorCode: sql`(SELECT code FROM typescript_errors WHERE id = ${errorFixes.error_id})`,
          errorMessage: sql`(SELECT message FROM typescript_errors WHERE id = ${errorFixes.error_id})`,
          errorContext: sql`(SELECT context FROM typescript_errors WHERE id = ${errorFixes.error_id})`,
          filePath: sql`(SELECT file_path FROM typescript_errors WHERE id = ${errorFixes.error_id})`
        })
        .from(errorFixes)
        .where(sql`${errorFixes.strategy_id} IS NOT NULL`)
        .limit(batchSize)
        .offset(offset);
        
        if (results.length === 0) {
          break;
        }
        
        // Process results
        for (const result of results) {
          if (!result.strategyId || !result.errorCode) continue;
          
          const features = await this.extractFeatures({
            code: result.errorCode,
            message: result.errorMessage,
            context: result.errorContext,
            file_path: result.filePath,
            category: result.errorCategory,
            severity: result.errorSeverity
          });
          
          trainingSamples.push({
            errorFeatures: features,
            successfulStrategy: result.strategyId,
            fixId: result.fixId,
            outcome: result.success ? 'success' : 'failure'
          });
        }
        
        offset += batchSize;
      }
      
      logger.info(`Training model on ${trainingSamples.length} samples for ${iterations} iterations`);
      
      if (trainingSamples.length === 0) {
        return {
          accuracy: 0,
          precision: 0,
          recall: 0,
          f1Score: 0,
          confusionMatrix: {},
          dataPoints: 0
        };
      }
      
      // Simple model training - placeholder for more sophisticated algorithms
      this.trainSimpleModel(trainingSamples, iterations);
      
      // Save the model
      await this.saveModel();
      
      // Calculate model performance
      const performance = this.evaluateModel(trainingSamples);
      logger.info(`Model training complete. Accuracy: ${performance.accuracy.toFixed(2)}`);
      
      return performance;
    } catch (error) {
      logger.error(`Model training failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Train a simple model based on historical data
   * This is a placeholder for more sophisticated algorithms
   */
  private trainSimpleModel(samples: TrainingSample[], iterations: number): void {
    // Initialize strategy data
    const strategyData: Record<string, {
      errorCodes: Record<string, { success: number, total: number }>,
      messageFeatures: Record<string, number>,
      contextFeatures: Record<string, number>,
      categories: Record<string, { success: number, total: number }>,
      severities: Record<string, { success: number, total: number }>,
      successRate: number
    }> = {};
    
    // Process training samples
    for (let iter = 0; iter < iterations; iter++) {
      for (const sample of samples) {
        const { errorFeatures, successfulStrategy, outcome } = sample;
        
        // Initialize strategy data if needed
        if (!strategyData[successfulStrategy]) {
          strategyData[successfulStrategy] = {
            errorCodes: {},
            messageFeatures: {},
            contextFeatures: {},
            categories: {},
            severities: {},
            successRate: 0
          };
        }
        
        // Update error code statistics
        if (!strategyData[successfulStrategy].errorCodes[errorFeatures.errorCode]) {
          strategyData[successfulStrategy].errorCodes[errorFeatures.errorCode] = { success: 0, total: 0 };
        }
        
        strategyData[successfulStrategy].errorCodes[errorFeatures.errorCode].total++;
        if (outcome === 'success') {
          strategyData[successfulStrategy].errorCodes[errorFeatures.errorCode].success++;
        }
        
        // Update category statistics
        if (!strategyData[successfulStrategy].categories[errorFeatures.errorCategory]) {
          strategyData[successfulStrategy].categories[errorFeatures.errorCategory] = { success: 0, total: 0 };
        }
        
        strategyData[successfulStrategy].categories[errorFeatures.errorCategory].total++;
        if (outcome === 'success') {
          strategyData[successfulStrategy].categories[errorFeatures.errorCategory].success++;
        }
        
        // Update severity statistics
        if (!strategyData[successfulStrategy].severities[errorFeatures.errorSeverity]) {
          strategyData[successfulStrategy].severities[errorFeatures.errorSeverity] = { success: 0, total: 0 };
        }
        
        strategyData[successfulStrategy].severities[errorFeatures.errorSeverity].total++;
        if (outcome === 'success') {
          strategyData[successfulStrategy].severities[errorFeatures.errorSeverity].success++;
        }
        
        // Update feature weights
        if (outcome === 'success') {
          // Only update feature weights for successful outcomes
          Object.entries(errorFeatures.messageFeatures).forEach(([feature, count]) => {
            strategyData[successfulStrategy].messageFeatures[feature] = 
              (strategyData[successfulStrategy].messageFeatures[feature] || 0) + count;
          });
          
          Object.entries(errorFeatures.contextFeatures).forEach(([feature, count]) => {
            strategyData[successfulStrategy].contextFeatures[feature] = 
              (strategyData[successfulStrategy].contextFeatures[feature] || 0) + count;
          });
        }
      }
    }
    
    // Calculate success rates
    Object.keys(strategyData).forEach(strategyId => {
      let totalSuccess = 0;
      let totalAttempts = 0;
      
      Object.values(strategyData[strategyId].errorCodes).forEach(stats => {
        totalSuccess += stats.success;
        totalAttempts += stats.total;
      });
      
      strategyData[strategyId].successRate = totalAttempts > 0 ? 
        totalSuccess / totalAttempts : 0;
    });
    
    // Update the model
    this.model.strategies = strategyData;
    this.model.trainingIterations += iterations;
    this.model.lastUpdated = new Date().toISOString();
    
    // Calculate feature importance
    this.calculateFeatureImportance();
  }

  /**
   * Calculate the importance of different features
   */
  private calculateFeatureImportance(): void {
    this.featureImportance.clear();
    
    // For each strategy
    Object.values(this.model.strategies).forEach((strategyData: any) => {
      // Message features
      Object.entries(strategyData.messageFeatures).forEach(([feature, weight]) => {
        this.featureImportance.set(
          feature, 
          (this.featureImportance.get(feature) || 0) + Number(weight)
        );
      });
      
      // Context features
      Object.entries(strategyData.contextFeatures).forEach(([feature, weight]) => {
        this.featureImportance.set(
          feature, 
          (this.featureImportance.get(feature) || 0) + Number(weight) * 0.5 // Less weight for context
        );
      });
    });
    
    // Normalize feature importance
    const maxImportance = Math.max(...this.featureImportance.values());
    if (maxImportance > 0) {
      for (const [feature, importance] of this.featureImportance.entries()) {
        this.featureImportance.set(feature, importance / maxImportance);
      }
    }
  }

  /**
   * Save the trained model to disk
   */
  private async saveModel(): Promise<void> {
    try {
      // Ensure directory exists
      const modelDir = path.dirname(this.modelPath);
      if (!fs.existsSync(modelDir)) {
        fs.mkdirSync(modelDir, { recursive: true });
      }
      
      // Save model
      fs.writeFileSync(this.modelPath, JSON.stringify(this.model, null, 2));
      
      // Save vocabulary
      fs.writeFileSync(this.vocabularyPath, JSON.stringify([...this.vocabulary], null, 2));
      
      logger.info(`Model saved to ${this.modelPath}`);
    } catch (error) {
      logger.error(`Failed to save model: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Evaluate model performance
   */
  private evaluateModel(samples: TrainingSample[]): ModelPerformance {
    if (samples.length === 0) {
      return {
        accuracy: 0,
        precision: 0,
        recall: 0,
        f1Score: 0,
        confusionMatrix: {},
        dataPoints: 0
      };
    }
    
    let correctPredictions = 0;
    const confusionMatrix: Record<string, Record<string, number>> = {};
    const strategyCounts: Record<string, { tp: number, fp: number, fn: number }> = {};
    
    // Initialize confusion matrix
    const uniqueStrategies = new Set<string>();
    samples.forEach(sample => uniqueStrategies.add(sample.successfulStrategy));
    
    uniqueStrategies.forEach(strategy => {
      confusionMatrix[strategy] = {};
      uniqueStrategies.forEach(innerStrategy => {
        confusionMatrix[strategy][innerStrategy] = 0;
      });
      
      strategyCounts[strategy] = { tp: 0, fp: 0, fn: 0 };
    });
    
    // Test model on each sample
    for (const sample of samples) {
      // Very simple prediction logic for evaluation
      // This would be replaced by the actual prediction model
      const features = sample.errorFeatures;
      const availableStrategies = Array.from(uniqueStrategies);
      
      // Make prediction using simplified model
      let bestStrategy = '';
      let bestScore = -1;
      
      for (const strategyId of availableStrategies) {
        const strategyData = this.model.strategies[strategyId];
        if (!strategyData) continue;
        
        let score = 0;
        
        // Score based on error code
        const errorCodeStats = strategyData.errorCodes[features.errorCode];
        if (errorCodeStats && errorCodeStats.total > 0) {
          score += 0.4 * (errorCodeStats.success / errorCodeStats.total);
        }
        
        // Score based on category
        const categoryStats = strategyData.categories[features.errorCategory];
        if (categoryStats && categoryStats.total > 0) {
          score += 0.3 * (categoryStats.success / categoryStats.total);
        }
        
        // Score based on severity
        const severityStats = strategyData.severities[features.errorSeverity];
        if (severityStats && severityStats.total > 0) {
          score += 0.1 * (severityStats.success / severityStats.total);
        }
        
        // Score based on message features
        let featureScore = 0;
        let featureCount = 0;
        
        Object.entries(features.messageFeatures).forEach(([feature, count]) => {
          if (strategyData.messageFeatures[feature]) {
            featureScore += count * strategyData.messageFeatures[feature];
            featureCount += count;
          }
        });
        
        if (featureCount > 0) {
          score += 0.2 * (featureScore / featureCount);
        }
        
        // Update best strategy
        if (score > bestScore) {
          bestScore = score;
          bestStrategy = strategyId;
        }
      }
      
      // Update confusion matrix and counts
      confusionMatrix[sample.successfulStrategy][bestStrategy]++;
      
      if (bestStrategy === sample.successfulStrategy) {
        correctPredictions++;
        strategyCounts[bestStrategy].tp++;
      } else {
        strategyCounts[bestStrategy].fp++;
        strategyCounts[sample.successfulStrategy].fn++;
      }
    }
    
    // Calculate metrics
    const accuracy = samples.length > 0 ? correctPredictions / samples.length : 0;
    
    let totalPrecision = 0;
    let totalRecall = 0;
    let strategyCount = 0;
    
    Object.entries(strategyCounts).forEach(([strategy, counts]) => {
      const precision = counts.tp + counts.fp > 0 ? counts.tp / (counts.tp + counts.fp) : 0;
      const recall = counts.tp + counts.fn > 0 ? counts.tp / (counts.tp + counts.fn) : 0;
      
      totalPrecision += precision;
      totalRecall += recall;
      strategyCount++;
    });
    
    const avgPrecision = strategyCount > 0 ? totalPrecision / strategyCount : 0;
    const avgRecall = strategyCount > 0 ? totalRecall / strategyCount : 0;
    const f1Score = avgPrecision + avgRecall > 0 ? 
      2 * (avgPrecision * avgRecall) / (avgPrecision + avgRecall) : 0;
    
    return {
      accuracy,
      precision: avgPrecision,
      recall: avgRecall,
      f1Score,
      confusionMatrix,
      dataPoints: samples.length
    };
  }

  /**
   * Update the model based on fix outcome
   */
  public async recordFixOutcome(
    errorId: number, 
    fixId: number, 
    strategyId: string, 
    outcome: 'success' | 'partial' | 'failure'
  ): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      // Get error details
      const [error] = await db.select().from(typeScriptErrors).where(eq(typeScriptErrors.id, errorId));
      
      if (!error) {
        logger.warn(`Cannot record fix outcome: Error ${errorId} not found`);
        return;
      }
      
      // Extract features
      const features = await this.extractFeatures(error);
      
      // Create training sample
      const sample: TrainingSample = {
        errorFeatures: features,
        successfulStrategy: strategyId,
        fixId,
        outcome
      };
      
      // Update model with this single sample
      this.updateModelWithSample(sample);
      
      // Save every 10 updates (to prevent too frequent disk writes)
      if (this.model.trainingIterations % 10 === 0) {
        await this.saveModel();
      }
      
      logger.info(`Recorded fix outcome for error ${errorId} with strategy ${strategyId}: ${outcome}`);
    } catch (error) {
      logger.error(`Failed to record fix outcome: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Update the model with a single sample
   */
  private updateModelWithSample(sample: TrainingSample): void {
    const { errorFeatures, successfulStrategy, outcome } = sample;
    
    // Initialize strategy data if needed
    if (!this.model.strategies[successfulStrategy]) {
      this.model.strategies[successfulStrategy] = {
        errorCodes: {},
        messageFeatures: {},
        contextFeatures: {},
        categories: {},
        severities: {},
        successRate: 0
      };
    }
    
    const strategyData = this.model.strategies[successfulStrategy];
    
    // Update error code statistics
    if (!strategyData.errorCodes[errorFeatures.errorCode]) {
      strategyData.errorCodes[errorFeatures.errorCode] = { success: 0, total: 0 };
    }
    
    strategyData.errorCodes[errorFeatures.errorCode].total++;
    if (outcome === 'success') {
      strategyData.errorCodes[errorFeatures.errorCode].success++;
    }
    
    // Update category statistics
    if (!strategyData.categories[errorFeatures.errorCategory]) {
      strategyData.categories[errorFeatures.errorCategory] = { success: 0, total: 0 };
    }
    
    strategyData.categories[errorFeatures.errorCategory].total++;
    if (outcome === 'success') {
      strategyData.categories[errorFeatures.errorCategory].success++;
    }
    
    // Update severity statistics
    if (!strategyData.severities[errorFeatures.errorSeverity]) {
      strategyData.severities[errorFeatures.errorSeverity] = { success: 0, total: 0 };
    }
    
    strategyData.severities[errorFeatures.errorSeverity].total++;
    if (outcome === 'success') {
      strategyData.severities[errorFeatures.errorSeverity].success++;
    }
    
    // Update feature weights
    if (outcome === 'success') {
      // Only update feature weights for successful outcomes
      Object.entries(errorFeatures.messageFeatures).forEach(([feature, count]) => {
        strategyData.messageFeatures[feature] = 
          (strategyData.messageFeatures[feature] || 0) + count;
      });
      
      Object.entries(errorFeatures.contextFeatures).forEach(([feature, count]) => {
        strategyData.contextFeatures[feature] = 
          (strategyData.contextFeatures[feature] || 0) + count;
      });
    }
    
    // Recalculate success rate
    let totalSuccess = 0;
    let totalAttempts = 0;
    
    Object.values(strategyData.errorCodes).forEach(stats => {
      totalSuccess += stats.success;
      totalAttempts += stats.total;
    });
    
    strategyData.successRate = totalAttempts > 0 ? 
      totalSuccess / totalAttempts : 0;
    
    this.model.trainingIterations++;
    this.model.lastUpdated = new Date().toISOString();
  }

  /**
   * Calculate base score for a strategy based on features
   */
  private calculateStrategyBaseScore(strategyId: string, features: ErrorFeatures): number {
    const strategyData = this.model.strategies[strategyId];
    if (!strategyData) return 0.2; // Default score for unknown strategy
    
    let score = 0;
    
    // Score based on error code
    const errorCodeStats = strategyData.errorCodes[features.errorCode];
    if (errorCodeStats && errorCodeStats.total > 0) {
      score += 0.4 * (errorCodeStats.success / errorCodeStats.total);
    }
    
    // Score based on category
    const categoryStats = strategyData.categories[features.errorCategory];
    if (categoryStats && categoryStats.total > 0) {
      score += 0.3 * (categoryStats.success / categoryStats.total);
    }
    
    // Score based on severity
    const severityStats = strategyData.severities[features.errorSeverity];
    if (severityStats && severityStats.total > 0) {
      score += 0.1 * (severityStats.success / severityStats.total);
    }
    
    // Score based on overall success rate
    score += 0.2 * (strategyData.successRate || 0);
    
    return score;
  }

  /**
   * Calculate boost based on historical performance for error code
   */
  private calculateHistoryBoost(strategyId: string, errorCode: string): number {
    const strategyData = this.model.strategies[strategyId];
    if (!strategyData) return 0;
    
    const errorCodeStats = strategyData.errorCodes[errorCode];
    if (errorCodeStats && errorCodeStats.total > 2) {
      return errorCodeStats.success / errorCodeStats.total;
    }
    
    return 0.1; // Default boost for strategies without history
  }

  /**
   * Calculate similarity score based on features
   */
  private calculateSimilarityScore(strategyId: string, features: ErrorFeatures): number {
    const strategyData = this.model.strategies[strategyId];
    if (!strategyData) return 0;
    
    let featureScore = 0;
    let featureCount = 0;
    
    // Message features similarity
    Object.entries(features.messageFeatures).forEach(([feature, count]) => {
      if (strategyData.messageFeatures[feature]) {
        featureScore += count * strategyData.messageFeatures[feature];
        featureCount += count;
      }
    });
    
    // Context features similarity (with lower weight)
    Object.entries(features.contextFeatures).forEach(([feature, count]) => {
      if (strategyData.contextFeatures[feature]) {
        featureScore += count * strategyData.contextFeatures[feature] * 0.5;
        featureCount += count * 0.5;
      }
    });
    
    return featureCount > 0 ? featureScore / featureCount : 0;
  }

  /**
   * Generate reasons for the strategy prediction
   */
  private generateReasons(strategyId: string, features: ErrorFeatures): string[] {
    const reasons: string[] = [];
    const strategyData = this.model.strategies[strategyId];
    
    if (!strategyData) {
      return ['Using default strategy due to lack of historical data.'];
    }
    
    // Check error code history
    const errorCodeStats = strategyData.errorCodes[features.errorCode];
    if (errorCodeStats && errorCodeStats.total > 0) {
      const successRate = errorCodeStats.success / errorCodeStats.total;
      if (successRate > 0.7) {
        reasons.push(`This strategy has a ${(successRate * 100).toFixed(0)}% success rate for error code ${features.errorCode}.`);
      }
    }
    
    // Check category effectiveness
    const categoryStats = strategyData.categories[features.errorCategory];
    if (categoryStats && categoryStats.total > 0) {
      const successRate = categoryStats.success / categoryStats.total;
      if (successRate > 0.6) {
        reasons.push(`This strategy works well for ${features.errorCategory} errors (${(successRate * 100).toFixed(0)}% success).`);
      }
    }
    
    // Add message feature matches if significant
    const messageFeatures = Object.entries(features.messageFeatures)
      .filter(([feature]) => strategyData.messageFeatures[feature])
      .sort(([featureA, _], [featureB, __]) => {
        const importanceA = this.featureImportance.get(featureA) || 0;
        const importanceB = this.featureImportance.get(featureB) || 0;
        return importanceB - importanceA;
      })
      .slice(0, 2); // Get top 2 features
    
    if (messageFeatures.length > 0) {
      const featureList = messageFeatures.map(([feature]) => `"${feature}"`).join(', ');
      reasons.push(`Error message contains key terms (${featureList}) that this strategy handles well.`);
    }
    
    // Add overall strategy success rate
    if (strategyData.successRate > 0) {
      reasons.push(`This strategy has an overall success rate of ${(strategyData.successRate * 100).toFixed(0)}%.`);
    }
    
    // If no specific reasons found
    if (reasons.length === 0) {
      reasons.push('This strategy is the best match based on combined features and historical performance.');
    }
    
    return reasons;
  }

  /**
   * Get fallback strategy with highest success rate
   */
  private getFallbackStrategy(availableStrategies: string[]): string {
    // Find strategy with highest success rate
    let bestStrategy = availableStrategies[0];
    let bestSuccessRate = 0;
    
    for (const strategyId of availableStrategies) {
      const rateData = this.strategySuccessRates.get(strategyId);
      if (rateData && rateData.total > 0) {
        const successRate = rateData.success / rateData.total;
        if (successRate > bestSuccessRate) {
          bestSuccessRate = successRate;
          bestStrategy = strategyId;
        }
      }
    }
    
    return bestStrategy;
  }

  /**
   * Tokenize a string into terms
   */
  private tokenize(text: string): string[] {
    // Simple tokenization by splitting on non-alphanumeric and converting to lowercase
    // This would be replaced by more sophisticated NLP techniques in a real implementation
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 2); // Remove very short tokens
  }
}

// Export a singleton instance
export const mlStrategyPredictor = new MLStrategyPredictor();