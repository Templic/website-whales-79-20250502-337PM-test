/**
 * LazySecurityLoader - Implements lazy loading for security components
 * 
 * This module provides a mechanism to lazily load security components
 * to improve application startup time and reduce memory usage when
 * certain security features are not in use.
 */

import { EventEmitter } from 'events';
import chalk from 'chalk';

// Define component types for strong typing
export type SecurityComponentStatus = 'pending' | 'loading' | 'loaded' | 'error' | 'unloaded';

export interface SecurityComponent {
  name: string;
  loader: () => Promise<any>;
  instance?: any;
  status: SecurityComponentStatus;
  error?: Error;
  dependencies?: string[];
  priority: number; // Lower number = higher priority
  isRequired: boolean;
  loadTime?: number;
}

export interface LoadOptions {
  force?: boolean;
  timeout?: number;
}

/**
 * LazySecurityLoader manages the lazy loading of security components
 * based on their priority, dependencies, and when they are actually needed.
 */
class LazySecurityLoader extends EventEmitter {
  private components: Map<string, SecurityComponent> = new Map();
  private loadPromises: Map<string, Promise<any>> = new Map();
  private initialized: boolean = false;
  private startupMode: 'deferred' | 'immediate' = 'deferred';
  private loadTimeout: number = 10000; // Default timeout in ms
  
  constructor() {
    super();
    // Set max event listeners to avoid memory leak warnings
    this.setMaxListeners(100);
  }
  
  /**
   * Initialize the lazy loader
   * 
   * @param startupMode 'deferred' (default) or 'immediate'
   */
  initialize(startupMode: 'deferred' | 'immediate' = 'deferred'): void {
    if (this.initialized) return;
    
    this.startupMode = startupMode;
    this.initialized = true;
    
    console.log(chalk.blue(`[LazySecurityLoader] Initialized in ${startupMode} mode`));
    
    // If immediate mode, load all required components at startup
    if (startupMode === 'immediate') {
      this.loadRequiredComponents().catch(err => {
        console.error(chalk.red(`[LazySecurityLoader] Failed to load required components:`), err);
      });
    }
  }
  
  /**
   * Register a security component for lazy loading
   * 
   * @param name Component unique identifier
   * @param loader Function that returns a Promise resolving to the component
   * @param options Component options
   */
  register(
    name: string,
    loader: () => Promise<any>,
    options: {
      dependencies?: string[];
      priority?: number;
      isRequired?: boolean;
    } = {}
  ): void {
    if (this.components.has(name)) {
      console.warn(chalk.yellow(`[LazySecurityLoader] Component "${name}" is already registered`));
      return;
    }
    
    const component: SecurityComponent = {
      name,
      loader,
      status: 'pending',
      dependencies: options.dependencies || [],
      priority: options.priority !== undefined ? options.priority : 100,
      isRequired: options.isRequired !== undefined ? options.isRequired : false
    };
    
    this.components.set(name, component);
    this.emit('component:registered', name, component);
    
    console.log(chalk.blue(`[LazySecurityLoader] Registered component: ${name}`));
    
    // If in immediate mode and component is required, load it immediately
    if (this.initialized && this.startupMode === 'immediate' && component.isRequired) {
      this.load(name).catch(err => {
        console.error(chalk.red(`[LazySecurityLoader] Failed to load component "${name}":`), err);
      });
    }
  }
  
  /**
   * Load a security component and its dependencies
   * 
   * @param name Component name to load
   * @param options Load options
   */
  async load(name: string, options: LoadOptions = {}): Promise<any> {
    // Check if already loading
    if (this.loadPromises.has(name)) {
      return this.loadPromises.get(name)!;
    }
    
    const component = this.components.get(name);
    if (!component) {
      throw new Error(`Component "${name}" is not registered`);
    }
    
    // If component is already loaded and not forced, return the instance
    if (component.status === 'loaded' && !options.force) {
      return component.instance;
    }
    
    // Create and store the loading promise
    const loadPromise = this._loadComponent(name, options);
    this.loadPromises.set(name, loadPromise);
    
    try {
      // Wait for component to load
      const instance = await loadPromise;
      return instance;
    } finally {
      // Clean up the promise
      this.loadPromises.delete(name);
    }
  }
  
  /**
   * Check if a component is loaded
   * 
   * @param name Component name
   */
  isLoaded(name: string): boolean {
    const component = this.components.get(name);
    return component ? component.status === 'loaded' : false;
  }
  
  /**
   * Get a component's status
   * 
   * @param name Component name
   */
  getStatus(name: string): SecurityComponentStatus | undefined {
    const component = this.components.get(name);
    return component?.status;
  }
  
  /**
   * Get a loaded component instance
   * 
   * @param name Component name
   */
  get(name: string): any | undefined {
    const component = this.components.get(name);
    return component?.status === 'loaded' ? component.instance : undefined;
  }
  
  /**
   * Unload a component if it's not required
   * 
   * @param name Component name
   */
  async unload(name: string): Promise<boolean> {
    const component = this.components.get(name);
    
    if (!component) {
      throw new Error(`Component "${name}" is not registered`);
    }
    
    if (component.isRequired) {
      console.warn(chalk.yellow(`[LazySecurityLoader] Cannot unload required component "${name}"`));
      return false;
    }
    
    if (component.status !== 'loaded') {
      return true; // Already not loaded
    }
    
    // Check if any loaded component depends on this one
    const dependents = this.getDependentComponents(name);
    if (dependents.length > 0) {
      const dependentNames = dependents.map(c => c.name).join(', ');
      console.warn(chalk.yellow(`[LazySecurityLoader] Cannot unload "${name}" because it's required by: ${dependentNames}`));
      return false;
    }
    
    // Update component status
    component.status = 'unloaded';
    component.instance = undefined;
    
    this.emit('component:unloaded', name, component);
    console.log(chalk.blue(`[LazySecurityLoader] Unloaded component: ${name}`));
    
    return true;
  }
  
  /**
   * Load all required components in the correct order
   */
  async loadRequiredComponents(): Promise<void> {
    const requiredComponents = Array.from(this.components.values())
      .filter(c => c.isRequired)
      .sort((a, b) => a.priority - b.priority);
    
    console.log(chalk.blue(`[LazySecurityLoader] Loading ${requiredComponents.length} required components...`));
    
    for (const component of requiredComponents) {
      try {
        await this.load(component.name);
      } catch (error) {
        console.error(chalk.red(`[LazySecurityLoader] Failed to load required component "${component.name}":`), error);
        throw error;
      }
    }
    
    console.log(chalk.green(`[LazySecurityLoader] All required components loaded successfully`));
  }
  
  /**
   * Get all registered components
   */
  getComponents(): SecurityComponent[] {
    return Array.from(this.components.values());
  }
  
  /**
   * Find components that depend on a given component
   */
  getDependentComponents(name: string): SecurityComponent[] {
    return Array.from(this.components.values())
      .filter(c => 
        c.status === 'loaded' && 
        c.dependencies && 
        c.dependencies.includes(name)
      );
  }
  
  /**
   * Get loading statistics for all components
   */
  getLoadingStats(): {
    total: number;
    loaded: number;
    pending: number;
    loading: number;
    error: number;
    unloaded: number;
    avgLoadTime: number;
  } {
    const components = Array.from(this.components.values());
    const loadTimes = components
      .filter(c => c.loadTime !== undefined)
      .map(c => c.loadTime!) || [0];
    
    const avgLoadTime = loadTimes.length 
      ? loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length 
      : 0;
    
    return {
      total: components.length,
      loaded: components.filter(c => c.status === 'loaded').length,
      pending: components.filter(c => c.status === 'pending').length,
      loading: components.filter(c => c.status === 'loading').length,
      error: components.filter(c => c.status === 'error').length,
      unloaded: components.filter(c => c.status === 'unloaded').length,
      avgLoadTime
    };
  }
  
  /**
   * Load a specific component and its dependencies
   * @private
   */
  private async _loadComponent(name: string, options: LoadOptions = {}): Promise<any> {
    const component = this.components.get(name);
    if (!component) {
      throw new Error(`Component "${name}" is not registered`);
    }
    
    // Update component status
    component.status = 'loading';
    this.emit('component:loading', name, component);
    
    console.log(chalk.blue(`[LazySecurityLoader] Loading component: ${name}`));
    
    // Create a timeout promise if needed
    const timeout = options.timeout || this.loadTimeout;
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Timeout loading component "${name}" after ${timeout}ms`));
      }, timeout);
    });
    
    try {
      // Load dependencies first
      if (component.dependencies && component.dependencies.length > 0) {
        for (const dep of component.dependencies) {
          if (!this.components.has(dep)) {
            throw new Error(`Component "${name}" depends on unknown component "${dep}"`);
          }
          
          // If dependency is not loaded, load it
          if (!this.isLoaded(dep)) {
            await this.load(dep, options);
          }
        }
      }
      
      // Measure loading time
      const startTime = performance.now();
      
      // Load the component with timeout
      const instance = await Promise.race([
        component.loader(),
        timeoutPromise
      ]);
      
      const endTime = performance.now();
      component.loadTime = endTime - startTime;
      
      // Update component status
      component.status = 'loaded';
      component.instance = instance;
      component.error = undefined;
      
      this.emit('component:loaded', name, component);
      console.log(chalk.green(`[LazySecurityLoader] Component loaded: ${name} (${component.loadTime.toFixed(2)}ms)`));
      
      return instance;
    } catch (error) {
      // Update component status
      component.status = 'error';
      component.error = error as Error;
      
      this.emit('component:error', name, component, error);
      console.error(chalk.red(`[LazySecurityLoader] Error loading component "${name}":`), error);
      
      throw error;
    }
  }
}

// Export singleton instance
export const lazySecurityLoader = new LazySecurityLoader();

// Export default for convenience
export default lazySecurityLoader;