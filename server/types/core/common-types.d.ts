/**
 * Common Type Definitions
 * 
 * This file contains common types used throughout the application.
 */

/**
 * Pagination parameters for list operations
 */
interface PaginationParams {
  /** Page number, starting from 1 */
  page?: number;
  
  /** Number of items per page */
  limit?: number;
  
  /** Total number of items (for response) */
  total?: number;
}

/**
 * Sorting parameters for list operations
 */
interface SortingParams {
  /** Field to sort by */
  sortBy?: string;
  
  /** Sort direction */
  sortDirection?: 'asc' | 'desc';
}

/**
 * Filtering parameters for list operations
 */
interface FilterParams {
  /** Field-value pairs for filtering */
  [key: string]: string | number | boolean | Array<string | number | boolean> | null;
}

/**
 * Response metadata
 */
interface ResponseMetadata {
  /** Response timestamp */
  timestamp: number;
  
  /** Request ID for tracing */
  requestId?: string;
  
  /** Response processing time in ms */
  processingTime?: number;
  
  /** API version */
  apiVersion?: string;
  
  /** Pagination information */
  pagination?: PaginationParams;
}

/**
 * Standard API response structure
 */
interface ApiResponse<T = any> {
  /** Success flag */
  success: boolean;
  
  /** Response data */
  data?: T;
  
  /** Error message if success is false */
  error?: string;
  
  /** Error code if success is false */
  errorCode?: string | number;
  
  /** Response metadata */
  meta?: ResponseMetadata;
}

/**
 * User session data
 */
interface SessionData {
  /** User ID */
  userId?: string;
  
  /** Username */
  username?: string;
  
  /** User's email */
  email?: string;
  
  /** User's roles */
  roles?: string[];
  
  /** User's permissions */
  permissions?: string[];
  
  /** Session expiration timestamp */
  expiresAt?: number;
  
  /** Whether user is authenticated */
  isAuthenticated?: boolean;
  
  /** CSRF token */
  csrfToken?: string;
  
  /** Last activity timestamp */
  lastActivity?: number;
  
  /** IP address */
  ipAddress?: string;
  
  /** User agent */
  userAgent?: string;
}

/**
 * Config entry
 */
interface ConfigEntry {
  /** Configuration key */
  key: string;
  
  /** Configuration value */
  value: any;
  
  /** Environment the config applies to */
  environment?: 'development' | 'testing' | 'production' | 'all';
  
  /** Whether the config is encrypted */
  encrypted?: boolean;
  
  /** Last updated timestamp */
  updatedAt?: number;
  
  /** User who last updated the config */
  updatedBy?: string;
}

/**
 * Logging level
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * Log entry
 */
interface LogEntry {
  /** Log timestamp */
  timestamp: number;
  
  /** Log level */
  level: LogLevel;
  
  /** Log message */
  message: string;
  
  /** Additional log data */
  data?: Record<string, unknown>;
  
  /** Source of the log */
  source?: string;
  
  /** Associated request ID */
  requestId?: string;
  
  /** Associated user ID */
  userId?: string;
}

/**
 * Environment information
 */
interface EnvironmentInfo {
  /** Current environment */
  environment: 'development' | 'testing' | 'production';
  
  /** Node.js version */
  nodeVersion: string;
  
  /** Server start time */
  startTime: number;
  
  /** Host information */
  host: {
    hostname: string;
    platform: string;
    architecture: string;
  };
  
  /** Memory usage information */
  memory?: {
    total: number;
    free: number;
    used: number;
  };
}

/**
 * Generic record with string keys and any values
 */
type GenericRecord = Record<string, any>;

/**
 * Function with any parameters and any return type
 */
type GenericFunction = (...args: any[]) => any;

/**
 * ID type used throughout the application
 */
type ID = string;

/**
 * Timestamp type (milliseconds since epoch)
 */
type Timestamp = number;

// Export types for use in other files
export {
  PaginationParams,
  SortingParams,
  FilterParams,
  ResponseMetadata,
  ApiResponse,
  SessionData,
  ConfigEntry,
  LogLevel,
  LogEntry,
  EnvironmentInfo,
  GenericRecord,
  GenericFunction,
  ID,
  Timestamp
};