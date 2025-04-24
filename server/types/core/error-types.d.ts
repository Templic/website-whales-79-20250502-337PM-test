/**
 * Core Error Type Definitions
 * 
 * This file defines the base error types used throughout the application.
 * All error handling should use these types for consistency.
 */

/**
 * Base error interface extending the standard Error
 * All custom errors should extend this interface
 */
interface BaseError extends Error {
  /** Error code for categorization */
  code?: string | number;
  
  /** HTTP status code (if applicable) */
  statusCode?: number;
  
  /** Additional details about the error */
  details?: unknown;
  
  /** Timestamp when the error occurred */
  timestamp?: number;
  
  /** Stack trace */
  stack?: string;
}

/**
 * Security-related errors
 */
interface SecurityError extends BaseError {
  /** Severity level of the security error */
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  /** Suggested steps to mitigate the security issue */
  mitigationSteps?: string[];
  
  /** Security context information */
  context?: {
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    endpoint?: string;
  };
}

/**
 * Validation errors for input data
 */
interface ValidationError extends BaseError {
  /** Field-specific validation errors */
  fieldErrors?: Record<string, string>;
  
  /** The validator that caused the error */
  validator?: string;
  
  /** The invalid input that caused the error */
  invalidValue?: unknown;
}

/**
 * Database-related errors
 */
interface DatabaseError extends BaseError {
  /** The query that caused the error */
  query?: string;
  
  /** Parameters passed to the query */
  params?: unknown[];
  
  /** Database operation type */
  operation?: 'read' | 'write' | 'update' | 'delete' | 'connect';
  
  /** Database error code */
  dbErrorCode?: string | number;
}

/**
 * API request/response errors
 */
interface ApiError extends BaseError {
  /** The API endpoint that raised the error */
  endpoint?: string;
  
  /** HTTP method used in the request */
  method?: string;
  
  /** Request parameters or body */
  requestData?: unknown;
  
  /** Response data from the API */
  responseData?: unknown;
}

/**
 * Authentication and authorization errors
 */
interface AuthError extends SecurityError {
  /** The type of auth error */
  authErrorType: 'unauthorized' | 'forbidden' | 'invalid_token' | 'expired_token' | 'invalid_credentials';
  
  /** The failed permission or scope */
  requiredPermission?: string;
}

/**
 * Rate limiting errors
 */
interface RateLimitError extends SecurityError {
  /** When the rate limit will reset */
  resetTime?: number;
  
  /** Maximum allowed requests */
  limit?: number;
  
  /** Current request count */
  current?: number;
}

/**
 * Error type for unexpected exceptions
 */
interface UnexpectedError extends BaseError {
  /** Original error object */
  originalError?: unknown;
}

// Export the types for use in other files
export {
  BaseError,
  SecurityError,
  ValidationError,
  DatabaseError,
  ApiError,
  AuthError,
  RateLimitError,
  UnexpectedError
};