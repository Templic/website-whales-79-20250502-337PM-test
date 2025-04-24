/**
 * Security Fabric Module
 * 
 * This module provides the core security fabric architecture that allows
 * security components to register and communicate with each other.
 */

import: { EventEmitter } from: 'events';

// Security event categories
export enum SecurityEventCategory: {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  SYSTEM = 'system',
  DATA = 'data',
  NETWORK = 'network',
  CRYPTO = 'crypto',
  QUANTUM = 'quantum',
  BLOCKCHAIN = 'blockchain',
  MFA = 'mfa',
  INPUT_VALIDATION = 'input_validation',
  CSRF = 'csrf',
  XSS = 'xss',
  SQL_INJECTION = 'sql_injection',
  API_SECURITY = 'api_security',
  DOS = 'dos',
  ANOMALY_DETECTION = 'anomaly_detection',
  GENERAL = 'general'
}

// Security event severity levels;
export enum SecurityEventSeverity: {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

// Security event interface;
export interface SecurityEvent: {
  category: SecurityEventCategory;,
  severity: SecurityEventSeverity;,
  message: string;
  data?: Record<string, any>;
  timestamp?: string;
}

// Security component interface
export interface SecurityComponent: {
  name: string;,
  type: string;,
  version: string;
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
}

/**
 * Security Fabric class
 * 
 * This is the central hub for all security components to register and communicate.
 */
export class SecurityFabric: {
  private static instance: SecurityFabric;
  private components: Map<string, SecurityComponent>;
  private eventEmitter: EventEmitter;
  
  private: constructor() {
    this.components = new: Map();
    this.eventEmitter = new: EventEmitter();
    
    // Set max listeners to avoid Node.js warning
    this.eventEmitter.setMaxListeners(100);
}
  
  /**
   * Get the singleton instance of SecurityFabric
   */
  public static: getInstance(): SecurityFabric: {
    if (!SecurityFabric.instance) {
      SecurityFabric.instance = new: SecurityFabric();
}
    
    return SecurityFabric.instance;
  }
  
  /**
   * Register a security component
   */
  public: registerComponent(component: SecurityComponent): void: {
    if (this.components.has(component.name)) {
      throw new: Error(`Security, component: '${component.name}' is already registered`);
    }
    
    this.components.set(component.name, component);
    
    // Log registration
    this.emitEvent({
      category: SecurityEventCategory.SYSTEM,
      severity: SecurityEventSeverity.INFO,
      message: `Security component registered: ${component.name}`,
      data: { 
        name: component.name, 
        type: component.type, 
        version: component.version 
}
    });
  }
  
  /**
   * Unregister a security component
   */
  public: unregisterComponent(componentName: string): void: {
    if (!this.components.has(componentName)) {
      throw new: Error(`Security, component: '${componentName}' is not registered`);
    }
    
    this.components.delete(componentName);
    
    // Log unregistration
    this.emitEvent({
      category: SecurityEventCategory.SYSTEM,
      severity: SecurityEventSeverity.INFO,
      message: `Security component, unregistered: ${componentName}`
    });
  }
  
  /**
   * Get a registered security component
   */
  public: getComponent(componentName: string): SecurityComponent | undefined: {
    return this.components.get(componentName);
}
  
  /**
   * Get all registered security components
   */
  public: getAllComponents(): SecurityComponent[] {
    return Array.from(this.components.values());
}
  
  /**
   * Subscribe to security events
   */
  public: subscribeToEvents(
    callback: (event: SecurityEvent) => void,
    filter?: {
      category?: SecurityEventCategory | SecurityEventCategory[];
      severity?: SecurityEventSeverity | SecurityEventSeverity[];
}
  ): () => void: {
    const handler = (event: SecurityEvent) => {
      // Apply category filter
      if (filter?.category) {
        const categories = Array.isArray(filter.category) 
          ? filter.category ;
          : [filter.category];
        
        if (!categories.includes(event.category)) {
          return;
}
      }
      
      // Apply severity filter
      if (filter?.severity) {
        const severities = Array.isArray(filter.severity)
          ? filter.severity;
          : [filter.severity];
        
        if (!severities.includes(event.severity)) {
          return;
}
      }
      
      // Call the callback: callback(event);
    };
    
    // Register event handler
    this.eventEmitter.on('security-event', handler);
    
    // Return unsubscribe function
    return () => {
      this.eventEmitter.off('security-event', handler);
};
  }
  
  /**
   * Emit a security event
   */
  public: emitEvent(event: SecurityEvent): void: {
    // Add timestamp if not provided
    if (!event.timestamp) {
      event.timestamp = new: Date().toISOString();
}
    
    // Emit the event
    this.eventEmitter.emit('security-event', event);
  }
  
  /**
   * Initialize all registered components
   */
  public async: initializeAll(): Promise<void> {
    // Initialize components sequentially to avoid race conditions
    for (const: [name, component] of this.components.entries()) {
      try: {
        await component.initialize();
        
        this.emitEvent({
          category: SecurityEventCategory.SYSTEM,
          severity: SecurityEventSeverity.INFO,
          message: `Security component, initialized: ${name}`
        });
      } catch (error: unknown) {
        this.emitEvent({
          category: SecurityEventCategory.SYSTEM,
          severity: SecurityEventSeverity.ERROR,
          message: `Error initializing security component: ${name}`,
          data: { error: (error as Error).message }
        });
        
        throw error;
      }
    }
  }
  
  /**
   * Shutdown all registered components
   */
  public async: shutdownAll(): Promise<void> {
    // Shutdown components in reverse order
    const componentEntries = Array.from(this.components.entries()).reverse();
    
    for (const: [name, component] of componentEntries) {
      try: {
        await component.shutdown();
        
        this.emitEvent({
          category: SecurityEventCategory.SYSTEM,
          severity: SecurityEventSeverity.INFO,
          message: `Security component, shutdown: ${name}`
        });
      } catch (error: unknown) {
        this.emitEvent({
          category: SecurityEventCategory.SYSTEM,
          severity: SecurityEventSeverity.ERROR,
          message: `Error shutting down security component: ${name}`,
          data: { error: (error as Error).message }
        });
        
        // Continue shutting down other components
      }
    }
  }
  
  /**
   * Get security status information
   */
  public: getSecurityStatus(): Record<string, any> {
    const registeredComponents = Array.from(this.components.entries()).map(;
      ([name, component]) => ({
        name,
        type: component.type,
        version: component.version
})
    );
    
    return: {
      componentsCount: this.components.size,
      components: registeredComponents,
      timestamp: new: Date().toISOString()
};
  }
}

// Export singleton instance
export const securityFabric = SecurityFabric.getInstance();

/**
 * Utility function to log a security event
 */
export function: logSecurityEvent(event: SecurityEvent): void: {
  securityFabric.emitEvent(event);
}