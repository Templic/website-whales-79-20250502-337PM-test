/**
 * Enhanced Logging Utility
 * 
 * This module provides a consistent logging interface with features like:
 * - Timestamp formatting
 * - Log categories
 * - Severity levels
 * - Log rotation
 * - Persistence options
 * - Colorized console output
 */

import fs from 'fs';
import path from 'path';
import util from 'util';

// Log level types
type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

// Log category types - used to organize logs by component/functionality
type LogCategory = 
  | 'server' 
  | 'database' 
  | 'api' 
  | 'security' 
  | 'auth' 
  | 'background' 
  | 'metrics' 
  | 'cleanup' 
  | 'schedule' 
  | 'audit'
  | 'dependency'
  | 'content'
  | 'performance';

// Console color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m'
};

// Configuration
const LOG_DIR = path.join(process.cwd(), 'logs');
const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_LOG_FILES = 10;
const DEFAULT_LOG_LEVEL: LogLevel = 'info';
const CONSOLE_ENABLED = true;
const FILE_ENABLED = true;

// Initialize log directories
function initLogDirectories() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
  
  // Create subdirectories for each category
  const categories: LogCategory[] = [
    'server', 'database', 'api', 'security', 'auth', 'background', 
    'metrics', 'cleanup', 'schedule', 'audit', 'dependency', 'content',
    'performance'
  ];
  
  for (const category of categories) {
    const categoryDir = path.join(LOG_DIR, category);
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
    }
  }
}

// Initialize once
initLogDirectories();

/**
 * Get log file path for a category
 */
function getLogFilePath(category: LogCategory): string {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return path.join(LOG_DIR, category, `${category}-${today}.log`);
}

/**
 * Get color for log level
 */
function getLevelColor(level: LogLevel): string {
  switch (level) {
    case 'debug': return colors.gray;
    case 'info': return colors.green;
    case 'warn': return colors.yellow;
    case 'error': return colors.red;
    case 'critical': return `${colors.bright}${colors.red}`;
    default: return colors.reset;
  }
}

/**
 * Get color for log category
 */
function getCategoryColor(category: LogCategory): string {
  switch (category) {
    case 'server': return colors.cyan;
    case 'database': return colors.blue;
    case 'api': return colors.magenta;
    case 'security': return colors.red;
    case 'auth': return colors.yellow;
    case 'background': return colors.gray;
    case 'metrics': return colors.green;
    case 'cleanup': return colors.cyan;
    case 'schedule': return colors.blue;
    case 'audit': return colors.yellow;
    case 'dependency': return colors.magenta;
    case 'content': return colors.cyan;
    case 'performance': return colors.green;
    default: return colors.reset;
  }
}

/**
 * Rotate log file if needed
 */
function rotateLogFileIfNeeded(logPath: string): void {
  try {
    // Check if file exists and is too large
    if (fs.existsSync(logPath)) {
      const stats = fs.statSync(logPath);
      if (stats.size >= MAX_LOG_SIZE) {
        // Rotate logs
        const dirname = path.dirname(logPath);
        const basename = path.basename(logPath);
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const rotatedPath = path.join(dirname, `${basename}.${timestamp}`);
        
        fs.renameSync(logPath, rotatedPath);
        
        // Remove old log files if too many
        const logFiles = fs.readdirSync(dirname)
          .filter(file => file.startsWith(basename + '.'))
          .map(file => path.join(dirname, file));
        
        if (logFiles.length > MAX_LOG_FILES) {
          // Sort by modification time, oldest first
          logFiles.sort((a, b) => {
            return fs.statSync(a).mtime.getTime() - fs.statSync(b).mtime.getTime();
          });
          
          // Remove oldest files
          const filesToRemove = logFiles.slice(0, logFiles.length - MAX_LOG_FILES);
          for (const file of filesToRemove) {
            fs.unlinkSync(file);
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error rotating log file: ${error}`);
  }
}

/**
 * Format message for logging
 */
function formatMessage(message: any, level: LogLevel = 'info'): string {
  if (typeof message === 'string') {
    return message;
  } else if (message instanceof Error) {
    return message.stack || message.message;
  } else {
    return util.inspect(message, { depth: 5, colors: false });
  }
}

/**
 * Log message to file
 */
function logToFile(message: string, level: LogLevel, category: LogCategory): void {
  if (!FILE_ENABLED) return;
  
  try {
    const logPath = getLogFilePath(category);
    rotateLogFileIfNeeded(logPath);
    
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
    
    fs.appendFileSync(logPath, logLine);
  } catch (error) {
    console.error(`Error writing to log file: ${error}`);
  }
}

/**
 * Log message to console
 */
function logToConsole(message: string, level: LogLevel, category: LogCategory): void {
  if (!CONSOLE_ENABLED) return;
  
  const time = new Date().toLocaleTimeString();
  const levelColor = getLevelColor(level);
  const categoryColor = getCategoryColor(category);
  
  const formattedMessage = `${colors.dim}${time}${colors.reset} [${categoryColor}${category}${colors.reset}] ${message}`;
  
  switch (level) {
    case 'debug':
      console.debug(formattedMessage);
      break;
    case 'info':
      console.info(formattedMessage);
      break;
    case 'warn':
      console.warn(formattedMessage);
      break;
    case 'error':
    case 'critical':
      console.error(formattedMessage);
      break;
    default:
      console.log(formattedMessage);
  }
}

/**
 * Main logging function
 */
export function log(message: any, category: LogCategory = 'server', level: LogLevel = 'info'): void {
  const formattedMessage = formatMessage(message, level);
  
  logToConsole(formattedMessage, level, category);
  logToFile(formattedMessage, level, category);
}

/**
 * Debug log level
 */
export function debug(message: any, category: LogCategory = 'server'): void {
  log(message, category, 'debug');
}

/**
 * Info log level
 */
export function info(message: any, category: LogCategory = 'server'): void {
  log(message, category, 'info');
}

/**
 * Warning log level
 */
export function warn(message: any, category: LogCategory = 'server'): void {
  log(message, category, 'warn');
}

/**
 * Error log level
 */
export function error(message: any, category: LogCategory = 'server'): void {
  log(message, category, 'error');
}

/**
 * Critical log level
 */
export function critical(message: any, category: LogCategory = 'server'): void {
  log(message, category, 'critical');
}

// Export default log function
export default log;