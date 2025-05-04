/**
 * Secure Logger
 * 
 * This utility provides secure, tamper-evident logging for security events,
 * ensuring that security logs are properly formatted, stored securely,
 * and cannot be modified once created.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Log severity levels
export type LogSeverity = 'debug' | 'info' | 'warning' | 'error' | 'critical';

// Log entry structure
export interface SecureLogEntry {
  timestamp: string;
  severity: LogSeverity;
  component: string;
  message: string;
  hash: string; // HMAC of the log entry for tamper detection
  requestId?: string; // Optional request ID for correlation
  userId?: string | number; // Optional user ID if authenticated
  metadata?: Record<string, any>; // Additional contextual information
}

// Configuration options
interface SecureLoggerConfig {
  enabled: boolean;
  logToConsole: boolean;
  logToFile: boolean;
  logFilePath: string;
  hmacSecret: string;
  redactSensitiveData: boolean;
  maxLogSize: number; // Maximum size of log file in bytes
  rotationCount: number; // Number of log files to keep when rotating
}

// Default configuration
const defaultConfig: SecureLoggerConfig = {
  enabled: process.env.NODE_ENV !== 'test', // Disabled in test environment
  logToConsole: true,
  logToFile: true,
  logFilePath: path.join(process.cwd(), 'logs', 'security.log'),
  hmacSecret: process.env.LOG_HMAC_SECRET || 'default-secret-key-change-in-production',
  redactSensitiveData: true,
  maxLogSize: 10 * 1024 * 1024, // 10 MB
  rotationCount: 5
};

// Singleton instance configuration
let config: SecureLoggerConfig = { ...defaultConfig };

/**
 * Initialize the secure logger with custom configuration
 */
export function initSecureLogger(customConfig: Partial<SecureLoggerConfig> = {}): void {
  config = {
    ...defaultConfig,
    ...customConfig
  };
  
  // Ensure log directory exists
  if (config.logToFile) {
    const logDir = path.dirname(config.logFilePath);
    if (!fs.existsSync(logDir)) {
      try {
        fs.mkdirSync(logDir, { recursive: true });
      } catch (error) {
        console.error(`Failed to create log directory at ${logDir}:`, error);
        config.logToFile = false; // Disable file logging
      }
    }
  }
}

/**
 * Get current secure logger configuration
 */
export function getSecureLoggerConfig(): Readonly<SecureLoggerConfig> {
  return { ...config };
}

/**
 * Main secure logging function
 */
export function secureLog(
  severity: LogSeverity,
  component: string,
  message: string,
  options: {
    requestId?: string;
    userId?: string | number;
    metadata?: Record<string, any>;
  } = {}
): SecureLogEntry {
  if (!config.enabled) {
    // Return an empty log entry instead of null to avoid type errors
    return {
      timestamp: new Date().toISOString(),
      severity,
      component,
      message,
      hash: '',
    };
  }
  
  // Create the log entry object
  const timestamp = new Date().toISOString();
  const { requestId, userId, metadata } = options;
  
  // Process metadata and redact sensitive information if configured
  let processedMetadata = metadata;
  if (metadata && config.redactSensitiveData) {
    processedMetadata = redactSensitiveData(metadata);
  }
  
  // Create the base log entry without the hash
  const baseEntry = {
    timestamp,
    severity,
    component,
    message,
    requestId,
    userId,
    metadata: processedMetadata
  };
  
  // Calculate HMAC for the log entry for tamper detection
  const hmac = crypto.createHmac('sha256', config.hmacSecret);
  hmac.update(JSON.stringify(baseEntry));
  const hash = hmac.digest('hex');
  
  // Create the complete log entry
  const logEntry: SecureLogEntry = {
    ...baseEntry,
    hash
  };
  
  // Log to console if configured
  if (config.logToConsole) {
    logToConsole(logEntry);
  }
  
  // Log to file if configured
  if (config.logToFile) {
    logToFile(logEntry);
  }
  
  return logEntry;
}

/**
 * Log to console with appropriate styling based on severity
 */
function logToConsole(logEntry: SecureLogEntry): void {
  const { timestamp, severity, component, message } = logEntry;
  
  // Choose appropriate console method and color based on severity
  let consoleMethod: 'log' | 'info' | 'warn' | 'error' = 'log';
  let color = '';
  
  switch (severity) {
    case 'debug':
      consoleMethod = 'log';
      color = '\x1b[36m'; // Cyan
      break;
    case 'info':
      consoleMethod = 'info';
      color = '\x1b[32m'; // Green
      break;
    case 'warning':
      consoleMethod = 'warn';
      color = '\x1b[33m'; // Yellow
      break;
    case 'error':
      consoleMethod = 'error';
      color = '\x1b[31m'; // Red
      break;
    case 'critical':
      consoleMethod = 'error';
      color = '\x1b[41m\x1b[37m'; // White on Red background
      break;
  }
  
  // Format console output
  const reset = '\x1b[0m';
  const formattedMessage = `${color}[${timestamp}] [${severity.toUpperCase()}] [${component}]${reset} ${message}`;
  
  console[consoleMethod](formattedMessage);
}

/**
 * Log to file with rotation support
 */
function logToFile(logEntry: SecureLogEntry): void {
  try {
    // Check if log rotation is needed
    checkLogRotation();
    
    // Format the log entry as JSON
    const logLine = JSON.stringify(logEntry) + '\n';
    
    // Append to log file
    fs.appendFileSync(config.logFilePath, logLine, { encoding: 'utf8' });
  } catch (error) {
    // Fall back to console logging on file error
    console.error('Failed to write to security log file:', error);
    logToConsole({
      ...logEntry,
      message: `${logEntry.message} (Note: Failed to write to log file)`,
      severity: 'error'
    });
  }
}

/**
 * Check if log rotation is needed and perform rotation if necessary
 */
function checkLogRotation(): void {
  try {
    // Skip if file doesn't exist yet
    if (!fs.existsSync(config.logFilePath)) {
      return;
    }
    
    // Get file stats
    const stats = fs.statSync(config.logFilePath);
    
    // Check if file exceeds max size
    if (stats.size >= config.maxLogSize) {
      // Perform log rotation
      rotateLogFiles();
    }
  } catch (error) {
    console.error('Error checking log file size:', error);
  }
}

/**
 * Rotate log files
 */
function rotateLogFiles(): void {
  try {
    // Remove the oldest log file if it exists
    const oldestLog = `${config.logFilePath}.${config.rotationCount}`;
    if (fs.existsSync(oldestLog)) {
      fs.unlinkSync(oldestLog);
    }
    
    // Shift all existing log files
    for (let i = config.rotationCount - 1; i >= 1; i--) {
      const oldPath = `${config.logFilePath}.${i}`;
      const newPath = `${config.logFilePath}.${i + 1}`;
      
      if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
      }
    }
    
    // Rename current log file
    if (fs.existsSync(config.logFilePath)) {
      fs.renameSync(config.logFilePath, `${config.logFilePath}.1`);
    }
  } catch (error) {
    console.error('Error rotating log files:', error);
  }
}

/**
 * Redact sensitive data from metadata
 */
function redactSensitiveData(metadata: Record<string, any>): Record<string, any> {
  const sensitiveKeyPatterns = [
    /pass(word)?/i,
    /secret/i,
    /token/i,
    /key/i,
    /auth/i,
    /credential/i,
    /ssn/i,
    /social.*security/i,
    /credit.*card/i,
    /card.*number/i,
    /cvv/i,
    /session/i
  ];
  
  const result = { ...metadata };
  
  // Recursive function to redact sensitive fields
  function redact(obj: Record<string, any>, path: string = ''): void {
    Object.keys(obj).forEach(key => {
      const currentPath = path ? `${path}.${key}` : key;
      
      // Check if this key matches sensitive patterns
      const isSensitive = sensitiveKeyPatterns.some(pattern => pattern.test(key));
      
      if (isSensitive) {
        // Redact sensitive field
        if (typeof obj[key] === 'string') {
          const length = obj[key].length;
          obj[key] = length > 0 ? `[REDACTED:${length}]` : '[REDACTED]';
        } else if (obj[key] !== null && obj[key] !== undefined) {
          obj[key] = '[REDACTED]';
        }
      } else if (obj[key] !== null && typeof obj[key] === 'object') {
        // Recursively process nested objects
        redact(obj[key], currentPath);
      }
    });
  }
  
  redact(result);
  return result;
}

// Export convenience methods
export function logDebug(component: string, message: string, options?: any): SecureLogEntry {
  return secureLog('debug', component, message, options);
}

export function logInfo(component: string, message: string, options?: any): SecureLogEntry {
  return secureLog('info', component, message, options);
}

export function logWarning(component: string, message: string, options?: any): SecureLogEntry {
  return secureLog('warning', component, message, options);
}

export function logError(component: string, message: string, options?: any): SecureLogEntry {
  return secureLog('error', component, message, options);
}

export function logCritical(component: string, message: string, options?: any): SecureLogEntry {
  return secureLog('critical', component, message, options);
}

// Initialize logger with default config
initSecureLogger();

// Default export for importing as `import secureLog from './secureLogger'`
export default secureLog;