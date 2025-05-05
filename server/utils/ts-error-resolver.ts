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
    const mergedOptions = { ...this.defaultOptions, ...options };
    
    // Initialize priority metrics
    const priorityMetrics = {
      highPriorityFixed: 0,
      mediumPriorityFixed: 0,
      lowPriorityFixed: 0,
      highPriorityTotal: 0,
      mediumPriorityTotal: 0,
      lowPriorityTotal: 0
    };
    
    // 1. First, sort errors by dependency to resolve issues without creating new ones
    let sortedErrors = await this.sortErrorsByDependency(errors);
    
    // 2. Then, apply prioritization based on the selected strategy
    if (mergedOptions.prioritizationStrategy) {
      sortedErrors = this.prioritizeErrors(sortedErrors, mergedOptions);
    }
    
    // Calculate priority counts for metrics
    for (const error of sortedErrors) {
      const priority = this.calculateErrorPriority(error, mergedOptions);
      if (priority === 'high') {
        priorityMetrics.highPriorityTotal++;
      } else if (priority === 'medium') {
        priorityMetrics.mediumPriorityTotal++;
      } else {
        priorityMetrics.lowPriorityTotal++;
      }
    }
    
    // 3. Process errors in batches if configured
    const batchSize = mergedOptions.batchSize || sortedErrors.length;
    
    // Slice the sorted errors into batches
    for (let i = 0; i < sortedErrors.length; i += batchSize) {
      const batch = sortedErrors.slice(i, i + batchSize);
      
      // Process batch
      if (mergedOptions.concurrentFixes && mergedOptions.maxConcurrency > 1) {
        // Process batch concurrently with limited concurrency
        const batchPromises = [];
        const maxConcurrent = Math.min(mergedOptions.maxConcurrency, batch.length);
        
        // Process in chunks to limit concurrency
        for (let j = 0; j < batch.length; j += maxConcurrent) {
          const concurrentBatch = batch.slice(j, j + maxConcurrent);
          
          // Process concurrently
          const concurrentResults = await Promise.all(
            concurrentBatch.map(async (error) => {
              // Track error types for reporting
              errorsByType[error.category] = (errorsByType[error.category] || 0) + 1;
              
              // Resolve each error
              return this.resolveError(error, options);
            })
          );
          
          results.push(...concurrentResults);
          
          // Update priority metrics for this batch
          for (let k = 0; k < concurrentResults.length; k++) {
            const result = concurrentResults[k];
            if (result.success && result.appliedFix) {
              const error = concurrentBatch[k];
              const priority = this.calculateErrorPriority(error, mergedOptions);
              if (priority === 'high') {
                priorityMetrics.highPriorityFixed++;
              } else if (priority === 'medium') {
                priorityMetrics.mediumPriorityFixed++;
              } else {
                priorityMetrics.lowPriorityFixed++;
              }
            }
          }
        }
      } else {
        // Process batch sequentially
        for (const error of batch) {
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
          
          // Update priority metrics
          if (result.success && result.appliedFix) {
            const priority = this.calculateErrorPriority(error, mergedOptions);
            if (priority === 'high') {
              priorityMetrics.highPriorityFixed++;
            } else if (priority === 'medium') {
              priorityMetrics.mediumPriorityFixed++;
            } else {
              priorityMetrics.lowPriorityFixed++;
            }
          }
        }
      }
    }
    
    const successfulFixes = results.filter(r => r.success && r.appliedFix).length;
    
    return {
      totalErrors: errors.length,
      successfulFixes,
      skippedErrors: errors.length - results.length,
      results,
      timeMs: Date.now() - startTime,
      errorsByType,
      priorityMetrics
    };
  }
  
  /**
   * Prioritize errors based on the selected strategy
   */
  private prioritizeErrors(errors: TypeScriptError[], options: ResolutionOptions): TypeScriptError[] {
    const strategy = options.prioritizationStrategy || 'severity';
    
    switch (strategy) {
      case 'severity':
        // Sort by severity (critical > high > medium > low)
        return errors.sort((a, b) => {
          const priorityA = this.getSeverityScore(a.severity);
          const priorityB = this.getSeverityScore(b.severity);
          return priorityB - priorityA; // Higher severity first
        });
        
      case 'impact':
        // Sort by potential impact (based on file importance, error type, etc.)
        return errors.sort((a, b) => {
          const impactA = this.calculateImpactScore(a);
          const impactB = this.calculateImpactScore(b);
          return impactB - impactA; // Higher impact first
        });
        
      case 'frequency':
        // Sort by frequency of error pattern or code
        return errors.sort((a, b) => {
          const freqA = errorsByType[a.category] || 0;
          const freqB = errorsByType[b.category] || 0;
          return freqB - freqA; // More frequent error types first
        });
        
      case 'dependencies':
        // Already sorted by dependency earlier, return as is
        return errors;
        
      case 'feedback':
        // Sort based on user feedback if available
        return this.sortByUserFeedback(errors, options.context?.userFeedback || {});
        
      case 'custom':
        // Use a combination of strategies
        return this.customPrioritization(errors, options);
        
      default:
        return errors;
    }
  }
  
  /**
   * Calculate error priority level (high, medium, low)
   */
  private calculateErrorPriority(error: TypeScriptError, options: ResolutionOptions): 'high' | 'medium' | 'low' {
    const thresholds = options.priorityThresholds || { high: 80, medium: 50, low: 20 };
    
    // Combine various factors to calculate priority score
    let score = 0;
    
    // Factor 1: Severity
    score += this.getSeverityScore(error.severity) * 30; // 0-30 points
    
    // Factor 2: Error category importance
    score += this.getCategoryScore(error.category) * 25; // 0-25 points
    
    // Factor 3: Fix confidence
    const strategies = this.getApplicableStrategies(error);
    const confidence = strategies.length > 0 ? strategies[0].getConfidence(error) : 0;
    score += (confidence / 100) * 25; // 0-25 points
    
    // Factor 4: File importance
    score += this.getFileImportanceScore(error.file) * 20; // 0-20 points
    
    // Determine priority level based on score and thresholds
    if (score >= thresholds.high) {
      return 'high';
    } else if (score >= thresholds.medium) {
      return 'medium';
    } else {
      return 'low';
    }
  }
  
  /**
   * Get a numeric score for severity level
   */
  private getSeverityScore(severity: string): number {
    switch (severity.toLowerCase()) {
      case 'critical': return 1.0;
      case 'high': return 0.8;
      case 'medium': return 0.5;
      case 'low': return 0.2;
      default: return 0.1;
    }
  }
  
  /**
   * Get a score based on error category
   */
  private getCategoryScore(category: string): number {
    // Higher scores for more important categories
    switch (category.toLowerCase()) {
      case 'type_mismatch': return 0.7; // Important for correctness
      case 'null_reference': return 0.9; // Can cause runtime errors
      case 'import_error': return 0.8; // Can break dependencies
      case 'interface_mismatch': return 0.7; // API correctness issues
      case 'syntax_error': return 1.0; // Prevents compilation
      default: return 0.5;
    }
  }
  
  /**
   * Calculate a score for the potential impact of an error
   */
  private calculateImpactScore(error: TypeScriptError): number {
    let score = 0;
    
    // Check if error affects core files
    if (error.file.includes('core') || error.file.includes('index')) {
      score += 30;
    }
    
    // Check if error affects shared components or utilities
    if (error.file.includes('shared') || error.file.includes('utils') || error.file.includes('components')) {
      score += 25;
    }
    
    // Check if error is in a test file (lower priority)
    if (error.file.includes('test') || error.file.includes('spec')) {
      score -= 15;
    }
    
    // Consider error code importance
    if (error.code.startsWith('TS2')) {
      score += 15; // Type errors
    }
    if (error.code.startsWith('TS1')) {
      score += 20; // Syntax errors
    }
    
    return score;
  }
  
  /**
   * Score file importance based on its path
   */
  private getFileImportanceScore(filePath: string): number {
    // Core or configuration files are most important
    if (filePath.includes('config') || filePath.includes('core')) {
      return 1.0;
    }
    
    // Shared components and utilities are next
    if (filePath.includes('shared') || filePath.includes('utils') || filePath.includes('common')) {
      return 0.8;
    }
    
    // Feature components
    if (filePath.includes('components') || filePath.includes('pages')) {
      return 0.6;
    }
    
    // Test files less important for immediate fixes
    if (filePath.includes('test') || filePath.includes('spec')) {
      return 0.3;
    }
    
    // Default importance
    return 0.5;
  }
  
  /**
   * Sort errors based on user feedback
   */
  private sortByUserFeedback(errors: TypeScriptError[], feedback: Record<number, number>): TypeScriptError[] {
    // Sort by user feedback ratings if available, otherwise by severity
    return errors.sort((a, b) => {
      // Get pattern IDs for both errors (return 0 if not available)
      const patternA = a.patternId || 0;
      const patternB = b.patternId || 0;
      
      // Get feedback scores for both patterns (default to 0 if not available)
      const scoreA = feedback[patternA] || 0;
      const scoreB = feedback[patternB] || 0;
      
      if (scoreA !== scoreB) {
        return scoreB - scoreA; // Higher feedback scores first
      }
      
      // If feedback scores are equal, sort by severity
      const sevA = this.getSeverityScore(a.severity);
      const sevB = this.getSeverityScore(b.severity);
      return sevB - sevA;
    });
  }
  
  /**
   * Custom prioritization strategy that combines multiple factors
   */
  private customPrioritization(errors: TypeScriptError[], options: ResolutionOptions): TypeScriptError[] {
    return errors.sort((a, b) => {
      // Combine multiple scoring factors
      const aScore = 
        this.getSeverityScore(a.severity) * 0.4 + 
        this.getCategoryScore(a.category) * 0.3 +
        this.getFileImportanceScore(a.file) * 0.3;
        
      const bScore = 
        this.getSeverityScore(b.severity) * 0.4 + 
        this.getCategoryScore(b.category) * 0.3 +
        this.getFileImportanceScore(b.file) * 0.3;
      
      return bScore - aScore; // Higher scores first
    });
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