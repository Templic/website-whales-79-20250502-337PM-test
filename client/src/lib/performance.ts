/**
 * Performance Utilities
 * 
 * A collection of utilities for optimizing React component performance
 * including memoization helpers, debounce, throttle, and performance monitoring.
 */

import React, { useRef, useEffect, useState, useCallback, memo } from 'react';

// Time constants
const SECOND = 1000;
const MINUTE = 60 * SECOND;

/**
 * Debounce a function to prevent excessive calls
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
  
  return function(this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Throttle a function to limit execution rate
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
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return function(this: any, ...args: Parameters<T>) {
    const now = Date.now();
    const elapsed = now - lastCall;
    
    const execute = () => {
      lastCall = now;
      fn.apply(this, args);
    };
    
    if (elapsed >= limit) {
      // If enough time has passed, execute immediately
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      execute();
    } else if (!timeoutId) {
      // Otherwise schedule to run at the end of the throttle period
      timeoutId = setTimeout(() => {
        execute();
        timeoutId = null;
      }, limit - elapsed);
    }
  };
}

/**
 * Performance profiler component
 * Tracks and reports rendering performance of wrapped components
 */
export const PerformanceProfiler: React.FC<{
  id: string;
  children: React.ReactNode;
  onRenderCallback?: (id: string, phase: string, duration: number) => void;
}> = ({ id, children, onRenderCallback }) => {
  const handleRender = useCallback(
    (
      profilerId: string,
      phase: string,
      actualDuration: number,
      baseDuration: number,
      startTime: number,
      commitTime: number,
      interactions: Set<any>
    ) => {
      // Log only if duration is significant (> 16ms, which is ~60fps)
      if (actualDuration > 16) {
        console.log(
          `[Performance] Component "${id}" took ${actualDuration.toFixed(2)}ms to render`
        );
      }
      
      if (onRenderCallback) {
        onRenderCallback(id, phase, actualDuration);
      }
    },
    [id, onRenderCallback]
  );
  
  return React.createElement(React.Profiler, { id, onRender: handleRender }, children);
};

/**
 * Track component render counts (useful for debugging)
 * 
 * @param componentName Name of the component
 * @returns Component render count
 */
export function useRenderCount(componentName: string): number {
  const renderCount = useRef(0);
  
  useEffect(() => {
    renderCount.current += 1;
    
    if (renderCount.current > 5) {
      console.warn(
        `[Performance] Component "${componentName}" has rendered ${renderCount.current} times. Consider memoization.`
      );
    }
  });
  
  return renderCount.current;
}

/**
 * Measure time between renders
 * 
 * @returns Object with time measurements
 */
export function useRenderTime(): {
  lastRenderTime: number;
  timeSinceLastRender: number;
  averageRenderInterval: number;
} {
  const lastRender = useRef(Date.now());
  const renderTimes = useRef<number[]>([]);
  const [measurements, setMeasurements] = useState({
    lastRenderTime: 0,
    timeSinceLastRender: 0,
    averageRenderInterval: 0,
  });
  
  useEffect(() => {
    const now = Date.now();
    const timeSinceLast = now - lastRender.current;
    
    // Keep the last 10 render times
    if (renderTimes.current.length >= 10) {
      renderTimes.current.shift();
    }
    renderTimes.current.push(timeSinceLast);
    
    // Calculate average render interval
    const avgInterval =
      renderTimes.current.reduce((sum, time) => sum + time, 0) /
      renderTimes.current.length;
    
    setMeasurements({
      lastRenderTime: now,
      timeSinceLastRender: timeSinceLast,
      averageRenderInterval: avgInterval,
    });
    
    lastRender.current = now;
  }, []);
  
  return measurements;
}

/**
 * Track hooks that run unnecessarily between renders
 * 
 * @param hookName Name of the hook for identification
 * @param dependencies Array of dependencies to check
 * @returns The dependencies unchanged
 */
export function trackHookChanges<T extends any[]>(
  hookName: string,
  dependencies: T
): T {
  const previousDeps = useRef<T | null>(null);
  
  useEffect(() => {
    if (previousDeps.current !== null) {
      const changedDeps = dependencies.reduce((result, dep, index) => {
        if (previousDeps.current && dep !== previousDeps.current[index]) {
          result.push({
            index,
            oldValue: previousDeps.current[index],
            newValue: dep,
          });
        }
        return result;
      }, [] as { index: number; oldValue: any; newValue: any }[]);
      
      if (changedDeps.length > 0) {
        console.log(`[Performance] Hook "${hookName}" dependencies changed:`, changedDeps);
      }
    }
    
    previousDeps.current = [...dependencies];
  }, dependencies);
  
  return dependencies;
}

/**
 * Creates a stable object reference that updates only when deep values change
 * 
 * @param value Object to stabilize
 * @returns Stable object reference
 */
export function useDeepMemo<T>(value: T): T {
  const ref = useRef<T>(value);
  
  // Only update if deep comparison shows a change
  if (JSON.stringify(ref.current) !== JSON.stringify(value)) {
    ref.current = value;
  }
  
  return ref.current;
}

/**
 * Safely memo a component with warning for missing dependencies
 * 
 * @param Component React component to memoize
 * @param dependencies Optional array of dependencies
 * @returns Memoized component
 */
export function createMemoizedComponent<P>(
  Component: React.ComponentType<P>,
  propsAreEqual?: (prevProps: P, nextProps: P) => boolean
): React.MemoExoticComponent<React.ComponentType<P>> {
  const displayName = Component.displayName || Component.name || 'Component';
  
  const MemoizedComponent = memo(Component, propsAreEqual);
  MemoizedComponent.displayName = `Memoized(${displayName})`;
  
  return MemoizedComponent;
}

/**
 * Measure execution time of a function
 * 
 * @param fn Function to measure
 * @param label Label for logging
 * @param threshold Time threshold for logging in ms
 * @returns Function with timing measurement
 */
export function measureExecutionTime<T extends (...args: any[]) => any>(
  fn: T,
  label: string,
  threshold: number = 10
): (...args: Parameters<T>) => ReturnType<T> {
  return function(this: any, ...args: Parameters<T>) {
    const start = performance.now();
    const result = fn.apply(this, args);
    
    // Handle both normal and promise returns
    if (result instanceof Promise) {
      return result.then(value => {
        const end = performance.now();
        const duration = end - start;
        
        if (duration > threshold) {
          console.log(`[Performance] ${label} took ${duration.toFixed(2)}ms to execute`);
        }
        
        return value;
      });
    } else {
      const end = performance.now();
      const duration = end - start;
      
      if (duration > threshold) {
        console.log(`[Performance] ${label} took ${duration.toFixed(2)}ms to execute`);
      }
      
      return result;
    }
  };
}

/**
 * Hook to check if component is in view
 * 
 * @param options IntersectionObserver options
 * @returns [ref, isInView] tuple
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  options: IntersectionObserverInit = {}
): [React.RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [isInView, setIsInView] = useState(false);
  
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver !== 'function') {
      setIsInView(true); // Fallback for older browsers
      return;
    }
    
    const observer = new IntersectionObserver(([entry]) => {
      setIsInView(entry.isIntersecting);
    }, {
      threshold: 0.1, // Default to 10% visibility
      ...options
    });
    
    observer.observe(element);
    
    return () => {
      observer.disconnect();
    };
  }, [options]);
  
  return [ref, isInView];
}

/**
 * Hook to optimize performance by skipping renders when component is offscreen
 * 
 * @param isVisible Whether the component is currently visible
 * @returns A ref to be attached to the component's root element
 */
export function useSkipRenderIfInvisible(isVisible: boolean): React.RefObject<HTMLDivElement> {
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    // If not visible, apply a CSS class that reduces repaints/reflows
    if (!isVisible) {
      element.style.willChange = 'auto';
      element.style.contain = 'content';
      element.style.contentVisibility = 'auto';
    } else {
      element.style.willChange = '';
      element.style.contain = '';
      element.style.contentVisibility = '';
    }
  }, [isVisible]);
  
  return ref;
}