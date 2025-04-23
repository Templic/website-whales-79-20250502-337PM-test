/**
 * Security Fabric
 * 
 * This module provides a central hub for security-related events and coordination
 * across all security components in the application. It acts as an event bus
 * for security events and allows components to subscribe to events.
 */

import { EventEmitter } from 'events';

/**
 * Security fabric class
 */
class SecurityFabric extends EventEmitter {
  /**
   * Map of registered security components
   */
  private components: Map<string, any> = new Map();
  
  /**
   * Protected events that should only be emitted by trusted components
   */
  private protectedEvents: Set<string> = new Set([
    'security:rasp:blocked',
    'security:csrf:violation',
    'security:authentication:failure',
    'security:authorization:failure',
    'security:scan:started',
    'security:scan:completed',
    'security:scan:error',
    'security:scan:finding',
    'security:maximum-security:enabled',
    'security:configuration:changed'
  ]);
  
  /**
   * Create a new security fabric
   */
  constructor() {
    super();
    this.setMaxListeners(100); // Allow many listeners for security events
    
    // Log all security events
    this.on('security:*', (event, data) => {
      if (process.env.SECURITY_DEBUG === 'true') {
        console.log(`[SECURITY-FABRIC] Event: ${event}`, data);
      }
    });
  }
  
  /**
   * Register a security component
   */
  registerComponent(name: string, component: any): void {
    this.components.set(name, component);
    console.log(`[SECURITY-FABRIC] Registered component: ${name}`);
  }
  
  /**
   * Get a registered security component
   */
  getComponent(name: string): any {
    return this.components.get(name);
  }
  
  /**
   * Get all registered security components
   */
  getAllComponents(): Map<string, any> {
    return this.components;
  }
  
  /**
   * Check if a security component is registered
   */
  hasComponent(name: string): boolean {
    return this.components.has(name);
  }
  
  /**
   * Emit a security event
   * Override EventEmitter.emit to add additional security checks
   */
  emit(event: string, ...args: any[]): boolean {
    // Check if the event is protected and only allow if from trusted components
    if (this.protectedEvents.has(event)) {
      const stack = new Error().stack || '';
      const isTrustedSource = stack.includes('/server/security/') || 
        stack.includes('/server/middleware/') ||
        stack.includes('/server/routes.ts');
      
      if (!isTrustedSource) {
        console.error(`[SECURITY-FABRIC] Attempt to emit protected event ${event} from untrusted source`);
        return false;
      }
    }
    
    // Call the original emit method
    return super.emit(event, ...args);
  }
  
  /**
   * Subscribe to security events
   * This method provides type safety and documentation for security events
   */
  subscribe(event: string, callback: (...args: any[]) => void): this {
    return this.on(event, callback);
  }
  
  /**
   * Unsubscribe from security events
   */
  unsubscribe(event: string, callback: (...args: any[]) => void): this {
    return this.off(event, callback);
  }
  
  /**
   * Subscribe to security events once
   */
  subscribeOnce(event: string, callback: (...args: any[]) => void): this {
    return this.once(event, callback);
  }
}

/**
 * Global security fabric instance
 */
export const securityFabric = new SecurityFabric();