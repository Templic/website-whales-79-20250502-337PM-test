/**
 * ValidationAIConnector
 * 
 * This module connects the API Validation system with the AI-powered Security Analysis service,
 * allowing for AI-enhanced validation of API requests. It transforms security analysis results
 * into validation results that can be used by the API validation middleware.
 */

import { SecurityAnalysisService, SecurityContentType, SecurityAnalysisResult, SecuritySeverity } from './SecurityAnalysisService';
import { securityAnalysisService } from './SecurityAnalysisService';
import { log } from '../../utils/secureLogger';

// Define the interface for validation results
export interface ValidationError {
  rule: string;
  message: string;
  code?: string;
  severity: 'error' | 'warning' | 'info';
  path: string;
  context?: Record<string, any>;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  metadata?: Record<string, any>;
}

// Define validation rule interface
export interface ValidationRule {
  name: string;
  description: string;
  validate: (payload: any, context?: any) => Promise<ValidationResult>;
}

/**
 * Maps security severity to validation severity
 */
const securityToValidationSeverity: Record<string, 'error' | 'warning' | 'info'> = {
  'critical': 'error',
  'high': 'error',
  'medium': 'warning',
  'low': 'info',
  'info': 'info'
};

/**
 * Configuration options for AI validation
 */
export interface AIValidationOptions {
  /** Threshold for security severity that should trigger a validation failure */
  errorThreshold?: 'critical' | 'high' | 'medium' | 'low';
  /** Threshold for security severity that should trigger a validation warning */
  warningThreshold?: 'high' | 'medium' | 'low' | 'info';
  /** Whether to include detailed analysis in the validation result */
  includeDetails?: boolean;
  /** Maximum response time for AI validation in milliseconds */
  timeoutMs?: number;
  /** User ID associated with the validation request */
  userId?: string | number;
}

/**
 * Default options for AI validation
 */
const defaultOptions: AIValidationOptions = {
  errorThreshold: 'high',
  warningThreshold: 'medium',
  includeDetails: true,
  timeoutMs: 5000,
};

/**
 * ValidationAIConnector class
 * 
 * Provides a bridge between the API validation system and the AI-powered security analysis
 */
export class ValidationAIConnector {
  private static instance: ValidationAIConnector;
  private securityService: SecurityAnalysisService;

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
    this.securityService = securityAnalysisService;
    log('ValidationAIConnector initialized', 'info');
  }

  /**
   * Validate a request payload using AI security analysis
   * 
   * @param payload Request payload to validate
   * @param contentType Type of content to validate
   * @param context Additional context about the request
   * @param options Validation options
   * @returns Validation result
   */
  public async validateRequest(
    payload: any,
    contentType: SecurityContentType = 'api',
    context: string = '',
    options: AIValidationOptions = {}
  ): Promise<ValidationResult> {
    const opts = { ...defaultOptions, ...options };
    const startTime = Date.now();

    try {
      // Convert payload to string for analysis
      const content = typeof payload === 'string' 
        ? payload 
        : JSON.stringify(payload, null, 2);

      // Analyze the payload
      const analysisResult = await this.securityService.analyzeContent(
        content,
        contentType,
        context,
        {
          detailedAnalysis: opts.includeDetails,
          userId: opts.userId
        }
      );

      // Check if we've exceeded the timeout
      if (opts.timeoutMs && Date.now() - startTime > opts.timeoutMs) {
        log('AI validation timeout exceeded', 'warning');
        return this.createTimeoutResult(opts.timeoutMs);
      }

      // Transform the security analysis result into a validation result
      return this.transformAnalysisToValidationResult(analysisResult, opts);
    } catch (error: any) {
      log(`Error during AI validation: ${error.message}`, 'error');
      return {
        valid: true, // Fail open on error
        errors: [],
        warnings: [
          {
            rule: 'ai-validation',
            message: `AI validation failed: ${error.message}`,
            severity: 'warning',
            path: '',
            context: { error: error.message }
          }
        ],
        metadata: {
          aiValidationError: true,
          errorMessage: error.message,
          processingTimeMs: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Transform a security analysis result into a validation result
   * 
   * @param analysis Security analysis result
   * @param options Validation options
   * @returns Validation result
   */
  private transformAnalysisToValidationResult(
    analysis: SecurityAnalysisResult,
    options: AIValidationOptions
  ): ValidationResult {
    // Define severity thresholds
    const errorThresholds = this.getSeverityThresholds(options.errorThreshold || 'high');
    const warningThresholds = this.getSeverityThresholds(options.warningThreshold || 'medium');

    // Extract issues that meet the error threshold
    const errors = analysis.issues
      .filter(issue => errorThresholds.includes(issue.severity))
      .map(issue => ({
        rule: 'ai-security',
        message: issue.title,
        severity: 'error',
        path: issue.location || '',
        context: {
          description: issue.description,
          severity: issue.severity,
          remediation: issue.remediation,
          potentialImpact: issue.potentialImpact
        }
      }));

    // Extract issues that meet the warning threshold but not the error threshold
    const warnings = analysis.issues
      .filter(issue => 
        warningThresholds.includes(issue.severity) && 
        !errorThresholds.includes(issue.severity)
      )
      .map(issue => ({
        rule: 'ai-security',
        message: issue.title,
        severity: 'warning',
        path: issue.location || '',
        context: {
          description: issue.description,
          severity: issue.severity,
          remediation: issue.remediation,
          potentialImpact: issue.potentialImpact
        }
      }));

    // Determine if the request is valid (no errors)
    const valid = errors.length === 0;

    return {
      valid,
      errors,
      warnings,
      metadata: {
        aiValidation: true,
        summary: analysis.summary,
        riskScore: analysis.metrics.riskScore,
        criticalCount: analysis.metrics.criticalCount,
        highCount: analysis.metrics.highCount,
        mediumCount: analysis.metrics.mediumCount,
        lowCount: analysis.metrics.lowCount,
        infoCount: analysis.metrics.infoCount,
        totalIssues: analysis.metrics.totalIssues,
        recommendations: analysis.recommendations,
        model: analysis.model,
        processingTimeMs: analysis.processingTimeMs
      }
    };
  }

  /**
   * Get an array of severity levels based on a threshold
   * 
   * @param threshold Severity threshold
   * @returns Array of severity levels
   */
  private getSeverityThresholds(threshold: string): string[] {
    switch (threshold) {
      case 'critical':
        return ['critical'];
      case 'high':
        return ['critical', 'high'];
      case 'medium':
        return ['critical', 'high', 'medium'];
      case 'low':
        return ['critical', 'high', 'medium', 'low'];
      case 'info':
        return ['critical', 'high', 'medium', 'low', 'info'];
      default:
        return ['critical', 'high']; // Default to high threshold
    }
  }

  /**
   * Create a timeout validation result
   * 
   * @param timeoutMs Timeout in milliseconds
   * @returns Validation result for timeout
   */
  private createTimeoutResult(timeoutMs: number): ValidationResult {
    return {
      valid: true, // Fail open on timeout
      errors: [],
      warnings: [
        {
          rule: 'ai-validation',
          message: `AI validation timed out after ${timeoutMs}ms`,
          severity: 'warning',
          path: '',
          context: { timeout: timeoutMs }
        }
      ],
      metadata: {
        aiValidationTimeout: true,
        processingTimeMs: timeoutMs
      }
    };
  }

  /**
   * Create an AI-powered validation rule
   * 
   * @param options Validation options
   * @returns Validation rule
   */
  public createAIValidationRule(options: AIValidationOptions = {}): ValidationRule {
    return {
      name: 'ai-security-analysis',
      description: 'AI-powered security analysis for request payloads',
      validate: async (payload: any, context: any = {}) => {
        return this.validateRequest(
          payload,
          context.contentType || 'api',
          context.description || '',
          { ...options, userId: context.userId }
        );
      }
    };
  }
}

// Export singleton instance
export const validationAIConnector = ValidationAIConnector.getInstance();