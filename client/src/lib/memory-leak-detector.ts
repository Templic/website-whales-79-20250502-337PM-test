/**
 * Memory Leak Detector
 * 
 * This utility helps track component instances, event listeners, and other 
 * potentially leaky resources in React applications.
 * 
 * Features:
 * - Component mount/unmount tracking
 * - Event listener tracking
 * - Timer tracking (setTimeout/setInterval)
 * - Web Worker tracking
 * - Automatic detection of potential memory leaks
 * - React hook for easy integration
 * 
 * Usage:
 * ```tsx
 * // In a component
 * import { useMemoryLeakDetection } from '@/lib/memory-leak-detector';
 * 
 * const MyComponent = () => {
 *   // Automatically tracks this component instance
 *   useMemoryLeakDetection('MyComponent');
 *   
 *   // Use the tracked versions of APIs
 *   useEffect(() => {
 *     const timerId = MemoryLeakDetector.setTimeout(() => {
 *       console.log('Timer fired');
 *     }, 1000);
 *     
 *     const element = document.getElementById('my-element');
 *     if (element) {
 *       MemoryLeakDetector.addEventListener(element, 'click', handleClick);
 *     }
 *     
 *     return () => {
 *       // No need to manually clear - will be automatically detected and warned about
 *     };
 *   }, []);
 *   
 *   return <div>My Component</div>;
 * };
 * ```
 */

import React, { useEffect, useRef } from 'react';

// Types for tracked resources
interface TrackedComponent {
  id: string;
  name: string;
  mountedAt: number;
  unmountedAt?: number;
}

interface TrackedEventListener {
  id: string;
  element: Element | Window | Document;
  event: string;
  handler: EventListenerOrEventListenerObject;
  componentId?: string;
  addedAt: number;
  removedAt?: number;
}

interface TrackedTimer {
  id: number;
  timerId: number;
  type: 'timeout' | 'interval';
  componentId?: string;
  createdAt: number;
  clearedAt?: number;
}

interface TrackedWorker {
  id: string;
  worker: Worker;
  componentId?: string;
  createdAt: number;
  terminatedAt?: number;
}

export interface MemoryLeakReport {
  unmountedComponentsWithLeaks: TrackedComponent[];
  activeEventListeners: TrackedEventListener[];
  activeTimers: TrackedTimer[];
  activeWorkers: TrackedWorker[];
  recommendations: string[];
}

class MemoryLeakDetectorClass {
  private components: Map<string, TrackedComponent> = new Map();
  private eventListeners: Map<string, TrackedEventListener> = new Map();
  private timers: Map<number, TrackedTimer> = new Map();
  private workers: Map<string, TrackedWorker> = new Map();
  private nextComponentId = 1;
  private nextEventListenerId = 1;
  private nextTimerId = 1;
  private nextWorkerId = 1;
  private currentComponentContext: string | null = null;
  private enabled = false;
  private debugMode = false;
  private leakDetectionIntervalId: number | null = null;
  private memoryUsageSamples: number[] = [];
  private leakDetectionThreshold = 30000; // 30 seconds
  
  /**
   * Enable memory leak detection
   * @param debugMode Enable detailed console logging
   */
  enable(debugMode = false): void {
    this.enabled = true;
    this.debugMode = debugMode;
    
    if (this.leakDetectionIntervalId === null) {
      this.leakDetectionIntervalId = window.setInterval(() => {
        this.detectLeaks();
      }, 60000); // Check every minute
      
      // Start sampling memory usage if available
      if (window.performance && (performance as any).memory) {
        window.setInterval(() => {
          this.memoryUsageSamples.push((performance as any).memory.usedJSHeapSize);
          if (this.memoryUsageSamples.length > 10) {
            this.memoryUsageSamples.shift();
          }
        }, 30000); // Sample every 30 seconds
      }
    }
    
    if (this.debugMode) {
      console.log('[MemoryLeakDetector] Enabled with debug mode');
    }
  }
  
  /**
   * Disable memory leak detection
   */
  disable(): void {
    this.enabled = false;
    if (this.leakDetectionIntervalId !== null) {
      window.clearInterval(this.leakDetectionIntervalId);
      this.leakDetectionIntervalId = null;
    }
    
    if (this.debugMode) {
      console.log('[MemoryLeakDetector] Disabled');
    }
  }
  
  /**
   * Set the current component context for resource tracking
   * @param componentId The ID of the current component
   */
  setComponentContext(componentId: string | null): void {
    this.currentComponentContext = componentId;
  }
  
  /**
   * Track a component mount
   * @param name Component name for identification
   * @returns Component ID
   */
  trackComponentMount(name: string): string {
    if (!this.enabled) return `not-tracked-${this.nextComponentId++}`;
    
    const id = `component-${this.nextComponentId++}`;
    const component: TrackedComponent = {
      id,
      name,
      mountedAt: Date.now()
    };
    
    this.components.set(id, component);
    
    if (this.debugMode) {
      console.log(`[MemoryLeakDetector] Component mounted: ${name} (${id})`);
    }
    
    return id;
  }
  
  /**
   * Track a component unmount
   * @param id Component ID to track unmount for
   */
  trackComponentUnmount(id: string): void {
    if (!this.enabled) return;
    
    const component = this.components.get(id);
    if (component) {
      component.unmountedAt = Date.now();
      
      if (this.debugMode) {
        console.log(`[MemoryLeakDetector] Component unmounted: ${component.name} (${id})`);
      }
      
      // Check for resources that should be cleared on unmount
      this.checkComponentResources(id);
    }
  }
  
  /**
   * Add an event listener with tracking
   * @param element DOM element to attach listener to
   * @param event Event name
   * @param handler Event handler
   * @param options AddEventListener options
   */
  addEventListener<K extends keyof HTMLElementEventMap>(
    element: HTMLElement,
    event: K,
    handler: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): string {
    if (!this.enabled) {
      element.addEventListener(event, handler as EventListener, options);
      return `not-tracked-${this.nextEventListenerId++}`;
    }
    
    const id = `event-${this.nextEventListenerId++}`;
    
    // Store original handler for later removal
    const trackedEventListener: TrackedEventListener = {
      id,
      element,
      event: event as string,
      handler: handler as EventListenerOrEventListenerObject,
      componentId: this.currentComponentContext,
      addedAt: Date.now()
    };
    
    this.eventListeners.set(id, trackedEventListener);
    
    // Add the actual event listener
    element.addEventListener(event, handler as EventListener, options);
    
    if (this.debugMode) {
      console.log(`[MemoryLeakDetector] Event listener added: ${event} (${id}) ${this.currentComponentContext ? `by component ${this.currentComponentContext}` : ''}`);
    }
    
    return id;
  }
  
  /**
   * Remove a tracked event listener
   * @param id Event listener ID
   */
  removeEventListener(id: string): boolean {
    if (!this.enabled) return false;
    
    const eventListener = this.eventListeners.get(id);
    if (eventListener && !eventListener.removedAt) {
      const { element, event, handler } = eventListener;
      
      // Remove the actual event listener
      element.removeEventListener(event, handler);
      
      // Mark as removed
      eventListener.removedAt = Date.now();
      
      if (this.debugMode) {
        console.log(`[MemoryLeakDetector] Event listener removed: ${event} (${id})`);
      }
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Create a tracked setTimeout
   * @param handler Timeout handler
   * @param timeout Timeout in ms
   * @param args Arguments to pass to handler
   * @returns Timer ID
   */
  setTimeout(handler: TimerHandler, timeout?: number, ...args: any[]): number {
    if (!this.enabled) {
      return window.setTimeout(handler, timeout, ...args);
    }
    
    const actualTimerId = window.setTimeout(handler, timeout, ...args);
    const trackedId = this.nextTimerId++;
    
    this.timers.set(trackedId, {
      id: trackedId,
      timerId: actualTimerId,
      type: 'timeout',
      componentId: this.currentComponentContext,
      createdAt: Date.now()
    });
    
    if (this.debugMode) {
      console.log(`[MemoryLeakDetector] Timeout created: ${trackedId} ${this.currentComponentContext ? `by component ${this.currentComponentContext}` : ''}`);
    }
    
    return trackedId;
  }
  
  /**
   * Clear a tracked timeout
   * @param id Timer ID
   */
  clearTimeout(id: number): void {
    if (!this.enabled) {
      window.clearTimeout(id);
      return;
    }
    
    const timer = this.timers.get(id);
    if (timer && !timer.clearedAt) {
      window.clearTimeout(timer.timerId);
      timer.clearedAt = Date.now();
      
      if (this.debugMode) {
        console.log(`[MemoryLeakDetector] Timeout cleared: ${id}`);
      }
    } else {
      // If it's not in our tracking, it might be a raw timer ID
      window.clearTimeout(id);
    }
  }
  
  /**
   * Create a tracked setInterval
   * @param handler Interval handler
   * @param timeout Interval in ms
   * @param args Arguments to pass to handler
   * @returns Timer ID
   */
  setInterval(handler: TimerHandler, timeout?: number, ...args: any[]): number {
    if (!this.enabled) {
      return window.setInterval(handler, timeout, ...args);
    }
    
    const actualTimerId = window.setInterval(handler, timeout, ...args);
    const trackedId = this.nextTimerId++;
    
    this.timers.set(trackedId, {
      id: trackedId,
      timerId: actualTimerId,
      type: 'interval',
      componentId: this.currentComponentContext,
      createdAt: Date.now()
    });
    
    if (this.debugMode) {
      console.log(`[MemoryLeakDetector] Interval created: ${trackedId} ${this.currentComponentContext ? `by component ${this.currentComponentContext}` : ''}`);
    }
    
    return trackedId;
  }
  
  /**
   * Clear a tracked interval
   * @param id Timer ID
   */
  clearInterval(id: number): void {
    if (!this.enabled) {
      window.clearInterval(id);
      return;
    }
    
    const timer = this.timers.get(id);
    if (timer && !timer.clearedAt) {
      window.clearInterval(timer.timerId);
      timer.clearedAt = Date.now();
      
      if (this.debugMode) {
        console.log(`[MemoryLeakDetector] Interval cleared: ${id}`);
      }
    } else {
      // If it's not in our tracking, it might be a raw timer ID
      window.clearInterval(id);
    }
  }
  
  /**
   * Create a tracked Web Worker
   * @param scriptURL URL to worker script
   * @param options Worker options
   * @returns Tracked Worker object
   */
  createWorker(scriptURL: string | URL, options?: WorkerOptions): Worker {
    const worker = new Worker(scriptURL, options);
    
    if (!this.enabled) {
      return worker;
    }
    
    const id = `worker-${this.nextWorkerId++}`;
    
    this.workers.set(id, {
      id,
      worker,
      componentId: this.currentComponentContext,
      createdAt: Date.now()
    });
    
    if (this.debugMode) {
      console.log(`[MemoryLeakDetector] Worker created: ${id} ${this.currentComponentContext ? `by component ${this.currentComponentContext}` : ''}`);
    }
    
    // Add a proxy method to track termination
    const originalTerminate = worker.terminate.bind(worker);
    worker.terminate = () => {
      const trackedWorker = Array.from(this.workers.values()).find(w => w.worker === worker);
      if (trackedWorker) {
        trackedWorker.terminatedAt = Date.now();
        
        if (this.debugMode) {
          console.log(`[MemoryLeakDetector] Worker terminated: ${trackedWorker.id}`);
        }
      }
      
      return originalTerminate();
    };
    
    return worker;
  }
  
  /**
   * Check for resources that should have been cleaned up
   * @param componentId Component ID to check resources for
   */
  private checkComponentResources(componentId: string): void {
    // Check for event listeners that were added by this component
    const activeListeners = Array.from(this.eventListeners.values())
      .filter(listener => listener.componentId === componentId && !listener.removedAt);
    
    if (activeListeners.length > 0) {
      console.warn(`[MemoryLeakDetector] Component ${componentId} was unmounted but has ${activeListeners.length} active event listeners:`, activeListeners);
      
      // Automatically remove listeners to prevent leaks
      activeListeners.forEach(listener => {
        try {
          listener.element.removeEventListener(listener.event, listener.handler);
          listener.removedAt = Date.now();
          
          console.info(`[MemoryLeakDetector] Automatically removed event listener ${listener.id} to prevent leak`);
        } catch (error) {
          console.error(`[MemoryLeakDetector] Failed to automatically remove event listener ${listener.id}:`, error);
        }
      });
    }
    
    // Check for timers that were created by this component
    const activeTimers = Array.from(this.timers.values())
      .filter(timer => timer.componentId === componentId && !timer.clearedAt);
    
    if (activeTimers.length > 0) {
      console.warn(`[MemoryLeakDetector] Component ${componentId} was unmounted but has ${activeTimers.length} active timers:`, activeTimers);
      
      // Automatically clear timers to prevent leaks
      activeTimers.forEach(timer => {
        try {
          if (timer.type === 'timeout') {
            window.clearTimeout(timer.timerId);
          } else {
            window.clearInterval(timer.timerId);
          }
          
          timer.clearedAt = Date.now();
          
          console.info(`[MemoryLeakDetector] Automatically cleared ${timer.type} ${timer.id} to prevent leak`);
        } catch (error) {
          console.error(`[MemoryLeakDetector] Failed to automatically clear ${timer.type} ${timer.id}:`, error);
        }
      });
    }
    
    // Check for workers that were created by this component
    const activeWorkers = Array.from(this.workers.values())
      .filter(worker => worker.componentId === componentId && !worker.terminatedAt);
    
    if (activeWorkers.length > 0) {
      console.warn(`[MemoryLeakDetector] Component ${componentId} was unmounted but has ${activeWorkers.length} active web workers:`, activeWorkers);
      
      // Automatically terminate workers to prevent leaks
      activeWorkers.forEach(trackedWorker => {
        try {
          trackedWorker.worker.terminate();
          trackedWorker.terminatedAt = Date.now();
          
          console.info(`[MemoryLeakDetector] Automatically terminated worker ${trackedWorker.id} to prevent leak`);
        } catch (error) {
          console.error(`[MemoryLeakDetector] Failed to automatically terminate worker ${trackedWorker.id}:`, error);
        }
      });
    }
  }
  
  /**
   * Detect potential memory leaks
   */
  detectLeaks(): MemoryLeakReport | null {
    if (!this.enabled) return null;
    
    const now = Date.now();
    const unmountedComponentsWithLeaks: TrackedComponent[] = [];
    const activeEventListeners: TrackedEventListener[] = [];
    const activeTimers: TrackedTimer[] = [];
    const activeWorkers: TrackedWorker[] = [];
    const recommendations: string[] = [];
    
    // Find unmounted components with potential leaks
    this.components.forEach(component => {
      if (component.unmountedAt) {
        // Component is unmounted, check if it's been a while
        const timeSinceUnmount = now - component.unmountedAt;
        
        if (timeSinceUnmount > this.leakDetectionThreshold) {
          // Find active resources for this component
          const componentListeners = Array.from(this.eventListeners.values())
            .filter(listener => listener.componentId === component.id && !listener.removedAt);
          
          const componentTimers = Array.from(this.timers.values())
            .filter(timer => timer.componentId === component.id && !timer.clearedAt);
          
          const componentWorkers = Array.from(this.workers.values())
            .filter(worker => worker.componentId === component.id && !worker.terminatedAt);
          
          if (componentListeners.length > 0 || componentTimers.length > 0 || componentWorkers.length > 0) {
            unmountedComponentsWithLeaks.push(component);
            
            // Add resources to their respective lists
            activeEventListeners.push(...componentListeners);
            activeTimers.push(...componentTimers);
            activeWorkers.push(...componentWorkers);
            
            // Add recommendations
            if (componentListeners.length > 0) {
              recommendations.push(`Component ${component.name} has ${componentListeners.length} event listeners that should be removed in the useEffect cleanup function.`);
            }
            
            if (componentTimers.length > 0) {
              recommendations.push(`Component ${component.name} has ${componentTimers.length} active timers that should be cleared in the useEffect cleanup function.`);
            }
            
            if (componentWorkers.length > 0) {
              recommendations.push(`Component ${component.name} has ${componentWorkers.length} web workers that should be terminated in the useEffect cleanup function.`);
            }
          }
        }
      }
    });
    
    // Check for memory growth pattern
    if (this.memoryUsageSamples.length >= 5) {
      let consistentGrowth = true;
      for (let i = 1; i < this.memoryUsageSamples.length; i++) {
        if (this.memoryUsageSamples[i] <= this.memoryUsageSamples[i - 1]) {
          consistentGrowth = false;
          break;
        }
      }
      
      if (consistentGrowth) {
        const growthRate = (this.memoryUsageSamples[this.memoryUsageSamples.length - 1] - this.memoryUsageSamples[0]) / this.memoryUsageSamples[0] * 100;
        recommendations.push(`Detected consistent memory growth of ${growthRate.toFixed(2)}% over the last ${this.memoryUsageSamples.length} samples. This may indicate a memory leak.`);
      }
    }
    
    // Only report if we found potential issues
    if (unmountedComponentsWithLeaks.length > 0 || recommendations.length > 0) {
      const report: MemoryLeakReport = {
        unmountedComponentsWithLeaks,
        activeEventListeners,
        activeTimers,
        activeWorkers,
        recommendations
      };
      
      console.warn('[MemoryLeakDetector] Potential memory leaks detected:', report);
      
      // Report to any registered listeners
      window.dispatchEvent(new CustomEvent('memory-leak-detected', { detail: report }));
      
      return report;
    }
    
    return null;
  }
  
  /**
   * Clear all tracking data and reset
   */
  reset(): void {
    this.components.clear();
    this.eventListeners.clear();
    this.timers.clear();
    this.workers.clear();
    this.nextComponentId = 1;
    this.nextEventListenerId = 1;
    this.nextTimerId = 1;
    this.nextWorkerId = 1;
    this.currentComponentContext = null;
    this.memoryUsageSamples = [];
    
    if (this.leakDetectionIntervalId !== null) {
      window.clearInterval(this.leakDetectionIntervalId);
      this.leakDetectionIntervalId = null;
      
      if (this.enabled) {
        this.leakDetectionIntervalId = window.setInterval(() => {
          this.detectLeaks();
        }, 60000);
      }
    }
    
    if (this.debugMode) {
      console.log('[MemoryLeakDetector] Reset all tracking data');
    }
  }
  
  /**
   * Get memory usage statistics
   */
  getMemoryStats(): object {
    const stats = {
      components: this.components.size,
      eventListeners: this.eventListeners.size,
      timers: this.timers.size,
      workers: this.workers.size,
      memoryUsage: (performance as any).memory?.usedJSHeapSize || 'Not available',
      memoryLimit: (performance as any).memory?.jsHeapSizeLimit || 'Not available',
      memoryGrowth: this.memoryUsageSamples.length > 1 
        ? ((this.memoryUsageSamples[this.memoryUsageSamples.length - 1] - this.memoryUsageSamples[0]) / this.memoryUsageSamples[0] * 100).toFixed(2) + '%'
        : 'Not enough data'
    };
    
    return stats;
  }
}

// Create a singleton instance
const MemoryLeakDetector = new MemoryLeakDetectorClass();

// Enable in development mode by default
if (process.env.NODE_ENV === 'development') {
  MemoryLeakDetector.enable(false); // Debug mode off by default
}

export default MemoryLeakDetector;

/**
 * React hook for memory leak detection in components
 * @param componentName Name of the component for tracking
 */
export function useMemoryLeakDetection(componentName: string): void {
  const componentIdRef = useRef<string | null>(null);
  
  useEffect(() => {
    componentIdRef.current = MemoryLeakDetector.trackComponentMount(componentName);
    MemoryLeakDetector.setComponentContext(componentIdRef.current);
    
    return () => {
      if (componentIdRef.current) {
        MemoryLeakDetector.trackComponentUnmount(componentIdRef.current);
        
        // Reset component context if this was the active one
        if (componentIdRef.current === MemoryLeakDetector.currentComponentContext) {
          MemoryLeakDetector.setComponentContext(null);
        }
      }
    };
  }, [componentName]);
  
  // Track effect cleanup failures
  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<MemoryLeakReport>;
      const report = customEvent.detail;
      
      // Check if this component is in the report
      const isAffected = report.unmountedComponentsWithLeaks.some(
        component => component.id === componentIdRef.current
      );
      
      if (isAffected) {
        console.error(`[MemoryLeakDetector] Component ${componentName} has memory leaks. Check cleanup functions in useEffect hooks.`, report);
      }
    };
    
    window.addEventListener('memory-leak-detected', handler);
    
    return () => {
      window.removeEventListener('memory-leak-detected', handler);
    };
  }, [componentName]);
}