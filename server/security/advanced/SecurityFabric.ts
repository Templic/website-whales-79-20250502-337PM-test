/**
 * Security Fabric Core
 * 
 * This module implements the central orchestration layer for the next-generation 
 * security architecture. It coordinates all security components, manages their 
 * lifecycle, and ensures integrated defensive capabilities.
 */

import { EventEmitter } from 'events';
import { SecurityContext } from './context/SecurityContext';
import { ThreatIntelligence } from './intelligence/ThreatIntelligence';
import { SecurityMetrics } from './metrics/SecurityMetrics';
import { SecurityConfig } from './config/SecurityConfig';
import { Logger } from '../../utils/Logger';

// Security posture levels
export type SecurityPostureLevel = 'normal' | 'elevated' | 'high' | 'maximum';

/**
 * Central orchestration for the advanced security architecture
 */
export class SecurityFabric {
  private static instance: SecurityFabric;
  private eventBus: EventEmitter;
  private components: Map<string, any> = new Map();
  private securityPosture: SecurityPostureLevel = 'normal';
  private threatLevel: number = 0;
  private startTime: number;
  private metricsCollectionInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.startTime = Date.now();
    this.eventBus = new EventEmitter();
    this.eventBus.setMaxListeners(100); // Allow many listeners for security events
    
    console.log('[SecurityFabric] Initializing advanced security architecture...');
    
    // Publish initialization event
    this.eventBus.emit('security:fabric:initializing', { timestamp: new Date() });
  }

  /**
   * Get the singleton instance of SecurityFabric
   */
  public static getInstance(): SecurityFabric {
    if (!SecurityFabric.instance) {
      SecurityFabric.instance = new SecurityFabric();
    }
    return SecurityFabric.instance;
  }

  /**
   * Initialize the security fabric and all its components
   */
  public async initialize(config: SecurityConfig = {}): Promise<void> {
    try {
      console.log('[SecurityFabric] Starting security fabric initialization...');
      
      // Register internal event listeners
      this.registerEventListeners();
      
      // Initialize core security components
      await this.initializeSecurityComponents(config);
      
      // Start continuous security monitoring
      this.startContinuousMonitoring();
      
      // Initialize security posture
      this.adjustSecurityPosture(0.1); // Start with low threat level
      
      // Emit completion event
      this.eventBus.emit('security:fabric:initialized', {
        timestamp: new Date(),
        initializationTime: Date.now() - this.startTime
      });
      
      console.log(`[SecurityFabric] Security fabric initialized in ${Date.now() - this.startTime}ms`);
    } catch (error) {
      console.error('[SecurityFabric] Failed to initialize security fabric', error);
      // Re-throw to allow proper handling by the application
      throw new Error('Failed to initialize security fabric: ' + (error as Error).message);
    }
  }

  /**
   * Register a security component with the fabric
   */
  public registerComponent(name: string, component: any): void {
    this.components.set(name, component);
    console.debug(`[SecurityFabric] Registered component: ${name}`);
    
    // Notify about new component registration
    this.eventBus.emit('security:component:registered', { name, component });
  }

  /**
   * Get a registered security component
   */
  public getComponent<T>(name: string): T | undefined {
    return this.components.get(name) as T | undefined;
  }

  /**
   * Subscribe to security events
   */
  public on(event: string, listener: (...args: any[]) => void): void {
    this.eventBus.on(event, listener);
  }

  /**
   * Publish a security event
   */
  public emit(event: string, data: any): void {
    this.eventBus.emit(event, {
      ...data,
      timestamp: new Date(),
      securityPosture: this.securityPosture,
      threatLevel: this.threatLevel
    });
  }

  /**
   * Create a security context for the current request
   */
  public createSecurityContext(req: any, res: any): SecurityContext {
    const context = new SecurityContext(req, res);
    this.emit('security:context:created', { context });
    return context;
  }

  /**
   * Adjust the system-wide security posture based on threat intelligence
   */
  public adjustSecurityPosture(threatLevel: number): void {
    this.threatLevel = threatLevel;
    
    // Determine appropriate security posture based on threat level
    if (threatLevel >= 0.8) {
      this.securityPosture = 'maximum';
    } else if (threatLevel >= 0.5) {
      this.securityPosture = 'high';
    } else if (threatLevel >= 0.3) {
      this.securityPosture = 'elevated';
    } else {
      this.securityPosture = 'normal';
    }
    
    console.log(`[SecurityFabric] Security posture adjusted to: ${this.securityPosture} (threat level: ${threatLevel})`);
    
    // Notify all components about posture change
    this.emit('security:posture:changed', {
      posture: this.securityPosture,
      previousThreatLevel: this.threatLevel,
      newThreatLevel: threatLevel
    });
    
    // Apply security settings based on new posture
    this.applySecurityPostureSettings();
  }

  /**
   * Get the current security posture
   */
  public getSecurityPosture(): SecurityPostureLevel {
    return this.securityPosture;
  }

  /**
   * Get the current threat level (0-1)
   */
  public getThreatLevel(): number {
    return this.threatLevel;
  }

  /**
   * Clean shutdown of the security fabric
   */
  public async shutdown(): Promise<void> {
    console.log('[SecurityFabric] Initiating security fabric shutdown...');
    
    // Notify about shutdown
    this.emit('security:fabric:shuttingDown', { timestamp: new Date() });
    
    // Stop metrics collection
    if (this.metricsCollectionInterval) {
      clearInterval(this.metricsCollectionInterval);
      this.metricsCollectionInterval = null;
    }
    
    // Shutdown each component
    for (const [name, component] of this.components.entries()) {
      if (component && typeof component.shutdown === 'function') {
        try {
          console.debug(`[SecurityFabric] Shutting down component: ${name}`);
          await component.shutdown();
        } catch (error) {
          console.error(`[SecurityFabric] Error shutting down component ${name}:`, error);
        }
      }
    }
    
    // Clear all components
    this.components.clear();
    
    // Remove all event listeners
    this.eventBus.removeAllListeners();
    
    console.log('[SecurityFabric] Security fabric shutdown complete');
  }

  /**
   * Register internal event listeners
   */
  private registerEventListeners(): void {
    // Log all security events at debug level
    this.eventBus.on('security:*', (data) => {
      console.debug(`[SecurityEvent] ${data.event}`, data);
    });
    
    // Listen for threat intelligence updates
    this.eventBus.on('security:threatIntelligence:updated', (data) => {
      this.adjustSecurityPosture(data.threatLevel);
    });
  }

  /**
   * Initialize core security components
   */
  private async initializeSecurityComponents(config: SecurityConfig): Promise<void> {
    // Initialize threat intelligence
    const threatIntelligence = new ThreatIntelligence(config.threatIntelligence);
    await threatIntelligence.initialize();
    this.registerComponent('threatIntelligence', threatIntelligence);
    
    // Initialize security metrics
    const securityMetrics = new SecurityMetrics();
    await securityMetrics.initialize();
    this.registerComponent('securityMetrics', securityMetrics);
    
    // Additional components will be initialized in their respective modules
  }

  /**
   * Start continuous security monitoring
   */
  private startContinuousMonitoring(): void {
    // Collect security metrics periodically
    this.metricsCollectionInterval = setInterval(() => {
      const metrics = this.getComponent<SecurityMetrics>('securityMetrics');
      if (metrics) {
        metrics.collectMetrics();
      }
    }, 60000); // Collect metrics every minute
    
    console.log('[SecurityFabric] Started continuous security monitoring');
  }

  /**
   * Apply settings based on current security posture
   */
  private applySecurityPostureSettings(): void {
    // Adjust security parameters based on current posture
    const settings = {
      rateLimitMultiplier: this.getRateLimitMultiplierForPosture(),
      sessionTTL: this.getSessionTTLForPosture(),
      additionalValidations: this.getValidationsForPosture(),
      loggingLevel: this.getLoggingLevelForPosture()
    };
    
    // Apply settings to all relevant components
    this.emit('security:settings:updated', { settings });
    
    console.log(`[SecurityFabric] Applied security settings for posture: ${this.securityPosture}`);
  }

  /**
   * Get rate limit multiplier based on security posture
   */
  private getRateLimitMultiplierForPosture(): number {
    switch (this.securityPosture) {
      case 'maximum': return 0.2;  // Most restrictive (20% of normal)
      case 'high': return 0.5;     // Very restrictive (50% of normal)
      case 'elevated': return 0.7; // Somewhat restrictive (70% of normal)
      case 'normal': return 1.0;   // Normal rate limits (100%)
      default: return 1.0;
    }
  }

  /**
   * Get session TTL based on security posture
   */
  private getSessionTTLForPosture(): number {
    switch (this.securityPosture) {
      case 'maximum': return 5 * 60;     // 5 minutes
      case 'high': return 15 * 60;       // 15 minutes
      case 'elevated': return 30 * 60;   // 30 minutes
      case 'normal': return 60 * 60;     // 1 hour
      default: return 60 * 60;
    }
  }

  /**
   * Get additional validations based on security posture
   */
  private getValidationsForPosture(): string[] {
    const baseValidations = ['input', 'csrf', 'xss'];
    
    switch (this.securityPosture) {
      case 'maximum':
        return [...baseValidations, 'deviceFingerprint', 'behavioralAnalysis', 'deepContentInspection'];
      case 'high':
        return [...baseValidations, 'deviceFingerprint', 'behavioralAnalysis'];
      case 'elevated':
        return [...baseValidations, 'deviceFingerprint'];
      case 'normal':
        return baseValidations;
      default:
        return baseValidations;
    }
  }

  /**
   * Get logging level based on security posture
   */
  private getLoggingLevelForPosture(): string {
    switch (this.securityPosture) {
      case 'maximum': return 'trace';  // Maximum logging detail
      case 'high': return 'debug';     // Detailed logging
      case 'elevated': return 'info';  // Standard logging
      case 'normal': return 'warn';    // Minimal logging
      default: return 'info';
    }
  }
}

// Export singleton instance
export const securityFabric = SecurityFabric.getInstance();