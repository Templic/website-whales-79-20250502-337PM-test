/**
 * Validation Types for Client-Side Validation
 * 
 * This module defines type definitions for client-side validation.
 * It mirrors the core validation types from the shared validation system.
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
 * Convert a Zod validation error to our standard ValidationError format
 */
export function zodErrorToValidationError(
  error: z.ZodError,
  context: ValidationContext = ValidationContext.CLIENT
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
  context: ValidationContext = ValidationContext.CLIENT,
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