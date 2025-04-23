import React, { useState, useRef, useEffect, useCallback, useContext, useMemo, FC, ReactNode } from 'react';
import { useInView as useReactInView } from 'react-intersection-observer';

// Export the useInView hook from react-intersection-observer
export const useInView = useReactInView;

/**
 * Custom hook to skip rendering a component when it's not visible
 * @param options Options for controlling when to skip rendering
 */
export function useSkipRenderIfInvisible(options: {
  enabled?: boolean;
  rootMargin?: string;
  threshold?: number;
  fallback?: React.ReactNode;
} = {}): { 
  isVisible: boolean; 
  ref: (node: Element | null) => void;
  shouldRender: boolean;
  fallbackContent: React.ReactNode;
} {
  const { 
    enabled = true,
    rootMargin = '0px',
    threshold = 0,
    fallback = null
  } = options;
  
  const { ref, inView } = useReactInView({
    rootMargin,
    threshold,
    triggerOnce: false,
  });
  
  const isVisible = !enabled || inView;
  const shouldRender = isVisible;
  
  return {
    isVisible,
    ref,
    shouldRender,
    fallbackContent: fallback,
  };
}

/**
 * A performance profiler component that measures and reports rendering metrics
 */
export interface PerformanceProfilerProps {
  /** ID of the component to profile */
  id: string;
  /** Whether to enable profiling */
  enabled?: boolean;
  /** Children to render */
  children: React.ReactNode;
  /** Whether to log metrics to console */
  logToConsole?: boolean;
  /** Custom metrics callback */
  onMetrics?: (metrics$2 => void;
  /** Whether to show a visual indicator */
  showVisualIndicator?: boolean;
}

/**
 * PerformanceProfiler component that wraps children and measures render performance
 */
export const PerformanceProfiler: FC<PerformanceProfilerProps> = ({
  id,
  enabled = true,
  children,
  logToConsole = false,
  onMetrics,
  showVisualIndicator = false,
}) => {
  const startTimeRef = useRef(0);
  const renderCountRef = useRef(0);
  const [lastRenderTime, setLastRenderTime] = useState(0);
  
  useEffect(() => {
    if (!enabled) return;
    
    const endTime = performance.now();
    const renderTime = endTime - startTimeRef.current;
    renderCountRef.current += 1;
    
    // Save metrics
    const metrics = {
      id,
      renderCount: renderCountRef.current,
      renderTime,
      timestamp: Date.now(),
    };
    
    // Update state for visual indicator
    if (showVisualIndicator) {
      setLastRenderTime(renderTime);
    }
    
    // Optional logging
    if (logToConsole) {
      console.log(`[PerformanceProfiler] ${id} render #${renderCountRef.current}: ${renderTime.toFixed(2)}ms`);
    }
    
    // Report metrics through callback
    if (onMetrics) {
      onMetrics(metrics);
    }
  });
  
  // Record start time before render
  startTimeRef.current = performance.now();
  
  if (showVisualIndicator) {
    const isSlow = lastRenderTime > 16.7; // 60fps threshold
    
    return React.createElement(
      'div',
      { style: { position: 'relative' } },
      children,
      React.createElement(
        'div',
        {
          style: {
            position: 'absolute',
            top: 0,
            right: 0,
            backgroundColor: isSlow ? 'rgba(255, 0, 0, 0.5)' : 'rgba(0, 255, 0, 0.5)',
            color: 'white',
            fontSize: '10px',
            padding: '2px 4px',
            borderRadius: '2px',
            pointerEvents: 'none',
          }
        },
        `${lastRenderTime.toFixed(1)}ms`
      )
    );
  }
  
  return React.createElement(React.Fragment, null, children);
};

/**
 * Throttle a function to only execute once per specified time period
 * @param fn Function to throttle
 * @param delay Delay in ms
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  let lastCall = 0;
  let lastResult: ReturnType<T>;
  
  return function throttled(...args: Parameters<T>): ReturnType<T> | undefined {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      lastResult = fn(...args);
    }
    return lastResult;
  };
}

/**
 * Debounce a function to only execute after a specified delay
 * @param fn Function to debounce
 * @param delay Delay in ms
 * @param immediate Whether to execute immediately on first call
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
  immediate = false
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeoutId: NodeJS.Timeout | null = null;
  let resolveList: Array<(value: ReturnType<T>) => void> = [];
  
  return function debounced(...args: Parameters<T>): Promise<ReturnType<T>> {
    return new Promise(resolve => {
      resolveList.push(resolve);
      
      const executeFunction = () => {
        const result = fn(...args);
        resolveList.forEach(res => res(result));
        resolveList = [];
        timeoutId = null;
        return result;
      };
      
      if (timeoutId) {
        clearTimeout(timeoutId);
      } else if (immediate) {
        executeFunction();
      }
      
      timeoutId = setTimeout(executeFunction, delay);
    });
  };
}

/**
 * Cache the result of an expensive function call
 * @param fn Function to memoize
 * @param getKey Function to generate a cache key from arguments
 * @returns Memoized function
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  getKey: (...args: Parameters<T>) => string = (...args) => JSON.stringify(args)
): T {
  const cache = new Map<string, { result: ReturnType<T>; timestamp: number }>();
  
  return function memoized(...args: Parameters<T>): ReturnType<T> {
    const key = getKey(...args);
    const entry = cache.get(key);
    
    if (entry) {
      return entry.result;
    }
    
    const result = fn(...args);
    cache.set(key, { result, timestamp: Date.now() });
    
    return result;
  } as T;
}

// Types for performance measurements
interface PerformanceMeasurement {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

interface PerformanceMetrics {
  measurements: Record<string, PerformanceMeasurement[]>;
  averages: Record<string, number>;
  min: Record<string, number>;
  max: Record<string, number>;
  count: Record<string, number>;
  totalDuration: number;
  startTime: number;
  endTime?: number;
}

// Global performance tracking
const performanceMetrics: PerformanceMetrics = {
  measurements: {},
  averages: {},
  min: {},
  max: {},
  count: {},
  totalDuration: 0,
  startTime: Date.now(),
};

/**
 * Measure the execution time of a function
 * @param name Name of the measurement
 * @param fn Function to measure
 * @param metadata Additional metadata for the measurement
 * @returns Result of the function
 */
export function measureExecutionTime<T>(
  name: string,
  fn: () => T,
  metadata?: Record<string, any>
): T {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  const duration = end - start;
  
  // Store measurement
  if (!performanceMetrics.measurements[name]) {
    performanceMetrics.measurements[name] = [];
    performanceMetrics.min[name] = Infinity;
    performanceMetrics.max[name] = 0;
    performanceMetrics.count[name] = 0;
    performanceMetrics.averages[name] = 0;
  }
  
  const measurement: PerformanceMeasurement = {
    name,
    startTime: start,
    endTime: end,
    duration,
    metadata,
  };
  
  performanceMetrics.measurements[name].push(measurement);
  
  // Keep only the last 100 measurements per name
  if (performanceMetrics.measurements[name].length > 100) {
    performanceMetrics.measurements[name].shift();
  }
  
  // Update statistics
  performanceMetrics.min[name] = Math.min(performanceMetrics.min[name], duration);
  performanceMetrics.max[name] = Math.max(performanceMetrics.max[name], duration);
  performanceMetrics.count[name]++;
  
  // Recalculate average
  const totalTime = performanceMetrics.measurements[name].reduce(
    (sum, m) => sum + (m.duration || 0),
    0
  );
  
  performanceMetrics.averages[name] = totalTime / performanceMetrics.measurements[name].length;
  performanceMetrics.totalDuration += duration;
  
  // Maybe log to console in development
  if (process.env.NODE_ENV === 'development' && duration > 100) {
    console.warn(`[Performance] ${name} took ${duration.toFixed(2)}ms to execute`);
  }
  
  return result;
}

/**
 * Create a performance marker to track time between points
 * @param name Name of the marker
 * @param metadata Additional metadata for the marker
 * @returns Object with mark and measure methods
 */
export function createPerformanceMarker(name: string, metadata?: Record<string, any>) {
  let startTime = 0;
  let markerActive = false;
  
  return {
    mark: () => {
      startTime = performance.now();
      markerActive = true;
      
      // Use native performance API if available
      if (typeof performance !== 'undefined' && performance.mark) {
        performance.mark(`${name}-start`);
      }
      
      return startTime;
    },
    measure: (additionalMetadata?: Record<string, any>) => {
      if (!markerActive) {
        console.warn(`[Performance] Cannot measure ${name}: marker not started`);
        return 0;
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      markerActive = false;
      
      // Use native performance API if available
      if (typeof performance !== 'undefined' && performance.measure) {
        try {
          performance.measure(name, `${name}-start`);
        } catch (e) {
          // Some browsers might throw if the mark doesn't exist
        }
      }
      
      // Store measurement
      if (!performanceMetrics.measurements[name]) {
        performanceMetrics.measurements[name] = [];
        performanceMetrics.min[name] = Infinity;
        performanceMetrics.max[name] = 0;
        performanceMetrics.count[name] = 0;
        performanceMetrics.averages[name] = 0;
      }
      
      const measurement: PerformanceMeasurement = {
        name,
        startTime,
        endTime,
        duration,
        metadata: { ...metadata, ...additionalMetadata },
      };
      
      performanceMetrics.measurements[name].push(measurement);
      
      // Keep only the last 100 measurements per name
      if (performanceMetrics.measurements[name].length > 100) {
        performanceMetrics.measurements[name].shift();
      }
      
      // Update statistics
      performanceMetrics.min[name] = Math.min(performanceMetrics.min[name], duration);
      performanceMetrics.max[name] = Math.max(performanceMetrics.max[name], duration);
      performanceMetrics.count[name]++;
      
      // Recalculate average
      const totalTime = performanceMetrics.measurements[name].reduce(
        (sum, m) => sum + (m.duration || 0),
        0
      );
      
      performanceMetrics.averages[name] = totalTime / performanceMetrics.measurements[name].length;
      performanceMetrics.totalDuration += duration;
      
      return duration;
    },
  };
}

/**
 * Get current performance metrics
 * @returns Copy of current performance metrics
 */
export function getPerformanceMetrics(): PerformanceMetrics {
  return {
    ...performanceMetrics,
    endTime: Date.now(),
  };
}

/**
 * Reset performance metrics
 */
export function resetPerformanceMetrics(): void {
  Object.keys(performanceMetrics.measurements).forEach(key => {
    performanceMetrics.measurements[key] = [];
  });
  
  Object.keys(performanceMetrics.averages).forEach(key => {
    performanceMetrics.averages[key] = 0;
  });
  
  Object.keys(performanceMetrics.min).forEach(key => {
    performanceMetrics.min[key] = Infinity;
  });
  
  Object.keys(performanceMetrics.max).forEach(key => {
    performanceMetrics.max[key] = 0;
  });
  
  Object.keys(performanceMetrics.count).forEach(key => {
    performanceMetrics.count[key] = 0;
  });
  
  performanceMetrics.totalDuration = 0;
  performanceMetrics.startTime = Date.now();
  delete performanceMetrics.endTime;
}

/**
 * Custom hook to track component render count
 * @param componentName Name of the component
 * @returns Current render count
 */
export function useRenderCount(componentName?: string): number {
  const renderCountRef = useRef(0);
  const name = componentName || 'Component';
  
  // Update render count
  renderCountRef.current += 1;
  
  // Log excessive renders in development
  useEffect(() => {
    if (
      process.env.NODE_ENV === 'development' && 
      renderCountRef.current > 5 &&
      renderCountRef.current % 5 === 0
    ) {
      console.warn(`[Performance] ${name} has rendered ${renderCountRef.current} times`);
    }
  });
  
  return renderCountRef.current;
}

/**
 * Custom hook to determine if a component should render based on prioritization
 * This helps limit concurrent heavy renders
 * @param priority Priority level (higher = more important)
 * @param concurrencyLimit Maximum number of components to render concurrently
 * @returns Whether the component should render now
 */
export function usePrioritizedRendering(
  priority: number = 1,
  concurrencyLimit: number = 3
): boolean {
  // In a real app, this would be stored in a context or global state
  // For simplicity, we'll use a module-level variable
  const [shouldRender, setShouldRender] = useState(false);
  
  useEffect(() => {
    // This simulates checking if we're under the concurrency limit
    // In a real app, this would interact with a priority queue system
    const delay = Math.max(0, 1000 - priority * 100);
    const timeoutId = setTimeout(() => {
      setShouldRender(true);
    }, delay);
    
    return () => clearTimeout(timeoutId);
  }, [priority]);
  
  return shouldRender;
}

/**
 * Create a React component that displays performance metrics
 */
export function PerformanceMonitor({ visible = true }: { visible?: boolean }) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>(getPerformanceMetrics());
  
  useEffect(() => {
    const intervalId = setInterval(() => {
      setMetrics(getPerformanceMetrics());
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  if (!visible) return null;
  
  const slowMeasurements = Object.entries(metrics.averages)
    .filter(([_, avg]) => avg > 16.7) // 60fps threshold
    .sort(([_, a], [__, b]) => b - a);
  
  return React.createElement('div', {
    style: {
      position: 'fixed',
      bottom: 0,
      right: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px',
      fontFamily: 'monospace',
      fontSize: '12px',
      maxHeight: '300px',
      overflow: 'auto',
      zIndex: 9999,
    },
  }, [
    React.createElement('h3', { key: 'title' }, 'Performance Metrics'),
    React.createElement('div', { key: 'stats' }, [
      React.createElement('p', { key: 'total' }, `Total Duration: ${metrics.totalDuration.toFixed(2)}ms`),
      React.createElement('p', { key: 'slow' }, `Slow Operations (>16.7ms): ${slowMeasurements.length}`),
    ]),
    React.createElement('table', { key: 'table', style: { borderCollapse: 'collapse' } }, [
      React.createElement('thead', { key: 'thead' }, 
        React.createElement('tr', {}, [
          React.createElement('th', { style: { padding: '5px', textAlign: 'left' } }, 'Operation'),
          React.createElement('th', { style: { padding: '5px', textAlign: 'right' } }, 'Avg (ms)'),
          React.createElement('th', { style: { padding: '5px', textAlign: 'right' } }, 'Max (ms)'),
          React.createElement('th', { style: { padding: '5px', textAlign: 'right' } }, 'Count'),
        ])
      ),
      React.createElement('tbody', { key: 'tbody' }, 
        Object.entries(metrics.averages)
          .sort(([_, a], [__, b]) => b - a)
          .slice(0, 10)
          .map(([name, avg]) => 
            React.createElement('tr', { key: name }, [
              React.createElement('td', { style: { padding: '5px' } }, name),
              React.createElement('td', { style: { padding: '5px', textAlign: 'right', color: avg > 16.7 ? '#ff6b6b' : '#4cd137' } }, 
                avg.toFixed(2)
              ),
              React.createElement('td', { style: { padding: '5px', textAlign: 'right' } }, 
                metrics.max[name].toFixed(2)
              ),
              React.createElement('td', { style: { padding: '5px', textAlign: 'right' } }, 
                metrics.count[name]
              ),
            ])
          )
      )
    ]),
    React.createElement('button', {
      key: 'reset',
      onClick: resetPerformanceMetrics,
      style: {
        marginTop: '10px',
        padding: '5px',
        backgroundColor: '#3498db',
        border: 'none',
        color: 'white',
        cursor: 'pointer',
      },
    }, 'Reset Metrics'),
  ]);
}

/**
 * Custom hook for detecting when an element is visible in the viewport
 * and only executing expensive functions when visible
 */
export function useVisibilityBasedExecution<T>(
  expensiveFn: () => T,
  options: {
    fallbackValue: T;
    rootMargin?: string;
    threshold?: number;
    disabled?: boolean;
  }
): { result: T; ref: React.RefObject<HTMLDivElement> } {
  const { fallbackValue, rootMargin = '0px', threshold = 0.1, disabled = false } = options;
  const [isVisible, setIsVisible] = useState(false);
  const [result, setResult] = useState<T>(fallbackValue);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (disabled) {
      // If disabled, execute the function regardless of visibility
      setResult(expensiveFn());
      return;
    }
    
    const observer = new IntersectionObserver(
      entries => {
        const [entry] = entries;
        setIsVisible(entry.isIntersecting);
      },
      { rootMargin, threshold }
    );
    
    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }
    
    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
      observer.disconnect();
    };
  }, [disabled, rootMargin, threshold]);
  
  useEffect(() => {
    if (isVisible || disabled) {
      setResult(expensiveFn());
    }
  }, [isVisible, disabled, expensiveFn]);
  
  return { result, ref };
}

/**
 * Execute a callback when idle time is available
 * @param callback Function to execute during idle time
 * @param timeout Optional timeout in ms
 */
export function executeWhenIdle(
  callback: () => void,
  timeout?: number
): void {
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(callback, { timeout });
  } else {
    // Fallback for browsers that don't support requestIdleCallback
    setTimeout(callback, 0);
  }
}

/**
 * Split a long-running task into smaller chunks to avoid blocking the main thread
 * @param items Items to process
 * @param processFn Function to process each item
 * @param options Options for chunking
 */
export function processInChunks<T, R>(
  items: T[],
  processFn: (item: T) => R,
  options: {
    chunkSize?: number;
    chunkTimeout?: number;
    onProgress?: (processed: number, total: number) => void;
    onComplete?: (results: R[]) => void;
    onError?: (error: Error) => void;
  } = {}
): void {
  const {
    chunkSize = 100,
    chunkTimeout = 0,
    onProgress,
    onComplete,
    onError,
  } = options;
  
  const results: R[] = [];
  let processed = 0;
  const total = items.length;
  
  const processChunk = (startIndex: number) => {
    try {
      const endIndex = Math.min(startIndex + chunkSize, total);
      
      for (let i = startIndex; i < endIndex; i++) {
        results[i] = processFn(items[i]);
        processed++;
      }
      
      if (onProgress) {
        onProgress(processed, total);
      }
      
      if (processed < total) {
        setTimeout(() => processChunk(endIndex), chunkTimeout);
      } else if (onComplete) {
        onComplete(results);
      }
    } catch (error) {
      if (onError) {
        onError(error as Error);
      } else {
        console.error('Error processing chunk:', error);
      }
    }
  };
  
  processChunk(0);
}

/**
 * Check if rapid component updates are happening
 * @param componentName Name of the component
 * @param threshold Threshold in ms to consider updates as rapid
 * @returns Whether rapid updates are happening
 */
export function useDetectRapidUpdates(
  componentName: string,
  threshold: number = 100
): boolean {
  const lastUpdateRef = useRef<number>(Date.now());
  const updateCountRef = useRef<number>(0);
  const [isRapid, setIsRapid] = useState(false);
  
  useEffect(() => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;
    
    if (timeSinceLastUpdate < threshold) {
      updateCountRef.current++;
      
      if (updateCountRef.current > 3) {
        setIsRapid(true);
        console.warn(`[Performance] Rapid updates detected in ${componentName}`);
      }
    } else {
      updateCountRef.current = 0;
      setIsRapid(false);
    }
    
    lastUpdateRef.current = now;
  });
  
  return isRapid;
}