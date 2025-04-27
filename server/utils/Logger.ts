/**
 * @file Logger.ts
 * @description Centralized logging utility for consistent logging across the application
 */

/**
 * Log levels for the Logger
 */
export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}

/**
 * Colors for terminal output
 */
const LOG_COLORS = {
    DEBUG: '\x1b[36m', // Cyan
    INFO: '\x1b[32m',  // Green
    WARN: '\x1b[33m',  // Yellow
    ERROR: '\x1b[31m', // Red
    RESET: '\x1b[0m'   // Reset
};

/**
 * Logger configuration
 */
export interface LoggerConfig {
    level: LogLevel;
    enableColors: boolean;
    includeTimestamp: boolean;
    includeLevel: boolean;
    format?: (level: string, message: string, meta?: any) => string;
}

/**
 * Default logger implementation
 */
class DefaultLogger {
    private config: LoggerConfig = {
        level: LogLevel.INFO,
        enableColors: true,
        includeTimestamp: true,
        includeLevel: true
    };

    /**
     * Configure the logger
     */
    public configure(config: Partial<LoggerConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Log a debug message
     */
    public debug(message: string, meta?: any): void {
        if (this.config.level <= LogLevel.DEBUG) {
            this.log('DEBUG', message, meta);
        }
    }

    /**
     * Log an info message
     */
    public info(message: string, meta?: any): void {
        if (this.config.level <= LogLevel.INFO) {
            this.log('INFO', message, meta);
        }
    }

    /**
     * Log a warning message
     */
    public warn(message: string, meta?: any): void {
        if (this.config.level <= LogLevel.WARN) {
            this.log('WARN', message, meta);
        }
    }

    /**
     * Log an error message
     */
    public error(message: string, meta?: any): void {
        if (this.config.level <= LogLevel.ERROR) {
            this.log('ERROR', message, meta);
        }
    }

    /**
     * Internal log method
     */
    private log(level: string, message: string, meta?: any): void {
        let formattedMessage = message;

        // Apply custom format if provided
        if (this.config.format) {
            formattedMessage = this.config.format(level, message, meta);
        } else {
            // Default formatting
            let prefix = '';
            
            if (this.config.includeTimestamp) {
                prefix += `[${new Date().toISOString()}] `;
            }
            
            if (this.config.includeLevel) {
                prefix += `[${level}] `;
            }
            
            formattedMessage = `${prefix}${message}`;
            
            // Add meta if available
            if (meta !== undefined) {
                if (typeof meta === 'object') {
                    try {
                        formattedMessage += ` ${JSON.stringify(meta)}`;
                    } catch (error) {
                        formattedMessage += ` [Object - Unstringifiable]`;
                    }
                } else {
                    formattedMessage += ` ${meta}`;
                }
            }
        }

        // Apply colors if enabled
        if (this.config.enableColors) {
            let colorCode = '';
            switch (level) {
                case 'DEBUG':
                    colorCode = LOG_COLORS.DEBUG;
                    break;
                case 'INFO':
                    colorCode = LOG_COLORS.INFO;
                    break;
                case 'WARN':
                    colorCode = LOG_COLORS.WARN;
                    break;
                case 'ERROR':
                    colorCode = LOG_COLORS.ERROR;
                    break;
                default:
                    colorCode = '';
            }
            formattedMessage = `${colorCode}${formattedMessage}${LOG_COLORS.RESET}`;
        }

        // Output to console
        switch (level) {
            case 'ERROR':
                console.error(formattedMessage);
                break;
            case 'WARN':
                console.warn(formattedMessage);
                break;
            case 'DEBUG':
                console.debug(formattedMessage);
                break;
            default:
                console.log(formattedMessage);
        }
    }
}

export const Logger = new DefaultLogger();