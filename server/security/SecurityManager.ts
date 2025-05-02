/**
 * Security Manager
 * 
 * This module provides a central manager for the application's security features.
 * It uses the lazy loading system to optimize startup time and memory usage.
 */

import { Request, Response, NextFunction } from 'express';
import chalk from 'chalk';

import {
  initializeSecurityComponents,
  getSecurityComponent,
  getSecurityComponentSync,
  loadSecurityLevel,
  SecurityComponentName
} from './SecurityComponentRegistry';

/**
 * Available security modes
 */
export enum SecurityMode {
  MINIMUM = 'minimum',
  STANDARD = 'standard',
  MAXIMUM = 'maximum'
}

/**
 * Security Manager Class
 * 
 * Manages application security features with lazy loading support
 */
export class SecurityManager {
  private initialized: boolean = false;
  private activeMode: SecurityMode = SecurityMode.STANDARD;
  private startTime: number = 0;
  
  /**
   * Initialize the security system
   * 
   * @param mode Security mode to use
   * @param options Initialization options
   */
  async initialize(
    mode: SecurityMode = SecurityMode.STANDARD,
    options: {
      defer?: boolean;
      timeout?: number;
    } = {}
  ): Promise<void> {
    if (this.initialized) {
      console.warn(chalk.yellow('[SecurityManager] Security system already initialized'));
      return;
    }
    
    this.startTime = performance.now();
    this.activeMode = mode;
    
    const defer = options.defer !== undefined ? options.defer : true;
    
    console.log(chalk.blue(`[SecurityManager] Initializing security in ${mode} mode (defer: ${defer})`));
    
    // Initialize the component registry
    initializeSecurityComponents(defer ? 'deferred' : 'immediate');
    
    // If not deferred, load all required components for the selected mode
    if (!defer) {
      try {
        await loadSecurityLevel(mode);
      } catch (error) {
        console.error(chalk.red('[SecurityManager] Failed to initialize security:'), error);
        throw error;
      }
    } else {
      // In deferred mode, load only critical components
      try {
        // Load only required components for now
        await loadSecurityLevel('minimum');
        
        // Schedule the rest to load after a delay
        setTimeout(() => {
          loadSecurityLevel(mode)
            .then(() => {
              const endTime = performance.now();
              console.log(chalk.green(
                `[SecurityManager] Completed deferred loading of ${mode} security mode ` +
                `(total time: ${(endTime - this.startTime).toFixed(2)}ms)`
              ));
            })
            .catch(err => {
              console.error(chalk.red('[SecurityManager] Error during deferred security initialization:'), err);
            });
        }, 1000); // 1 second delay to allow critical paths to initialize first
      } catch (error) {
        console.error(chalk.red('[SecurityManager] Failed to initialize critical security components:'), error);
        throw error;
      }
    }
    
    this.initialized = true;
    const initTime = performance.now() - this.startTime;
    
    console.log(chalk.green(
      `[SecurityManager] Security system initialized in ${initTime.toFixed(2)}ms ` +
      `(${defer ? 'deferred' : 'immediate'} mode)`
    ));
  }
  
  /**
   * Change the security mode at runtime
   * 
   * @param mode New security mode
   */
  async changeMode(mode: SecurityMode): Promise<void> {
    if (!this.initialized) {
      throw new Error('Security system not initialized');
    }
    
    if (mode === this.activeMode) {
      console.log(chalk.blue(`[SecurityManager] Already in ${mode} mode`));
      return;
    }
    
    console.log(chalk.blue(`[SecurityManager] Changing security mode from ${this.activeMode} to ${mode}`));
    
    try {
      await loadSecurityLevel(mode);
      this.activeMode = mode;
      console.log(chalk.green(`[SecurityManager] Security mode changed to ${mode}`));
    } catch (error) {
      console.error(chalk.red(`[SecurityManager] Failed to change security mode to ${mode}:`), error);
      throw error;
    }
  }
  
  /**
   * Get the current security mode
   */
  getMode(): SecurityMode {
    return this.activeMode;
  }
  
  /**
   * Check if the security system is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
  
  /**
   * Get a security component (with auto-loading if needed)
   */
  async getComponent<T = any>(componentName: SecurityComponentName): Promise<T> {
    if (!this.initialized) {
      throw new Error('Security system not initialized');
    }
    
    const component = await getSecurityComponent<T>(componentName);
    if (!component) {
      throw new Error(`Failed to load security component: ${componentName}`);
    }
    
    return component;
  }
  
  /**
   * Get a security component synchronously (no auto-loading)
   */
  getComponentSync<T = any>(componentName: SecurityComponentName): T | undefined {
    if (!this.initialized) {
      throw new Error('Security system not initialized');
    }
    
    return getSecurityComponentSync<T>(componentName);
  }
  
  /**
   * Create middleware that applies all active security protections
   */
  createSecurityMiddleware(): (req: Request, res: Response, next: NextFunction) => void {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (!this.initialized) {
        console.error(chalk.red('[SecurityManager] Security middleware used before initialization'));
        return next(new Error('Security system not initialized'));
      }
      
      try {
        // CSRF Protection (if available)
        const csrfGuard = getSecurityComponentSync(SecurityComponentName.PROTECTION_CSRFGUARD);
        if (csrfGuard) {
          try {
            await csrfGuard.validate(req);
          } catch (error) {
            return res.status(403).json({
              error: 'CSRF validation failed',
              message: (error as Error).message
            });
          }
        }
        
        // XSS Protection (if available)
        const xssGuard = getSecurityComponentSync(SecurityComponentName.PROTECTION_XSSGUARD);
        if (xssGuard) {
          try {
            xssGuard.sanitize(req);
          } catch (error) {
            return res.status(400).json({
              error: 'XSS protection triggered',
              message: (error as Error).message
            });
          }
        }
        
        // Injection Protection (if available)
        const injectionGuard = getSecurityComponentSync(SecurityComponentName.PROTECTION_INJECTION_GUARD);
        if (injectionGuard) {
          try {
            await injectionGuard.validate(req);
          } catch (error) {
            return res.status(400).json({
              error: 'Injection attack detected',
              message: (error as Error).message
            });
          }
        }
        
        // API Validation (if available)
        const apiValidator = getSecurityComponentSync(SecurityComponentName.API_VALIDATOR);
        if (apiValidator) {
          try {
            await apiValidator.validate(req);
          } catch (error) {
            return res.status(400).json({
              error: 'API validation failed',
              message: (error as Error).message
            });
          }
        }
        
        // Threat Detection (async, non-blocking)
        const threatDetector = getSecurityComponentSync(SecurityComponentName.DETECTION_THREAT_DETECTOR);
        if (threatDetector) {
          // Run threat detection in background (don't wait for it)
          threatDetector.detect(req).catch(err => {
            console.error(chalk.red('[SecurityManager] Threat detection error:'), err);
          });
        }
        
        // Continue to next middleware
        next();
      } catch (error) {
        console.error(chalk.red('[SecurityManager] Security middleware error:'), error);
        res.status(500).json({
          error: 'Security check failed',
          message: 'An internal security error occurred'
        });
      }
    };
  }
  
  /**
   * Create middleware that ensures a specific component is loaded
   */
  ensureComponentMiddleware(componentName: SecurityComponentName): (req: Request, res: Response, next: NextFunction) => void {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (!this.initialized) {
        console.error(chalk.red(`[SecurityManager] Component middleware for ${componentName} used before initialization`));
        return next(new Error('Security system not initialized'));
      }
      
      try {
        await this.getComponent(componentName);
        next();
      } catch (error) {
        console.error(chalk.red(`[SecurityManager] Failed to load required component ${componentName}:`), error);
        res.status(500).json({
          error: 'Security component unavailable',
          message: `Required security component could not be loaded`
        });
      }
    };
  }
  
  /**
   * Get information about loaded security components
   */
  getSecurityInfo(): {
    mode: SecurityMode;
    initialized: boolean;
    initTime: number;
    components: {
      total: number;
      loaded: number;
      pending: number;
      error: number;
    };
  } {
    const currentTime = performance.now();
    const initTime = this.initialized ? currentTime - this.startTime : 0;
    
    // Get component statistics
    const components = {
      total: 0,
      loaded: 0,
      pending: 0,
      error: 0
    };
    
    // Count components by status
    Object.values(SecurityComponentName).forEach(componentName => {
      components.total++;
      
      const status = getSecurityComponentSync(SecurityComponentName.CORE_CONFIG)?.getComponentStatus?.(componentName);
      if (status === 'loaded') {
        components.loaded++;
      } else if (status === 'error') {
        components.error++;
      } else {
        components.pending++;
      }
    });
    
    return {
      mode: this.activeMode,
      initialized: this.initialized,
      initTime,
      components
    };
  }
}

// Export singleton instance
export const securityManager = new SecurityManager();

// Export default for convenience
export default securityManager;