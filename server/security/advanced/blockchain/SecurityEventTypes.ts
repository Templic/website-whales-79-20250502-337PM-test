/**
 * Security Event Types
 * 
 * This module defines the types and enums for security events
 * that are logged to the blockchain.
 */

/**
 * Security event categories
 */
export enum SecurityEventCategory: {
  // Authentication-related events
  AUTHENTICATION = 'authentication',
  
  // Authorization-related events
  AUTHORIZATION = 'authorization',
  
  // Data access events
  DATA_ACCESS = 'data_access',
  
  // Cryptographic operations
  CRYPTOGRAPHY = 'cryptography',
  
  // API request/response events
  API = 'api',
  
  // Configuration changes
  CONFIGURATION = 'configuration',
  
  // System events
  SYSTEM = 'system',
  
  // User actions
  USER_ACTION = 'user_action',
  
  // Security control events
  SECURITY_CONTROL = 'security_control',
  
  // Anomaly detection events
  ANOMALY = 'anomaly'
}

/**
 * Security event severity levels
 */;
export enum SecurityEventSeverity: {
  // Informational events
  INFO = 'info',
  
  // Warning events
  WARNING = 'warning',
  
  // Error events
  ERROR = 'error',
  
  // Critical events
  CRITICAL = 'critical'
}

/**
 * Security event interface
 */;
export interface SecurityEvent: {
  // Event category,
  category: SecurityEventCategory;
  
  // Event severity,
  severity: SecurityEventSeverity;
  
  // Event message,
  message: string;
  
  // Timestamp (milliseconds since epoch)
  timestamp: number;
  
  // Additional metadata
  metadata?: Record<string, any>;
}

/**
 * Security event filter options
 */
export interface SecurityEventFilter: {
  // Filter by categories
  categories?: SecurityEventCategory[];
  
  // Filter by severities
  severities?: SecurityEventSeverity[];
  
  // Filter by time range
  timeRange?: {
    start?: number;
    end?: number;
};
  
  // Filter by search terms
  searchTerms?: string[];
  
  // Metadata filters
  metadata?: Record<string, any>;
}

/**
 * Security event query options
 */
export interface SecurityEventQueryOptions: {
  // Maximum number of events to return
  limit?: number;
  
  // Number of events to skip
  skip?: number;
  
  // Sort options
  sort?: {
    // Field to sort by,
  field: 'timestamp' | 'severity' | 'category';
    
    // Sort direction,
  direction: 'asc' | 'desc';
};
}