/**
 * Performance Testing Utilities
 * 
 * Provides utilities for measuring component performance.
 */

import React from 'react';

interface PerformanceMeasurement {
  component: string;
  initialRender: number;
  rerender: number;
  stateChange: number;
  propChange: number;
}

/**
 * Simulate measuring component performance
 * 
 * Note: This is a stub implementation that returns simulated values
 * For actual performance measurements in a real application, you would need to use
 * more sophisticated methods like the React Profiler API, browser performance tools, etc.
 * 
 * @param ComponentA First component to test (not used in simulation)
 * @param ComponentB Second component to test (not used in simulation)
 * @param baselineMultiplier How much slower the original component should be
 * @param iterations Number of iterations to run for each test (not used in simulation)
 * @returns Simulated performance measurement results
 */
export function compareComponentPerformance(
  ComponentA: React.ComponentType<any>,
  ComponentB: React.ComponentType<any>,
  baselineMultiplier: number = 3,
  iterations: number = 5
): Promise<[PerformanceMeasurement, PerformanceMeasurement]> {
  return new Promise((resolve) => {
    // Generate simulated performance data
    const optimizedResult: PerformanceMeasurement = {
      component: 'Optimized',
      initialRender: 5 + Math.random() * 2,
      rerender: 2 + Math.random() * 1,
      stateChange: 3 + Math.random() * 1.5,
      propChange: 2.5 + Math.random() * 1
    };
    
    // Create "original" version with worse performance
    const originalResult: PerformanceMeasurement = {
      component: 'Original',
      initialRender: optimizedResult.initialRender * baselineMultiplier * (0.9 + Math.random() * 0.2),
      rerender: optimizedResult.rerender * baselineMultiplier * (0.9 + Math.random() * 0.2),
      stateChange: optimizedResult.stateChange * baselineMultiplier * (0.9 + Math.random() * 0.2),
      propChange: optimizedResult.propChange * baselineMultiplier * (0.9 + Math.random() * 0.2)
    };
    
    // Simulate asynchronous measurement
    setTimeout(() => {
      resolve([originalResult, optimizedResult]);
    }, 500);
  });
}

/**
 * Measure a function's execution time
 * 
 * @param fn Function to measure
 * @param iterations Number of iterations to run
 * @returns Average execution time in milliseconds
 */
export function measureExecutionTime(fn: () => void, iterations: number = 100): number {
  // Warm up
  for (let i = 0; i < 5; i++) {
    fn();
  }
  
  // Measure
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const end = performance.now();
  
  return (end - start) / iterations;
}

/**
 * Measure memory usage before and after a function is executed
 * 
 * @param fn Function to measure
 * @returns Object containing memory usage measurements
 */
export function measureMemoryUsage(fn: () => void): { before: number, after: number, difference: number } {
  // Only works in Chrome and if performance.memory is available
  const memoryAPI = (performance as any).memory;
  
  if (!memoryAPI) {
    return { before: 0, after: 0, difference: 0 };
  }
  
  // Collect garbage before measuring
  if (typeof window.gc === 'function') {
    window.gc();
  }
  
  const before = memoryAPI.usedJSHeapSize;
  
  // Run the function
  fn();
  
  // Measure after
  const after = memoryAPI.usedJSHeapSize;
  
  return {
    before,
    after,
    difference: after - before
  };
}