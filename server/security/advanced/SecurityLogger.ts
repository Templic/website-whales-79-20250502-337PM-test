/**
 * Security Event Logger
 * 
 * This module provides a unified interface for logging security events
 * with proper categorization, severity levels, and structured data.
 * It can output logs to multiple destinations including console, file,
 * and blockchain-based immutable logs.
 */

import { SecurityEvent, SecurityEventCategory, SecurityEventSeverity } from './SecurityFabric';
import { ImmutableSecurityLogs } from './blockchain/ImmutableSecurityLogs';

// Available log destinations
enum LogDestination {
  CONSOLE = 'console',
  FILE = 'file',
  BLOCKCHAIN = 'blockchain',
  DATABASE = 'database'
}

// Configuration interface for the security logger
interface SecurityLoggerConfig {
  enabledDestinations: LogDestination[];
  minSeverity: SecurityEventSeverity;
  includeStackTrace: boolean;
  prettifyConsole: boolean;
  logFilePath?: string;
  rotateLogsDaily?: boolean;
}

// Default configuration for the security logger
const DEFAULT_CONFIG: SecurityLoggerConfig = {
  enabledDestinations: [LogDestination.CONSOLE, LogDestination.BLOCKCHAIN],
  minSeverity: SecurityEventSeverity.INFO,
  includeStackTrace: true,
  prettifyConsole: true,
  rotateLogsDaily: true
};

// Class to handle security event logging
class SecurityLogger {
  private static instance: SecurityLogger;
  private config: SecurityLoggerConfig;
  private blockchainLogger?: ImmutableSecurityLogs;

  private constructor(config: Partial<SecurityLoggerConfig> = {}) {
    // Merge provided config with defaults
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Initialize blockchain logger if enabled
    if (this.config.enabledDestinations.includes(LogDestination.BLOCKCHAIN)) {
      this.blockchainLogger = ImmutableSecurityLogs.getInstance();
    }
  }

  /**
   * Get the singleton instance of the SecurityLogger
   */
  public static getInstance(config?: Partial<SecurityLoggerConfig>): SecurityLogger {
    if (!SecurityLogger.instance) {
      SecurityLogger.instance = new SecurityLogger(config);
    }
    return SecurityLogger.instance;
  }

  /**
   * Log a security event to all enabled destinations
   */
  public logEvent(event: SecurityEvent): void {
    // Check if event meets minimum severity threshold
    if (event.severity < this.config.minSeverity) {
      return;
    }

    // Add timestamp if not present
    if (!event.timestamp) {
      event.timestamp = new Date();
    }

    // Add stack trace if configured
    if (this.config.includeStackTrace && !event.stackTrace) {
      const stack = new Error().stack;
      event.stackTrace = stack ? stack.split('\n').slice(3).join('\n') : 'No stack trace available';
    }

    // Log to each enabled destination
    for (const destination of this.config.enabledDestinations) {
      switch (destination) {
        case LogDestination.CONSOLE:
          this.logToConsole(event);
          break;
        case LogDestination.FILE:
          this.logToFile(event);
          break;
        case LogDestination.BLOCKCHAIN:
          this.logToBlockchain(event);
          break;
        case LogDestination.DATABASE:
          this.logToDatabase(event);
          break;
      }
    }
  }

  /**
   * Update the logger configuration
   */
  public updateConfig(config: Partial<SecurityLoggerConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Initialize blockchain logger if newly enabled
    if (
      this.config.enabledDestinations.includes(LogDestination.BLOCKCHAIN) &&
      !this.blockchainLogger
    ) {
      this.blockchainLogger = ImmutableSecurityLogs.getInstance();
    }
  }

  /**
   * Get the current logger configuration
   */
  public getConfig(): SecurityLoggerConfig {
    return { ...this.config };
  }

  /**
   * Log to console with appropriate formatting
   */
  private logToConsole(event: SecurityEvent): void {
    const timestamp = event.timestamp instanceof Date
      ? event.timestamp.toISOString()
      : new Date().toISOString();

    const prefix = `[SECURITY] ${this.getSeverityLabel(event.severity)} - ${event.category}: `;
    
    if (this.config.prettifyConsole) {
      // Use console colors based on severity
      const colorCode = this.getSeverityColor(event.severity);
      console.log(`\x1b[${colorCode}m${prefix}${event.message}\x1b[0m`);
      
      if (event.data) {
        console.log('\x1b[36mData:', JSON.stringify(event.data, null, 2), '\x1b[0m');
      }
      
      if (this.config.includeStackTrace && event.stackTrace) {
        console.log('\x1b[90mStack trace:', event.stackTrace, '\x1b[0m');
      }
    } else {
      // Simple logging without colors
      console.log(`${timestamp} ${prefix}${event.message}`);
      
      if (event.data) {
        console.log('Data:', JSON.stringify(event.data));
      }
      
      if (this.config.includeStackTrace && event.stackTrace) {
        console.log('Stack trace:', event.stackTrace);
      }
    }
  }

  /**
   * Log to a file (placeholder implementation)
   */
  private logToFile(event: SecurityEvent): void {
    // This would be implemented with a file writing library
    // For now, we'll just note that this method was called
    console.log(`[SecurityLogger] Would log to file: ${JSON.stringify(event)}`);
  }

  /**
   * Log to blockchain-based immutable logs
   */
  private logToBlockchain(event: SecurityEvent): void {
    if (this.blockchainLogger) {
      this.blockchainLogger.logSecurityEvent(event);
    }
  }

  /**
   * Log to database (placeholder implementation)
   */
  private logToDatabase(event: SecurityEvent): void {
    // This would be implemented with a database client
    // For now, we'll just note that this method was called
    console.log(`[SecurityLogger] Would log to database: ${JSON.stringify(event)}`);
  }

  /**
   * Get human-readable label for severity level
   */
  private getSeverityLabel(severity: SecurityEventSeverity): string {
    switch (severity) {
      case SecurityEventSeverity.DEBUG:
        return 'DEBUG';
      case SecurityEventSeverity.INFO:
        return 'INFO';
      case SecurityEventSeverity.WARNING:
        return 'WARNING';
      case SecurityEventSeverity.ERROR:
        return 'ERROR';
      case SecurityEventSeverity.CRITICAL:
        return 'CRITICAL';
      default:
        return 'UNKNOWN';
    }
  }

  /**
   * Get ANSI color code for severity level
   */
  private getSeverityColor(severity: SecurityEventSeverity): number {
    switch (severity) {
      case SecurityEventSeverity.DEBUG:
        return 90; // Bright black (gray)
      case SecurityEventSeverity.INFO:
        return 32; // Green
      case SecurityEventSeverity.WARNING:
        return 33; // Yellow
      case SecurityEventSeverity.ERROR:
        return 31; // Red
      case SecurityEventSeverity.CRITICAL:
        return 41; // White text on red background
      default:
        return 0;  // Default terminal color
    }
  }
}

// Create and export the singleton instance
const securityLogger = SecurityLogger.getInstance();

/**
 * Convenience function to log a security event
 */
export function logSecurityEvent(event: SecurityEvent): void {
  securityLogger.logEvent(event);
}

/**
 * Export the SecurityLogger class and related types
 */
export {
  SecurityLogger,
  SecurityLoggerConfig,
  LogDestination
};