/**
 * Validation Integration Module
 * 
 * This module provides a unified API for the three-tier validation system:
 * 1. Client-side pre-submission validation
 * 2. API endpoint validation
 * 3. Database-level constraint validation
 */

import { z } from 'zod';
import { 
  ValidationContext, 
  ValidationError, 
  ValidationResult, 
  createValidationResult
} from './validationTypes';
import { BusinessRule, BusinessRulesValidator } from './businessRuleValidation';

/**
 * Validation options for integrated validator
 */
export interface IntegratedValidationOptions {
  // Whether to abort on first error
  abortEarly?: boolean;
  
  // Specific fields to validate
  fields?: string[];
  
  // Specific business rules to validate
  rules?: string[];
  
  // Context data for validation
  context?: Record<string, any>;
  
  // Whether to throw on validation failure
  throwOnError?: boolean;
  
  // Validation contexts to run
  contexts?: ValidationContext[];
}

/**
 * Integrated validator for schema and business rules
 */
export class IntegratedValidator<T extends object> {
  private schema: z.ZodType<T>;
  private businessRules: BusinessRulesValidator<T>;
  
  constructor(schema: z.ZodType<T>, businessRules?: BusinessRulesValidator<T>) {
    this.schema = schema;
    this.businessRules = businessRules || new BusinessRulesValidator<T>();
  }
  
  /**
   * Add a business rule
   */
  addRule(rule: BusinessRule<T>): this {
    this.businessRules.addRule(rule);
    return this;
  }
  
  /**
   * Add multiple business rules
   */
  addRules(rules: BusinessRule<T>[]): this {
    this.businessRules.addRules(rules);
    return this;
  }
  
  /**
   * Validate data against schema and business rules
   */
  async validate(
    data: any, 
    options: IntegratedValidationOptions = {}
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    let validatedData: T | undefined;
    
    // Determine which validation contexts to run
    const contexts = options.contexts || [
      ValidationContext.CLIENT, 
      ValidationContext.CUSTOM
    ];
    
    // Schema validation (CLIENT context)
    if (contexts.includes(ValidationContext.CLIENT)) {
      try {
        // Validate with Zod schema
        validatedData = await this.schema.parseAsync(data);
      } catch (error) {
        if (error instanceof z.ZodError) {
          // Handle Zod validation errors
          for (const issue of error.errors) {
            errors.push({
              field: issue.path.join('.'),
              message: issue.message,
              code: issue.code,
              severity: 'error',
              context: ValidationContext.CLIENT,
              path: issue.path.map(p => String(p)),
              value: issue.message
            });
          }
          
          // If aborting early, return with schema errors
          if (options.abortEarly) {
            return createValidationResult(
              false,
              errors,
              ValidationContext.CLIENT
            );
          }
        } else {
          // Handle unexpected errors
          errors.push({
            field: 'schema',
            message: error instanceof Error ? error.message : 'Schema validation error',
            code: 'SCHEMA_ERROR',
            severity: 'error',
            context: ValidationContext.CLIENT
          });
          
          // Return early with unexpected error
          return createValidationResult(
            false,
            errors,
            ValidationContext.CLIENT
          );
        }
      }
    } else {
      // If not validating schema, treat input as validated data
      validatedData = data as T;
    }
    
    // Business rules validation (CUSTOM context)
    if (contexts.includes(ValidationContext.CUSTOM) && validatedData) {
      let businessRuleResult: ValidationResult;
      
      // Validate specific rules if provided
      if (options.rules && options.rules.length > 0) {
        businessRuleResult = this.businessRules.validateRules(
          validatedData,
          options.rules,
          options.context
        );
      } 
      // Validate specific fields if provided
      else if (options.fields && options.fields.length > 0) {
        businessRuleResult = this.businessRules.validateFields(
          validatedData,
          options.fields as Array<keyof T>,
          options.context
        );
      } 
      // Validate all rules
      else {
        businessRuleResult = this.businessRules.validate(
          validatedData,
          options.context
        );
      }
      
      // Add business rule errors to the list
      if (!businessRuleResult.valid) {
        errors.push(...businessRuleResult.errors);
      }
    }
    
    // Create final validation result
    const result = createValidationResult(
      errors.length === 0,
      errors,
      contexts[0], // Use the first context as the primary
      errors.length === 0 ? validatedData : undefined
    );
    
    // Throw error if requested and validation failed
    if (options.throwOnError && !result.valid) {
      throw new ValidationError(
        'Validation failed',
        result.errors
      );
    }
    
    return result;
  }
  
  /**
   * Create a validator for the client side
   */
  getClientValidator(): (data: any) => Promise<ValidationResult> {
    return (data: any) => this.validate(data, {
      contexts: [ValidationContext.CLIENT]
    });
  }
  
  /**
   * Create a validator for the API side
   */
  getApiValidator(): (data: any) => Promise<ValidationResult> {
    return (data: any) => this.validate(data, {
      contexts: [ValidationContext.CLIENT, ValidationContext.CUSTOM]
    });
  }
  
  /**
   * Create a validator for the database side
   */
  getDatabaseValidator(): (data: any) => Promise<ValidationResult> {
    return (data: any) => this.validate(data, {
      contexts: [ValidationContext.CUSTOM, ValidationContext.DATABASE]
    });
  }
}

// Validation error class for throwing validation errors
export class ValidationErrorException extends Error {
  validationErrors: ValidationError[];
  
  constructor(message: string, errors: ValidationError[]) {
    super(message);
    this.name = 'ValidationErrorException';
    this.validationErrors = errors;
  }
}