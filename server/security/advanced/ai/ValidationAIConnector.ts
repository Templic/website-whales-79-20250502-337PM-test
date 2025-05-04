/**
 * Validation AI Connector
 * 
 * This module connects the ValidationEngine with the AI-powered SecurityAnalysisService,
 * enabling AI-enhanced security validation for complex validation scenarios.
 */

import { securityAnalysisService, SecurityContentType, SecurityAnalysisResult } from './SecurityAnalysisService';
import { ValidationResult, ValidationContext } from '../../advanced/apiValidation/types';
import { log } from '../../../utils/logger';

/**
 * AI Validation options
 */
export interface AIValidationOptions {
  maxTokens?: number;
  temperature?: number;
  detailedAnalysis?: boolean;
  contentType?: SecurityContentType;
  threshold?: number; // Minimum risk score to trigger validation failure
  userId?: string | number;
}

/**
 * Default options
 */
const defaultOptions: AIValidationOptions = {
  maxTokens: 1000,
  temperature: 0.2,
  detailedAnalysis: false,
  contentType: 'code',
  threshold: 5 // Default risk threshold (1 critical or 1 high + 1 medium)
};

/**
 * Validation AI Connector class
 */
export class ValidationAIConnector {
  private static instance: ValidationAIConnector;

  /**
   * Get singleton instance
   */
  public static getInstance(): ValidationAIConnector {
    if (!ValidationAIConnector.instance) {
      ValidationAIConnector.instance = new ValidationAIConnector();
    }
    return ValidationAIConnector.instance;
  }

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    log('ValidationAIConnector initialized', 'security');
  }

  /**
   * Validate content using AI security analysis
   * 
   * @param content Content to validate
   * @param context Validation context
   * @param options AI validation options
   * @returns Validation result
   */
  public async validateWithAI(
    content: string,
    context: ValidationContext,
    options: AIValidationOptions = {}
  ): Promise<ValidationResult> {
    try {
      // Merge with default options
      const mergedOptions = { ...defaultOptions, ...options };
      
      // Start timing
      const startTime = Date.now();
      
      // Convert validation context to context string for AI
      const contextString = this.formatContextForAI(context);
      
      // Call security analysis service
      const securityResult = await securityAnalysisService.analyzeContent(
        content,
        mergedOptions.contentType!,
        contextString,
        {
          maxTokens: mergedOptions.maxTokens,
          temperature: mergedOptions.temperature,
          detailedAnalysis: mergedOptions.detailedAnalysis,
          userId: mergedOptions.userId || context.userId
        }
      );
      
      // Calculate time taken
      const timeMs = Date.now() - startTime;
      
      // Transform security result to validation result
      return this.transformSecurityToValidationResult(securityResult, mergedOptions.threshold!, timeMs, context);
    } catch (error: any) {
      log(`Error in AI validation: ${error.message}`, 'error');
      
      // Return failed validation
      return {
        success: false,
        errors: [{
          code: 'AI_VALIDATION_ERROR',
          message: `AI validation failed: ${error.message}`,
          path: [],
          suggestion: 'Try again later or check AI service configuration'
        }],
        timeMs: 0,
        context
      };
    }
  }

  /**
   * Format validation context for AI
   * 
   * @param context Validation context
   * @returns Formatted context string
   */
  private formatContextForAI(context: ValidationContext): string {
    return `Request details:
- Path: ${context.path}
- Method: ${context.method}
- User ID: ${context.userId || 'Not authenticated'}
- Authenticated: ${context.isAuthenticated ? 'Yes' : 'No'}
- Roles: ${context.roles ? context.roles.join(', ') : 'None'}
- Permissions: ${context.permissions ? context.permissions.join(', ') : 'None'}
- IP Address: ${context.ip || 'Unknown'}
- Session ID: ${context.sessionId || 'None'}
- Timestamp: ${new Date(context.timestamp).toISOString()}
${context.additionalContext ? '- Additional context: ' + JSON.stringify(context.additionalContext) : ''}`;
  }

  /**
   * Transform security analysis result to validation result
   * 
   * @param securityResult Security analysis result
   * @param threshold Risk threshold
   * @param timeMs Processing time
   * @param context Validation context
   * @returns Validation result
   */
  private transformSecurityToValidationResult(
    securityResult: SecurityAnalysisResult,
    threshold: number,
    timeMs: number,
    context: ValidationContext
  ): ValidationResult {
    // Check if risk score exceeds threshold
    const exceedsThreshold = securityResult.metrics.riskScore >= threshold;
    
    // Transform issues to validation errors
    const errors = exceedsThreshold 
      ? securityResult.issues.map(issue => ({
          code: `SECURITY_${issue.severity.toUpperCase()}`,
          message: issue.title,
          path: issue.location ? [issue.location] : [],
          field: issue.location,
          value: issue.codeSnippet,
          suggestion: issue.remediation
        }))
      : [];
    
    return {
      success: !exceedsThreshold,
      errors: errors,
      timeMs,
      context
    };
  }
}

// Export singleton instance
export const validationAIConnector = ValidationAIConnector.getInstance();