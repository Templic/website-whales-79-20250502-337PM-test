/**
 * Core Error Type Definitions
 * 
 * This file defines the base error types used throughout the application.
 * These types ensure consistent error handling and provide type safety
 * for error objects across the codebase.
 */

/**
 * Base error interface that all error types extend
 */
export interface BaseError extends Error {
  // Standard Error properties
  name: string;
  message: string;
  stack?: string;
  
  // Extended properties
  code: string | number;
  statusCode?: number;
  timestamp?: number;
  details?: Record<string, any>;
}

/**
 * Security-related errors
 */
export interface SecurityError extends BaseError {
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: {
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    endpoint?: string;
    [key: string]: any;
  };
}

/**
 * Validation errors for form inputs and API payloads
 */
export interface ValidationError extends BaseError {
  fieldErrors: Record<string, string>;
}

/**
 * Database operation errors
 */
export interface DatabaseError extends BaseError {
  operation?: 'query' | 'insert' | 'update' | 'delete' | 'transaction';
  query?: string;
  params?: unknown[];
  dbErrorCode?: string | number;
}

/**
 * API-related errors (both internal and external)
 */
export interface ApiError extends BaseError {
  endpoint?: string;
  method?: string;
  requestData?: unknown;
  responseData?: unknown;
}

/**
 * Authentication and authorization errors
 */
export interface AuthError extends SecurityError {
  authErrorType: 'unauthorized' | 'forbidden' | 'invalid_token' | 'expired_token' | 'missing_token';
  requiredPermission?: string;
}

/**
 * Rate limiting errors
 */
export interface RateLimitError extends SecurityError {
  limit: number;
  current: number;
  resetTime?: number;
  scope?: string;
}

/**
 * Content or resource not found errors
 */
export interface NotFoundError extends BaseError {
  resourceType: string;
  resourceId?: string | number;
}

/**
 * External service errors
 */
export interface ExternalServiceError extends BaseError {
  service: string;
  endpoint?: string;
  responseStatus?: number;
  responseData?: unknown;
}

/**
 * Configuration errors
 */
export interface ConfigError extends BaseError {
  missingConfig?: string[];
  invalidConfig?: Record<string, string>;
}

/**
 * File operation errors
 */
export interface FileError extends BaseError {
  operation: 'read' | 'write' | 'delete' | 'move' | 'copy';
  path: string;
  targetPath?: string;
}

/**
 * Type guard for checking if an error is a BaseError
 */
export function isBaseError(error: unknown): error is BaseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    'message' in error &&
    'code' in error
  );
}

/**
 * Type guard for SecurityError
 */
export function isSecurityError(error: unknown): error is SecurityError {
  return (
    isBaseError(error) &&
    'severity' in error
  );
}

/**
 * Type guard for ValidationError
 */
export function isValidationError(error: unknown): error is ValidationError {
  return (
    isBaseError(error) &&
    'fieldErrors' in error
  );
}

/**
 * Type guard for DatabaseError
 */
export function isDatabaseError(error: unknown): error is DatabaseError {
  return (
    isBaseError(error) &&
    (
      'operation' in error ||
      'query' in error ||
      'dbErrorCode' in error
    )
  );
}

/**
 * Type guard for ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    isBaseError(error) &&
    (
      'endpoint' in error ||
      'method' in error ||
      'requestData' in error
    )
  );
}

/**
 * Type guard for AuthError
 */
export function isAuthError(error: unknown): error is AuthError {
  return (
    isSecurityError(error) &&
    'authErrorType' in error
  );
}

/**
 * Type guard for RateLimitError
 */
export function isRateLimitError(error: unknown): error is RateLimitError {
  return (
    isSecurityError(error) &&
    'limit' in error &&
    'current' in error
  );
}

/**
 * Type guard for NotFoundError
 */
export function isNotFoundError(error: unknown): error is NotFoundError {
  return (
    isBaseError(error) &&
    'resourceType' in error
  );
}

/**
 * Type guard for ExternalServiceError
 */
export function isExternalServiceError(error: unknown): error is ExternalServiceError {
  return (
    isBaseError(error) &&
    'service' in error
  );
}

/**
 * Error factory function for creating properly typed errors
 */
export function createError<T extends BaseError>(
  type: 'base' | 'security' | 'validation' | 'database' | 'api' | 'auth' | 'ratelimit' | 'notfound' | 'externalservice' | 'config' | 'file',
  message: string,
  details: Partial<T>
): T {
  const baseError: BaseError = {
    name: details.name || 'Error',
    message,
    code: details.code || 'ERROR',
    statusCode: details.statusCode || 500,
    timestamp: details.timestamp || Date.now(),
    stack: details.stack || new Error().stack,
    details: details.details
  };
  
  switch (type) {
    case 'security':
      return {
        ...baseError,
        name: 'SecurityError',
        severity: (details as any).severity || 'medium',
        context: (details as any).context || {}
      } as unknown as T;
      
    case 'validation':
      return {
        ...baseError,
        name: 'ValidationError',
        statusCode: 400,
        fieldErrors: (details as any).fieldErrors || {}
      } as unknown as T;
      
    case 'database':
      return {
        ...baseError,
        name: 'DatabaseError',
        operation: (details as any).operation,
        query: (details as any).query,
        params: (details as any).params,
        dbErrorCode: (details as any).dbErrorCode
      } as unknown as T;
      
    case 'api':
      return {
        ...baseError,
        name: 'ApiError',
        endpoint: (details as any).endpoint,
        method: (details as any).method,
        requestData: (details as any).requestData,
        responseData: (details as any).responseData
      } as unknown as T;
      
    case 'auth':
      return {
        ...baseError,
        name: 'AuthError',
        severity: (details as any).severity || 'high',
        authErrorType: (details as any).authErrorType || 'unauthorized',
        requiredPermission: (details as any).requiredPermission,
        context: (details as any).context || {}
      } as unknown as T;
      
    case 'ratelimit':
      return {
        ...baseError,
        name: 'RateLimitError',
        severity: (details as any).severity || 'medium',
        limit: (details as any).limit,
        current: (details as any).current,
        resetTime: (details as any).resetTime,
        scope: (details as any).scope,
        statusCode: 429
      } as unknown as T;
      
    case 'notfound':
      return {
        ...baseError,
        name: 'NotFoundError',
        resourceType: (details as any).resourceType,
        resourceId: (details as any).resourceId,
        statusCode: 404
      } as unknown as T;
      
    case 'externalservice':
      return {
        ...baseError,
        name: 'ExternalServiceError',
        service: (details as any).service,
        endpoint: (details as any).endpoint,
        responseStatus: (details as any).responseStatus,
        responseData: (details as any).responseData
      } as unknown as T;
      
    case 'config':
      return {
        ...baseError,
        name: 'ConfigError',
        missingConfig: (details as any).missingConfig,
        invalidConfig: (details as any).invalidConfig
      } as unknown as T;
      
    case 'file':
      return {
        ...baseError,
        name: 'FileError',
        operation: (details as any).operation,
        path: (details as any).path,
        targetPath: (details as any).targetPath
      } as unknown as T;
      
    case 'base':
    default:
      return baseError as unknown as T;
  }
}