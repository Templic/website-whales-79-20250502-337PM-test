/**
 * Logger Utility
 * 
 * This module provides standardized logging functionality throughout the application.
 * It supports different log levels and categories for better log filtering.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Ensure paths work in both ESM and CommonJS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Log levels
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

// Log categories
export type LogCategory = 
  | 'security' 
  | 'system' 
  | 'api' 
  | 'database' 
  | 'auth' 
  | 'user' 
  | 'scheduler' 
  | 'email' 
  | 'payment'
  | 'perf'
  | 'background'
  | 'audit'
  | 'db-maintenance';

// Color codes for terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  bright: '\x1b[1m'
};

// Category colors
const categoryColors: Record<LogCategory, string> = {
  security: colors.red,
  system: colors.cyan,
  api: colors.green,
  database: colors.blue,
  auth: colors.magenta,
  user: colors.yellow,
  scheduler: colors.cyan,
  email: colors.cyan,
  payment: colors.green,
  perf: colors.yellow,
  background: colors.blue,
  audit: colors.magenta,
  'db-maintenance': colors.blue
};

// Level colors
const levelColors: Record<LogLevel, string> = {
  debug: colors.dim,
  info: colors.reset,
  warn: colors.yellow,
  error: colors.red,
  fatal: `${colors.red}${colors.bright}`
};

// Configuration
const config = {
  // Enable console logging (always true in development)
  console: process.env.NODE_ENV !== 'production' || process.env.LOG_CONSOLE === 'true',
  
  // Enable file logging
  file: process.env.LOG_FILE === 'true',
  
  // Log directory
  logDir: path.join(process.cwd(), 'logs'),
  
  // Log rotation size in bytes (default: 10MB)
  maxSize: parseInt(process.env.LOG_MAX_SIZE || '10485760', 10),
  
  // Minimum log level to record
  level: (process.env.LOG_LEVEL || 'info') as LogLevel,
  
  // Maximum log message size (will be truncated if longer)
  maxMessageSize: parseInt(process.env.LOG_MAX_MESSAGE_SIZE || '10000', 10)
};

// Ensure log directory exists
if (config.file) {
  try {
    if (!fs.existsSync(config.logDir)) {
      fs.mkdirSync(config.logDir, { recursive: true });
    }
  } catch (error) {
    console.error(`Failed to create log directory: ${error}`);
  }
}

/**
 * Get current log file path
 * 
 * @param category Log category
 * @returns Log file path
 */
function getLogFilePath(category: LogCategory): string {
  const date = new Date().toISOString().slice(0, 10);
  return path.join(config.logDir, `${category}-${date}.log`);
}

/**
 * Truncate a message if it's too long
 * 
 * @param message Message to truncate
 * @returns Truncated message
 */
function truncateMessage(message: string): string {
  if (message.length > config.maxMessageSize) {
    return `${message.substring(0, config.maxMessageSize)}... [TRUNCATED, ${message.length} chars total]`;
  }
  return message;
}

/**
 * Write log to file
 * 
 * @param formattedMessage Formatted log message
 * @param category Log category
 */
function writeToFile(formattedMessage: string, category: LogCategory): void {
  if (!config.file) return;

  try {
    const logFilePath = getLogFilePath(category);
    fs.appendFileSync(logFilePath, formattedMessage + '\n');
    
    // Check file size and rotate if needed
    const stats = fs.statSync(logFilePath);
    if (stats.size > config.maxSize) {
      const rotatedPath = `${logFilePath}.${Date.now()}`;
      fs.renameSync(logFilePath, rotatedPath);
    }
  } catch (error) {
    console.error(`Failed to write to log file: ${error}`);
  }
}

/**
 * Format log message
 * 
 * @param message Log message
 * @param level Log level
 * @param category Log category
 * @returns Formatted message
 */
function formatMessage(message: string, level: LogLevel = 'info', category?: LogCategory): string {
  // Get timestamp
  const timestamp = new Date().toISOString();
  
  // Build log message
  return `[${timestamp}] [${level.toUpperCase()}] ${category ? `[${category}] ` : ''}${message}`;
}

/**
 * Log a message
 * 
 * @param message Message to log
 * @param category Optional log category
 * @param level Optional log level (default: info)
 */
export function log(message: string, category?: LogCategory, level: LogLevel = 'info'): void {
  try {
    // Skip logging if level is below configured level
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'fatal'];
    if (levels.indexOf(level) < levels.indexOf(config.level)) {
      return;
    }
    
    // Truncate message if needed
    const truncatedMessage = truncateMessage(message);
    
    // Format message
    const formattedMessage = formatMessage(truncatedMessage, level, category);
    
    // Log to console
    if (config.console) {
      const levelColor = levelColors[level] || colors.reset;
      const categoryColor = category ? categoryColors[category] || colors.reset : colors.reset;
      
      console.log(
        `${levelColor}${formattedMessage}${colors.reset}`
          .replace(
            category ? `[${category}]` : '', 
            category ? `${categoryColor}[${category}]${levelColor}` : ''
          )
      );
    }
    
    // Log to file
    if (config.file && category) {
      writeToFile(formattedMessage, category);
    }
  } catch (error) {
    console.error(`Error in logger: ${error}`);
  }
}

/**
 * Log a debug message
 * 
 * @param message Message to log
 * @param category Optional log category
 */
export function debug(message: string, category?: LogCategory): void {
  log(message, category, 'debug');
}

/**
 * Log an info message
 * 
 * @param message Message to log
 * @param category Optional log category
 */
export function info(message: string, category?: LogCategory): void {
  log(message, category, 'info');
}

/**
 * Log a warning message
 * 
 * @param message Message to log
 * @param category Optional log category
 */
export function warn(message: string, category?: LogCategory): void {
  log(message, category, 'warn');
}

/**
 * Log an error message
 * 
 * @param message Message to log
 * @param category Optional log category
 */
export function error(message: string, category?: LogCategory): void {
  log(message, category, 'error');
}

/**
 * Log a fatal message
 * 
 * @param message Message to log
 * @param category Optional log category
 */
export function fatal(message: string, category?: LogCategory): void {
  log(message, category, 'fatal');
}

// Export default log function
export default log;