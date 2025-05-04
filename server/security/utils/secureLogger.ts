/**
 * Secure Logger Utility
 * 
 * Provides a consistent logging interface for security-related events with
 * appropriate log levels, timestamps, and metadata.
 */

type LogLevel = 'info' | 'warning' | 'error' | 'critical' | 'debug' | 'security' | 'audit';

/**
 * Log a message with a specific log level
 * 
 * @param message The message to log
 * @param level The log level (default: 'info')
 * @param metadata Additional metadata to include
 */
export function log(message: string, level: LogLevel = 'info', metadata: Record<string, any> = {}): void {
  const timestamp = new Date().toISOString();
  const logPrefix = `[${timestamp}] [${level.padEnd(10)}]`;
  
  // Format the log message
  const formattedMessage = `${logPrefix} ${message}`;
  
  // Log to console with appropriate level
  switch (level) {
    case 'error':
    case 'critical':
      console.error(formattedMessage, Object.keys(metadata).length > 0 ? metadata : '');
      break;
    case 'warning':
      console.warn(formattedMessage, Object.keys(metadata).length > 0 ? metadata : '');
      break;
    case 'security':
    case 'audit':
      // Security and audit logs always go to error for high visibility
      console.error(formattedMessage, Object.keys(metadata).length > 0 ? metadata : '');
      
      // Also log to security audit trail if available
      try {
        const { secureAuditTrail } = require('../monitoring/secureAuditTrail');
        secureAuditTrail.log(message, level, metadata);
      } catch (error) {
        // Fall back to console if audit trail not available
        console.error(`[${timestamp}] [audit-fail] Failed to log to audit trail:`, error);
      }
      break;
    case 'debug':
      // Only log debug in development
      if (process.env.NODE_ENV !== 'production') {
        console.debug(formattedMessage, Object.keys(metadata).length > 0 ? metadata : '');
      }
      break;
    case 'info':
    default:
      console.log(formattedMessage, Object.keys(metadata).length > 0 ? metadata : '');
      break;
  }
  
  // Additional logging to monitoring systems could be added here
}

/**
 * Log an error with stack trace
 * 
 * @param error The error to log
 * @param context Additional context about the error
 */
export function logError(error: Error, context: string = 'General Error'): void {
  const timestamp = new Date().toISOString();
  const logPrefix = `[${timestamp}] [error     ]`;
  
  console.error(`${logPrefix} ${context}: ${error.message}`);
  console.error(`${logPrefix} Stack trace:`, error.stack);
}

/**
 * Log a security event
 * 
 * @param message The security event message
 * @param metadata Additional metadata about the event
 */
export function logSecurityEvent(message: string, metadata: Record<string, any> = {}): void {
  log(message, 'security', {
    ...metadata,
    timestamp: new Date().toISOString(),
    securityEvent: true
  });
}

/**
 * Create a child logger with predefined metadata
 * 
 * @param module The module name
 * @param defaultMetadata Default metadata to include in all logs
 * @returns A logger function with predefined metadata
 */
export function createLogger(module: string, defaultMetadata: Record<string, any> = {}) {
  return {
    log: (message: string, level: LogLevel = 'info', metadata: Record<string, any> = {}) => {
      log(`[${module}] ${message}`, level, { ...defaultMetadata, ...metadata });
    },
    error: (error: Error, context: string = module) => {
      logError(error, `[${module}] ${context}`);
    },
    securityEvent: (message: string, metadata: Record<string, any> = {}) => {
      logSecurityEvent(`[${module}] ${message}`, { ...defaultMetadata, ...metadata });
    }
  };
}