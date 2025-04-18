/**
 * Performance Optimization Utilities
 *
 * This module provides a set of utilities and hooks for optimizing React components
 * and improving application performance.
 */

import { useEffect, useRef, useState, useCallback, Profiler, ProfilerOnRenderCallback } from 'react';

/**
 * Performance metrics for a component.
 */
export interface PerformanceMetrics {
  renderCount: number;
  renderTime: number;
  lastRenderTime: number;
  averageRenderTime: number;
  totalRenderTime: number;
  maxRenderTime: number;
  minRenderTime: number;
}

// Global store for performance metrics by component name
const metricsStore: Record<string, PerformanceMetrics> = {};

/**
 * Get performance metrics for a specific component.
 * @param componentName The name of the component.
 * @returns Performance metrics for the component.
 */
export function getComponentMetrics(componentName: string): PerformanceMetrics | undefined {
  return metricsStore[componentName];
}

/**
 * Get performance metrics for all components.
 * @returns Record of component names to performance metrics.
 */
export function getAllComponentMetrics(): Record<string, PerformanceMetrics> {
  return { ...metricsStore };
}

/**
 * Reset performance metrics for a specific component.
 * @param componentName The name of the component.
 */
export function resetComponentMetrics(componentName: string): void {
  delete metricsStore[componentName];
}

/**
 * Reset performance metrics for all components.
 */
export function resetAllComponentMetrics(): void {
  Object.keys(metricsStore).forEach((key) => {
    delete metricsStore[key];
  });
}

/**
 * Hook to track the number of times a component renders.
 * @param componentName Name of the component for tracking purposes.
 * @returns Number of renders.
 */
export function useRenderCount(componentName: string): number {
  const renderCount = useRef(0);
  
  useEffect(() => {
    renderCount.current += 1;
    
    if (!metricsStore[componentName]) {
      metricsStore[componentName] = {
        renderCount: 0,
        renderTime: 0,
        lastRenderTime: 0,
        averageRenderTime: 0,
        totalRenderTime: 0,
        maxRenderTime: 0,
        minRenderTime: Infinity,
      };
    }
    
    metricsStore[componentName].renderCount = renderCount.current;
  });
  
  return renderCount.current;
}

/**
 * Hook for profiling component render performance.
 * @param id Component identifier.
 * @returns ProfilerOnRenderCallback to be used with React Profiler component.
 */
export function useProfiler(id: string): ProfilerOnRenderCallback {
  return useCallback((
    profilerId: string,
    phase: string,
    actualDuration: number,
    baseDuration: number,
    startTime: number,
    commitTime: number
  ) => {
    if (!metricsStore[id]) {
      metricsStore[id] = {
        renderCount: 0,
        renderTime: actualDuration,
        lastRenderTime: actualDuration,
        averageRenderTime: actualDuration,
        totalRenderTime: actualDuration,
        maxRenderTime: actualDuration,
        minRenderTime: actualDuration,
      };
    } else {
      const metrics = metricsStore[id];
      metrics.renderCount += 1;
      metrics.lastRenderTime = actualDuration;
      metrics.totalRenderTime += actualDuration;
      metrics.averageRenderTime = metrics.totalRenderTime / metrics.renderCount;
      metrics.maxRenderTime = Math.max(metrics.maxRenderTime, actualDuration);
      metrics.minRenderTime = Math.min(metrics.minRenderTime, actualDuration);
    }
    
    // Log if the render took longer than a threshold
    if (actualDuration > 16) { // ~60fps threshold
      console.warn(`[Performance] Component ${id} took ${actualDuration.toFixed(2)}ms to render.`);
    }
  }, [id]);
}

/**
 * Utility to measure the execution time of a function.
 * @param label Label for the measurement.
 * @param callback Function to measure.
 * @returns The return value of the callback.
 */
export function measureExecutionTime<T>(label: string, callback: () => T): T {
  const start = performance.now();
  try {
    return callback();
  } finally {
    const end = performance.now();
    const duration = end - start;
    console.debug(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
  }
}

/**
 * Hook for implementing the Intersection Observer API to determine when an element is in view.
 * @param options IntersectionObserver options.
 * @returns [ref, isInView] tuple with ref to attach to the element and boolean indicating if element is in view.
 */
export function useInView(options: IntersectionObserverInit = {}): [React.RefCallback<Element>, boolean] {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<Element | null>(null);
  
  const callback = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    setIsInView(entry.isIntersecting);
  }, []);
  
  const setRef: React.RefCallback<Element> = useCallback((node) => {
    if (ref.current) {
      // Cleanup previous observer
      const observer = getObserver(options, callback);
      observer.unobserve(ref.current);
    }
    
    if (node) {
      // Observe new node
      const observer = getObserver(options, callback);
      observer.observe(node);
      ref.current = node;
    }
  }, [options.threshold, options.root, options.rootMargin, callback]);
  
  return [setRef, isInView];
}

// Cache for IntersectionObserver instances
const observerCache = new Map<string, IntersectionObserver>();

/**
 * Get or create an IntersectionObserver with the given options and callback.
 * @param options IntersectionObserver options.
 * @param callback Callback to invoke when intersection changes.
 * @returns IntersectionObserver instance.
 */
function getObserver(
  options: IntersectionObserverInit,
  callback: IntersectionObserverCallback
): IntersectionObserver {
  const key = JSON.stringify({
    threshold: options.threshold || 0,
    root: options.root ? '#root' : null, // Can't stringify DOM nodes
    rootMargin: options.rootMargin || '0px',
  });
  
  if (!observerCache.has(key)) {
    observerCache.set(key, new IntersectionObserver(callback, options));
  }
  
  return observerCache.get(key)!;
}

/**
 * Hook to prevent unnecessary renders of a component that is not in view.
 * @param isInView Boolean indicating if the element is in view.
 * @returns RefCallback to attach to the component.
 */
export function useSkipRenderIfInvisible(
  isInView: boolean
): React.RefCallback<HTMLElement> {
  const prevInViewRef = useRef(isInView);
  
  // Effect to handle visibility changes
  useEffect(() => {
    prevInViewRef.current = isInView;
  }, [isInView]);
  
  return useCallback((node: HTMLElement | null) => {
    if (!node) return;
    
    if (!isInView) {
      // If element is out of view, adjust styling to reduce rendering cost
      if (node.style.display !== 'none') {
        node.dataset.prevDisplay = node.style.display;
        node.style.display = 'none';
      }
    } else if (prevInViewRef.current !== isInView) {
      // If element just came into view, restore its styling
      if (node.dataset.prevDisplay) {
        node.style.display = node.dataset.prevDisplay;
        delete node.dataset.prevDisplay;
      } else {
        node.style.display = '';
      }
    }
  }, [isInView]);
}

/**
 * Creates a throttled version of a function.
 * @param callback Function to throttle.
 * @param delay Minimum delay between function invocations (in ms).
 * @returns Throttled function.
 */
export function throttle<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T {
  let lastCall = 0;
  let timeoutId: NodeJS.Timeout | null = null;
  let lastArgs: Parameters<T> | null = null;
  
  function throttled(this: any, ...args: Parameters<T>) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;
    
    // Save the latest args
    lastArgs = args;
    
    if (timeSinceLastCall >= delay) {
      // If enough time has passed, call immediately
      lastCall = now;
      callback.apply(this, args);
    } else if (!timeoutId) {
      // Schedule a call for when the delay has passed
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        timeoutId = null;
        if (lastArgs) {
          callback.apply(this, lastArgs);
        }
      }, delay - timeSinceLastCall);
    }
  }
  
  return throttled as T;
}

/**
 * Creates a debounced version of a function.
 * @param callback Function to debounce.
 * @param delay Delay before the function is called after the last invocation (in ms).
 * @returns Debounced function.
 */
export function debounce<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): (this: any, ...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return function debounced(this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      callback.apply(this, args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Hook to optimize costly animations and effects based on frame rate.
 * @param options Configuration options.
 * @returns Object with methods to control the optimized updates.
 */
export function useAnimationOptimizer(options: {
  targetFps?: number;
  measuringPeriod?: number;
  minQuality?: number;
  maxQuality?: number;
} = {}) {
  const {
    targetFps = 60,
    measuringPeriod = 1000,
    minQuality = 0.2,
    maxQuality = 1.0,
  } = options;
  
  const [quality, setQuality] = useState(maxQuality);
  const frameTimesRef = useRef<number[]>([]);
  const lastFrameTimeRef = useRef(0);
  const requestRef = useRef<number>();
  
  // Measure current FPS and adjust quality if needed
  const measurePerformance = useCallback(() => {
    const now = performance.now();
    
    if (lastFrameTimeRef.current) {
      const frameTime = now - lastFrameTimeRef.current;
      frameTimesRef.current.push(frameTime);
      
      // Keep only frames within the measuring period
      const frameTimesCopy = [...frameTimesRef.current];
      let totalTime = 0;
      
      for (let i = frameTimesCopy.length - 1; i >= 0; i--) {
        totalTime += frameTimesCopy[i];
        if (totalTime > measuringPeriod) {
          frameTimesRef.current = frameTimesCopy.slice(i + 1);
          break;
        }
      }
      
      // Calculate current FPS
      const avgFrameTime = frameTimesRef.current.reduce((sum, time) => sum + time, 0) 
                          / frameTimesRef.current.length;
      const currentFps = 1000 / avgFrameTime;
      
      // Adjust quality based on FPS
      if (currentFps < targetFps * 0.8 && quality > minQuality) {
        setQuality(q => Math.max(minQuality, q - 0.1));
      } else if (currentFps > targetFps * 0.95 && quality < maxQuality) {
        setQuality(q => Math.min(maxQuality, q + 0.05));
      }
    }
    
    lastFrameTimeRef.current = now;
    requestRef.current = requestAnimationFrame(measurePerformance);
  }, [targetFps, measuringPeriod, minQuality, maxQuality, quality]);
  
  // Start and stop the measurement loop
  const start = useCallback(() => {
    if (requestRef.current) return;
    
    frameTimesRef.current = [];
    lastFrameTimeRef.current = 0;
    requestRef.current = requestAnimationFrame(measurePerformance);
  }, [measurePerformance]);
  
  const stop = useCallback(() => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = undefined;
    }
  }, []);
  
  // Clean up the animation frame on unmount
  useEffect(() => {
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);
  
  return {
    quality,
    start,
    stop,
    setQuality,
  };
}

/**
 * Custom profiler component that logs render times.
 */
export function PerformanceProfiler({ id, children }: {
  id: string;
  children: React.ReactNode;
}) {
  const onRender = useProfiler(id);
  
  return React.createElement(
    Profiler, 
    { id, onRender }, 
    children
  );
}