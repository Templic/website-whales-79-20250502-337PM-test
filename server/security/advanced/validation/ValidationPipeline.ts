/**
 * Validation Pipeline
 * 
 * A comprehensive validation pipeline that processes validation in distinct phases:
 * 1. Pre-validation phase (optional)
 * 2. Main validation phase (schema + AI)
 * 3. Post-validation checks and logging
 * 
 * This pipeline integrates deeply with the security architecture and provides
 * caching, batching, and performance optimization.
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationEngine } from '../apiValidation/ValidationEngine';
import secureLogger from '../../utils/secureLogger'; // Fixed import
import { LRUCache } from 'lru-cache';
import { createHash } from 'crypto';
import { ValidationAIConnector } from '../ai/ValidationAIConnector';
import { SecurityAnalysisService } from '../ai/SecurityAnalysisService';

// Interfaces
export interface ValidationOptions {
  skipCache?: boolean;
  batchKey?: string;
  priority?: 'high' | 'normal' | 'low';
  contentType?: 'api' | 'code' | 'database' | 'config';
  detailedAnalysis?: boolean;
  threshold?: number;
  maxTokens?: number;
  contextData?: Record<string, any>;
}

interface ValidationContext {
  req: Request;
  data: any;
  schema?: z.ZodType<any>;
  options: ValidationOptions;
  startTime: number;
  validationId: string;
}

interface ValidationResult {
  valid: boolean;
  validatedData?: any;
  errors?: any;
  warnings?: any;
  timeTaken?: number;
  cacheLookup?: boolean;
  cacheHit?: boolean;
  validationId: string;
  securityScore?: number;
  threatAnalysis?: any;
}

// Configure validation cache
const validationCache = new LRUCache<string, ValidationResult>({
  max: 1000, // Maximum items in cache
  ttl: 5 * 60 * 1000, // 5 minutes TTL
  allowStale: false,
  updateAgeOnGet: true,
  updateAgeOnHas: false,
});

// Batch validation queue
interface BatchItem {
  context: ValidationContext;
  resolve: (result: ValidationResult) => void;
  reject: (error: Error) => void;
}

const batchQueues: Record<string, BatchItem[]> = {};
const BATCH_PROCESS_INTERVAL = 200; // Process batches every 200ms

// Start batch processing
setInterval(() => {
  processBatchQueues();
}, BATCH_PROCESS_INTERVAL);

/**
 * Process all pending batch validation queues
 */
function processBatchQueues() {
  const queueKeys = Object.keys(batchQueues);
  if (queueKeys.length === 0) return;

  for (const key of queueKeys) {
    const queue = batchQueues[key];
    if (queue.length === 0) {
      delete batchQueues[key];
      continue;
    }

    // Process this batch
    processBatch(key, queue);
    delete batchQueues[key];
  }
}

/**
 * Process a specific batch of validation requests
 */
async function processBatch(batchKey: string, items: BatchItem[]) {
  try {
    // Group similar requests for efficiency
    const contexts = items.map(item => item.context);
    
    // Create a representative context from the batch
    // For simplicity, we're using the first item, but this could be enhanced
    const representativeContext = contexts[0];
    
    // Execute validation with combined data
    const engine = new ValidationEngine();
    const result = await engine.validate(
      representativeContext.data, 
      representativeContext.schema, 
      { ...representativeContext.options, isBatchValidation: true }
    );
    
    // Return results to all waiting items
    for (const item of items) {
      const validationResult: ValidationResult = {
        ...result,
        timeTaken: Date.now() - item.context.startTime,
        validationId: item.context.validationId,
        cacheLookup: false,
        cacheHit: false
      };
      
      item.resolve(validationResult);
    }
  } catch (error) {
    // Handle errors in batch processing
    secureLogger.error('Batch validation failed', { 
      batchKey, 
      itemCount: items.length, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    
    // Reject all promises
    for (const item of items) {
      item.reject(error instanceof Error ? error : new Error('Batch validation failed'));
    }
  }
}

/**
 * Generate a cache key for a validation request
 */
function generateCacheKey(data: any, schema?: z.ZodType<any>, options?: ValidationOptions): string {
  // For security reasons, we hash the data to create the cache key
  const dataString = JSON.stringify(data);
  const schemaString = schema ? schema.toString() : '';
  const optionsString = options ? JSON.stringify(options) : '';
  
  return createHash('sha256')
    .update(dataString + schemaString + optionsString)
    .digest('hex');
}

/**
 * Main validation pipeline class
 */
export class ValidationPipeline {
  private engine: ValidationEngine;
  private aiConnector: ValidationAIConnector;
  private securityService: SecurityAnalysisService;
  
  constructor() {
    this.engine = new ValidationEngine();
    this.aiConnector = new ValidationAIConnector();
    this.securityService = new SecurityAnalysisService();
  }

  /**
   * Execute the validation pipeline
   */
  async validate(
    req: Request,
    data: any, 
    schema?: z.ZodType<any>, 
    options: ValidationOptions = {}
  ): Promise<ValidationResult> {
    const startTime = Date.now();
    const validationId = createHash('md5').update(Date.now() + Math.random().toString()).digest('hex').slice(0, 8);
    
    // Create validation context
    const context: ValidationContext = {
      req,
      data,
      schema,
      options,
      startTime,
      validationId
    };
    
    try {
      // Phase 1: Pre-validation (cache check and batching)
      const preValidationResult = await this.performPreValidation(context);
      if (preValidationResult) {
        return preValidationResult;
      }
      
      // Phase 2: Main validation
      const mainValidationResult = await this.performMainValidation(context);
      
      // Phase 3: Post-validation
      return await this.performPostValidation(context, mainValidationResult);
    } catch (error) {
      // Handle any pipeline failures
      secureLogger.error('Validation pipeline failed', { 
        validationId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return {
        valid: false,
        errors: [{ message: 'Validation system error', code: 'SYSTEM_ERROR' }],
        timeTaken: Date.now() - startTime,
        validationId
      };
    }
  }
  
  /**
   * Phase 1: Pre-validation checks including caching and batching
   */
  private async performPreValidation(context: ValidationContext): Promise<ValidationResult | null> {
    const { data, schema, options, validationId, startTime } = context;
    
    // Skip pre-validation if explicitly requested
    if (options.skipCache) {
      return null;
    }
    
    // Check cache first
    const cacheKey = generateCacheKey(data, schema, options);
    const cachedResult = validationCache.get(cacheKey);
    
    if (cachedResult) {
      secureLogger.debug('Validation cache hit', { validationId, cacheKey });
      
      return {
        ...cachedResult,
        timeTaken: Date.now() - startTime,
        validationId,
        cacheLookup: true,
        cacheHit: true
      };
    }
    
    // Check if this should be batched
    if (options.batchKey) {
      return await new Promise<ValidationResult>((resolve, reject) => {
        // Add to batch queue
        if (!batchQueues[options.batchKey!]) {
          batchQueues[options.batchKey!] = [];
        }
        
        batchQueues[options.batchKey!].push({
          context,
          resolve,
          reject
        });
        
        secureLogger.debug('Added validation to batch queue', { 
          validationId, 
          batchKey: options.batchKey 
        });
      });
    }
    
    // No cache hit and no batching, continue with normal validation
    return null;
  }
  
  /**
   * Phase 2: Main validation logic
   */
  private async performMainValidation(context: ValidationContext): Promise<ValidationResult> {
    const { data, schema, options, validationId, startTime } = context;
    
    // Determine if this needs AI validation
    const needsAIValidation = options.contentType || options.detailedAnalysis;
    
    // Start with schema validation if a schema is provided
    let schemaResult = { valid: true, validatedData: data };
    if (schema) {
      schemaResult = await this.engine.validate(data, schema);
    }
    
    // If schema validation failed or AI validation not needed, return schema result
    if (!schemaResult.valid || !needsAIValidation) {
      return {
        ...schemaResult,
        timeTaken: Date.now() - startTime,
        validationId,
        cacheLookup: true,
        cacheHit: false
      };
    }
    
    // Perform AI validation if needed
    if (needsAIValidation) {
      try {
        const aiValidationResult = await this.aiConnector.validateData(data, {
          contentType: options.contentType || 'api',
          threshold: options.threshold,
          detailedAnalysis: options.detailedAnalysis,
          maxTokens: options.maxTokens,
          requestContext: {
            url: context.req.url,
            method: context.req.method,
            ip: context.req.ip,
            userAgent: context.req.get('user-agent')
          }
        });
        
        // Merge results
        return {
          valid: schemaResult.valid && aiValidationResult.valid,
          validatedData: schemaResult.validatedData,
          errors: aiValidationResult.valid ? schemaResult.errors : [
            ...(schemaResult.errors || []),
            ...(aiValidationResult.reason ? [{ message: aiValidationResult.reason }] : [])
          ],
          warnings: aiValidationResult.threats?.map(threat => ({
            message: threat.description,
            severity: threat.severity,
            type: threat.type,
            confidence: threat.confidence
          })),
          timeTaken: Date.now() - startTime,
          validationId,
          securityScore: aiValidationResult.confidence || 1,
          threatAnalysis: aiValidationResult
        };
      } catch (error) {
        secureLogger.error('AI validation failed', { 
          validationId, 
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        // Return schema validation result if AI validation fails
        return {
          ...schemaResult,
          timeTaken: Date.now() - startTime,
          validationId,
          warnings: [{ message: 'AI security validation failed, falling back to schema validation only' }]
        };
      }
    }
    
    // Default result if no AI validation was performed
    return {
      ...schemaResult,
      timeTaken: Date.now() - startTime,
      validationId
    };
  }
  
  /**
   * Phase 3: Post-validation processing
   */
  private async performPostValidation(
    context: ValidationContext, 
    validationResult: ValidationResult
  ): Promise<ValidationResult> {
    const { data, schema, options, validationId } = context;
    
    // Cache the result for future use (if valid)
    if (validationResult.valid && !options.skipCache) {
      const cacheKey = generateCacheKey(data, schema, options);
      validationCache.set(cacheKey, validationResult);
    }
    
    // Log validation result
    this.logValidationResult(context, validationResult);
    
    // Return the final result
    return validationResult;
  }
  
  /**
   * Log validation result for auditing
   */
  private logValidationResult(context: ValidationContext, result: ValidationResult): void {
    const { req, validationId } = context;
    
    // Prepare log data
    const logData = {
      validationId,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userId: req.user?.id,
      userRole: req.user?.role,
      valid: result.valid,
      timeTaken: result.timeTaken,
      cacheHit: result.cacheHit,
      securityScore: result.securityScore,
      hasWarnings: !!result.warnings && result.warnings.length > 0,
      warningCount: result.warnings?.length || 0,
      errorCount: result.errors?.length || 0
    };
    
    // Log based on validation result
    if (result.valid) {
      secureLogger.info('Validation passed', logData);
    } else {
      secureLogger.warn('Validation failed', {
        ...logData,
        errors: result.errors,
        warnings: result.warnings
      });
    }
  }
  
  /**
   * Clear validation cache
   */
  clearCache(): void {
    validationCache.clear();
    secureLogger.info('Validation cache cleared');
  }
  
  /**
   * Get validation cache stats
   */
  getCacheStats(): any {
    return {
      size: validationCache.size,
      maxSize: validationCache.max,
      itemCount: validationCache.size,
      hits: validationCache.size, // This would ideally be an actual hits counter
      misses: 0 // This would ideally be an actual misses counter
    };
  }
  
  /**
   * Get validation pipeline status
   */
  async getStatus(): Promise<any> {
    const aiStatus = await this.aiConnector.getStatus();
    
    return {
      operational: true,
      cacheEnabled: true,
      cacheStats: this.getCacheStats(),
      aiValidation: aiStatus,
      batchProcessingEnabled: true,
      activeBatches: Object.keys(batchQueues).length,
      pendingValidations: Object.values(batchQueues).reduce((sum, queue) => sum + queue.length, 0)
    };
  }
}

// Export singleton instance
export const validationPipeline = new ValidationPipeline();