/**
 * Logger Utility
 * 
 * This module provides a centralized logging system with categories.
 */

import chalk from 'chalk';

// Configure log levels
const LOG_LEVELS = {
  debug: { color: 'blue', enabled: process.env.LOG_LEVEL === 'debug' },
  info: { color: 'green', enabled: true },
  warn: { color: 'yellow', enabled: true },
  error: { color: 'red', enabled: true },
  security: { color: 'magenta', enabled: true },
  perf: { color: 'cyan', enabled: process.env.LOG_PERFORMANCE === 'true' },
  audit: { color: 'gray', enabled: true }
};

// Log category types
type LogCategory = keyof typeof LOG_LEVELS;

/**
 * Enhanced log function with category support
 * 
 * @param message Message to log
 * @param category Log category
 */
export function log(message: string, category: LogCategory = 'info'): void {
  // Check if category is enabled
  if (!LOG_LEVELS[category]?.enabled) {
    return;
  }
  
  const timestamp = new Date().toISOString();
  const color = LOG_LEVELS[category]?.color || 'white';
  
  // Get trace
  const trace = new Error().stack?.split('\n')[2]?.trim() || '';
  
  // Extract file and line from trace
  const traceMatch = trace.match(/at\s+(.+)\s+\((.+):(\d+):(\d+)\)/);
  const fileInfo = traceMatch ? `${traceMatch[2].split('/').pop()}:${traceMatch[3]}` : '';
  
  // Calculate padding
  const categoryPadding = 10 - category.length;
  const paddedCategory = category + ' '.repeat(Math.max(0, categoryPadding));
  
  // Format message with color
  const coloredMessage = chalk[color](message);
  
  // Log with timestamp, category, and caller info
  console.log(`[${timestamp}] [${paddedCategory}] ${coloredMessage}${fileInfo ? ` (${fileInfo})` : ''}`);
  
  // If error category, add to error log stream
  if (category === 'error' || category === 'security') {
    appendToErrorLog(timestamp, category, message, fileInfo);
  }
}

/**
 * Append error or security log to persistent log stream
 * 
 * @param timestamp Log timestamp
 * @param category Log category
 * @param message Log message
 * @param fileInfo File info
 */
function appendToErrorLog(timestamp: string, category: string, message: string, fileInfo: string): void {
  try {
    // In a real implementation, this would write to a persistent log store
    // For now, we just construct the log entry
    const logEntry = {
      timestamp,
      category,
      message,
      fileInfo,
      severity: category === 'security' ? determineSeverity(message) : 'error'
    };
    
    // In a production system, this could be sent to a log aggregation service
    // console.debug('Error log entry:', logEntry);
  } catch (error) {
    console.error('Failed to append to error log:', error);
  }
}

/**
 * Determine security log severity based on content
 * 
 * @param message Log message
 * @returns Severity level
 */
function determineSeverity(message: string): 'low' | 'medium' | 'high' | 'critical' {
  const lowercaseMessage = message.toLowerCase();
  
  // Check for critical indicators
  if (
    lowercaseMessage.includes('attack') ||
    lowercaseMessage.includes('breach') ||
    lowercaseMessage.includes('compromised') ||
    lowercaseMessage.includes('exploit')
  ) {
    return 'critical';
  }
  
  // Check for high severity indicators
  if (
    lowercaseMessage.includes('threat') ||
    lowercaseMessage.includes('suspicious') ||
    lowercaseMessage.includes('malicious') ||
    lowercaseMessage.includes('unauthorized')
  ) {
    return 'high';
  }
  
  // Check for medium severity indicators
  if (
    lowercaseMessage.includes('rate limit') ||
    lowercaseMessage.includes('failed') ||
    lowercaseMessage.includes('invalid') ||
    lowercaseMessage.includes('blocked')
  ) {
    return 'medium';
  }
  
  // Default to low
  return 'low';
}

/**
 * Log an error with stack trace
 * 
 * @param error Error object or string
 * @param context Optional context information
 */
export function logError(error: Error | string, context?: string): void {
  const errorObj = typeof error === 'string' ? new Error(error) : error;
  const contextInfo = context ? ` (${context})` : '';
  
  log(`${errorObj.message}${contextInfo}\n${errorObj.stack}`, 'error');
}

/**
 * Log a security event
 * 
 * @param event Security event description
 * @param data Event data
 * @param source Event source
 */
export function logSecurity(event: string, data?: any, source?: string): void {
  try {
    const sourceInfo = source ? ` (${source})` : '';
    const message = `${event}${sourceInfo}`;
    
    // Log message
    log(message, 'security');
    
    // Log data if provided
    if (data) {
      const safeData = sanitizeData(data);
      log(`Security event data: ${JSON.stringify(safeData)}`, 'security');
    }
  } catch (error) {
    log(`Error logging security event: ${error}`, 'error');
  }
}

/**
 * Sanitize sensitive data for logging
 * 
 * @param data Data to sanitize
 * @returns Sanitized data
 */
function sanitizeData(data: any): any {
  try {
    // Clone data
    const sanitized = JSON.parse(JSON.stringify(data));
    
    // Sensitive fields to redact
    const sensitiveFields = [
      'password', 'token', 'secret', 'key', 'auth', 'jwt', 'session', 
      'cookie', 'credential', 'apiKey', 'api_key'
    ];
    
    // Recursively sanitize object
    function sanitizeObject(obj: any) {
      if (!obj || typeof obj !== 'object') {
        return;
      }
      
      Object.keys(obj).forEach(key => {
        const lowerKey = key.toLowerCase();
        
        // Check if this is a sensitive field
        if (sensitiveFields.some(field => lowerKey.includes(field))) {
          // Redact value but preserve type information
          if (typeof obj[key] === 'string') {
            obj[key] = '[REDACTED]';
          } else if (Array.isArray(obj[key])) {
            obj[key] = ['[REDACTED]'];
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            obj[key] = { redacted: true };
          } else {
            obj[key] = '[REDACTED]';
          }
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          // Recursively sanitize nested objects
          sanitizeObject(obj[key]);
        }
      });
    }
    
    sanitizeObject(sanitized);
    return sanitized;
  } catch (error) {
    log(`Error sanitizing data: ${error}`, 'error');
    return { error: 'Data sanitization failed' };
  }
}