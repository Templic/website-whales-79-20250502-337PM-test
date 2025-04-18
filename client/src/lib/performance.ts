/**
 * React Performance Optimization Utilities
 * 
 * Provides helpers for optimizing React component performance including
 * component analysis, rendering optimization, and performance monitoring.
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';

/**
 * Tracks whether a component renders too many times within a time period
 * 
 * @param name Component name for logging
 * @param threshold Maximum number of renders allowed in timeframe
 * @param timeframe Timeframe in milliseconds to check renders within
 * @returns Boolean indicating if component is rendering too frequently
 */
export const useRenderTracker = (
  name: string,
  threshold: number = 3,
  timeframe: number = 1000
): boolean => {
  const renderCount = useRef(0);
  const lastWarning = useRef(0);
  const renders = useRef<number[]>([]);
  
  // Track this render
  useEffect(() => {
    const now = Date.now();
    renders.current.push(now);
    
    // Only keep renders within the timeframe
    renders.current = renders.current.filter(time => now - time < timeframe);
    renderCount.current += 1;
    
    // Check if rendering too frequently
    if (
      renders.current.length >= threshold &&
      now - lastWarning.current > timeframe
    ) {
      console.warn(
        `Component "${name}" rendered ${renders.current.length} times in ${timeframe}ms (${renderCount.current} total renders).`
      );
      lastWarning.current = now;
    }
    
    return () => {
      // Cleanup on unmount
    };
  });
  
  return renders.current.length >= threshold;
};

/**
 * Profiler component to measure and log component render performance
 */
export const PerformanceProfiler: React.FC<{
  id: string;
  children: React.ReactNode;
  logResults?: boolean;
  onRender?: (id: string, phase: string, actualDuration: number) => void;
}> = ({ id, children, logResults = true, onRender }) => {
  // Handle render completion with React Profiler API
  const handleRender = React.useCallback(
    (
      profilerId: string,
      phase: string,
      actualDuration: number,
      baseDuration: number,
      startTime: number,
      commitTime: number,
      interactions: Set<any>
    ) => {
      if (logResults) {
        console.log(
          `[Performance] ${profilerId} (${phase}): ${actualDuration.toFixed(2)}ms`
        );
      }
      
      if (onRender) {
        onRender(profilerId, phase, actualDuration);
      }
    },
    [logResults, onRender]
  );
  
  return React.createElement(
    React.Profiler,
    { id, onRender: handleRender },
    children
  );
};

/**
 * Hook to track component prop changes and provide warnings about unstable props
 * 
 * @param props Component props object to track
 * @param componentName Name of component for logging
 */
export const usePropChangeTracker = (
  props: Record<string, any>,
  componentName: string
): void => {
  const propsRef = useRef<Record<string, any>>(props);
  
  useEffect(() => {
    // Find what props changed
    const changedProps: string[] = [];
    
    Object.keys(props).forEach(key => {
      if (props[key] !== propsRef.current[key]) {
        changedProps.push(key);
      }
    });
    
    // Log if props changed
    if (changedProps.length > 0) {
      console.log(
        `[PropChangeTracker] ${componentName} props changed: ${changedProps.join(', ')}`
      );
      
      // Check for non-primitive values that could be unstable references
      changedProps.forEach(prop => {
        const value = props[prop];
        if (
          value &&
          typeof value === 'object' &&
          !(value instanceof Date) && // Dates are OK
          !Array.isArray(value) // Simple check for arrays
        ) {
          console.warn(
            `[PropChangeTracker] ${componentName}.${prop} is an object. Consider using useMemo or useCallback to stabilize this reference.`
          );
        } else if (typeof value === 'function') {
          console.warn(
            `[PropChangeTracker] ${componentName}.${prop} is a function. Consider using useCallback to stabilize this reference.`
          );
        }
      });
    }
    
    // Update the ref
    propsRef.current = props;
  });
};

/**
 * Debounce a function call (for expensive operations)
 * 
 * @param fn Function to debounce
 * @param delay Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Throttle a function call (for frequently triggered events)
 * 
 * @param fn Function to throttle
 * @param limit Time limit in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let lastArgs: Parameters<T> | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>) {
    const now = Date.now();
    
    if (now - lastCall >= limit) {
      // Allow immediate execution if enough time has passed
      lastCall = now;
      fn(...args);
    } else {
      // Store the most recent arguments to use when the throttle period ends
      lastArgs = args;
      
      // Set up the next call if not already pending
      if (timeoutId === null) {
        timeoutId = setTimeout(() => {
          if (lastArgs) {
            lastCall = Date.now();
            fn(...lastArgs);
          }
          timeoutId = null;
          lastArgs = null;
        }, limit - (now - lastCall));
      }
    }
  };
}

/**
 * Check if two objects are deeply equal (for memoization helpers)
 * 
 * @param obj1 First object
 * @param obj2 Second object
 * @returns Boolean indicating if objects are equal
 */
export function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;
  
  if (
    obj1 === null ||
    obj2 === null ||
    typeof obj1 !== 'object' ||
    typeof obj2 !== 'object'
  ) {
    return obj1 === obj2;
  }
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (const key of keys1) {
    if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
      return false;
    }
  }
  
  return true;
}

/**
 * Track render time of a component
 * 
 * @returns Object with start and end functions to track render time
 */
export const useRenderTimeTracker = () => {
  const startTime = useRef(0);
  
  const start = useCallback(() => {
    startTime.current = performance.now();
  }, []);
  
  const end = useCallback((componentName: string) => {
    const endTime = performance.now();
    const duration = endTime - startTime.current;
    console.log(`[RenderTime] ${componentName}: ${duration.toFixed(2)}ms`);
    return duration;
  }, []);
  
  return { start, end };
};

/**
 * Custom hook to measure how long a component stays mounted
 * 
 * @param componentName Name of the component for logging
 * @returns Mount time in milliseconds when component unmounts
 */
export const useMountTimeTracker = (componentName: string): number => {
  const mountTime = useRef(Date.now());
  const [timeElapsed, setTimeElapsed] = useState(0);
  
  useEffect(() => {
    return () => {
      const unmountTime = Date.now();
      const duration = unmountTime - mountTime.current;
      console.log(`[MountTime] ${componentName} was mounted for ${duration}ms`);
      setTimeElapsed(duration);
    };
  }, [componentName]);
  
  return timeElapsed;
};

/**
 * Create a memoized callback that only updates when deep dependencies change
 * 
 * @param callback The callback function to memoize
 * @param dependencies Array of dependencies for the callback
 * @returns Memoized callback function
 */
export function useDeepCallback<T extends (...args: any[]) => any>(
  callback: T,
  dependencies: any[]
): T {
  const ref = useRef<{
    fn: T;
    deps: any[];
  }>({
    fn: callback,
    deps: dependencies
  });
  
  const depsChanged = !dependencies.every((dep, i) => 
    deepEqual(dep, ref.current.deps[i])
  );
  
  if (depsChanged || callback !== ref.current.fn) {
    ref.current = {
      fn: callback,
      deps: dependencies
    };
  }
  
  return ref.current.fn;
}

/**
 * Detect frequent component rerenders and provide warnings
 * 
 * @param componentName Name of the component for logging
 * @param warningThreshold Number of renders before warning
 * @param interval Time interval to count renders within (ms)
 * @returns Function to call on each render
 */
export const useRerenderDetector = (
  componentName: string,
  warningThreshold: number = 5,
  interval: number = 3000
): (() => void) => {
  const renderCount = useRef(0);
  const lastIntervalStart = useRef(Date.now());
  
  return useCallback(() => {
    const now = Date.now();
    renderCount.current++;
    
    // Check if the interval has elapsed
    if (now - lastIntervalStart.current > interval) {
      // Report and reset if over threshold
      if (renderCount.current > warningThreshold) {
        console.warn(
          `[RerenderDetector] ${componentName} rendered ${renderCount.current} times in ${interval}ms. Consider optimizing with React.memo, useMemo, or useCallback.`
        );
      }
      
      // Reset for next interval
      renderCount.current = 0;
      lastIntervalStart.current = now;
    }
  }, [componentName, warningThreshold, interval]);
};