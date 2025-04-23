/**
 * Security Fabric
 * 
 * This module provides a central orchestration layer for all security components.
 * It enables communication between components, manages security posture,
 * and provides a unified interface for security operations.
 */

import { Request, Response } from 'express';
import { EventEmitter } from 'events';
import { SecurityContext, createSecurityContext } from './context/SecurityContext';
import { SecurityConfig } from './config/SecurityConfig';

/**
 * Security posture levels
 */
export type SecurityPosture = 'normal' | 'elevated' | 'high' | 'maximum';

/**
 * Security component interface
 */
export interface SecurityComponent {
  /**
   * Initialize the component
   */
  initialize(): Promise<void>;
  
  /**
   * Shutdown the component
   */
  shutdown(): Promise<void>;
  
  /**
   * Get component status
   */
  getStatus(): Record<string, any>;
}

/**
 * Security Fabric class
 * 
 * Central orchestration layer for security components
 */
export class SecurityFabric extends EventEmitter {
  private components: Map<string, any> = new Map();
  private securityPosture: SecurityPosture = 'normal';
  private threatLevel: number = 0;
  private initialized: boolean = false;
  
  /**
   * Initialize the security fabric
   */
  public async initialize(config: SecurityConfig = {}): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    console.log('[SecurityFabric] Initializing security fabric...');
    
    try {
      // Set initial security posture from config
      this.securityPosture = config.initialSecurityPosture || 'normal';
      
      // Set max listeners to avoid memory leak warnings
      this.setMaxListeners(50);
      
      // Mark as initialized
      this.initialized = true;
      
      console.log(`[SecurityFabric] Security fabric initialized with ${this.securityPosture} security posture`);
      
      // Emit initialization event
      this.emit('security:initialized', {
        timestamp: new Date(),
        securityPosture: this.securityPosture
      });
    } catch (error) {
      console.error('[SecurityFabric] Failed to initialize security fabric:', error);
      throw error;
    }
  }
  
  /**
   * Shut down the security fabric
   */
  public async shutdown(): Promise<void> {
    console.log('[SecurityFabric] Shutting down security fabric...');
    
    try {
      // Shut down all components
      for (const [name, component] of this.components.entries()) {
        if (typeof component.shutdown === 'function') {
          console.log(`[SecurityFabric] Shutting down component: ${name}`);
          await component.shutdown();
        }
      }
      
      // Clear all components
      this.components.clear();
      
      // Remove all listeners
      this.removeAllListeners();
      
      // Mark as not initialized
      this.initialized = false;
      
      console.log('[SecurityFabric] Security fabric shut down successfully');
    } catch (error) {
      console.error('[SecurityFabric] Error shutting down security fabric:', error);
      throw error;
    }
  }
  
  /**
   * Register a security component
   */
  public registerComponent<T>(name: string, component: T): void {
    if (this.components.has(name)) {
      console.warn(`[SecurityFabric] Component already registered with name: ${name}`);
      return;
    }
    
    this.components.set(name, component);
    console.log(`[SecurityFabric] Registered component: ${name}`);
    
    // Emit component registered event
    this.emit('security:component:registered', {
      name,
      timestamp: new Date()
    });
  }
  
  /**
   * Get a security component by name
   */
  public getComponent<T>(name: string): T | undefined {
    return this.components.get(name) as T | undefined;
  }
  
  /**
   * Create a security context for a request
   */
  public createSecurityContext(req: Request, res: Response): SecurityContext {
    return createSecurityContext(req, res, {
      securityPosture: this.securityPosture,
      threatLevel: this.threatLevel
    });
  }
  
  /**
   * Get the current security posture
   */
  public getSecurityPosture(): SecurityPosture {
    return this.securityPosture;
  }
  
  /**
   * Get the current threat level (0-1)
   */
  public getThreatLevel(): number {
    return this.threatLevel;
  }
  
  /**
   * Set the security posture
   */
  public setSecurityPosture(posture: SecurityPosture): void {
    const previousPosture = this.securityPosture;
    this.securityPosture = posture;
    
    console.log(`[SecurityFabric] Security posture changed from ${previousPosture} to ${posture}`);
    
    // Emit security posture change event
    this.emit('security:posture:changed', {
      previous: previousPosture,
      current: posture,
      timestamp: new Date()
    });
  }
  
  /**
   * Adjust the security posture based on threat level
   */
  public adjustSecurityPosture(threatLevel: number): void {
    // Update threat level
    this.threatLevel = Math.max(0, Math.min(1, threatLevel));
    
    // Adjust security posture based on threat level
    const previousPosture = this.securityPosture;
    
    if (threatLevel >= 0.8) {
      this.securityPosture = 'maximum';
    } else if (threatLevel >= 0.6) {
      this.securityPosture = 'high';
    } else if (threatLevel >= 0.3) {
      this.securityPosture = 'elevated';
    } else {
      this.securityPosture = 'normal';
    }
    
    // If posture changed, emit event
    if (previousPosture !== this.securityPosture) {
      console.log(`[SecurityFabric] Security posture adjusted from ${previousPosture} to ${this.securityPosture} (threat level: ${threatLevel.toFixed(2)})`);
      
      // Emit security posture change event
      this.emit('security:posture:changed', {
        previous: previousPosture,
        current: this.securityPosture,
        threatLevel: this.threatLevel,
        timestamp: new Date()
      });
    }
  }
  
  /**
   * Get all registered component names
   */
  public getComponentNames(): string[] {
    return Array.from(this.components.keys());
  }
  
  /**
   * Check if the security fabric is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }
}

/**
 * Create a singleton instance of the security fabric
 */
export const securityFabric = new SecurityFabric();