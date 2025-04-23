/**
 * Memory Leak Detector
 * 
 * A utility module for detecting and preventing memory leaks in React components.
 * This helps identify components that are not properly unmounted or cleaned up.
 */

// Map to track mounted components and their instances
const mountedComponents = new Map<string, Set<string>>();

/**
 * Register a component instance for leak detection
 * 
 * @param componentName The name of the component to track
 * @returns A cleanup function to call when the component unmounts
 */
export function registerComponent(componentName: string): () => void {
  // Generate a unique instance ID
  const instanceId = `${componentName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Get or create the set of instances for this component
  if (!mountedComponents.has(componentName)) {
    mountedComponents.set(componentName, new Set());
  }
  
  // Add this instance
  mountedComponents.get(componentName)?.add(instanceId);
  
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[MemoryLeakDetector] Registered component: ${componentName} (instance: ${instanceId})`);
  }
  
  // Return a cleanup function
  return () => {
    // Remove this instance when the component unmounts
    mountedComponents.get(componentName)?.delete(instanceId);
    
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[MemoryLeakDetector] Unregistered component: ${componentName} (instance: ${instanceId})`);
    }
  };
}

/**
 * Check for memory leaks in components
 * 
 * @param componentName Optional component name to check. If omitted, all components are checked.
 * @returns An object with leak information
 */
export function checkComponentLeaks(componentName?: string): { 
  leaks: { component: string, instanceCount: number }[],
  totalLeaks: number 
} {
  if (componentName) {
    // Check a specific component
    const instances = mountedComponents.get(componentName);
    const instanceCount = instances?.size || 0;
    
    return {
      leaks: instanceCount > 0 ? [{ component: componentName, instanceCount }] : [],
      totalLeaks: instanceCount
    };
  } else {
    // Check all components
    const leaks: { component: string, instanceCount: number }[] = [];
    let totalLeaks = 0;
    
    mountedComponents.forEach((instances, component) => {
      if (instances.size > 0) {
        leaks.push({ component, instanceCount: instances.size });
        totalLeaks += instances.size;
      }
    });
    
    return { leaks, totalLeaks };
  }
}

/**
 * Clear all registered component instances
 * Useful for tests or hot reloading
 */
export function clearAllRegistrations(): void {
  mountedComponents.clear();
  
  if (process.env.NODE_ENV === 'development') {
    console.debug('[MemoryLeakDetector] Cleared all registrations');
  }
}

/**
 * Hook for using the memory leak detector in a component
 * 
 * @param componentName The name of the component
 */
export function useMemoryLeakDetection(componentName: string): void {
  if (typeof window === 'undefined') return;
  
  // This only runs in development
  if (process.env.NODE_ENV !== 'development') return;
  
  // Import React hooks dynamically as they're frontend-only
  try {
    const React = require('react');
    const { useEffect } = React;
    
    useEffect(() => {
      // Register on mount
      const cleanup = registerComponent(componentName);
      // Clean up on unmount
      return cleanup;
    }, []);
  } catch (error) {
    console.warn('[MemoryLeakDetector] Could not import React for hooks:', error);
import { registerComponent, checkComponentLeaks, clearAllRegistrations, useMemoryLeakDetection } from "@/lib/memory-leak-detector";
  }
}
