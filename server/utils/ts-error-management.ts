/**
 * TypeScript Error Management System
 * 
 * This module serves as the primary orchestration layer for the TypeScript 
 * error management system, integrating detection, analysis, and resolution.
 * 
 * Features:
 * - Open source compatible: All components use standard TypeScript APIs
 * - Secure: Multiple validation layers ensure safe code transformation
 * - Private: All code processing happens locally with minimal data transmission
 * - Automated: Complete system for finding and fixing TypeScript errors
 * - Future-proof: Extensible architecture to adapt to TypeScript evolution
 */

import path from 'path';
import { findTypeScriptErrors } from './ts-error-finder';
import { analyzeTypeScriptErrors } from './ts-error-analyzer';
import { TypeScriptErrorResolver, ResolutionOptions } from './ts-error-resolver';
import { CodeTransformer } from './code-transformer';
import { FixValidator, ValidationLevel } from './fix-validator';
import { OpenAIFixGenerator } from './openai-fix-generator';
import { ResolutionMetricsService } from './resolution-metrics';
import { FixStrategyFactory } from './fix-strategy-factory';
import { db } from '../db';
import { typeScriptErrors, errorPatterns, errorFixes } from '@shared/schema';
import { logger } from '../logger';
import { TypeScriptError } from './ts-error-resolver';
import { eq, and, or, not, isNull, sql, desc, count } from 'drizzle-orm';

/**
 * Main orchestration service for TypeScript error management
 */
export class TypeScriptErrorManagement {
  private resolver: TypeScriptErrorResolver;
  private metricsService: ResolutionMetricsService;
  private projectRoot: string;
  
  constructor(
    private openAiApiKey?: string,
    projectRoot: string = process.cwd()
  ) {
    this.projectRoot = projectRoot;
    
    // Initialize components
    const transformer = new CodeTransformer(projectRoot);
    const validator = new FixValidator(projectRoot);
    const aiGenerator = new OpenAIFixGenerator(openAiApiKey);
    this.metricsService = new ResolutionMetricsService();
    
    // Set up fix strategies
    const strategyFactory = FixStrategyFactory.createDefault(projectRoot);
    
    // Create resolver
    this.resolver = new TypeScriptErrorResolver(
      strategyFactory.strategies,
      transformer,
      validator,
      aiGenerator,
      this.metricsService
    );
    
    logger.info('TypeScript Error Management System initialized');
  }
  
  /**
   * Run a complete error detection, analysis, and resolution cycle
   */
  async runFullErrorProcessingCycle(options: {
    includeDirs: string[];
    excludeDirs?: string[];
    maxErrors?: number;
    autoFix?: boolean;
    resolution?: Partial<ResolutionOptions>;
    prioritization?: {
      strategy: 'severity' | 'impact' | 'frequency' | 'dependencies' | 'feedback' | 'custom';
      thresholds?: {
        high: number;
        medium: number;
        low: number;
      };
    };
    concurrentProcessing?: boolean;
    maxConcurrentFixes?: number;
    batchSize?: number;
  }): Promise<{
    detectedErrors: number;
    analyzedErrors: number;
    resolvedErrors: number;
    totalTimeMs: number;
    priorityMetrics?: {
      highPriorityFixed: number;
      mediumPriorityFixed: number;
      lowPriorityFixed: number;
      highPriorityTotal: number;
      mediumPriorityTotal: number;
      lowPriorityTotal: number;
    };
  }> {
    const startTime = Date.now();
    logger.info('Starting full TypeScript error processing cycle');
    
    try {
      // 1. Detect errors
      logger.info('Phase 1: Error Detection');
      const detectionResult = await findTypeScriptErrors({
        projectRoot: this.projectRoot,
        includeDirs: options.includeDirs,
        excludeDirs: options.excludeDirs || ['node_modules', 'dist', 'build'],
        maxErrors: options.maxErrors || 100
      });
      
      logger.info(`Detected ${detectionResult.errors.length} TypeScript errors`);
      
      // 2. Analyze errors
      logger.info('Phase 2: Error Analysis');
      const analyzedErrors = await analyzeTypeScriptErrors(detectionResult.errors);
      
      logger.info(`Analyzed ${analyzedErrors.length} TypeScript errors`);
      
      // 3. Store errors in database
      const storedErrors = await this.storeErrors(analyzedErrors);
      
      logger.info(`Stored ${storedErrors.length} TypeScript errors in database`);
      
      // 4. Resolve errors if autoFix is enabled
      let resolvedErrors = 0;
      let priorityMetrics;
      
      if (options.autoFix) {
        logger.info('Phase 3: Error Resolution');
        
        // Configure resolution options with prioritization if specified
        const resolutionOptions: Partial<ResolutionOptions> = {
          ...options.resolution,
          // Add prioritization configuration if provided
          prioritizationStrategy: options.prioritization?.strategy,
          priorityThresholds: options.prioritization?.thresholds,
          concurrentFixes: options.concurrentProcessing,
          maxConcurrency: options.maxConcurrentFixes,
          batchSize: options.batchSize
        };
        
        logger.info(`Using prioritization strategy: ${resolutionOptions.prioritizationStrategy || 'default (severity)'}`);
        
        if (resolutionOptions.concurrentFixes) {
          logger.info(`Using concurrent processing with max concurrency: ${resolutionOptions.maxConcurrency}`);
        }
        
        const resolutionResults = await this.batchResolveErrors(
          storedErrors, 
          resolutionOptions
        );
        
        resolvedErrors = resolutionResults.successfulFixes;
        priorityMetrics = resolutionResults.priorityMetrics;
        
        const fixRate = (resolvedErrors / storedErrors.length * 100).toFixed(1);
        logger.info(`Resolved ${resolvedErrors} out of ${storedErrors.length} errors (${fixRate}% success rate)`);
        
        // Log detailed metrics by error type
        const errorTypeMetrics = await this.metricsService.getErrorTypeSuccessRates();
        logger.info('Fix success rates by error type:');
        errorTypeMetrics.forEach(metric => {
          logger.info(`- ${metric.errorType}: ${metric.successRate.toFixed(1)}% (${metric.successCount}/${metric.totalCount})`);
        });
      }
      
      // 5. Return summary
      const totalTimeMs = Date.now() - startTime;
      logger.info(`Full TypeScript error processing cycle completed in ${totalTimeMs}ms`);
      
      return {
        detectedErrors: detectionResult.errors.length,
        analyzedErrors: analyzedErrors.length,
        resolvedErrors,
        totalTimeMs,
        priorityMetrics
      };
    } catch (error) {
      logger.error(`Error in full processing cycle: ${error.message}`);
      return {
        detectedErrors: 0,
        analyzedErrors: 0,
        resolvedErrors: 0,
        totalTimeMs: Date.now() - startTime
      };
    }
  }
  
  /**
   * Resolve a specific TypeScript error
   */
  async resolveError(
    errorId: number, 
    options?: Partial<ResolutionOptions>
  ): Promise<{
    success: boolean;
    diagnostics: string[];
    fixId?: number;
    timeMs: number;
  }> {
    try {
      // Get error from database
      const [error] = await db.select()
        .from(typeScriptErrors)
        .where(eq(typeScriptErrors.id, errorId));
      
      if (!error) {
        throw new Error(`Error with ID ${errorId} not found`);
      }
      
      // Convert to resolver's error format
      const resolverError: TypeScriptError = {
        id: error.id,
        code: error.code,
        message: error.message,
        file: error.file_path,
        line: error.line,
        column: error.column,
        severity: error.severity,
        category: error.category,
        status: error.status,
        patternId: error.pattern_id,
        fixId: error.fix_id,
        detectedAt: error.detected_at,
        resolvedAt: error.resolved_at,
        userId: error.user_id
      };
      
      // Resolve error
      const resolution = await this.resolver.resolveError(resolverError, options);
      
      return {
        success: resolution.success,
        diagnostics: resolution.diagnostics,
        fixId: resolution.fixId,
        timeMs: resolution.timeMs
      };
    } catch (error) {
      logger.error(`Error resolving error ${errorId}: ${error.message}`);
      return {
        success: false,
        diagnostics: [`Error: ${error.message}`],
        timeMs: 0
      };
    }
  }
  
  /**
   * Resolve multiple errors in batch with prioritization
   */
  async batchResolveErrors(
    errors: any[], 
    options?: Partial<ResolutionOptions>
  ): Promise<{
    totalErrors: number;
    successfulFixes: number;
    timeMs: number;
    priorityMetrics?: {
      highPriorityFixed: number;
      mediumPriorityFixed: number;
      lowPriorityFixed: number;
      highPriorityTotal: number;
      mediumPriorityTotal: number;
      lowPriorityTotal: number;
    };
  }> {
    try {
      // Convert database errors to resolver format
      const resolverErrors: TypeScriptError[] = errors.map(error => ({
        id: error.id,
        code: error.code,
        message: error.message,
        file: error.file_path,
        line: error.line,
        column: error.column,
        severity: error.severity,
        category: error.category,
        status: error.status,
        patternId: error.pattern_id,
        fixId: error.fix_id,
        detectedAt: error.detected_at,
        resolvedAt: error.resolved_at,
        userId: error.user_id
      }));
      
      // Get user feedback for prioritization if available
      let userFeedback: Record<number, number> = {};
      if (options?.prioritizationStrategy === 'feedback') {
        try {
          // Fetch user feedback from database for fix patterns
          const feedbackData = await db.select({
            pattern_id: errorFixes.pattern_id,
            avg_rating: sql`AVG(user_rating)`.as('avg_rating')
          })
          .from(errorFixes)
          .where(
            and(
              not(isNull(errorFixes.user_rating)),
              not(isNull(errorFixes.pattern_id))
            )
          )
          .groupBy(errorFixes.pattern_id);
          
          // Convert to a map of pattern_id -> avg_rating
          userFeedback = feedbackData.reduce((acc, item) => {
            acc[item.pattern_id] = Number(item.avg_rating);
            return acc;
          }, {} as Record<number, number>);
          
          logger.info(`Using user feedback for ${Object.keys(userFeedback).length} error patterns`);
        } catch (dbError) {
          logger.error(`Error fetching user feedback: ${dbError.message}`);
        }
      }
      
      // Setup enhanced options
      const enhancedOptions: Partial<ResolutionOptions> = {
        ...options,
        context: {
          ...options?.context,
          userFeedback // Add user feedback data for prioritization
        }
      };
      
      // Batch resolve errors with enhanced options
      const batchResult = await this.resolver.batchResolve(resolverErrors, enhancedOptions);
      
      // Log priority metrics if available
      if (batchResult.priorityMetrics) {
        logger.info(`Priority metrics for batch resolution:
          - High priority: Fixed ${batchResult.priorityMetrics.highPriorityFixed}/${batchResult.priorityMetrics.highPriorityTotal} (${Math.round(batchResult.priorityMetrics.highPriorityFixed / batchResult.priorityMetrics.highPriorityTotal * 100)}%)
          - Medium priority: Fixed ${batchResult.priorityMetrics.mediumPriorityFixed}/${batchResult.priorityMetrics.mediumPriorityTotal} (${Math.round(batchResult.priorityMetrics.mediumPriorityFixed / batchResult.priorityMetrics.mediumPriorityTotal * 100)}%)
          - Low priority: Fixed ${batchResult.priorityMetrics.lowPriorityFixed}/${batchResult.priorityMetrics.lowPriorityTotal} (${Math.round(batchResult.priorityMetrics.lowPriorityFixed / batchResult.priorityMetrics.lowPriorityTotal * 100)}%)`);
      }
      
      return {
        totalErrors: batchResult.totalErrors,
        successfulFixes: batchResult.successfulFixes,
        timeMs: batchResult.timeMs,
        priorityMetrics: batchResult.priorityMetrics
      };
    } catch (error) {
      logger.error(`Error in batch resolution: ${error.message}`);
      return {
        totalErrors: errors.length,
        successfulFixes: 0,
        timeMs: 0
      };
    }
  }
  
  /**
   * Get resolution metrics
   */
  async getMetrics(): Promise<any> {
    try {
      // Get strategy success rates
      const strategyRates = await this.metricsService.getStrategySuccessRates();
      
      // Get error type success rates
      const errorTypeRates = await this.metricsService.getErrorTypeSuccessRates();
      
      // Get fix trends over time
      const trends = await this.metricsService.getFixTrends('last_month');
      
      // Get AI fix metrics
      const aiMetrics = await this.metricsService.getAIFixMetrics();
      
      return {
        strategyRates,
        errorTypeRates,
        trends,
        aiMetrics
      };
    } catch (error) {
      logger.error(`Error getting metrics: ${error.message}`);
      return {
        strategyRates: [],
        errorTypeRates: [],
        trends: [],
        aiMetrics: {
          totalFixes: 0,
          successRate: 0,
          averageConfidence: 0,
          averageUserRating: 0,
          fixesByModel: {}
        }
      };
    }
  }
  
  /**
   * Store analyzed errors in the database
   */
  private async storeErrors(analyzedErrors: any[]): Promise<any[]> {
    const storedErrors = [];
    
    for (const error of analyzedErrors) {
      try {
        // Check if error already exists
        const [existingError] = await db.select({ id: typeScriptErrors.id })
          .from(typeScriptErrors)
          .where(
            and(
              eq(typeScriptErrors.code, error.code),
              eq(typeScriptErrors.file_path, error.file),
              eq(typeScriptErrors.line, error.line),
              eq(typeScriptErrors.column, error.column)
            )
          );
        
        if (existingError) {
          // Error already exists, update if needed
          await db.update(typeScriptErrors)
            .set({
              message: error.message,
              severity: error.severity,
              category: error.category,
              updated_at: new Date()
            })
            .where(eq(typeScriptErrors.id, existingError.id));
          
          // Get updated error
          const [updatedError] = await db.select()
            .from(typeScriptErrors)
            .where(eq(typeScriptErrors.id, existingError.id));
          
          storedErrors.push(updatedError);
          continue;
        }
        
        // Find or create pattern
        let patternId: number | null = null;
        
        // Check if pattern exists for this error code
        const [existingPattern] = await db.select({ id: errorPatterns.id })
          .from(errorPatterns)
          .where(eq(errorPatterns.error_code, error.code));
        
        if (existingPattern) {
          patternId = existingPattern.id;
        } else {
          // Create new pattern
          const [newPattern] = await db.insert(errorPatterns)
            .values({
              name: `${error.code} - ${this.shortenErrorMessage(error.message)}`,
              description: error.message,
              category: error.category,
              error_code: error.code,
              auto_fixable: error.autoFixable || false,
              created_at: new Date()
            })
            .returning({ id: errorPatterns.id });
          
          patternId = newPattern.id;
        }
        
        // Create new error
        const [newError] = await db.insert(typeScriptErrors)
          .values({
            code: error.code,
            message: error.message,
            file_path: error.file,
            line: error.line,
            column: error.column,
            severity: error.severity,
            category: error.category,
            status: 'pending',
            pattern_id: patternId,
            detected_at: new Date(),
            updated_at: new Date()
          })
          .returning();
        
        storedErrors.push(newError);
      } catch (dbError) {
        logger.error(`Error storing error in database: ${dbError.message}`);
        // Continue with next error
      }
    }
    
    return storedErrors;
  }
  
  /**
   * Create a shortened version of the error message for pattern names
   */
  private shortenErrorMessage(message: string): string {
    // Get first sentence or limit to 50 characters
    const firstSentence = message.split('.')[0];
    return firstSentence.length > 50 
      ? firstSentence.substring(0, 47) + '...' 
      : firstSentence;
  }
}