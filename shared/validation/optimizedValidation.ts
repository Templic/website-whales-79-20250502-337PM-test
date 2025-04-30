/**
 * Optimized Validation Module
 * 
 * This module provides performance optimizations for validation,
 * including caching, debouncing, and batched validation.
 */

import { ValidationResult, ValidationContext } from './validationTypes';
import { z } from 'zod';

/**
 * Cache configuration
 */
export interface ValidationCacheConfig {
  enabled: boolean;
  maxAge: number; // milliseconds
  maxSize: number; // max items in cache
}

/**
 * Debounce configuration
 */
export interface ValidationDebounceConfig {
  enabled: boolean;
  delay: number; // milliseconds
  maxWait: number; // milliseconds
}

/**
 * Batch configuration
 */
export interface ValidationBatchConfig {
  enabled: boolean;
  maxBatchSize: number;
  maxDelay: number; // milliseconds
}

/**
 * Validation optimization configuration
 */
export interface ValidationOptimizationConfig {
  cache: ValidationCacheConfig;
  debounce: ValidationDebounceConfig;
  batch: ValidationBatchConfig;
}

/**
 * Default optimization configuration
 */
export const DEFAULT_OPTIMIZATION_CONFIG: ValidationOptimizationConfig = {
  cache: {
    enabled: true,
    maxAge: 60000, // 1 minute
    maxSize: 100
  },
  debounce: {
    enabled: true,
    delay: 300, // 300ms
    maxWait: 1000 // 1 second
  },
  batch: {
    enabled: true,
    maxBatchSize: 10,
    maxDelay: 100 // 100ms
  }
};

/**
 * Cache entry
 */
interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

/**
 * Validation cache
 */
class ValidationCache {
  private cache: Map<string, CacheEntry<ValidationResult>>;
  private config: ValidationCacheConfig;
  
  constructor(config: ValidationCacheConfig) {
    this.cache = new Map();
    this.config = config;
  }
  
  /**
   * Get a cached result
   */
  get(key: string): ValidationResult | undefined {
    if (!this.config.enabled) {
      return undefined;
    }
    
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }
    
    // Check if entry is expired
    const now = Date.now();
    if (now - entry.timestamp > this.config.maxAge) {
      this.cache.delete(key);
      return undefined;
    }
    
    return entry.value;
  }
  
  /**
   * Set a cached result
   */
  set(key: string, value: ValidationResult): void {
    if (!this.config.enabled) {
      return;
    }
    
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.config.maxSize) {
      const oldestKey = this.getOldestKey();
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }
  
  /**
   * Invalidate a cached result
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }
  
  /**
   * Clear the cache
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Get the oldest key in the cache
   */
  private getOldestKey(): string | undefined {
    let oldestKey: string | undefined;
    let oldestTimestamp = Infinity;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }
    
    return oldestKey;
  }
}

/**
 * Create a cache key for validation
 */
function createCacheKey(
  schema: z.ZodType<any>,
  data: any,
  context: ValidationContext,
  fields?: string[]
): string {
  // Create a stable JSON representation of the data
  const dataString = JSON.stringify(data, Object.keys(data).sort());
  
  // Include schema identifier (this is not perfect but should work for most cases)
  const schemaId = (schema as any)._def?.typeName || schema.constructor.name;
  
  // Include fields if provided
  const fieldsString = fields ? fields.sort().join(',') : '';
  
  // Create cache key
  return `${schemaId}:${context}:${fieldsString}:${dataString}`;
}

/**
 * Debounce a validation function
 */
export function debounceValidation<T>(
  validationFn: (data: T, fields?: string[]) => Promise<ValidationResult>,
  config: ValidationDebounceConfig
): (data: T, fields?: string[]) => Promise<ValidationResult> {
  if (!config.enabled) {
    return validationFn;
  }
  
  let timeout: NodeJS.Timeout | null = null;
  let maxWaitTimeout: NodeJS.Timeout | null = null;
  let lastCallTime = 0;
  let lastCallArgs: [T, string[] | undefined] | null = null;
  let pendingPromise: Promise<ValidationResult> | null = null;
  let resolve: ((result: ValidationResult) => void) | null = null;
  
  // Function to execute the validation
  const executeValidation = async () => {
    if (!lastCallArgs) return;
    
    const [data, fields] = lastCallArgs;
    const result = await validationFn(data, fields);
    
    if (resolve) {
      resolve(result);
    }
    
    timeout = null;
    maxWaitTimeout = null;
    lastCallTime = 0;
    lastCallArgs = null;
    pendingPromise = null;
    resolve = null;
  };
  
  return async (data: T, fields?: string[]): Promise<ValidationResult> => {
    const now = Date.now();
    lastCallTime = now;
    lastCallArgs = [data, fields];
    
    // Clear existing timeout
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    
    // Create a new promise if none exists
    if (!pendingPromise) {
      pendingPromise = new Promise<ValidationResult>((res) => {
        resolve = res;
      });
      
      // Set max wait timeout
      if (!maxWaitTimeout && config.maxWait > 0) {
        maxWaitTimeout = setTimeout(() => {
          if (timeout) {
            clearTimeout(timeout);
            timeout = null;
          }
          executeValidation();
        }, config.maxWait);
      }
    }
    
    // Set the debounce timeout
    timeout = setTimeout(() => {
      if (maxWaitTimeout) {
        clearTimeout(maxWaitTimeout);
        maxWaitTimeout = null;
      }
      executeValidation();
    }, config.delay);
    
    return pendingPromise;
  };
}

/**
 * Batch validation for multiple fields
 */
export class BatchValidator<T> {
  private schema: z.ZodType<T>;
  private config: ValidationBatchConfig;
  private validationFn: (data: T, fields?: string[]) => Promise<ValidationResult>;
  private pendingFields: Set<string>;
  private timeout: NodeJS.Timeout | null;
  private data: T | null;
  private callbacks: Map<string, ((result: ValidationResult) => void)[]>;
  
  constructor(
    schema: z.ZodType<T>,
    validationFn: (data: T, fields?: string[]) => Promise<ValidationResult>,
    config: ValidationBatchConfig
  ) {
    this.schema = schema;
    this.config = config;
    this.validationFn = validationFn;
    this.pendingFields = new Set();
    this.timeout = null;
    this.data = null;
    this.callbacks = new Map();
  }
  
  /**
   * Validate a field
   */
  async validateField(field: keyof T, data: T): Promise<ValidationResult> {
    if (!this.config.enabled) {
      return this.validationFn(data, [field as string]);
    }
    
    // Update data
    this.data = data;
    
    // Add field to pending fields
    this.pendingFields.add(field as string);
    
    // Create a promise for this field
    return new Promise<ValidationResult>((resolve) => {
      // Add callback
      if (!this.callbacks.has(field as string)) {
        this.callbacks.set(field as string, []);
      }
      
      this.callbacks.get(field as string)!.push(resolve);
      
      // Schedule batch validation if not already scheduled
      this.scheduleBatchValidation();
    });
  }
  
  /**
   * Schedule batch validation
   */
  private scheduleBatchValidation(): void {
    if (this.timeout) {
      return;
    }
    
    // If we've reached the max batch size, validate immediately
    if (this.pendingFields.size >= this.config.maxBatchSize) {
      this.executeValidation();
      return;
    }
    
    // Otherwise, schedule validation
    this.timeout = setTimeout(() => {
      this.executeValidation();
    }, this.config.maxDelay);
  }
  
  /**
   * Execute batch validation
   */
  private async executeValidation(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    
    if (!this.data || this.pendingFields.size === 0) {
      return;
    }
    
    // Get fields to validate
    const fields = Array.from(this.pendingFields);
    
    // Clear pending fields
    this.pendingFields.clear();
    
    // Validate
    try {
      const result = await this.validationFn(this.data, fields);
      
      // Call callbacks for each field
      fields.forEach(field => {
        const callbacks = this.callbacks.get(field) || [];
        
        callbacks.forEach(callback => {
          // Create a field-specific result by filtering errors
          const fieldErrors = result.errors.filter(
            error => error.field === field || error.path?.includes(field)
          );
          
          const fieldResult: ValidationResult = {
            valid: fieldErrors.length === 0,
            errors: fieldErrors,
            context: result.context,
            validatedData: result.validatedData
          };
          
          callback(fieldResult);
        });
        
        // Clear callbacks
        this.callbacks.delete(field);
      });
    } catch (error) {
      // Call callbacks with error
      fields.forEach(field => {
        const callbacks = this.callbacks.get(field) || [];
        
        callbacks.forEach(callback => {
          callback({
            valid: false,
            errors: [{
              field,
              message: 'An error occurred during validation',
              code: 'VALIDATION_ERROR',
              severity: 'error',
              context: 'client'
            }],
            context: 'client'
          });
        });
        
        // Clear callbacks
        this.callbacks.delete(field);
      });
    }
  }
  
  /**
   * Cancel all pending validations
   */
  cancel(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    
    this.pendingFields.clear();
    this.callbacks.clear();
  }
}

/**
 * Create an optimized validator
 */
export function createOptimizedValidator<T>(
  schema: z.ZodType<T>,
  validationFn: (data: T, fields?: string[]) => Promise<ValidationResult>,
  config: ValidationOptimizationConfig = DEFAULT_OPTIMIZATION_CONFIG
): {
  validateData: (data: T, fields?: string[]) => Promise<ValidationResult>;
  validateField: (field: keyof T, data: T) => Promise<ValidationResult>;
  invalidateCache: (data: T, fields?: string[]) => void;
  clearCache: () => void;
} {
  // Create cache
  const cache = new ValidationCache(config.cache);
  
  // Create batch validator
  const batchValidator = new BatchValidator(
    schema,
    validationFn,
    config.batch
  );
  
  // Create debounced validation function
  const debouncedValidate = debounceValidation<T>(
    async (data: T, fields?: string[]): Promise<ValidationResult> => {
      // Check cache first
      const cacheKey = createCacheKey(schema, data, ValidationContext.CLIENT, fields);
      const cachedResult = cache.get(cacheKey);
      
      if (cachedResult) {
        return cachedResult;
      }
      
      // Validate
      const result = await validationFn(data, fields);
      
      // Cache result
      cache.set(cacheKey, result);
      
      return result;
    },
    config.debounce
  );
  
  return {
    // Validate data (with cache and debounce)
    validateData: debouncedValidate,
    
    // Validate field (with batching)
    validateField: (field: keyof T, data: T) => batchValidator.validateField(field, data),
    
    // Invalidate cache for specific data
    invalidateCache: (data: T, fields?: string[]) => {
      const cacheKey = createCacheKey(schema, data, ValidationContext.CLIENT, fields);
      cache.invalidate(cacheKey);
    },
    
    // Clear entire cache
    clearCache: () => cache.clear()
  };
}