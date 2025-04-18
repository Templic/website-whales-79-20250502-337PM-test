/**
 * Performance optimization utilities for React components
 * 
 * This file provides utilities for optimizing React components
 * and measuring their performance.
 */

import { useCallback, useEffect, useRef } from 'react';

/**
 * Custom hook to debounce a function call
 * Useful for optimizing input handlers and other frequently called functions
 * 
 * @param fn The function to debounce
 * @param delay The delay in milliseconds
 * @returns A debounced version of the function
 */
export function useDebounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        fn(...args);
      }, delay);
    },
    [fn, delay]
  );
}

/**
 * Custom hook to throttle a function call
 * Useful for optimizing scroll handlers, resize handlers, etc.
 * 
 * @param fn The function to throttle
 * @param limit The minimum time between function calls in milliseconds
 * @returns A throttled version of the function
 */
export function useThrottle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  const lastCallTimeRef = useRef<number>(0);
  const throttledFnRef = useRef<T>(fn);
  
  // Update the ref when the function changes
  useEffect(() => {
    throttledFnRef.current = fn;
  }, [fn]);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      
      if (now - lastCallTimeRef.current >= limit) {
        throttledFnRef.current(...args);
        lastCallTimeRef.current = now;
      }
    },
    [limit]
  );
}

/**
 * Custom hook to detect if a component is visible in the viewport
 * Useful for implementing lazy loading of components
 * 
 * @param options IntersectionObserver options
 * @returns [ref, isVisible] - ref to attach to the element, and whether it's visible
 */
export function useInView(options: IntersectionObserverInit = {}) {
  const ref = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useRef<boolean>(false);

  useEffect(() => {
    const currentRef = ref.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible.current = entry.isIntersecting;
    }, options);

    observer.observe(currentRef);

    return () => {
      observer.disconnect();
    };
  }, [options]);

  return [ref, isVisible];
}

/**
 * Custom hook to record performance metrics for a component
 * Useful for measuring and optimizing component performance
 * 
 * @param componentName Name of the component to measure
 * @returns Object with start and end functions for measuring render time
 */
export function usePerformanceMetrics(componentName: string) {
  const renderStartTime = useRef<number>(0);
  
  const start = () => {
    renderStartTime.current = performance.now();
  };
  
  const end = () => {
    const renderEndTime = performance.now();
    const renderTime = renderEndTime - renderStartTime.current;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${componentName} rendered in ${renderTime.toFixed(2)}ms`);
    }
    
    // Could send this data to an analytics service in production
    return renderTime;
  };
  
  return { start, end };
}