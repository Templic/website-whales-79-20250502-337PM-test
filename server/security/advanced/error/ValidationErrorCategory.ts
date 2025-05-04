/**
 * Validation Error Categorization System
 * 
 * This module defines error categories and severity levels for the validation system,
 * enabling better error handling, reporting, and resolution.
 */

export enum ValidationErrorSeverity {
  LOW = 'low',       // Low-impact errors, typically UI/UX issues
  MEDIUM = 'medium', // Medium-impact errors, may affect functionality but not security
  HIGH = 'high',     // High-impact errors, may affect security or critical functionality
  CRITICAL = 'critical' // Critical errors, must be addressed immediately
}

export enum ValidationErrorCategory {
  // Schema validation errors
  SCHEMA_TYPE_ERROR = 'schema_type_error',         // Data type mismatch
  SCHEMA_CONSTRAINT_ERROR = 'schema_constraint_error', // Constraint violation (min, max, etc.)
  SCHEMA_REQUIRED_ERROR = 'schema_required_error',    // Missing required field
  SCHEMA_FORMAT_ERROR = 'schema_format_error',      // Format violation (email, url, etc.)
  
  // Security validation errors
  SECURITY_INJECTION = 'security_injection',       // Potential injection attack
  SECURITY_XSS = 'security_xss',                 // Cross-site scripting threat
  SECURITY_CSRF = 'security_csrf',               // CSRF token missing or invalid
  SECURITY_AUTH = 'security_auth',               // Authentication issue
  SECURITY_ACCESS = 'security_access',            // Access control issue
  
  // Database validation errors
  DB_QUERY_ERROR = 'db_query_error',             // Invalid SQL query
  DB_CONSTRAINT_ERROR = 'db_constraint_error',     // Database constraint violation
  DB_RELATION_ERROR = 'db_relation_error',        // Invalid relation (foreign key, etc.)
  
  // AI validation errors
  AI_CONTENT_POLICY = 'ai_content_policy',        // Content policy violation
  AI_THREAT_DETECTED = 'ai_threat_detected',       // AI-detected security threat
  AI_ANOMALY = 'ai_anomaly',                  // Unusual request pattern detected
  
  // System errors
  SYSTEM_TIMEOUT = 'system_timeout',             // Validation timed out
  SYSTEM_DEPENDENCY = 'system_dependency',         // Dependency failure
  SYSTEM_CONFIG = 'system_config',               // Configuration error
  
  // Unknown errors
  UNKNOWN = 'unknown'                         // Unclassified error
}

/**
 * Validation error entry with categorization
 */
export interface ValidationError {
  message: string;
  path?: string | string[];
  code?: string;
  type?: ValidationErrorCategory;
  severity?: ValidationErrorSeverity;
  metadata?: Record<string, any>;
}

/**
 * Maps error codes or patterns to categories and severity
 */
export const errorCategoryMap: Record<string, { 
  category: ValidationErrorCategory, 
  severity: ValidationErrorSeverity 
}> = {
  // Schema validation errors
  'invalid_type': { category: ValidationErrorCategory.SCHEMA_TYPE_ERROR, severity: ValidationErrorSeverity.MEDIUM },
  'too_small': { category: ValidationErrorCategory.SCHEMA_CONSTRAINT_ERROR, severity: ValidationErrorSeverity.MEDIUM },
  'too_big': { category: ValidationErrorCategory.SCHEMA_CONSTRAINT_ERROR, severity: ValidationErrorSeverity.MEDIUM },
  'invalid_string': { category: ValidationErrorCategory.SCHEMA_FORMAT_ERROR, severity: ValidationErrorSeverity.MEDIUM },
  'required_error': { category: ValidationErrorCategory.SCHEMA_REQUIRED_ERROR, severity: ValidationErrorSeverity.MEDIUM },
  
  // Security validation errors
  'sql_injection': { category: ValidationErrorCategory.SECURITY_INJECTION, severity: ValidationErrorSeverity.CRITICAL },
  'xss_detected': { category: ValidationErrorCategory.SECURITY_XSS, severity: ValidationErrorSeverity.CRITICAL },
  'csrf_error': { category: ValidationErrorCategory.SECURITY_CSRF, severity: ValidationErrorSeverity.HIGH },
  'auth_error': { category: ValidationErrorCategory.SECURITY_AUTH, severity: ValidationErrorSeverity.HIGH },
  'access_denied': { category: ValidationErrorCategory.SECURITY_ACCESS, severity: ValidationErrorSeverity.HIGH },
  
  // Database validation errors
  'db_query': { category: ValidationErrorCategory.DB_QUERY_ERROR, severity: ValidationErrorSeverity.HIGH },
  'db_constraint': { category: ValidationErrorCategory.DB_CONSTRAINT_ERROR, severity: ValidationErrorSeverity.MEDIUM },
  'db_relation': { category: ValidationErrorCategory.DB_RELATION_ERROR, severity: ValidationErrorSeverity.MEDIUM },
  
  // AI validation errors
  'content_policy': { category: ValidationErrorCategory.AI_CONTENT_POLICY, severity: ValidationErrorSeverity.HIGH },
  'ai_threat': { category: ValidationErrorCategory.AI_THREAT_DETECTED, severity: ValidationErrorSeverity.CRITICAL },
  'anomaly': { category: ValidationErrorCategory.AI_ANOMALY, severity: ValidationErrorSeverity.MEDIUM },
  
  // System errors
  'timeout': { category: ValidationErrorCategory.SYSTEM_TIMEOUT, severity: ValidationErrorSeverity.MEDIUM },
  'dependency': { category: ValidationErrorCategory.SYSTEM_DEPENDENCY, severity: ValidationErrorSeverity.HIGH },
  'config': { category: ValidationErrorCategory.SYSTEM_CONFIG, severity: ValidationErrorSeverity.HIGH }
};

/**
 * Categorize an error based on code or message pattern
 */
export function categorizeError(error: { code?: string; message: string }): { 
  category: ValidationErrorCategory; 
  severity: ValidationErrorSeverity;
} {
  // Try to match by code first
  if (error.code && errorCategoryMap[error.code]) {
    return errorCategoryMap[error.code];
  }
  
  // Then try to match by message patterns
  const message = error.message.toLowerCase();
  
  if (message.includes('sql') && (message.includes('injection') || message.includes('syntax'))) {
    return { category: ValidationErrorCategory.SECURITY_INJECTION, severity: ValidationErrorSeverity.CRITICAL };
  }
  
  if (message.includes('xss') || message.includes('script') || message.includes('cross-site')) {
    return { category: ValidationErrorCategory.SECURITY_XSS, severity: ValidationErrorSeverity.CRITICAL };
  }
  
  if (message.includes('csrf') || message.includes('token')) {
    return { category: ValidationErrorCategory.SECURITY_CSRF, severity: ValidationErrorSeverity.HIGH };
  }
  
  if (message.includes('required')) {
    return { category: ValidationErrorCategory.SCHEMA_REQUIRED_ERROR, severity: ValidationErrorSeverity.MEDIUM };
  }
  
  if (message.includes('type')) {
    return { category: ValidationErrorCategory.SCHEMA_TYPE_ERROR, severity: ValidationErrorSeverity.MEDIUM };
  }
  
  if (message.includes('min') || message.includes('max') || message.includes('length') || message.includes('size')) {
    return { category: ValidationErrorCategory.SCHEMA_CONSTRAINT_ERROR, severity: ValidationErrorSeverity.MEDIUM };
  }
  
  if (message.includes('email') || message.includes('url') || message.includes('format')) {
    return { category: ValidationErrorCategory.SCHEMA_FORMAT_ERROR, severity: ValidationErrorSeverity.MEDIUM };
  }
  
  if (message.includes('timeout')) {
    return { category: ValidationErrorCategory.SYSTEM_TIMEOUT, severity: ValidationErrorSeverity.MEDIUM };
  }
  
  // Default to unknown
  return { category: ValidationErrorCategory.UNKNOWN, severity: ValidationErrorSeverity.MEDIUM };
}

/**
 * Enhanced error handler that categorizes errors and adds metadata
 */
export function enhanceValidationError(error: any): ValidationError {
  // Start with basic error properties
  const enhancedError: ValidationError = {
    message: error.message || 'Unknown validation error',
    path: error.path,
    code: error.code
  };
  
  // Categorize the error
  const { category, severity } = categorizeError(error);
  enhancedError.type = category;
  enhancedError.severity = severity;
  
  // Add any additional metadata from the original error
  if (error.metadata) {
    enhancedError.metadata = { ...error.metadata };
  } else {
    enhancedError.metadata = {};
  }
  
  // Add timestamp for tracking
  enhancedError.metadata.timestamp = new Date().toISOString();
  
  return enhancedError;
}

/**
 * Create a human-readable description for an error category
 */
export function getErrorCategoryDescription(category: ValidationErrorCategory): string {
  switch (category) {
    case ValidationErrorCategory.SCHEMA_TYPE_ERROR:
      return 'The data provided has an incorrect type (e.g., string instead of number)';
    case ValidationErrorCategory.SCHEMA_CONSTRAINT_ERROR:
      return 'The data provided violates constraints (e.g., too short, too long)';
    case ValidationErrorCategory.SCHEMA_REQUIRED_ERROR:
      return 'A required field is missing from the request';
    case ValidationErrorCategory.SCHEMA_FORMAT_ERROR:
      return 'The data format is invalid (e.g., incorrect email format)';
    case ValidationErrorCategory.SECURITY_INJECTION:
      return 'Potential injection attack detected in the request';
    case ValidationErrorCategory.SECURITY_XSS:
      return 'Cross-site scripting vulnerability detected';
    case ValidationErrorCategory.SECURITY_CSRF:
      return 'Cross-site request forgery protection error';
    case ValidationErrorCategory.SECURITY_AUTH:
      return 'Authentication error';
    case ValidationErrorCategory.SECURITY_ACCESS:
      return 'Access control violation';
    case ValidationErrorCategory.DB_QUERY_ERROR:
      return 'Invalid database query';
    case ValidationErrorCategory.DB_CONSTRAINT_ERROR:
      return 'Database constraint violation';
    case ValidationErrorCategory.DB_RELATION_ERROR:
      return 'Invalid database relation';
    case ValidationErrorCategory.AI_CONTENT_POLICY:
      return 'Content policy violation detected by AI';
    case ValidationErrorCategory.AI_THREAT_DETECTED:
      return 'Security threat detected by AI';
    case ValidationErrorCategory.AI_ANOMALY:
      return 'Unusual request pattern detected by AI';
    case ValidationErrorCategory.SYSTEM_TIMEOUT:
      return 'Validation timed out';
    case ValidationErrorCategory.SYSTEM_DEPENDENCY:
      return 'Dependency failure in validation system';
    case ValidationErrorCategory.SYSTEM_CONFIG:
      return 'Validation system configuration error';
    case ValidationErrorCategory.UNKNOWN:
    default:
      return 'Unclassified validation error';
  }
}

/**
 * Get suggested actions for resolving an error based on its category
 */
export function getErrorResolutionSteps(category: ValidationErrorCategory): string[] {
  switch (category) {
    case ValidationErrorCategory.SCHEMA_TYPE_ERROR:
      return [
        'Check the data type of each field being submitted',
        'Ensure numbers are not sent as strings',
        'Verify date formats match expected formats'
      ];
    case ValidationErrorCategory.SCHEMA_CONSTRAINT_ERROR:
      return [
        'Verify field lengths meet minimum and maximum requirements',
        'Check that numeric values are within accepted ranges',
        'Ensure array items meet all constraints'
      ];
    case ValidationErrorCategory.SCHEMA_REQUIRED_ERROR:
      return [
        'Ensure all required fields are included in the request',
        'Check for null or undefined values',
        'Verify field names match expected schema'
      ];
    case ValidationErrorCategory.SCHEMA_FORMAT_ERROR:
      return [
        'Verify email addresses follow valid format',
        'Check URL format is correct and includes protocol',
        'Ensure dates follow accepted format (e.g., ISO 8601)'
      ];
    case ValidationErrorCategory.SECURITY_INJECTION:
      return [
        'Remove any SQL-like syntax from input',
        'Do not include executable code in input fields',
        'Use parameterized queries for database operations'
      ];
    // Add more resolution steps for other categories
    default:
      return [
        'Verify input data meets all requirements',
        'Check for any security-sensitive characters or patterns',
        'Contact support if the issue persists'
      ];
  }
}