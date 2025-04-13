/**
 * Simple logger utility for the application
 * Provides methods for logging messages with different severity levels
 */

export const logger = {
  /**
   * Log an info level message
   * @param message Main message to log
   * @param args Additional arguments to log
   */
  info: (message: string, ...args: any[]) => {
    console.log(`[INFO] ${message}`, ...args);
  },

  /**
   * Log a warning level message
   * @param message Main message to log
   * @param args Additional arguments to log
   */
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${message}`, ...args);
  },

  /**
   * Log an error level message
   * @param message Main message to log
   * @param args Additional arguments to log
   */
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] ${message}`, ...args);
  },

  /**
   * Log a debug level message
   * Only outputs in development environment
   * @param message Main message to log
   * @param args Additional arguments to log
   */
  debug: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }
};

// Default export for more flexible importing
export default logger;