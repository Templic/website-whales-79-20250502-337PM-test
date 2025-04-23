/**
 * Memory Leak Detector
 * 
 * A utility to detect and report potential memory leaks in React components
 * by tracking long-lived component instances that may indicate leaked references.
 */

import React, { useEffect } from 'react';

interface LeakDetectorOptions {
  warnAfterMs?: number; // Time to wait before considering a component leaked
  debugMode?: boolean;  // Enable additional debug logging
}

class MemoryLeakDetector {
  private mountedComponents: Map<string, { timestamp: number; stack: string }> = new Map();
  private readonly warnAfterMs: number;
  private readonly debugMode: boolean;
  private checkInterval: number | null = null;

  constructor(options: LeakDetectorOptions = {}) {
    this.warnAfterMs = options.warnAfterMs || 60000; // Default 1 minute
    this.debugMode = options.debugMode || false;
    
    // Start periodic check if we're in a browser environment
    if (typeof window !== 'undefined') {
      this.startPeriodicCheck();
    }
  }

  /**
   * Register a component as mounted
   */
  trackMount(componentId: string): void {
    if (this.debugMode) {
      console.debug(`[MemoryLeakDetector] Component mounted: ${componentId}`);
    }
    
    // Capture stack trace for debugging
    let stack = '';
    try {
      throw new Error();
    } catch (e: unknown) {
      if (e instanceof Error) {
        stack = e.stack || '';
      }
    }
    
    this.mountedComponents.set(componentId, {
      timestamp: Date.now(),
      stack
    });
  }

  /**
   * Unregister a component on unmount
   */
  trackUnmount(componentId: string): void {
    if (this.debugMode) {
      console.debug(`[MemoryLeakDetector] Component unmounted: ${componentId}`);
    }
    
    this.mountedComponents.delete(componentId);
  }

  /**
   * Generate a unique ID for a component
   */
  generateComponentId(componentName: string): string {
    return `${componentName}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Start periodic check for leaked components
   */
  private startPeriodicCheck(): void {
    if (this.checkInterval) {
      window.clearInterval(this.checkInterval);
    }
    
    this.checkInterval = window.setInterval(() => {
      this.checkForLeaks();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Check for potential memory leaks
   */
  private checkForLeaks(): void {
    const now = Date.now();
    
    this.mountedComponents.forEach((details, componentId) => {
      const mountTime = now - details.timestamp;
      
      if (mountTime > this.warnAfterMs) {
        console.warn(
          `[MemoryLeakDetector] Potential memory leak detected: Component ${componentId} has been mounted for ${Math.round(mountTime / 1000)}s without unmounting.`,
          `\nStack trace at mount time:\n${details.stack}`
        );
      }
    });
    
    if (this.debugMode) {
      console.debug(`[MemoryLeakDetector] Current tracked components: ${this.mountedComponents.size}`);
    }
  }

  /**
   * Cleanup and stop tracking
   */
  dispose(): void {
    if (this.checkInterval) {
      window.clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    this.mountedComponents.clear();
  }
}

// Create singleton instance
const memoryLeakDetector = new MemoryLeakDetector({
  debugMode: process.env.NODE_ENV === 'development'
});

export default memoryLeakDetector;

/**
 * React hook for tracking component lifecycle to detect memory leaks
 */
export function useMemoryLeakDetection(componentName: string): void {
  useEffect(() => {
    // Skip in SSR or production
    if (typeof window === 'undefined' || process.env.NODE_ENV === 'production') {
      return;
    }
    
    const componentId = memoryLeakDetector.generateComponentId(componentName);
    memoryLeakDetector.trackMount(componentId);
    
    // Return cleanup function for React's useEffect
    return () => {
      memoryLeakDetector.trackUnmount(componentId);
    };
  }, []); // Empty dependency array - run only on mount and unmount
}