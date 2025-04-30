/**
 * Validation Types Module
 * 
 * This module defines the common types used across all validation layers,
 * ensuring consistency between client, API, and database validation.
 */

/**
 * Validation context - where the validation is being performed
 */
export enum ValidationContext {
  CLIENT = 'client',     // Client-side pre-submission validation
  API = 'api',           // API endpoint validation
  DATABASE = 'database', // Database-level validation
  CUSTOM = 'custom'      // Custom business rule validation
}

/**
 * Validation severity - how severe the validation error is
 */
export enum ValidationSeverity {
  ERROR = 'error',       // Critical error that prevents submission
  WARNING = 'warning',   // Warning that allows submission but needs attention
  INFO = 'info'          // Informational message only
}

/**
 * Validation error structure
 */
export interface ValidationError {
  field: string;             // Field name that has the error
  message: string;           // User-friendly error message
  code: string;              // Error code for programmatic handling
  severity: ValidationSeverity; // Error severity
  context: ValidationContext;   // Validation context
  path?: string[];           // Path to the field (for nested fields)
  value?: any;               // Value that failed validation
}

/**
 * Validation result structure
 */
export interface ValidationResult {
  valid: boolean;            // Whether validation passed
  errors: ValidationError[]; // List of validation errors
  context: ValidationContext; // Validation context
  validatedData?: any;      // The validated data if valid
}

/**
 * Create a validation error with standard format
 */
export function createValidationError(
  field: string,
  message: string,
  code: string,
  severity: ValidationSeverity = ValidationSeverity.ERROR,
  context: ValidationContext = ValidationContext.CLIENT,
  value?: any,
  path?: string[]
): ValidationError {
  return {
    field,
    message,
    code,
    severity,
    context,
    value,
    path: path || [field]
  };
}

/**
 * Create a validation result with standard format
 */
export function createValidationResult(
  valid: boolean,
  errors: ValidationError[],
  context: ValidationContext,
  validatedData?: any
): ValidationResult {
  return {
    valid,
    errors,
    context,
    validatedData
  };
}