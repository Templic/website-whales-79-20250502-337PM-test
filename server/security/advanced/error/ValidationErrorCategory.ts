/**
 * Validation Error Categorization System
 * 
 * This module defines error categories and severity levels for the validation system,
 * enabling better error handling, reporting, and resolution.
 */

import secureLogger from '../../utils/secureLogger';

// Configure component name for logging
const logComponent = 'ValidationErrorCategory';

/**
 * Validation error severity levels
 */
export enum ValidationErrorSeverity {
  LOW = 'low',       // Low-impact errors, typically UI/UX issues
  MEDIUM = 'medium', // Medium-impact errors, may affect functionality but not security
  HIGH = 'high',     // High-impact errors, may affect security or critical functionality
  CRITICAL = 'critical' // Critical errors, must be addressed immediately
}

/**
 * Validation error categories
 */
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
  // Zod error codes
  'invalid_type': {
    category: ValidationErrorCategory.SCHEMA_TYPE_ERROR,
    severity: ValidationErrorSeverity.MEDIUM
  },
  'invalid_string': {
    category: ValidationErrorCategory.SCHEMA_CONSTRAINT_ERROR,
    severity: ValidationErrorSeverity.MEDIUM
  },
  'too_small': {
    category: ValidationErrorCategory.SCHEMA_CONSTRAINT_ERROR,
    severity: ValidationErrorSeverity.MEDIUM
  },
  'too_big': {
    category: ValidationErrorCategory.SCHEMA_CONSTRAINT_ERROR,
    severity: ValidationErrorSeverity.MEDIUM
  },
  'invalid_enum_value': {
    category: ValidationErrorCategory.SCHEMA_CONSTRAINT_ERROR,
    severity: ValidationErrorSeverity.MEDIUM
  },
  'invalid_arguments': {
    category: ValidationErrorCategory.SCHEMA_CONSTRAINT_ERROR,
    severity: ValidationErrorSeverity.MEDIUM
  },
  'invalid_return_type': {
    category: ValidationErrorCategory.SCHEMA_CONSTRAINT_ERROR,
    severity: ValidationErrorSeverity.MEDIUM
  },
  'invalid_date': {
    category: ValidationErrorCategory.SCHEMA_FORMAT_ERROR,
    severity: ValidationErrorSeverity.MEDIUM
  },
  'invalid_string.email': {
    category: ValidationErrorCategory.SCHEMA_FORMAT_ERROR,
    severity: ValidationErrorSeverity.MEDIUM
  },
  'invalid_string.url': {
    category: ValidationErrorCategory.SCHEMA_FORMAT_ERROR,
    severity: ValidationErrorSeverity.MEDIUM
  },
  'invalid_string.uuid': {
    category: ValidationErrorCategory.SCHEMA_FORMAT_ERROR,
    severity: ValidationErrorSeverity.MEDIUM
  },
  'required_error': {
    category: ValidationErrorCategory.SCHEMA_REQUIRED_ERROR,
    severity: ValidationErrorSeverity.MEDIUM
  },
  
  // Security error codes
  'sql_injection': {
    category: ValidationErrorCategory.SECURITY_INJECTION,
    severity: ValidationErrorSeverity.CRITICAL
  },
  'xss': {
    category: ValidationErrorCategory.SECURITY_XSS,
    severity: ValidationErrorSeverity.CRITICAL
  },
  'csrf': {
    category: ValidationErrorCategory.SECURITY_CSRF,
    severity: ValidationErrorSeverity.HIGH
  },
  'auth_failure': {
    category: ValidationErrorCategory.SECURITY_AUTH,
    severity: ValidationErrorSeverity.HIGH
  },
  'access_denied': {
    category: ValidationErrorCategory.SECURITY_ACCESS,
    severity: ValidationErrorSeverity.HIGH
  },
  
  // Database error codes
  'db_query': {
    category: ValidationErrorCategory.DB_QUERY_ERROR,
    severity: ValidationErrorSeverity.HIGH
  },
  'db_constraint': {
    category: ValidationErrorCategory.DB_CONSTRAINT_ERROR,
    severity: ValidationErrorSeverity.HIGH
  },
  'db_relation': {
    category: ValidationErrorCategory.DB_RELATION_ERROR,
    severity: ValidationErrorSeverity.HIGH
  },
  
  // System error codes
  'timeout': {
    category: ValidationErrorCategory.SYSTEM_TIMEOUT,
    severity: ValidationErrorSeverity.MEDIUM
  },
  'dependency_failure': {
    category: ValidationErrorCategory.SYSTEM_DEPENDENCY,
    severity: ValidationErrorSeverity.HIGH
  },
  'config_error': {
    category: ValidationErrorCategory.SYSTEM_CONFIG,
    severity: ValidationErrorSeverity.HIGH
  }
};

/**
 * Patterns to match in error messages for categorization
 */
export const errorPatternMap: Array<{
  pattern: RegExp;
  category: ValidationErrorCategory;
  severity: ValidationErrorSeverity;
}> = [
  // Security patterns
  {
    pattern: /(?:sql|database)\s+injection/i,
    category: ValidationErrorCategory.SECURITY_INJECTION,
    severity: ValidationErrorSeverity.CRITICAL
  },
  {
    pattern: /cross[\s-]site\s+scripting|xss/i,
    category: ValidationErrorCategory.SECURITY_XSS,
    severity: ValidationErrorSeverity.CRITICAL
  },
  {
    pattern: /csrf|cross[\s-]site\s+request\s+forgery/i,
    category: ValidationErrorCategory.SECURITY_CSRF,
    severity: ValidationErrorSeverity.HIGH
  },
  {
    pattern: /(?:invalid|expired|missing)\s+(?:token|session|credential)/i,
    category: ValidationErrorCategory.SECURITY_AUTH,
    severity: ValidationErrorSeverity.HIGH
  },
  {
    pattern: /(?:unauthorized|forbidden|permission\s+denied)/i,
    category: ValidationErrorCategory.SECURITY_ACCESS,
    severity: ValidationErrorSeverity.HIGH
  },
  
  // Database patterns
  {
    pattern: /(?:invalid|malformed)\s+(?:query|sql)/i,
    category: ValidationErrorCategory.DB_QUERY_ERROR,
    severity: ValidationErrorSeverity.HIGH
  },
  {
    pattern: /(?:constraint|unique|duplicate)\s+violation/i,
    category: ValidationErrorCategory.DB_CONSTRAINT_ERROR,
    severity: ValidationErrorSeverity.MEDIUM
  },
  {
    pattern: /(?:foreign\s+key|relation)\s+(?:constraint|error)/i,
    category: ValidationErrorCategory.DB_RELATION_ERROR,
    severity: ValidationErrorSeverity.HIGH
  },
  
  // Schema patterns
  {
    pattern: /(?:expected|invalid)\s+type/i,
    category: ValidationErrorCategory.SCHEMA_TYPE_ERROR,
    severity: ValidationErrorSeverity.MEDIUM
  },
  {
    pattern: /(?:too\s+(?:short|long|small|large)|invalid\s+(?:format|value))/i,
    category: ValidationErrorCategory.SCHEMA_CONSTRAINT_ERROR,
    severity: ValidationErrorSeverity.MEDIUM
  },
  {
    pattern: /(?:required|missing)(?:\s+field|\s+property)?/i,
    category: ValidationErrorCategory.SCHEMA_REQUIRED_ERROR,
    severity: ValidationErrorSeverity.MEDIUM
  },
  {
    pattern: /(?:invalid|malformed)\s+(?:email|url|phone|date|format)/i,
    category: ValidationErrorCategory.SCHEMA_FORMAT_ERROR,
    severity: ValidationErrorSeverity.MEDIUM
  },
  
  // System patterns
  {
    pattern: /(?:timeout|timed\s+out)/i,
    category: ValidationErrorCategory.SYSTEM_TIMEOUT,
    severity: ValidationErrorSeverity.MEDIUM
  },
  {
    pattern: /(?:dependency|service)\s+(?:unavailable|failure|error)/i,
    category: ValidationErrorCategory.SYSTEM_DEPENDENCY,
    severity: ValidationErrorSeverity.HIGH
  },
  {
    pattern: /(?:configuration|config)\s+(?:invalid|error|missing)/i,
    category: ValidationErrorCategory.SYSTEM_CONFIG,
    severity: ValidationErrorSeverity.HIGH
  }
];

/**
 * Categorize an error based on code or message pattern
 */
export function categorizeError(error: { code?: string; message: string }): { 
  category: ValidationErrorCategory; 
  severity: ValidationErrorSeverity;
} {
  // Check for error code match
  if (error.code && errorCategoryMap[error.code]) {
    return errorCategoryMap[error.code];
  }
  
  // Check for error code + message type
  if (error.code && error.message) {
    const combinedCode = `${error.code}.${error.message.toLowerCase()}`;
    if (errorCategoryMap[combinedCode]) {
      return errorCategoryMap[combinedCode];
    }
  }
  
  // Check for pattern match in message
  if (error.message) {
    for (const patternMatch of errorPatternMap) {
      if (patternMatch.pattern.test(error.message)) {
        return {
          category: patternMatch.category,
          severity: patternMatch.severity
        };
      }
    }
  }
  
  // Default to unknown
  return {
    category: ValidationErrorCategory.UNKNOWN,
    severity: ValidationErrorSeverity.MEDIUM
  };
}

/**
 * Enhanced error handler that categorizes errors and adds metadata
 */
export function enhanceValidationError(error: any): ValidationError {
  try {
    // Basic error info
    const enhancedError: ValidationError = {
      message: error.message || 'Unknown validation error',
      path: error.path || undefined,
      code: error.code || undefined
    };
    
    // Categorize the error
    const categorization = categorizeError(error);
    enhancedError.type = categorization.category;
    enhancedError.severity = categorization.severity;
    
    // Add metadata if available
    if (error.metadata) {
      enhancedError.metadata = { ...error.metadata };
    }
    
    secureLogger('info', logComponent, 'Enhanced validation error', {
      metadata: {
        originalError: {
          message: error.message,
          code: error.code,
          path: error.path
        },
        enhancedError
      }
    });
    
    return enhancedError;
  } catch (enhancementError) {
    // If enhancement fails, return a basic error
    secureLogger('error', logComponent, 'Error enhancing validation error', {
      metadata: {
        error: enhancementError instanceof Error ? enhancementError.message : String(enhancementError),
        originalError: error
      }
    });
    
    return {
      message: error.message || 'Unknown validation error',
      type: ValidationErrorCategory.UNKNOWN,
      severity: ValidationErrorSeverity.MEDIUM
    };
  }
}

/**
 * Create a human-readable description for an error category
 */
export function getErrorCategoryDescription(category: ValidationErrorCategory): string {
  switch (category) {
    case ValidationErrorCategory.SCHEMA_TYPE_ERROR:
      return 'The data type of one or more fields is incorrect.';
    case ValidationErrorCategory.SCHEMA_CONSTRAINT_ERROR:
      return 'One or more fields failed to meet specified constraints (e.g., length, range).';
    case ValidationErrorCategory.SCHEMA_REQUIRED_ERROR:
      return 'One or more required fields are missing.';
    case ValidationErrorCategory.SCHEMA_FORMAT_ERROR:
      return 'One or more fields have an invalid format (e.g., email, URL).';
    case ValidationErrorCategory.SECURITY_INJECTION:
      return 'Potential injection attack detected in the input.';
    case ValidationErrorCategory.SECURITY_XSS:
      return 'Potential cross-site scripting (XSS) vulnerability detected.';
    case ValidationErrorCategory.SECURITY_CSRF:
      return 'Cross-site request forgery (CSRF) protection failed.';
    case ValidationErrorCategory.SECURITY_AUTH:
      return 'Authentication issue detected.';
    case ValidationErrorCategory.SECURITY_ACCESS:
      return 'Authorization or access control issue detected.';
    case ValidationErrorCategory.DB_QUERY_ERROR:
      return 'Invalid database query detected.';
    case ValidationErrorCategory.DB_CONSTRAINT_ERROR:
      return 'Database constraint violation detected.';
    case ValidationErrorCategory.DB_RELATION_ERROR:
      return 'Invalid database relation detected.';
    case ValidationErrorCategory.AI_CONTENT_POLICY:
      return 'Content violates the system\'s content policy.';
    case ValidationErrorCategory.AI_THREAT_DETECTED:
      return 'AI system detected a potential security threat.';
    case ValidationErrorCategory.AI_ANOMALY:
      return 'AI system detected unusual or anomalous behavior.';
    case ValidationErrorCategory.SYSTEM_TIMEOUT:
      return 'Operation timed out during processing.';
    case ValidationErrorCategory.SYSTEM_DEPENDENCY:
      return 'A system dependency failed or was unavailable.';
    case ValidationErrorCategory.SYSTEM_CONFIG:
      return 'System configuration error detected.';
    case ValidationErrorCategory.UNKNOWN:
    default:
      return 'Unknown or unclassified error.';
  }
}

/**
 * Get suggested actions for resolving an error based on its category
 */
export function getErrorResolutionSteps(category: ValidationErrorCategory): string[] {
  switch (category) {
    case ValidationErrorCategory.SCHEMA_TYPE_ERROR:
      return [
        'Check the data types of all fields in your request.',
        'Ensure numbers are not sent as strings, dates are in the correct format, etc.',
        'Refer to the API documentation for the expected data types.'
      ];
    case ValidationErrorCategory.SCHEMA_CONSTRAINT_ERROR:
      return [
        'Check if values meet all specified constraints (min/max length, range, etc.).',
        'Verify that values are within acceptable ranges or formats.',
        'Refer to the API documentation for specific constraints.'
      ];
    case ValidationErrorCategory.SCHEMA_REQUIRED_ERROR:
      return [
        'Ensure all required fields are included in your request.',
        'Check for typos in field names.',
        'Refer to the API documentation for the list of required fields.'
      ];
    case ValidationErrorCategory.SCHEMA_FORMAT_ERROR:
      return [
        'Check the format of fields like email, URL, phone number, etc.',
        'Ensure the values adhere to the expected formats.',
        'Validate formats client-side before submission.'
      ];
    case ValidationErrorCategory.SECURITY_INJECTION:
      return [
        'Remove any SQL or script syntax from your input.',
        'Use parameterized values instead of constructing queries manually.',
        'Apply proper escaping to special characters.'
      ];
    case ValidationErrorCategory.SECURITY_XSS:
      return [
        'Remove HTML/JavaScript code from text input fields.',
        'Use plain text instead of HTML where possible.',
        'Escape special characters in user-generated content.'
      ];
    case ValidationErrorCategory.SECURITY_CSRF:
      return [
        'Include the CSRF token in your request headers or form data.',
        'Ensure your session is valid and not expired.',
        'Avoid submitting forms in multiple tabs simultaneously.'
      ];
    case ValidationErrorCategory.SECURITY_AUTH:
      return [
        'Check that your authentication credentials are valid.',
        'Ensure your session or token has not expired.',
        'Log in again to obtain a fresh session/token.'
      ];
    case ValidationErrorCategory.SECURITY_ACCESS:
      return [
        'Verify that you have permission to access the requested resource.',
        'Check if your account has the necessary role or privileges.',
        'Contact the system administrator if you believe this is an error.'
      ];
    case ValidationErrorCategory.DB_QUERY_ERROR:
      return [
        'Check the query syntax for errors.',
        'Verify that all referenced tables and columns exist.',
        'Ensure the query is appropriate for the database type (SQL, NoSQL).'
      ];
    case ValidationErrorCategory.DB_CONSTRAINT_ERROR:
      return [
        'Check for duplicate key violations.',
        'Ensure values meet database constraints (unique, not null, etc.).',
        'Verify that values are within acceptable ranges for the columns.'
      ];
    case ValidationErrorCategory.DB_RELATION_ERROR:
      return [
        'Verify that referenced records exist in the related tables.',
        'Check that foreign key relationships are maintained.',
        'Ensure cascading deletes are handled properly.'
      ];
    case ValidationErrorCategory.AI_CONTENT_POLICY:
      return [
        'Review your content for policy violations.',
        'Remove any potentially offensive, harmful, or prohibited content.',
        'Check the content policy documentation for specific guidelines.'
      ];
    case ValidationErrorCategory.AI_THREAT_DETECTED:
      return [
        'Remove any potentially malicious content from your request.',
        'Check for accidental inclusion of script or code snippets.',
        'If you believe this is a false positive, contact support.'
      ];
    case ValidationErrorCategory.AI_ANOMALY:
      return [
        'Check if your request deviates significantly from normal usage patterns.',
        'Verify that the request is not part of an automated or high-frequency batch.',
        'Try again with a more typical request pattern.'
      ];
    case ValidationErrorCategory.SYSTEM_TIMEOUT:
      return [
        'Try the request again after a short delay.',
        'Consider breaking large requests into smaller chunks.',
        'Check network connectivity and latency.'
      ];
    case ValidationErrorCategory.SYSTEM_DEPENDENCY:
      return [
        'Verify that all required services are available.',
        'Check external dependencies that might be affecting the system.',
        'Try again later as the issue might be temporary.'
      ];
    case ValidationErrorCategory.SYSTEM_CONFIG:
      return [
        'Check configuration settings for errors.',
        'Verify environment variables and settings are correct.',
        'Contact the system administrator for configuration issues.'
      ];
    case ValidationErrorCategory.UNKNOWN:
    default:
      return [
        'Check all inputs for errors or inconsistencies.',
        'Verify that the request format follows the API documentation.',
        'If the issue persists, contact support with details of your request.'
      ];
  }
}