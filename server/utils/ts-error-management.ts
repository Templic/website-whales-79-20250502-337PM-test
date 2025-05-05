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
  }): Promise<{
    detectedErrors: number;
    analyzedErrors: number;
    resolvedErrors: number;
    totalTimeMs: number;
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
      if (options.autoFix) {
        logger.info('Phase 3: Error Resolution');
        const resolutionResults = await this.batchResolveErrors(
          storedErrors, 
          options.resolution || {}
        );
        
        resolvedErrors = resolutionResults.successfulFixes;
        logger.info(`Resolved ${resolvedErrors} out of ${storedErrors.length} errors`);
      }
      
      // 5. Return summary
      const totalTimeMs = Date.now() - startTime;
      logger.info(`Full TypeScript error processing cycle completed in ${totalTimeMs}ms`);
      
      return {
        detectedErrors: detectionResult.errors.length,
        analyzedErrors: analyzedErrors.length,
        resolvedErrors,
        totalTimeMs
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
   * Resolve multiple errors in batch
   */
  async batchResolveErrors(
    errors: any[], 
    options?: Partial<ResolutionOptions>
  ): Promise<{
    totalErrors: number;
    successfulFixes: number;
    timeMs: number;
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
      
      // Batch resolve errors
      const batchResult = await this.resolver.batchResolve(resolverErrors, options);
      
      return {
        totalErrors: batchResult.totalErrors,
        successfulFixes: batchResult.successfulFixes,
        timeMs: batchResult.timeMs
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