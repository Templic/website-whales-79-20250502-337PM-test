/**
 * ValidationAIConnector
 * 
 * This connector integrates the SecurityAnalysisService with the validation pipeline,
 * transforming security analysis results into validation results based on configurable thresholds.
 */

import { securityAnalysisService, SecurityAnalysisOptions, SecurityAnalysisResult, PotentialThreat } from './SecurityAnalysisService';
import { securityConfig } from '../config/SecurityConfig';
import secureLog from '../../utils/secureLogger';
import { ValidationErrorCategory, ValidationErrorSeverity } from '../error/ValidationErrorCategory';

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
    this.isEnabled = securityConfig.isFeatureEnabled('aiSecurity');
    this.defaultThreshold = securityConfig.getFeatureValueAsNumber('aiSecurity') > 1 ? 
                           securityConfig.getFeatureValueAsNumber('aiSecurity') / 100 : 0.7;
    this.performancePriority = securityConfig.isFeatureEnabled('performancePriority');
    
    // Log initialization
    secureLog('info', 'ValidationAIConnector', `Initialized with threshold=${this.defaultThreshold}, enabled=${this.isEnabled}`);
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
        sensitivityLevel: options.detailedAnalysis ? 'high' : 'medium',
        timeoutMs: this.performancePriority ? 1000 : options.maxResponseTime, // 1-second limit in performance mode
        includeContext: true,
        maxTokens: 1000
      };
      
      // Create context for data analysis
      const context = {
        path: `/api/validation/${options.contentType}`,
        method: 'POST',
        metadata: {
          contentType: options.contentType,
          timestamp: new Date().toISOString()
        }
      };
      
      // Run the security analysis
      const analysisResult = await securityAnalysisService.analyzeData(content, context, analysisOptions);
      
      // Map the security analysis result to a validation result
      const validationResult = this.mapToValidationResult(analysisResult, options);
      
      // Calculate processing time
      const processingTime = Date.now() - startTime;
      
      // Add processing time to the result
      if (validationResult.metadata) {
        validationResult.metadata.processingTime = processingTime;
      }
      
      // Log the validation result
      secureLog('info', 'ValidationAIConnector', 
        `Validation ${validationResult.validationId}: passed=${validationResult.passed}, score=${validationResult.securityScore}, warnings=${validationResult.warnings.length}`);
      
      return validationResult;
    } catch (error) {
      // Log the error
      secureLog('error', 'ValidationAIConnector', `Validation failed: ${error instanceof Error ? error.message : String(error)}`);
      
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
    
    // Extract warnings from potential threats
    const warnings = analysisResult.potentialThreats.map(threat => 
      `[${threat.severity.toUpperCase()}] ${threat.description} (${Math.round(threat.confidence * 100)}% confidence)`
    );
    
    // Extract recommendations based on potential threats
    const recommendations = options.includeRecommendations
      ? analysisResult.potentialThreats
          .filter(threat => threat.suggestedAction)
          .map(threat => `[${threat.severity.toUpperCase()}] ${threat.suggestedAction}`)
      : undefined;
    
    // Determine if the validation passed
    // In strict mode, any detected threats will fail validation
    // Otherwise, use the risk score compared to the threshold (convert 0-100 scale to 0-1)
    const normalizedScore = analysisResult.riskScore / 100;
    const inverted = 1 - normalizedScore; // Invert because high risk means low security
    const passed = options.strictMode 
      ? analysisResult.potentialThreats.length === 0
      : inverted >= threshold;
    
    // Create the validation result
    return {
      passed,
      validationId: `vai_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`,
      securityScore: inverted, // Use the inverted risk score as security score (0-1)
      warnings,
      recommendations,
      timestamp: new Date().toISOString(),
      metadata: {
        processingTime: analysisResult.processingTimeMs,
        aiModel: "gpt-4o" // the newest OpenAI model used
      }
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