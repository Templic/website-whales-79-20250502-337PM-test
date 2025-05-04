/**
 * Secure Logger Utility
 * 
 * Provides a consistent logging interface for security-related events with
 * appropriate log levels, timestamps, and metadata.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// @ts-ignore - handle ESM/CJS differences
const __filename = typeof __filename !== 'undefined' ? __filename : fileURLToPath(import.meta.url);
// @ts-ignore - handle ESM/CJS differences
const __dirname = typeof __dirname !== 'undefined' ? __dirname : dirname(__filename);

type LogLevel = 'info' | 'warning' | 'error' | 'critical' | 'debug' | 'security' | 'audit';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
const securityLogsDir = path.join(logsDir, 'security');

try {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  
  if (!fs.existsSync(securityLogsDir)) {
    fs.mkdirSync(securityLogsDir, { recursive: true });
  }
} catch (err) {
  console.error('Failed to create logs directory:', err);
}

// Get timestamp in consistent format
function getTimestamp(): string {
  return new Date().toISOString();
}

// Format a log entry as JSON
function formatLogEntry(
  message: string, 
  level: LogLevel, 
  metadata: Record<string, any> = {}
): string {
  return JSON.stringify({
    timestamp: getTimestamp(),
    level,
    message,
    ...metadata
  });
}

// Write log to console and file
function writeLog(entry: string, level: LogLevel): void {
  // Always console log in development
  if (process.env.NODE_ENV !== 'production') {
    const consoleMethod = 
      level === 'error' || level === 'critical' ? console.error :
      level === 'warning' ? console.warn :
      console.log;
    
    consoleMethod(`[${level.toUpperCase()}] ${entry}`);
  }
  
  // Always write security and audit logs to file regardless of environment
  if (level === 'security' || level === 'audit' || process.env.NODE_ENV === 'production') {
    try {
      const logFile = path.join(securityLogsDir, 'security.log');
      fs.appendFileSync(logFile, entry + '\n', 'utf8');
    } catch (err) {
      console.error('Failed to write to security log file:', err);
    }
  }
}

/**
 * Log a message with a specific log level
 * 
 * @param message The message to log
 * @param level The log level (default: 'info')
 * @param metadata Additional metadata to include
 */
export function log(message: string, level: LogLevel = 'info', metadata: Record<string, any> = {}): void {
  const entry = formatLogEntry(message, level, metadata);
  writeLog(entry, level);
}

/**
 * Log an error with stack trace
 * 
 * @param error The error to log
 * @param context Additional context about the error
 */
export function logError(error: Error, context: string = 'General Error'): void {
  const metadata = {
    errorType: error.name,
    stack: error.stack,
    context
  };
  
  log(error.message, 'error', metadata);
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
    securityEvent: true,
    timestamp: getTimestamp()
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
      log(message, level, {
        module,
        ...defaultMetadata,
        ...metadata
      });
    },
    
    error: (error: Error, context: string = module) => {
      logError(error, context);
    },
    
    security: (message: string, metadata: Record<string, any> = {}) => {
      logSecurityEvent(message, {
        module,
        ...defaultMetadata,
        ...metadata
      });
    }
  };
}

// Export the default logger
export default {
  log,
  logError,
  logSecurityEvent,
  createLogger
};