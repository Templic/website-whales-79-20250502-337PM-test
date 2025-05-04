/**
 * ValidationAIConnector
 * 
 * This connector integrates the SecurityAnalysisService with the validation pipeline,
 * transforming security analysis results into validation results based on configurable thresholds.
 */

import { securityAnalysisService, SecurityAnalysisOptions, SecurityAnalysisResult } from './SecurityAnalysisService';
import { securityConfig } from '../config/SecurityConfig';
import secureLogger from '../../utils/secureLogger';

export interface ValidationAIResult {
  passed: boolean;
  validationId: string;
  securityScore: number;
  warnings: string[];
  recommendations?: string[];
  timestamp: string;
  metadata?: {
    processingTime: number;
    aiModel: string;
  };
}

export interface ValidationAIOptions {
  contentType: 'api' | 'user-content' | 'code' | 'database-query';
  detailedAnalysis?: boolean;
  includeRecommendations?: boolean;
  threshold?: number; // override default threshold (0 to 1)
  maxResponseTime?: number; // ms
  strictMode?: boolean; // if true, any detected threats fail validation
}

/**
 * ValidationAIConnector class
 */
export class ValidationAIConnector {
  private defaultThreshold: number;
  private isEnabled: boolean;
  private performancePriority: boolean;
  
  constructor() {
    // Get configuration from security config
    const features = securityConfig.getSecurityFeatures();
    this.isEnabled = features.aiSecurityAnalysis;
    this.defaultThreshold = features.aiValidationThreshold || 0.7;
    this.performancePriority = features.performancePriority || false;
    
    // Log initialization
    secureLogger('info', 'ValidationAIConnector', `Initialized with threshold=${this.defaultThreshold}, enabled=${this.isEnabled}`);
  }
  
  /**
   * Validate content using AI security analysis
   */
  public async validate(
    content: any,
    options: ValidationAIOptions
  ): Promise<ValidationAIResult> {
    const startTime = Date.now();
    
    try {
      // Early return if AI validation is disabled
      if (!this.isEnabled) {
        return this.createFallbackResult('ai_disabled');
      }
      
      // Set up security analysis options
      const analysisOptions: SecurityAnalysisOptions = {
        contentType: options.contentType,
        detailedAnalysis: options.detailedAnalysis,
        includeRecommendations: options.includeRecommendations,
        maxResponseTime: this.performancePriority ? 1000 : options.maxResponseTime // 1-second limit in performance mode
      };
      
      // Run the security analysis
      const analysisResult = await securityAnalysisService.analyzeContent(content, analysisOptions);
      
      // Map the security analysis result to a validation result
      const validationResult = this.mapToValidationResult(analysisResult, options);
      
      // Calculate processing time
      const processingTime = Date.now() - startTime;
      
      // Add processing time to the result
      if (validationResult.metadata) {
        validationResult.metadata.processingTime = processingTime;
      }
      
      // Log the validation result
      secureLogger('info', 'ValidationAIConnector', 
        `Validation ${validationResult.validationId}: passed=${validationResult.passed}, score=${validationResult.securityScore}, warnings=${validationResult.warnings.length}`);
      
      return validationResult;
    } catch (error) {
      // Log the error
      secureLogger('error', 'ValidationAIConnector', `Validation failed: ${error instanceof Error ? error.message : String(error)}`);
      
      // Return a fallback result
      return this.createFallbackResult('error', error instanceof Error ? error.message : String(error));
    }
  }
  
  /**
   * Map a security analysis result to a validation result
   */
  private mapToValidationResult(
    analysisResult: SecurityAnalysisResult,
    options: ValidationAIOptions
  ): ValidationAIResult {
    // Determine the threshold to use (options override default)
    const threshold = options.threshold !== undefined 
      ? options.threshold 
      : this.defaultThreshold;
    
    // Extract warnings from detected threats
    const warnings = analysisResult.detectedThreats.map(threat => 
      `[${threat.severity.toUpperCase()}] ${threat.description} (${Math.round(threat.confidence * 100)}% confidence)`
    );
    
    // Extract recommendations if available and requested
    const recommendations = options.includeRecommendations && analysisResult.recommendations
      ? analysisResult.recommendations.map(rec => `[${rec.priority.toUpperCase()}] ${rec.description}`)
      : undefined;
    
    // Determine if the validation passed
    // In strict mode, any detected threats will fail validation
    // Otherwise, use the security score compared to the threshold
    const passed = options.strictMode 
      ? analysisResult.detectedThreats.length === 0
      : analysisResult.securityScore >= threshold;
    
    // Create the validation result
    return {
      passed,
      validationId: analysisResult.analysisId,
      securityScore: analysisResult.securityScore,
      warnings,
      recommendations,
      timestamp: analysisResult.timestamp,
      metadata: analysisResult.metadata ? {
        processingTime: analysisResult.metadata.processingTime,
        aiModel: analysisResult.metadata.model
      } : undefined
    };
  }
  
  /**
   * Create a fallback validation result
   */
  private createFallbackResult(
    reason: 'ai_disabled' | 'error' | 'timeout',
    errorMessage?: string
  ): ValidationAIResult {
    const validationId = `vai_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
    
    // Default to passing validation in fallback mode
    // This ensures system availability when AI is unavailable
    const result: ValidationAIResult = {
      passed: true,
      validationId,
      securityScore: 0.5, // Neutral score for fallback
      warnings: [],
      timestamp: new Date().toISOString(),
      metadata: {
        processingTime: 0,
        aiModel: 'fallback'
      }
    };
    
    // Add appropriate warnings based on reason
    if (reason === 'ai_disabled') {
      result.warnings.push('[INFO] AI validation is disabled. Using fallback validation.');
    } else if (reason === 'error') {
      result.warnings.push('[WARNING] AI validation encountered an error. Using fallback validation.');
      if (errorMessage) {
        result.warnings.push(`[ERROR] ${errorMessage}`);
      }
    } else if (reason === 'timeout') {
      result.warnings.push('[WARNING] AI validation timed out. Using fallback validation.');
    }
    
    return result;
  }
}

// Export a singleton instance
export const validationAIConnector = new ValidationAIConnector();