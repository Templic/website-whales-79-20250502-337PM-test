/**
 * Validation Framework - Core Types
 * 
 * This module defines the core types and interfaces for the three-tier validation system:
 * 1. Client-side pre-submission validation
 * 2. API endpoint validation
 * 3. Database-level constraint validation
 */

import { z } from 'zod';

/**
 * Validation severity levels
 */
export enum ValidationSeverity {
  INFO = 'info',       // Information only, not blocking
  WARNING = 'warning', // Warning, but can be ignored
  ERROR = 'error',     // Error, must be fixed
  CRITICAL = 'critical' // Critical error, security implications
}

/**
 * Validation context - defines where the validation is occurring
 */
export enum ValidationContext {
  CLIENT = 'client',   // Client-side form validation
  API = 'api',         // API endpoint validation
  DATABASE = 'database', // Database constraint validation
  CUSTOM = 'custom'    // Custom business rule validation
}

/**
 * Validation error type
 */
export interface ValidationError {
  field: string;       // Field with the error
  message: string;     // Human-readable error message
  code: string;        // Error code for programmatic handling
  severity: ValidationSeverity; // Error severity
  context: ValidationContext; // Validation context
  path?: string[];     // Path to the field (for nested objects)
  value?: any;         // Value that failed validation
  constraints?: Record<string, string>; // Constraint details
  metadata?: Record<string, any>; // Additional metadata
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;      // Whether validation passed
  errors: ValidationError[]; // Validation errors if any
  context: ValidationContext; // Context in which validation occurred
  timestamp: number;   // When validation occurred
  fieldValues?: Record<string, any>; // Values that were validated
  validatedData?: any; // The validated data (if successful)
}

/**
 * Validation options
 */
export interface ValidationOptions {
  abortEarly?: boolean; // Stop at first error
  context?: ValidationContext; // Context for validation
  strictMode?: boolean; // Strict validation mode
  allowUnknown?: boolean; // Allow unknown fields
  stripUnknown?: boolean; // Strip unknown fields
  customMessages?: Record<string, string>; // Custom error messages
  contextData?: Record<string, any>; // Additional context data
}

/**
 * Validator function type
 */
export type ValidatorFn<T = any> = (
  value: T, 
  options?: ValidationOptions
) => ValidationResult;

/**
 * Async validator function type
 */
export type AsyncValidatorFn<T = any> = (
  value: T, 
  options?: ValidationOptions
) => Promise<ValidationResult>;

/**
 * Validation rule
 */
export interface ValidationRule<T = any> {
  validator: ValidatorFn<T> | AsyncValidatorFn<T>; // Validator function
  message: string;     // Error message
  code: string;        // Error code
  severity?: ValidationSeverity; // Error severity
  condition?: (value: T) => boolean; // Condition when rule applies
  metadata?: Record<string, any>; // Additional metadata
}

/**
 * Common validation pattern type for reuse across validators
 */
export interface ValidationPattern {
  pattern: RegExp;
  message: string;
  code: string;
}

/**
 * Field validator definition
 */
export interface FieldValidator<T = any> {
  field: string;       // Field name
  rules: ValidationRule<T>[]; // Validation rules
  isRequired?: boolean; // Whether field is required
  defaultValue?: T;    // Default value if absent
  dependencies?: string[]; // Fields this one depends on
  transform?: (value: any) => T; // Transform value before validation
}

/**
 * Form or object validator
 */
export interface ObjectValidator {
  fields: Record<string, FieldValidator>; // Field validators
  customRules?: ValidationRule[]; // Cross-field validation rules
  options?: ValidationOptions; // Validation options
}

/**
 * Error category for grouping errors
 */
export enum ErrorCategory {
  VALIDATION = 'validation',
  BUSINESS_RULE = 'business_rule',
  SYSTEM = 'system',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  NETWORK = 'network',
  DATABASE = 'database',
  UNKNOWN = 'unknown'
}

/**
 * Normalized error response
 */
export interface NormalizedError {
  message: string;     // User-friendly error message
  code: string;        // Error code
  category: ErrorCategory; // Error category
  statusCode?: number; // HTTP status code
  path?: string;       // Request path
  timestamp: number;   // Error timestamp
  correlationId?: string; // Request correlation ID
  errors?: ValidationError[]; // Validation errors if any
  stack?: string;      // Stack trace (omitted in production)
  contextData?: Record<string, any>; // Additional context
}

/**
 * Convert a Zod validation error to our standard ValidationError format
 */
export function zodErrorToValidationError(
  error: z.ZodError,
  context: ValidationContext = ValidationContext.API
): ValidationError[] {
  return error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
    severity: ValidationSeverity.ERROR,
    context,
    path: err.path.map(p => String(p)),
    value: err.message ? err.message : undefined
  }));
}

/**
 * Create a validation result
 */
export function createValidationResult(
  valid: boolean,
  errors: ValidationError[] = [],
  context: ValidationContext = ValidationContext.API,
  validatedData?: any
): ValidationResult {
  return {
    valid,
    errors,
    context,
    timestamp: Date.now(),
    validatedData
  };
}

/**
 * Create a validation error
 */
export function createValidationError(
  field: string,
  message: string,
  code: string,
  severity: ValidationSeverity = ValidationSeverity.ERROR,
  context: ValidationContext = ValidationContext.API,
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
 * Create a normalized error response
 */
export function createNormalizedError(
  message: string,
  code: string,
  category: ErrorCategory = ErrorCategory.VALIDATION,
  statusCode: number = 400,
  errors?: ValidationError[]
): NormalizedError {
  return {
    message,
    code,
    category,
    statusCode,
    timestamp: Date.now(),
    correlationId: generateCorrelationId(),
    errors
  };
}

/**
 * Generate a correlation ID for tracking errors
 */
function generateCorrelationId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}