/**
 * Database Validation Module
 * 
 * This module provides validation for database operations with constraint checking
 * and custom business rule validation at the database level.
 */

import { z } from 'zod';
import { 
  ValidationContext, 
  ValidationResult,
  ValidationError,
  createValidationResult,
  createValidationError,
  ValidationSeverity
} from '../../shared/validation/validationTypes';
import { PgDatabase } from 'drizzle-orm/pg-core';

/**
 * Database constraint type
 */
export enum ConstraintType {
  UNIQUE = 'unique',
  FOREIGN_KEY = 'foreign_key',
  CHECK = 'check',
  NOT_NULL = 'not_null',
  PRIMARY_KEY = 'primary_key',
  CUSTOM = 'custom'
}

/**
 * Database constraint error mapping
 */
interface ConstraintErrorMapping {
  constraintName: string | RegExp;
  type: ConstraintType;
  field?: string;
  message: string;
  code: string;
  severity?: ValidationSeverity;
}

/**
 * Default constraint error mappings for common PostgreSQL errors
 */
const defaultConstraintMappings: ConstraintErrorMapping[] = [
  {
    constraintName: /^.*_pkey$/,
    type: ConstraintType.PRIMARY_KEY,
    message: 'An item with this primary key already exists',
    code: 'DB_PRIMARY_KEY_VIOLATION',
    severity: ValidationSeverity.ERROR
  },
  {
    constraintName: /^.*_unique$/,
    type: ConstraintType.UNIQUE,
    message: 'This value must be unique',
    code: 'DB_UNIQUE_VIOLATION',
    severity: ValidationSeverity.ERROR
  },
  {
    constraintName: /^.*_not_null$/,
    type: ConstraintType.NOT_NULL,
    message: 'This value cannot be null',
    code: 'DB_NOT_NULL_VIOLATION',
    severity: ValidationSeverity.ERROR
  },
  {
    constraintName: /^.*_fkey$/,
    type: ConstraintType.FOREIGN_KEY,
    message: 'Referenced record does not exist',
    code: 'DB_FOREIGN_KEY_VIOLATION',
    severity: ValidationSeverity.ERROR
  },
  {
    constraintName: /^.*_check$/,
    type: ConstraintType.CHECK,
    message: 'This value does not meet database constraints',
    code: 'DB_CHECK_VIOLATION',
    severity: ValidationSeverity.ERROR
  }
];

/**
 * Database validation options
 */
export interface DatabaseValidationOptions {
  constraintMappings?: ConstraintErrorMapping[];
  extractFieldName?: (constraintName: string, errorMessage: string) => string | undefined;
  zod?: boolean;
  applyTransforms?: boolean;
  businessRules?: Record<string, (data: any) => ValidationError | null>;
}

/**
 * Create a validator for database operations
 */
export function createDatabaseValidator<T extends object = any>(
  schema?: z.ZodType<T>,
  options: DatabaseValidationOptions = {}
) {
  const constraintMappings = [
    ...(options.constraintMappings || []),
    ...defaultConstraintMappings
  ];
  
  /**
   * Extract field name from constraint
   */
  const extractFieldFromConstraint = (
    constraintName: string,
    errorMessage: string
  ): string | undefined => {
    // Use custom extractor if provided
    if (options.extractFieldName) {
      const field = options.extractFieldName(constraintName, errorMessage);
      if (field) return field;
    }
    
    // Default extractor
    // Try to extract field name from typical constraint naming patterns
    const uniqueMatch = constraintName.match(/^(.+)_unique$/);
    if (uniqueMatch) return uniqueMatch[1];
    
    const fkeyMatch = constraintName.match(/^(.+)_fkey$/);
    if (fkeyMatch) return fkeyMatch[1];
    
    const checkMatch = constraintName.match(/^(.+)_check$/);
    if (checkMatch) return checkMatch[1];
    
    const columnMatch = errorMessage.match(/column "([^"]+)"/);
    if (columnMatch) return columnMatch[1];
    
    // Default to constraint name if field can't be extracted
    return constraintName;
  };
  
  /**
   * Map database error to validation error
   */
  const mapDBErrorToValidationError = (
    error: any,
    data?: any
  ): ValidationError[] => {
    // Check if this is a PostgreSQL constraint violation
    if (error && error.code && 
        (error.code === '23505' || // unique_violation
         error.code === '23503' || // foreign_key_violation
         error.code === '23502' || // not_null_violation
         error.code === '23514')) { // check_violation
      
      // Extract constraint name from the error
      const constraintMatch = error.detail?.match(/constraint "([^"]+)"/) ||
                             error.message?.match(/constraint "([^"]+)"/);
      const constraintName = constraintMatch ? constraintMatch[1] : 'unknown_constraint';
      
      // Look for a matching constraint mapping
      const mapping = constraintMappings.find(m => 
        (typeof m.constraintName === 'string' && m.constraintName === constraintName) ||
        (m.constraintName instanceof RegExp && m.constraintName.test(constraintName))
      );
      
      if (mapping) {
        // Use the field from mapping or extract it
        const field = mapping.field || extractFieldFromConstraint(constraintName, error.message || '');
        
        return [{
          field: field || 'unknown',
          message: mapping.message,
          code: mapping.code,
          severity: mapping.severity || ValidationSeverity.ERROR,
          context: ValidationContext.DATABASE,
          value: field && data ? data[field] : undefined,
          path: field ? [field] : undefined,
          constraints: { constraintName, constraintType: mapping.type }
        }];
      }
      
      // Default error if no specific mapping found
      return [{
        field: 'unknown',
        message: 'A database constraint violation occurred',
        code: 'DB_CONSTRAINT_VIOLATION',
        severity: ValidationSeverity.ERROR,
        context: ValidationContext.DATABASE,
        constraints: { constraintName }
      }];
    }
    
    // Handle other types of database errors
    return [{
      field: 'database',
      message: error.message || 'A database error occurred',
      code: error.code || 'DB_ERROR',
      severity: ValidationSeverity.ERROR,
      context: ValidationContext.DATABASE
    }];
  };
  
  /**
   * Validate data against business rules
   */
  const validateBusinessRules = (data: T): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    // Skip if no business rules provided
    if (!options.businessRules) {
      return errors;
    }
    
    // Run each business rule
    for (const [ruleName, ruleValidator] of Object.entries(options.businessRules)) {
      const error = ruleValidator(data);
      if (error) {
        errors.push(error);
      }
    }
    
    return errors;
  };
  
  /**
   * Validate data before database operations
   */
  const validateData = async (data: unknown): Promise<ValidationResult> => {
    try {
      // Skip Zod validation if schema not provided or option disabled
      if (!schema || options.zod === false) {
        // Validate business rules if any
        const businessRuleErrors = validateBusinessRules(data as T);
        
        return createValidationResult(
          businessRuleErrors.length === 0,
          businessRuleErrors,
          ValidationContext.DATABASE,
          data
        );
      }
      
      // Validate with Zod
      const validated = await schema.parseAsync(data);
      
      // Validate business rules after schema validation
      const businessRuleErrors = validateBusinessRules(validated);
      
      return createValidationResult(
        businessRuleErrors.length === 0,
        businessRuleErrors,
        ValidationContext.DATABASE,
        validated
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Handle Zod validation errors
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
          severity: ValidationSeverity.ERROR,
          context: ValidationContext.DATABASE,
          path: err.path,
          value: err.input
        }));
        
        return createValidationResult(
          false,
          errors,
          ValidationContext.DATABASE
        );
      }
      
      // Handle other errors during validation
      return createValidationResult(
        false,
        [{
          field: 'validation',
          message: error instanceof Error ? error.message : 'Validation error',
          code: 'VALIDATION_ERROR',
          severity: ValidationSeverity.ERROR,
          context: ValidationContext.DATABASE
        }],
        ValidationContext.DATABASE
      );
    }
  };
  
  /**
   * Wrap a database operation with validation
   */
  const withValidation = <R>(
    operation: (validatedData: T) => Promise<R>
  ) => async (data: unknown): Promise<{ result?: R; validationResult: ValidationResult }> => {
    // First validate the data
    const validationResult = await validateData(data);
    
    // If validation failed, return the errors
    if (!validationResult.valid) {
      return { validationResult };
    }
    
    try {
      // Execute the database operation with validated data
      const result = await operation(validationResult.validatedData);
      
      return { result, validationResult };
    } catch (error) {
      // Map database errors to validation errors
      const dbErrors = mapDBErrorToValidationError(error, data);
      
      return {
        validationResult: createValidationResult(
          false,
          dbErrors,
          ValidationContext.DATABASE
        )
      };
    }
  };
  
  /**
   * Create a safe executor for database operations
   */
  const createSafeExecutor = <R>(db: PgDatabase<any>) => {
    /**
     * Safely execute a database query with validation
     */
    return async <T>(
      data: T,
      operation: (db: PgDatabase<any>, validatedData: T) => Promise<R>
    ): Promise<{ result?: R; validationResult: ValidationResult }> => {
      // Wrap the operation
      const wrappedOperation = withValidation((validatedData: T) => 
        operation(db, validatedData)
      );
      
      // Execute with validation
      return wrappedOperation(data);
    };
  };
  
  return {
    validateData,
    withValidation,
    createSafeExecutor,
    mapDBErrorToValidationError
  };
}