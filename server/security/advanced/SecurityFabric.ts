/**
 * Security Fabric
 * 
 * The Security Fabric is the central orchestrator for all security components,
 * providing a unified interface for security events, configuration, and coordination.
 * It serves as the "nervous system" of the security architecture.
 */

import { EventEmitter } from 'events';
import { SecurityEventSeverity, SecurityEventCategory } from './blockchain/ImmutableSecurityLogs';

/**
 * Security event interface
 */
export interface SecurityEvent {
  /**
   * Event ID
   */
  id?: string;
  
  /**
   * Event timestamp
   */
  timestamp: Date;
  
  /**
   * Event severity
   */
  severity: SecurityEventSeverity;
  
  /**
   * Event category
   */
  category: SecurityEventCategory;
  
  /**
   * Event message
   */
  message: string;
  
  /**
   * User that triggered the event (if applicable)
   */
  user?: string;
  
  /**
   * IP address associated with the event
   */
  ipAddress?: string;
  
  /**
   * Additional metadata
   */
  metadata?: Record<string, any>;
}

/**
 * Security component interface
 */
export interface SecurityComponent {
  /**
   * Component name
   */
  name: string;
  
  /**
   * Component description
   */
  description: string;
  
  /**
   * Initialize the component
   */
  initialize?(): Promise<void>;
  
  /**
   * Shut down the component
   */
  shutdown?(): Promise<void>;
  
  /**
   * Process a security event
   */
  processEvent?(event: SecurityEvent): Promise<void>;
  
  /**
   * Get component status
   */
  getStatus?(): Promise<Record<string, any>>;
}

/**
 * Security Fabric interface
 */
export interface ISecurityFabric {
  /**
   * Register a security component
   */
  registerComponent(component: SecurityComponent): void;
  
  /**
   * Unregister a security component
   */
  unregisterComponent(componentName: string): void;
  
  /**
   * Get a security component by name
   */
  getComponent(componentName: string): SecurityComponent | null;
  
  /**
   * Process a security event
   */
  processEvent(event: SecurityEvent): Promise<void>;
  
  /**
   * Emit a security event
   */
  emit(eventName: string, eventData: any): boolean;
  
  /**
   * Subscribe to a security event
   */
  on(eventName: string, handler: (...args: any[]) => void): this;
  
  /**
   * Get the status of all security components
   */
  getSecurityStatus(): Promise<Record<string, any>>;
}

/**
 * Security Fabric implementation
 */
class SecurityFabric extends EventEmitter implements ISecurityFabric {
  /**
   * Security components
   */
  private components: Map<string, SecurityComponent> = new Map();
  
  /**
   * Security events log
   */
  private events: SecurityEvent[] = [];
  
  /**
   * Maximum events to keep in memory
   */
  private maxEvents = 1000;
  
  /**
   * Create a new security fabric
   */
  constructor() {
    super();
    
    // Set maximum number of listeners
    this.setMaxListeners(100);
    
    console.log('[SecurityFabric] Security Fabric initialized');
  }
  
  /**
   * Register a security component
   */
  public registerComponent(component: SecurityComponent): void {
    if (this.components.has(component.name)) {
      console.warn(`[SecurityFabric] Component ${component.name} is already registered`);
      return;
    }
    
    this.components.set(component.name, component);
    console.log(`[SecurityFabric] Registered component: ${component.name}`);
    
    // Emit component registration event
    this.emit('security:component:registered', { name: component.name });
  }
  
  /**
   * Unregister a security component
   */
  public unregisterComponent(componentName: string): void {
    if (!this.components.has(componentName)) {
      console.warn(`[SecurityFabric] Component ${componentName} is not registered`);
      return;
    }
    
    this.components.delete(componentName);
    console.log(`[SecurityFabric] Unregistered component: ${componentName}`);
    
    // Emit component unregistration event
    this.emit('security:component:unregistered', { name: componentName });
  }
  
  /**
   * Get a security component by name
   */
  public getComponent(componentName: string): SecurityComponent | null {
    return this.components.get(componentName) || null;
  }
  
  /**
   * Process a security event
   */
  public async processEvent(event: SecurityEvent): Promise<void> {
    try {
      // Add event to in-memory log
      this.events.push(event);
      
      // Trim events if needed
      if (this.events.length > this.maxEvents) {
        this.events = this.events.slice(-this.maxEvents);
      }
      
      // Emit event
      this.emit(`security:event:${event.category}`, event);
      this.emit(`security:event:${event.severity}`, event);
      this.emit('security:event', event);
      
      // Process event in all components
      const promises: Promise<void>[] = [];
      
      for (const component of this.components.values()) {
        if (component.processEvent) {
          promises.push(component.processEvent(event));
        }
      }
      
      await Promise.all(promises);
    } catch (error) {
      console.error('[SecurityFabric] Error processing security event:', error);
    }
  }
  
  /**
   * Get the status of all security components
   */
  public async getSecurityStatus(): Promise<Record<string, any>> {
    try {
      const status: Record<string, any> = {
        components: {},
        eventCounts: {}
      };
      
      // Get component statuses
      for (const [name, component] of this.components.entries()) {
        if (component.getStatus) {
          try {
            status.components[name] = await component.getStatus();
          } catch (error) {
            status.components[name] = { error: 'Failed to get component status' };
            console.error(`[SecurityFabric] Error getting status for component ${name}:`, error);
          }
        } else {
          status.components[name] = { registered: true };
        }
      }
      
      // Get event counts by category and severity
      const eventCountsByCategory: Record<string, number> = {};
      const eventCountsBySeverity: Record<string, number> = {};
      
      for (const event of this.events) {
        // Count by category
        eventCountsByCategory[event.category] = (eventCountsByCategory[event.category] || 0) + 1;
        
        // Count by severity
        eventCountsBySeverity[event.severity] = (eventCountsBySeverity[event.severity] || 0) + 1;
      }
      
      status.eventCounts.byCategory = eventCountsByCategory;
      status.eventCounts.bySeverity = eventCountsBySeverity;
      status.eventCounts.total = this.events.length;
      
      return status;
    } catch (error) {
      console.error('[SecurityFabric] Error getting security status:', error);
      return { error: 'Failed to get security status' };
    }
  }
  
  /**
   * Initialize all registered components
   */
  public async initializeComponents(): Promise<void> {
    try {
      console.log('[SecurityFabric] Initializing all components...');
      
      for (const [name, component] of this.components.entries()) {
        if (component.initialize) {
          try {
            console.log(`[SecurityFabric] Initializing component: ${name}`);
            await component.initialize();
            console.log(`[SecurityFabric] Component ${name} initialized successfully`);
          } catch (error) {
            console.error(`[SecurityFabric] Error initializing component ${name}:`, error);
          }
        }
      }
      
      console.log('[SecurityFabric] All components initialized');
    } catch (error) {
      console.error('[SecurityFabric] Error initializing components:', error);
    }
  }
  
  /**
   * Shut down all registered components
   */
  public async shutdownComponents(): Promise<void> {
    try {
      console.log('[SecurityFabric] Shutting down all components...');
      
      for (const [name, component] of this.components.entries()) {
        if (component.shutdown) {
          try {
            console.log(`[SecurityFabric] Shutting down component: ${name}`);
            await component.shutdown();
            console.log(`[SecurityFabric] Component ${name} shut down successfully`);
          } catch (error) {
            console.error(`[SecurityFabric] Error shutting down component ${name}:`, error);
          }
        }
      }
      
      console.log('[SecurityFabric] All components shut down');
    } catch (error) {
      console.error('[SecurityFabric] Error shutting down components:', error);
    }
  }
}

/**
 * Singleton security fabric instance
 */
export const securityFabric = new SecurityFabric();