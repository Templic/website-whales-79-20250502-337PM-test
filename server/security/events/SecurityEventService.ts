/**
 * Security Event Service
 * 
 * This service manages security events using the batched event processor
 * for efficient database operations.
 */

import chalk from 'chalk';

import { 
  BatchedEventProcessor, 
  SecurityEvent, 
  EventPriority,
  BatchProcessingOptions 
} from './BatchedEventProcessor';
import { DatabaseEventProcessor } from './DatabaseEventProcessor';
import { randomUUID } from 'crypto';

/**
 * Security event types
 */
export enum SecurityEventType {
  // Authentication events
  AUTH_LOGIN_SUCCESS = 'auth:login:success',
  AUTH_LOGIN_FAILURE = 'auth:login:failure',
  AUTH_LOGOUT = 'auth:logout',
  AUTH_PASSWORD_CHANGE = 'auth:password:change',
  AUTH_MFA_ENABLED = 'auth:mfa:enabled',
  AUTH_MFA_DISABLED = 'auth:mfa:disabled',
  AUTH_MFA_CHALLENGE = 'auth:mfa:challenge',
  
  // Access control events
  ACCESS_UNAUTHORIZED = 'access:unauthorized',
  ACCESS_PERMISSION_DENIED = 'access:permission:denied',
  ACCESS_ADMIN_ACTION = 'access:admin:action',
  
  // Threat detection events
  THREAT_SQL_INJECTION = 'threat:sql:injection',
  THREAT_XSS = 'threat:xss',
  THREAT_CSRF = 'threat:csrf',
  THREAT_BRUTE_FORCE = 'threat:brute:force',
  THREAT_RATE_LIMIT = 'threat:rate:limit',
  THREAT_FILE_UPLOAD = 'threat:file:upload',
  THREAT_SUSPICIOUS_ACTIVITY = 'threat:suspicious:activity',
  
  // Data events
  DATA_EXPORT = 'data:export',
  DATA_IMPORT = 'data:import',
  DATA_DELETE = 'data:delete',
  DATA_SENSITIVE_ACCESS = 'data:sensitive:access',
  
  // System events
  SYSTEM_STARTUP = 'system:startup',
  SYSTEM_SHUTDOWN = 'system:shutdown',
  SYSTEM_CONFIG_CHANGE = 'system:config:change',
  SYSTEM_ERROR = 'system:error',
  SYSTEM_PERFORMANCE = 'system:performance',
  
  // User management events
  USER_CREATE = 'user:create',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_ROLE_CHANGE = 'user:role:change',
  USER_LOCK = 'user:lock',
  USER_UNLOCK = 'user:unlock',
  
  // API events
  API_REQUEST = 'api:request',
  API_ERROR = 'api:error',
  API_RATE_LIMIT = 'api:rate:limit',
  API_KEY_USAGE = 'api:key:usage'
}

/**
 * Security event sources
 */
export enum SecurityEventSource {
  API = 'api',
  WEB = 'web',
  SYSTEM = 'system',
  SCHEDULED_TASK = 'scheduled_task',
  ADMIN_PANEL = 'admin_panel',
  BACKGROUND_JOB = 'background_job',
  SECURITY_SYSTEM = 'security_system'
}

/**
 * Request context for capturing event information
 */
export interface RequestContext {
  userId?: string;
  ipAddress: string;
  userAgent?: string;
  path?: string;
  method?: string;
  headers?: Record<string, string>;
}

/**
 * Security event with extended details
 */
export interface ExtendedSecurityEvent extends SecurityEvent {
  userId?: string;
  ipAddress: string;
  userAgent?: string;
  url?: string;
  method?: string;
  correlationId?: string;
  sessionId?: string;
}

/**
 * Event logging options
 */
export interface EventLoggingOptions {
  /**
   * Whether to include request headers in the event
   */
  includeHeaders?: boolean;
  
  /**
   * Priority override for the event
   */
  priority?: EventPriority;
  
  /**
   * Correlation ID for linking related events
   */
  correlationId?: string;
  
  /**
   * Session ID for linking events in the same session
   */
  sessionId?: string;
}

/**
 * Configuration for the security event service
 */
export interface SecurityEventServiceConfig {
  /**
   * Whether to enable event logging
   */
  enabled: boolean;
  
  /**
   * Event batch processing options
   */
  batchProcessing?: Partial<BatchProcessingOptions>;
  
  /**
   * Default priority for each event type
   */
  defaultPriorities?: Partial<Record<SecurityEventType, EventPriority>>;
  
  /**
   * Default logging options
   */
  defaultLoggingOptions?: EventLoggingOptions;
}

/**
 * Default security event service configuration
 */
const defaultConfig: SecurityEventServiceConfig = {
  enabled: true,
  batchProcessing: {
    maxBatchSize: {
      [EventPriority.CRITICAL]: 1,
      [EventPriority.HIGH]: 5,
      [EventPriority.MEDIUM]: 20,
      [EventPriority.LOW]: 50,
      [EventPriority.INFO]: 100
    },
    enableAutoFlush: true,
    enableDeduplication: true
  },
  defaultPriorities: {
    // Authentication events
    [SecurityEventType.AUTH_LOGIN_SUCCESS]: EventPriority.INFO,
    [SecurityEventType.AUTH_LOGIN_FAILURE]: EventPriority.MEDIUM,
    [SecurityEventType.AUTH_LOGOUT]: EventPriority.INFO,
    [SecurityEventType.AUTH_PASSWORD_CHANGE]: EventPriority.MEDIUM,
    [SecurityEventType.AUTH_MFA_ENABLED]: EventPriority.MEDIUM,
    [SecurityEventType.AUTH_MFA_DISABLED]: EventPriority.MEDIUM,
    [SecurityEventType.AUTH_MFA_CHALLENGE]: EventPriority.INFO,
    
    // Access control events
    [SecurityEventType.ACCESS_UNAUTHORIZED]: EventPriority.HIGH,
    [SecurityEventType.ACCESS_PERMISSION_DENIED]: EventPriority.MEDIUM,
    [SecurityEventType.ACCESS_ADMIN_ACTION]: EventPriority.MEDIUM,
    
    // Threat detection events
    [SecurityEventType.THREAT_SQL_INJECTION]: EventPriority.CRITICAL,
    [SecurityEventType.THREAT_XSS]: EventPriority.CRITICAL,
    [SecurityEventType.THREAT_CSRF]: EventPriority.HIGH,
    [SecurityEventType.THREAT_BRUTE_FORCE]: EventPriority.HIGH,
    [SecurityEventType.THREAT_RATE_LIMIT]: EventPriority.MEDIUM,
    [SecurityEventType.THREAT_FILE_UPLOAD]: EventPriority.HIGH,
    [SecurityEventType.THREAT_SUSPICIOUS_ACTIVITY]: EventPriority.HIGH,
    
    // Data events
    [SecurityEventType.DATA_EXPORT]: EventPriority.MEDIUM,
    [SecurityEventType.DATA_IMPORT]: EventPriority.MEDIUM,
    [SecurityEventType.DATA_DELETE]: EventPriority.HIGH,
    [SecurityEventType.DATA_SENSITIVE_ACCESS]: EventPriority.HIGH,
    
    // System events
    [SecurityEventType.SYSTEM_STARTUP]: EventPriority.INFO,
    [SecurityEventType.SYSTEM_SHUTDOWN]: EventPriority.INFO,
    [SecurityEventType.SYSTEM_CONFIG_CHANGE]: EventPriority.MEDIUM,
    [SecurityEventType.SYSTEM_ERROR]: EventPriority.HIGH,
    [SecurityEventType.SYSTEM_PERFORMANCE]: EventPriority.LOW,
    
    // User management events
    [SecurityEventType.USER_CREATE]: EventPriority.LOW,
    [SecurityEventType.USER_UPDATE]: EventPriority.LOW,
    [SecurityEventType.USER_DELETE]: EventPriority.MEDIUM,
    [SecurityEventType.USER_ROLE_CHANGE]: EventPriority.MEDIUM,
    [SecurityEventType.USER_LOCK]: EventPriority.MEDIUM,
    [SecurityEventType.USER_UNLOCK]: EventPriority.MEDIUM,
    
    // API events
    [SecurityEventType.API_REQUEST]: EventPriority.INFO,
    [SecurityEventType.API_ERROR]: EventPriority.MEDIUM,
    [SecurityEventType.API_RATE_LIMIT]: EventPriority.MEDIUM,
    [SecurityEventType.API_KEY_USAGE]: EventPriority.INFO
  },
  defaultLoggingOptions: {
    includeHeaders: false
  }
};

/**
 * SecurityEventService manages security events and logs them efficiently
 */
export class SecurityEventService {
  private config: SecurityEventServiceConfig;
  private eventProcessor: BatchedEventProcessor;
  private isDisposed: boolean = false;
  
  /**
   * Create a new security event service
   */
  constructor(config: Partial<SecurityEventServiceConfig> = {}) {
    // Merge provided config with defaults
    this.config = {
      ...defaultConfig,
      ...config,
      defaultPriorities: {
        ...defaultConfig.defaultPriorities,
        ...config.defaultPriorities
      },
      defaultLoggingOptions: {
        ...defaultConfig.defaultLoggingOptions,
        ...config.defaultLoggingOptions
      },
      batchProcessing: {
        ...defaultConfig.batchProcessing,
        ...config.batchProcessing
      }
    };
    
    // Create the event processor
    this.eventProcessor = new BatchedEventProcessor(
      new DatabaseEventProcessor(),
      this.config.batchProcessing
    );
    
    // Log initialization
    console.log(chalk.blue('[SecurityEventService] Initialized with batch processing'));
    
    // Attach event listeners
    this.setupEventListeners();
  }
  
  /**
   * Log a security event
   * 
   * @param type The type of security event
   * @param source The source of the event
   * @param details Additional event details
   * @param options Event logging options
   * @returns The event that was logged
   */
  logEvent(
    type: SecurityEventType,
    source: SecurityEventSource | string,
    details: Record<string, any> = {},
    options: EventLoggingOptions = {}
  ): ExtendedSecurityEvent {
    // Skip if disabled
    if (!this.config.enabled || this.isDisposed) {
      return {
        type,
        priority: options.priority || this.getDefaultPriority(type),
        source,
        details,
        processed: false
      };
    }
    
    // Determine event priority
    const priority = options.priority || this.getDefaultPriority(type);
    
    // Create the event
    const event: ExtendedSecurityEvent = {
      type,
      priority,
      source,
      timestamp: new Date(),
      details: { ...details },
      correlationId: options.correlationId || details.correlationId || randomUUID(),
      sessionId: options.sessionId || details.sessionId,
      userId: details.userId,
      ipAddress: details.ipAddress || 'unknown',
      userAgent: details.userAgent,
      url: details.url || details.path,
      method: details.method
    };
    
    // Add to the event processor
    this.eventProcessor.addEvent(event);
    
    return event;
  }
  
  /**
   * Log a security event from an Express request
   * 
   * @param type The type of security event
   * @param req The Express request
   * @param details Additional event details
   * @param options Event logging options
   * @returns The event that was logged
   */
  logFromRequest(
    type: SecurityEventType,
    req: any,
    details: Record<string, any> = {},
    options: EventLoggingOptions = {}
  ): ExtendedSecurityEvent {
    // Skip if disabled
    if (!this.config.enabled || this.isDisposed) {
      return {
        type,
        priority: options.priority || this.getDefaultPriority(type),
        source: SecurityEventSource.WEB,
        details,
        ipAddress: 'unknown',
        processed: false
      };
    }
    
    // Extract request context
    const context: RequestContext = {
      userId: req.user?.id,
      ipAddress: req.ip || req.connection?.remoteAddress || 'unknown',
      userAgent: req.headers?.['user-agent'],
      path: req.originalUrl || req.url,
      method: req.method
    };
    
    // Add headers if requested
    if (options.includeHeaders || this.config.defaultLoggingOptions?.includeHeaders) {
      context.headers = { ...req.headers };
      
      // Remove sensitive headers
      delete context.headers.authorization;
      delete context.headers.cookie;
    }
    
    // Merge context with provided details
    const mergedDetails = {
      ...context,
      ...details
    };
    
    // Log the event
    return this.logEvent(type, SecurityEventSource.WEB, mergedDetails, options);
  }
  
  /**
   * Force all pending events to be processed immediately
   * 
   * @returns A promise that resolves when processing is complete
   */
  async flush(): Promise<{
    processed: number;
    failed: number;
  }> {
    if (!this.config.enabled || this.isDisposed) {
      return { processed: 0, failed: 0 };
    }
    
    return this.eventProcessor.flushAll();
  }
  
  /**
   * Get event processing statistics
   */
  getStats() {
    return this.eventProcessor.getStats();
  }
  
  /**
   * Dispose the service
   */
  async dispose(): Promise<void> {
    if (this.isDisposed) {
      return;
    }
    
    this.isDisposed = true;
    
    // Flush any remaining events
    await this.flush();
    
    // Dispose the event processor
    this.eventProcessor.dispose();
    
    console.log(chalk.green('[SecurityEventService] Disposed'));
  }
  
  /**
   * Get the default priority for an event type
   * 
   * @param type The event type
   * @returns The priority for the event type
   * @private
   */
  private getDefaultPriority(type: SecurityEventType): EventPriority {
    return this.config.defaultPriorities?.[type] || EventPriority.INFO;
  }
  
  /**
   * Set up event listeners
   * 
   * @private
   */
  private setupEventListeners(): void {
    // Event added
    this.eventProcessor.on('event:added', (event: SecurityEvent) => {
      if (event.priority === EventPriority.CRITICAL) {
        console.log(chalk.red(`[SecurityEventService] Critical event added: ${event.type}`));
      }
    });
    
    // Event deduplicated
    this.eventProcessor.on('event:deduplicated', (event: SecurityEvent) => {
      if (event.priority === EventPriority.CRITICAL || event.priority === EventPriority.HIGH) {
        console.log(chalk.yellow(
          `[SecurityEventService] High priority event deduplicated: ${event.type}`
        ));
      }
    });
    
    // Batch processed
    this.eventProcessor.on('batch:processed', (result: any) => {
      if (result.failed > 0) {
        console.warn(chalk.yellow(
          `[SecurityEventService] Batch processed with failures: ${result.processed}/${result.batchSize} successful`
        ));
      }
    });
    
    // Batch error
    this.eventProcessor.on('batch:error', (error: any) => {
      console.error(chalk.red('[SecurityEventService] Batch processing error:'), error);
    });
  }
}

// Create singleton instance
export const securityEventService = new SecurityEventService();

// Export default for convenience
export default securityEventService;