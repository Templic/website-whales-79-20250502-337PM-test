/**
 * Validation Pipeline
 * 
 * This module provides a comprehensive pipeline for validating API requests,
 * combining schema validation, security checks, and AI-powered analysis.
 */

import { z } from 'zod';
import secureLogger from '../../utils/secureLogger';
import { ValidationErrorCategory, ValidationErrorSeverity, enhanceValidationError } from '../error/ValidationErrorCategory';
import { validationFallbackHandler } from '../fallback/ValidationFallbackHandler';
import { validationAlertSystem, AlertType } from '../notification/ValidationAlertSystem';
import { validationRuleVersioning } from '../versioning/ValidationRuleVersioning';
import { Request } from 'express';

// Configure component name for logging
const logComponent = 'ValidationPipeline';

// Validation pipeline hooks
export type ValidationHook<T> = (data: T, context: ValidationContext) => Promise<T | null>;

// Validation context
export interface ValidationContext {
  ruleId?: string;
  ruleVersion?: number;
  requestId: string;
  userId?: string | number;
  path: string;
  method: string;
  target: 'body' | 'query' | 'params' | 'headers' | 'file';
  timestamp: Date;
  metadata: Record<string, any>;
}

// Validation result
export interface ValidationResult<T = any> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
  metadata: {
    ruleId?: string;
    ruleVersion?: number;
    fallbackUsed: boolean;
    aiAnalysisPerformed: boolean;
    processingTimeMs: number;
  };
}

// Validation error
export interface ValidationError {
  message: string;
  path?: string | string[];
  code?: string;
  type: ValidationErrorCategory;
  severity: ValidationErrorSeverity;
  metadata?: Record<string, any>;
}

// Validation pipeline options
export interface ValidationPipelineOptions {
  hooks?: {
    preValidation?: ValidationHook<any>[];
    postValidation?: ValidationHook<any>[];
  };
  fallbackEnabled?: boolean;
  aiAnalysisEnabled?: boolean;
  logSuccesses?: boolean;
  recordMetrics?: boolean;
  maxProcessingTimeMs?: number;
}

// Default pipeline options
const defaultOptions: ValidationPipelineOptions = {
  hooks: {
    preValidation: [],
    postValidation: []
  },
  fallbackEnabled: true,
  aiAnalysisEnabled: true,
  logSuccesses: true,
  recordMetrics: true,
  maxProcessingTimeMs: 5000 // 5 seconds
};

/**
 * Main validation pipeline class
 */
export class ValidationPipeline {
  private options: ValidationPipelineOptions;
  
  constructor(options?: Partial<ValidationPipelineOptions>) {
    this.options = {
      ...defaultOptions,
      ...options,
      hooks: {
        preValidation: options?.hooks?.preValidation || defaultOptions.hooks?.preValidation,
        postValidation: options?.hooks?.postValidation || defaultOptions.hooks?.postValidation
      }
    };
    
    secureLogger('info', logComponent, 'Validation pipeline initialized', {
      metadata: {
        options: this.options
      }
    });
  }
  
  /**
   * Validate data against a registered rule
   */
  public async validate<T>(
    ruleId: string,
    data: any,
    context: Partial<ValidationContext>
  ): Promise<ValidationResult<T>> {
    const startTime = Date.now();
    const errors: ValidationError[] = [];
    
    // Complete the validation context
    const fullContext: ValidationContext = {
      ruleId,
      requestId: context.requestId || `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      path: context.path || 'unknown',
      method: context.method || 'UNKNOWN',
      target: context.target || 'body',
      timestamp: new Date(),
      metadata: context.metadata || {},
      userId: context.userId
    };
    
    try {
      // Check processing time limit
      const timeoutPromise = new Promise<ValidationResult<T>>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Validation timeout after ${this.options.maxProcessingTimeMs}ms`));
        }, this.options.maxProcessingTimeMs);
      });
      
      // Run actual validation
      const validationPromise = this.performValidation<T>(ruleId, data, fullContext, errors);
      
      // Race the validation against the timeout
      const result = await Promise.race([validationPromise, timeoutPromise]);
      
      // Log success if configured
      if (result.success && this.options.logSuccesses) {
        secureLogger('info', logComponent, `Validation succeeded for rule ${ruleId}`, {
          metadata: {
            ruleId,
            ruleVersion: result.metadata.ruleVersion,
            processingTimeMs: Date.now() - startTime,
            context: fullContext
          }
        });
      }
      
      return result;
    } catch (error) {
      // Handle timeout or other unexpected errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      secureLogger('error', logComponent, `Validation pipeline error: ${errorMessage}`, {
        metadata: {
          ruleId,
          error: errorMessage,
          processingTimeMs: Date.now() - startTime,
          context: fullContext
        }
      });
      
      // Record failure for fallback system
      if (this.options.fallbackEnabled) {
        validationFallbackHandler.recordFailure(error instanceof Error ? error : new Error(errorMessage));
      }
      
      // Send alert for system error
      validationAlertSystem.sendAlert(
        AlertType.SYSTEM_ERROR,
        `Validation pipeline error: ${errorMessage}`,
        {
          ruleId,
          context: fullContext,
          processingTimeMs: Date.now() - startTime
        }
      );
      
      // Return error result
      return {
        success: false,
        errors: [
          {
            message: `Validation pipeline error: ${errorMessage}`,
            type: ValidationErrorCategory.SYSTEM_DEPENDENCY,
            severity: ValidationErrorSeverity.HIGH,
            metadata: {
              error: errorMessage
            }
          }
        ],
        metadata: {
          ruleId,
          fallbackUsed: false,
          aiAnalysisPerformed: false,
          processingTimeMs: Date.now() - startTime
        }
      };
    }
  }
  
  /**
   * Perform the actual validation process
   */
  private async performValidation<T>(
    ruleId: string,
    data: any,
    context: ValidationContext,
    errors: ValidationError[]
  ): Promise<ValidationResult<T>> {
    const startTime = Date.now();
    let processedData = data;
    let fallbackUsed = false;
    let aiAnalysisPerformed = false;
    let ruleVersion: number | undefined;
    
    // Step 1: Run pre-validation hooks
    if (this.options.hooks?.preValidation && this.options.hooks.preValidation.length > 0) {
      for (const hook of this.options.hooks.preValidation) {
        try {
          const result = await hook(processedData, context);
          
          if (result === null) {
            // Hook signaled to abort validation
            return {
              success: false,
              errors: errors.length > 0 ? errors : [
                {
                  message: 'Validation aborted by pre-validation hook',
                  type: ValidationErrorCategory.SYSTEM_DEPENDENCY,
                  severity: ValidationErrorSeverity.MEDIUM
                }
              ],
              metadata: {
                ruleId,
                ruleVersion,
                fallbackUsed,
                aiAnalysisPerformed,
                processingTimeMs: Date.now() - startTime
              }
            };
          }
          
          // Update processed data with hook result
          processedData = result;
        } catch (error) {
          // Record hook error but continue pipeline
          const errorMessage = error instanceof Error ? error.message : String(error);
          
          secureLogger('error', logComponent, `Pre-validation hook error: ${errorMessage}`, {
            metadata: {
              ruleId,
              error: errorMessage,
              context
            }
          });
          
          errors.push({
            message: `Pre-validation error: ${errorMessage}`,
            type: ValidationErrorCategory.SYSTEM_DEPENDENCY,
            severity: ValidationErrorSeverity.MEDIUM,
            metadata: {
              error: errorMessage
            }
          });
        }
      }
    }
    
    // Step 2: Perform schema validation
    let schemaResult: { success: boolean; data?: T; error?: z.ZodError; ruleVersion?: number };
    
    try {
      // Get the rule from the versioning system
      const rule = validationRuleVersioning.getRule(ruleId);
      
      if (!rule) {
        errors.push({
          message: `Validation rule not found: ${ruleId}`,
          type: ValidationErrorCategory.SYSTEM_CONFIG,
          severity: ValidationErrorSeverity.HIGH
        });
        
        return {
          success: false,
          errors,
          metadata: {
            ruleId,
            fallbackUsed,
            aiAnalysisPerformed,
            processingTimeMs: Date.now() - startTime
          }
        };
      }
      
      if (!rule.isActive) {
        secureLogger('warn', logComponent, `Validation rule ${ruleId} is inactive`, {
          metadata: {
            ruleId,
            context
          }
        });
        
        // Return success without validation if rule is inactive
        return {
          success: true,
          data: processedData as T,
          metadata: {
            ruleId,
            fallbackUsed,
            aiAnalysisPerformed,
            processingTimeMs: Date.now() - startTime
          }
        };
      }
      
      // Perform actual validation
      const validationResult = validationRuleVersioning.validate<T>(ruleId, processedData);
      ruleVersion = validationResult.ruleVersion;
      
      if (!validationResult.success) {
        // Check if we should enter fallback mode
        if (this.options.fallbackEnabled && validationFallbackHandler.isInFallbackState()) {
          secureLogger('warn', logComponent, `Using fallback mode for validation rule ${ruleId}`, {
            metadata: {
              ruleId,
              error: validationResult.error,
              context
            }
          });
          
          fallbackUsed = true;
          
          // Convert Zod errors to enhanced validation errors
          if (validationResult.error) {
            const zodErrors = validationResult.error.errors || [];
            
            for (const zodError of zodErrors) {
              const enhancedError = enhanceValidationError(zodError);
              
              // Check if this error type should be allowed in fallback mode
              const shouldAllow = validationFallbackHandler.shouldAllowRequest(
                enhancedError.type || ValidationErrorCategory.UNKNOWN,
                enhancedError.severity || ValidationErrorSeverity.MEDIUM
              );
              
              if (!shouldAllow) {
                errors.push(enhancedError);
              }
            }
          }
          
          // If no errors were added during fallback processing, consider validation successful
          if (errors.length === 0) {
            return {
              success: true,
              data: processedData as T,
              metadata: {
                ruleId,
                ruleVersion,
                fallbackUsed,
                aiAnalysisPerformed,
                processingTimeMs: Date.now() - startTime
              }
            };
          }
        } else {
          // Normal error handling (no fallback)
          if (validationResult.error) {
            const zodErrors = validationResult.error.errors || [];
            
            for (const zodError of zodErrors) {
              errors.push(enhanceValidationError(zodError));
            }
          }
        }
        
        return {
          success: false,
          errors,
          metadata: {
            ruleId,
            ruleVersion,
            fallbackUsed,
            aiAnalysisPerformed,
            processingTimeMs: Date.now() - startTime
          }
        };
      }
      
      // Update processed data with validated result
      processedData = validationResult.data;
      schemaResult = validationResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      secureLogger('error', logComponent, `Schema validation error: ${errorMessage}`, {
        metadata: {
          ruleId,
          error: errorMessage,
          context
        }
      });
      
      // Record failure for fallback system
      if (this.options.fallbackEnabled) {
        validationFallbackHandler.recordFailure(error instanceof Error ? error : new Error(errorMessage));
      }
      
      errors.push({
        message: `Schema validation error: ${errorMessage}`,
        type: ValidationErrorCategory.SYSTEM_DEPENDENCY,
        severity: ValidationErrorSeverity.HIGH,
        metadata: {
          error: errorMessage
        }
      });
      
      return {
        success: false,
        errors,
        metadata: {
          ruleId,
          ruleVersion,
          fallbackUsed,
          aiAnalysisPerformed,
          processingTimeMs: Date.now() - startTime
        }
      };
    }
    
    // Step 3: Run post-validation hooks
    if (this.options.hooks?.postValidation && this.options.hooks.postValidation.length > 0) {
      for (const hook of this.options.hooks.postValidation) {
        try {
          const result = await hook(processedData, context);
          
          if (result === null) {
            // Hook signaled to abort validation
            return {
              success: false,
              errors: errors.length > 0 ? errors : [
                {
                  message: 'Validation aborted by post-validation hook',
                  type: ValidationErrorCategory.SYSTEM_DEPENDENCY,
                  severity: ValidationErrorSeverity.MEDIUM
                }
              ],
              metadata: {
                ruleId,
                ruleVersion,
                fallbackUsed,
                aiAnalysisPerformed,
                processingTimeMs: Date.now() - startTime
              }
            };
          }
          
          // Update processed data with hook result
          processedData = result;
        } catch (error) {
          // Record hook error but continue pipeline
          const errorMessage = error instanceof Error ? error.message : String(error);
          
          secureLogger('error', logComponent, `Post-validation hook error: ${errorMessage}`, {
            metadata: {
              ruleId,
              error: errorMessage,
              context
            }
          });
          
          errors.push({
            message: `Post-validation error: ${errorMessage}`,
            type: ValidationErrorCategory.SYSTEM_DEPENDENCY,
            severity: ValidationErrorSeverity.MEDIUM,
            metadata: {
              error: errorMessage
            }
          });
        }
      }
    }
    
    // Step 4: If everything succeeded, return success
    return {
      success: errors.length === 0,
      data: errors.length === 0 ? processedData as T : undefined,
      errors: errors.length > 0 ? errors : undefined,
      metadata: {
        ruleId,
        ruleVersion,
        fallbackUsed,
        aiAnalysisPerformed,
        processingTimeMs: Date.now() - startTime
      }
    };
  }
  
  /**
   * Create a validation context from an Express request
   */
  public static createContextFromRequest(
    req: Request,
    target: 'body' | 'query' | 'params' | 'headers' | 'file',
    metadata?: Record<string, any>
  ): ValidationContext {
    return {
      requestId: req.headers['x-request-id'] as string || `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: (req as any).user?.id,
      path: req.path,
      method: req.method,
      target,
      timestamp: new Date(),
      metadata: {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        ...metadata
      }
    };
  }
  
  /**
   * Update pipeline options
   */
  public updateOptions(options: Partial<ValidationPipelineOptions>): void {
    this.options = {
      ...this.options,
      ...options,
      hooks: {
        preValidation: options.hooks?.preValidation || this.options.hooks?.preValidation,
        postValidation: options.hooks?.postValidation || this.options.hooks?.postValidation
      }
    };
    
    secureLogger('info', logComponent, 'Validation pipeline options updated', {
      metadata: {
        options: this.options
      }
    });
  }
  
  /**
   * Add a pre-validation hook
   */
  public addPreValidationHook(hook: ValidationHook<any>): void {
    if (!this.options.hooks) {
      this.options.hooks = {};
    }
    
    if (!this.options.hooks.preValidation) {
      this.options.hooks.preValidation = [];
    }
    
    this.options.hooks.preValidation.push(hook);
  }
  
  /**
   * Add a post-validation hook
   */
  public addPostValidationHook(hook: ValidationHook<any>): void {
    if (!this.options.hooks) {
      this.options.hooks = {};
    }
    
    if (!this.options.hooks.postValidation) {
      this.options.hooks.postValidation = [];
    }
    
    this.options.hooks.postValidation.push(hook);
  }
}

// Export singleton instance
export const validationPipeline = new ValidationPipeline();