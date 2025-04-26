/**
 * Logger utility for consistent logging across the application.
 * Provides different log levels and formatting options.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
  includeTimestamp?: boolean;
  colorize?: boolean;
}

class Logger {
  private options: LoggerOptions;

  constructor(options: LoggerOptions = {}) {
    this.options = {
      includeTimestamp: options.includeTimestamp !== undefined ? options.includeTimestamp : true,
      colorize: options.colorize !== undefined ? options.colorize : true
    };
  }

  /**
   * Format a log message with optional timestamp and color
   */
  private formatMessage(level: LogLevel, message: string, ...args: unknown[]): string {
    let formattedMessage = message;
    
    // Add timestamp if enabled
    if (this.options.includeTimestamp) {
      const timestamp = new Date().toISOString();
      formattedMessage = `[${timestamp}] ${formattedMessage}`;
    }

    // Add log level
    formattedMessage = `[${level.toUpperCase()}] ${formattedMessage}`;
    
    // Add colorization if enabled
    if (this.options.colorize) {
      const colors = {
        debug: '\x1b[36m', // Cyan
        info: '\x1b[32m',  // Green
        warn: '\x1b[33m',  // Yellow
        error: '\x1b[31m'  // Red
      };
      
      const resetColor = '\x1b[0m';
      formattedMessage = `${colors[level]}${formattedMessage}${resetColor}`;
    }
    
    return formattedMessage;
  }

  /**
   * Debug level logging (verbose information for debugging)
   */
  debug(message: string, ...args: unknown[]): void {
    console.debug(this.formatMessage('debug', message), ...args);
  }

  /**
   * Info level logging (general information about application operation)
   */
  info(message: string, ...args: unknown[]): void {
    console.info(this.formatMessage('info', message), ...args);
  }

  /**
   * Warning level logging (potential issues that don't prevent operation)
   */
  warn(message: string, ...args: unknown[]): void {
    console.warn(this.formatMessage('warn', message), ...args);
  }

  /**
   * Error level logging (errors that may prevent proper operation)
   */
  error(message: string, ...args: unknown[]): void {
    console.error(this.formatMessage('error', message), ...args);
  }
}

// Export a singleton instance with default options
export const logger = new Logger();

// Also export the class for custom instances
export default Logger;