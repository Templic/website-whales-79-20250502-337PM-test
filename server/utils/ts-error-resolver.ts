/**
 * TypeScript Error Resolver (Phase 3)
 * 
 * Core engine for resolving TypeScript errors through various strategies.
 * This system is designed to be:
 * - Open source compatible: Uses standard TypeScript APIs
 * - Secure: All fixes undergo multi-stage validation
 * - Private: Handles code locally without unnecessary external transmission
 * - Automated: Provides intelligent fix suggestions with minimal human intervention
 * - Future-proof: Modular architecture allows for extension and enhancement
 */

import * as ts from 'typescript';
import { db } from '../db';
import { typeScriptErrors, errorFixes, errorPatterns } from '@shared/schema';
import { FixStrategy } from './fix-strategy-factory';
import { CodeTransformer, Transformation, SourceFileEdit } from './code-transformer';
import { OpenAIFixGenerator } from './openai-fix-generator';
import { FixValidator } from './fix-validator';
import { ResolutionMetricsService } from './resolution-metrics';
import { eq, and, not, isNull } from 'drizzle-orm';
import { logger } from '../logger';

// Types for resolution system
export interface ResolutionOptions {
  maxAttempts?: number;
  timeoutMs?: number;
  validateFixes?: boolean;
  applyImmediately?: boolean;
  securityCheck?: boolean;
  useAI?: boolean;
  userId?: string;
  prioritizationStrategy?: 'severity' | 'impact' | 'frequency' | 'dependencies' | 'feedback' | 'custom';
  priorityThresholds?: {
    high: number;
    medium: number;
    low: number;
  };
  batchSize?: number;
  concurrentFixes?: boolean;
  maxConcurrency?: number;
  context?: {
    recentFiles?: string[];
    projectTsConfig?: any;
    additionalContext?: string;
    userFeedback?: Record<number, number>; // Maps fix IDs to user ratings
  }
}

export interface ResolutionResult {
  success: boolean;
  error?: TypeScriptError;
  appliedFix?: Fix;
  fixId?: number;
  validationResult?: ValidationResult;
  attempts: number;
  suggestedFixes: Fix[];
  diagnostics: string[];
  timeMs: number;
}

export interface ValidationResult {
  valid: boolean;
  newErrorsIntroduced: number;
  securityIssues: number;
  typechecks: boolean;
  stylePassing: boolean;
  performanceImpact: 'none' | 'low' | 'medium' | 'high';
  details: string[];
}

export interface Fix {
  id?: number;
  errorId: number;
  patternId?: number;
  description: string;
  replacements: SourceFileEdit[];
  isAIGenerated: boolean;
  confidence: number;
  successRate?: number;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface TypeScriptError {
  id: number;
  code: string;
  message: string;
  file: string;
  line: number;
  column: number;
  severity: string;
  category: string;
  status: string;
  patternId?: number;
  fixId?: number;
  detectedAt: Date;
  resolvedAt?: Date;
  userId?: string;
}

export interface BatchResolutionResult {
  totalErrors: number;
  successfulFixes: number;
  skippedErrors: number;
  results: ResolutionResult[];
  timeMs: number;
  errorsByType: Record<string, number>;
  priorityMetrics?: {
    highPriorityFixed: number;
    mediumPriorityFixed: number;
    lowPriorityFixed: number;
    highPriorityTotal: number;
    mediumPriorityTotal: number;
    lowPriorityTotal: number;
  };
}

/**
 * The main TypeScript error resolution engine
 */
export class TypeScriptErrorResolver {
  private defaultOptions: ResolutionOptions = {
    maxAttempts: 3,
    timeoutMs: 30000,
    validateFixes: true,
    applyImmediately: false,
    securityCheck: true,
    useAI: true,
    prioritizationStrategy: 'severity',
    priorityThresholds: {
      high: 80,
      medium: 50,
      low: 20
    },
    batchSize: 25,
    concurrentFixes: false,
    maxConcurrency: 1
  };

  constructor(
    private fixStrategies: FixStrategy[],
    private transformer: CodeTransformer,
    private validator: FixValidator,
    private aiGenerator: OpenAIFixGenerator,
    private metricsService: ResolutionMetricsService
  ) {
    logger.info('TypeScript Error Resolver initialized');
  }

  /**
   * Resolve a single TypeScript error
   */
  async resolveError(error: TypeScriptError, options?: Partial<ResolutionOptions>): Promise<ResolutionResult> {
    const startTime = Date.now();
    const mergedOptions = { ...this.defaultOptions, ...options };
    const diagnostics: string[] = [];
    let attempts = 0;
    const suggestedFixes: Fix[] = [];

    try {
      diagnostics.push(`Starting resolution for error ${error.id} in ${error.file}:${error.line}:${error.column}`);
      diagnostics.push(`Error message: ${error.message}`);

      // Find applicable strategies for this error
      const applicableStrategies = this.getApplicableStrategies(error);
      diagnostics.push(`Found ${applicableStrategies.length} applicable fix strategies`);

      // Try strategies in order of confidence
      for (const strategy of applicableStrategies) {
        if (attempts >= mergedOptions.maxAttempts) {
          diagnostics.push('Maximum attempts reached');
          break;
        }

        attempts++;
        diagnostics.push(`Attempt ${attempts}: Trying strategy ${strategy.name}`);

        try {
          const fix = await strategy.generateFix(error);
          suggestedFixes.push(fix);
          
          if (mergedOptions.validateFixes) {
            const validationResult = await this.validator.validateFix(error, fix);
            
            if (validationResult.valid) {
              diagnostics.push('Fix validation successful');
              
              if (mergedOptions.applyImmediately) {
                await this.applyFix(error, fix, mergedOptions.userId);
                diagnostics.push('Fix applied successfully');
                
                // Record success in metrics
                await this.metricsService.recordFixApplication({
                  errorId: error.id,
                  fixId: fix.id,
                  strategyName: strategy.name,
                  success: true,
                  validationResult,
                  timeMs: Date.now() - startTime
                });
                
                return {
                  success: true,
                  error,
                  appliedFix: fix,
                  fixId: fix.id,
                  validationResult,
                  attempts,
                  suggestedFixes,
                  diagnostics,
                  timeMs: Date.now() - startTime
                };
              } else {
                diagnostics.push('Valid fix found but not applied (applyImmediately=false)');
                // Just return the validated fix suggestion
                return {
                  success: true,
                  error,
                  appliedFix: undefined,
                  validationResult,
                  attempts,
                  suggestedFixes,
                  diagnostics,
                  timeMs: Date.now() - startTime
                };
              }
            } else {
              diagnostics.push(`Fix validation failed: ${validationResult.details.join(', ')}`);
            }
          } else {
            diagnostics.push('Validation skipped, returning potential fix');
            return {
              success: true,
              error,
              appliedFix: undefined,
              attempts,
              suggestedFixes,
              diagnostics,
              timeMs: Date.now() - startTime
            };
          }
        } catch (strategyError) {
          diagnostics.push(`Strategy ${strategy.name} failed: ${strategyError.message}`);
        }
      }

      // If we got here, pattern-based strategies failed - try AI-based resolution
      if (mergedOptions.useAI && attempts < mergedOptions.maxAttempts) {
        diagnostics.push('Attempting AI-based fix generation');
        attempts++;
        
        try {
          const aiFix = await this.aiGenerator.generateFix(error, mergedOptions.context);
          suggestedFixes.push(aiFix);
          
          if (mergedOptions.validateFixes) {
            const validationResult = await this.validator.validateFix(error, aiFix);
            
            if (validationResult.valid) {
              diagnostics.push('AI-generated fix validation successful');
              
              if (mergedOptions.applyImmediately) {
                await this.applyFix(error, aiFix, mergedOptions.userId);
                diagnostics.push('AI-generated fix applied successfully');
                
                // Record success in metrics
                await this.metricsService.recordFixApplication({
                  errorId: error.id,
                  fixId: aiFix.id,
                  strategyName: 'openai',
                  success: true,
                  validationResult,
                  timeMs: Date.now() - startTime
                });
                
                return {
                  success: true,
                  error,
                  appliedFix: aiFix,
                  fixId: aiFix.id,
                  validationResult,
                  attempts,
                  suggestedFixes,
                  diagnostics,
                  timeMs: Date.now() - startTime
                };
              } else {
                diagnostics.push('Valid AI fix found but not applied (applyImmediately=false)');
                return {
                  success: true,
                  error,
                  appliedFix: undefined,
                  validationResult,
                  attempts,
                  suggestedFixes,
                  diagnostics,
                  timeMs: Date.now() - startTime
                };
              }
            } else {
              diagnostics.push(`AI fix validation failed: ${validationResult.details.join(', ')}`);
            }
          } else {
            diagnostics.push('Validation skipped for AI fix, returning potential fix');
            return {
              success: true,
              error,
              appliedFix: undefined,
              attempts,
              suggestedFixes,
              diagnostics,
              timeMs: Date.now() - startTime
            };
          }
        } catch (aiError) {
          diagnostics.push(`AI fix generation failed: ${aiError.message}`);
        }
      }

      // All strategies failed
      diagnostics.push('All fix strategies failed');
      return {
        success: false,
        error,
        attempts,
        suggestedFixes,
        diagnostics,
        timeMs: Date.now() - startTime
      };
    } catch (error) {
      diagnostics.push(`Unexpected error in resolution process: ${error.message}`);
      return {
        success: false,
        attempts,
        suggestedFixes,
        diagnostics,
        timeMs: Date.now() - startTime
      };
    }
  }

  /**
   * Resolve multiple TypeScript errors in batch
   */
  async batchResolve(errors: TypeScriptError[], options?: Partial<ResolutionOptions>): Promise<BatchResolutionResult> {
    const startTime = Date.now();
    const results: ResolutionResult[] = [];
    const errorsByType: Record<string, number> = {};
    
    // Sort errors by dependency to resolve issues without creating new ones
    const sortedErrors = await this.sortErrorsByDependency(errors);
    
    // Process errors sequentially to avoid race conditions
    for (const error of sortedErrors) {
      // Track error types for reporting
      errorsByType[error.category] = (errorsByType[error.category] || 0) + 1;
      
      // Resolve each error
      const result = await this.resolveError(error, options);
      results.push(result);
      
      // If this fix introduced new errors, refresh the error list
      if (result.success && result.appliedFix && result.validationResult?.newErrorsIntroduced > 0) {
        // In a real implementation, you might want to re-scan the file for new errors
        // and add them to the processing queue
        logger.info(`Fix for error ${error.id} introduced ${result.validationResult.newErrorsIntroduced} new errors`);
      }
    }
    
    const successfulFixes = results.filter(r => r.success && r.appliedFix).length;
    
    return {
      totalErrors: errors.length,
      successfulFixes,
      skippedErrors: errors.length - results.length,
      results,
      timeMs: Date.now() - startTime,
      errorsByType
    };
  }

  /**
   * Get strategies that can fix a specific error
   */
  private getApplicableStrategies(error: TypeScriptError): FixStrategy[] {
    return this.fixStrategies
      .filter(strategy => strategy.canFix(error))
      .sort((a, b) => b.getConfidence(error) - a.getConfidence(error));
  }

  /**
   * Apply a fix to a file and update the database
   */
  private async applyFix(error: TypeScriptError, fix: Fix, userId?: string): Promise<void> {
    // Apply the code transformations
    for (const edit of fix.replacements) {
      await this.transformer.applyEdit(edit);
    }
    
    // Create a new fix record if it doesn't have an ID already
    let fixId = fix.id;
    if (!fixId) {
      // Insert the fix details
      const [newFix] = await db.insert(errorFixes)
        .values({
          error_id: error.id,
          pattern_id: fix.patternId,
          fix_text: JSON.stringify(fix.replacements),
          description: fix.description,
          is_ai_generated: fix.isAIGenerated,
          confidence_score: fix.confidence,
          success_rate: fix.successRate || 0,
          user_id: userId || null,
          created_at: new Date(),
          // Add other fields as needed
        })
        .returning({ id: errorFixes.id });
      
      fixId = newFix.id;
    }
    
    // Update the error status
    await db.update(typeScriptErrors)
      .set({
        status: 'fixed',
        fix_id: fixId,
        resolved_at: new Date(),
        user_id: userId || error.userId
      })
      .where(eq(typeScriptErrors.id, error.id));
  }

  /**
   * Sort errors by dependency to minimize the chance of fixes breaking other code
   */
  private async sortErrorsByDependency(errors: TypeScriptError[]): Promise<TypeScriptError[]> {
    // This is a simplified implementation
    // A real implementation would build a dependency graph and perform topological sort
    
    // Group errors by file
    const errorsByFile = this.groupByFile(errors);
    
    // Sort files by dependency (in a real implementation, this would be based on import structure)
    const sortedFiles = Object.keys(errorsByFile).sort();
    
    // For each file, sort errors by line/column (bottom-up to avoid position shifting)
    const result: TypeScriptError[] = [];
    for (const file of sortedFiles) {
      const fileErrors = errorsByFile[file].sort((a, b) => {
        if (a.line !== b.line) {
          return b.line - a.line; // Bottom-up
        }
        return b.column - a.column;
      });
      
      result.push(...fileErrors);
    }
    
    return result;
  }

  /**
   * Group errors by file
   */
  private groupByFile(errors: TypeScriptError[]): Record<string, TypeScriptError[]> {
    return errors.reduce((acc, error) => {
      if (!acc[error.file]) {
        acc[error.file] = [];
      }
      acc[error.file].push(error);
      return acc;
    }, {} as Record<string, TypeScriptError[]>);
  }
}