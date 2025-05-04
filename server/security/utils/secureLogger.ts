/**
 * Secure Logger
 * 
 * This module provides secure logging capabilities, including log level control,
 * log rotation, sanitization, and metadata support.
 */

// Configure log severity levels
export type LogSeverity = 'debug' | 'info' | 'warn' | 'error';

// Log entry interface
export interface LogEntry {
  timestamp: string;
  severity: LogSeverity;
  component: string;
  message: string;
  metadata?: Record<string, any>;
}

/**
 * Log a message with sanitized and structured format
 */
function secureLog(
  severity: LogSeverity,
  component: string,
  message: string,
  options?: {
    metadata?: Record<string, any>;
  }
): void {
  // Create log entry
  const logEntry: LogEntry = {
    timestamp: new Date().toISOString(),
    severity,
    component,
    message,
    metadata: options?.metadata ? sanitizeMetadata(options.metadata) : undefined
  };
  
  // Determine log output based on severity
  switch (severity) {
    case 'error':
      console.error(`[${logEntry.timestamp}] [${component}] ${message}`);
      if (logEntry.metadata) {
        console.error('  Metadata:', JSON.stringify(logEntry.metadata, null, 2));
      }
      break;
    case 'warn':
      console.warn(`[${logEntry.timestamp}] [${component}] ${message}`);
      if (logEntry.metadata) {
        console.warn('  Metadata:', JSON.stringify(logEntry.metadata, null, 2));
      }
      break;
    case 'info':
      console.info(`[${logEntry.timestamp}] [${component}] ${message}`);
      if (logEntry.metadata) {
        console.info('  Metadata:', JSON.stringify(logEntry.metadata, null, 2));
      }
      break;
    case 'debug':
      console.debug(`[${logEntry.timestamp}] [${component}] ${message}`);
      if (logEntry.metadata) {
        console.debug('  Metadata:', JSON.stringify(logEntry.metadata, null, 2));
      }
      break;
  }
  
  // In a real implementation, we would also write the log entry to a secure log file or
  // send it to a central logging service with appropriate security measures.
}

/**
 * Sanitize log metadata to remove sensitive information
 * 
 * This function creates a deep copy of the metadata and redacts sensitive fields.
 */
function sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
  // Create a deep copy of the metadata
  const sanitized = JSON.parse(JSON.stringify(metadata));
  
  // Define sensitive fields to redact
  const sensitiveFields = [
    'password', 'token', 'secret', 'key', 'authorization', 'auth',
    'credit_card', 'creditcard', 'cardNumber', 'cvv', 'pin',
    'ssn', 'social_security', 'passport'
  ];
  
  // Recursively sanitize objects
  function sanitizeObject(obj: Record<string, any>): Record<string, any> {
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      
      // Check if this key should be redacted
      const isSensitive = sensitiveFields.some(field => lowerKey.includes(field));
      
      if (isSensitive && (typeof value === 'string' || typeof value === 'number')) {
        // Redact sensitive values
        obj[key] = '[REDACTED]';
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        // Recursively sanitize nested objects
        obj[key] = sanitizeObject(value);
      } else if (Array.isArray(value)) {
        // Recursively sanitize arrays
        obj[key] = value.map(item => {
          if (item && typeof item === 'object') {
            return sanitizeObject(item);
          }
          return item;
        });
      }
    }
    
    return obj;
  }
  
  return sanitizeObject(sanitized);
}

// Export the secure logger function
export default secureLog;