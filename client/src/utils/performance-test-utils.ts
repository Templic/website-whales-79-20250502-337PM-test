/**
 * Performance Testing Utilities
 * 
 * Provides functions and types for measuring and comparing component performance.
 */

import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';

/**
 * Structure for performance test results
 */
export interface PerformanceResult {
  /** Time for initial component render (ms) */
  initialRender: number;
  /** Time for subsequent re-renders (ms) */
  rerender: number;
  /** Time for state changes to propagate (ms) */
  stateChange: number;
  /** Time for prop changes to propagate (ms) */
  propChange: number;
}

/**
 * Measure rendering performance of a component
 * 
 * @param Component React component to test
 * @returns PerformanceResult with various performance metrics
 */
export async function measureComponentPerformance(
  Component: React.ComponentType<any>
): Promise<PerformanceResult> {
  // Create a container for mounting
  const container = document.createElement('div');
  document.body.appendChild(container);
  
  try {
    // Measure initial render time
    const startInitialRender = performance.now();
    render(<Component />, container);
    const initialRenderTime = performance.now() - startInitialRender;
    
    // Measure re-render time
    const startRerender = performance.now();
    render(<Component />, container);
    const rerenderTime = performance.now() - startRerender;
    
    // Measure state change propagation (using a wrapper)
    const StateWrapper = () => {
      const [state, setState] = React.useState(0);
      
      React.useEffect(() => {
        // Trigger a state change after initial render
        const timer = setTimeout(() => {
          performance.mark('state-change-start');
          setState(1);
        }, 50);
        
        return () => clearTimeout(timer);
      }, []);
      
      React.useLayoutEffect(() => {
        if (state === 1) {
          performance.mark('state-change-end');
          performance.measure('state-change', 'state-change-start', 'state-change-end');
        }
      }, [state]);
      
      return <Component />;
    };
    
    // Clear and remount with state wrapper
    unmountComponentAtNode(container);
    render(<StateWrapper />, container);
    
    // Wait for state change to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Get state change measurement
    const stateChangeEntries = performance.getEntriesByName('state-change');
    const stateChangeTime = stateChangeEntries.length > 0 
      ? stateChangeEntries[0].duration 
      : 0;
    
    // Measure prop change propagation
    const PropWrapper = () => {
      const [prop, setProp] = React.useState(0);
      
      React.useEffect(() => {
        // Trigger a prop change after initial render
        const timer = setTimeout(() => {
          performance.mark('prop-change-start');
          setProp(1);
        }, 50);
        
        return () => clearTimeout(timer);
      }, []);
      
      React.useLayoutEffect(() => {
        if (prop === 1) {
          performance.mark('prop-change-end');
          performance.measure('prop-change', 'prop-change-start', 'prop-change-end');
        }
      }, [prop]);
      
      return <Component testProp={prop} />;
    };
    
    // Clear and remount with prop wrapper
    unmountComponentAtNode(container);
    render(<PropWrapper />, container);
    
    // Wait for prop change to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Get prop change measurement
    const propChangeEntries = performance.getEntriesByName('prop-change');
    const propChangeTime = propChangeEntries.length > 0 
      ? propChangeEntries[0].duration 
      : 0;
    
    // Clear performance entries
    performance.clearMarks();
    performance.clearMeasures();
    
    return {
      initialRender: initialRenderTime,
      rerender: rerenderTime,
      stateChange: stateChangeTime,
      propChange: propChangeTime,
    };
  } finally {
    // Clean up
    if (container.parentNode) {
      unmountComponentAtNode(container);
      document.body.removeChild(container);
    }
  }
}

/**
 * Compare performance between original and optimized components
 * 
 * @param OriginalComponent Original React component
 * @param OptimizedComponent Optimized React component
 * @returns Promise resolving to performance results for both components
 */
export async function compareComponentPerformance(
  OriginalComponent: React.ComponentType<any>,
  OptimizedComponent: React.ComponentType<any>
): Promise<[PerformanceResult, PerformanceResult]> {
  console.log('Starting performance comparison...');
  
  // Measure original component
  console.log('Measuring original component...');
  const originalResult = await measureComponentPerformance(OriginalComponent);
  
  // Brief pause between tests
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Measure optimized component
  console.log('Measuring optimized component...');
  const optimizedResult = await measureComponentPerformance(OptimizedComponent);
  
  // Calculate improvements
  const initialRenderImprovement = 
    ((originalResult.initialRender - optimizedResult.initialRender) / originalResult.initialRender) * 100;
  
  const rerenderImprovement = 
    ((originalResult.rerender - optimizedResult.rerender) / originalResult.rerender) * 100;
  
  const stateChangeImprovement = 
    ((originalResult.stateChange - optimizedResult.stateChange) / originalResult.stateChange) * 100;
  
  const propChangeImprovement = 
    ((originalResult.propChange - optimizedResult.propChange) / originalResult.propChange) * 100;
  
  // Log summary
  console.log('Performance comparison complete:');
  console.log(`Initial render: ${initialRenderImprovement.toFixed(2)}% improvement`);
  console.log(`Re-render: ${rerenderImprovement.toFixed(2)}% improvement`);
  console.log(`State change: ${stateChangeImprovement.toFixed(2)}% improvement`);
  console.log(`Prop change: ${propChangeImprovement.toFixed(2)}% improvement`);
  
  return [originalResult, optimizedResult];
}

/**
 * Generate a performance report HTML string
 * 
 * @param originalResult Performance results for original component
 * @param optimizedResult Performance results for optimized component
 * @returns HTML string containing a performance report
 */
export function generatePerformanceReport(
  originalResult: PerformanceResult,
  optimizedResult: PerformanceResult
): string {
  const calculateImprovement = (original: number, optimized: number): string => {
    if (original === 0 || optimized === 0) return 'N/A';
    
    const improvement = ((original - optimized) / original) * 100;
    return improvement > 0
      ? `${improvement.toFixed(2)}% faster`
      : `${Math.abs(improvement).toFixed(2)}% slower`;
  };
  
  return `
    <div class="performance-report">
      <h2>Performance Comparison Report</h2>
      <table>
        <thead>
          <tr>
            <th>Metric</th>
            <th>Original</th>
            <th>Optimized</th>
            <th>Improvement</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Initial Render</td>
            <td>${originalResult.initialRender.toFixed(2)} ms</td>
            <td>${optimizedResult.initialRender.toFixed(2)} ms</td>
            <td>${calculateImprovement(originalResult.initialRender, optimizedResult.initialRender)}</td>
          </tr>
          <tr>
            <td>Re-render</td>
            <td>${originalResult.rerender.toFixed(2)} ms</td>
            <td>${optimizedResult.rerender.toFixed(2)} ms</td>
            <td>${calculateImprovement(originalResult.rerender, optimizedResult.rerender)}</td>
          </tr>
          <tr>
            <td>State Change</td>
            <td>${originalResult.stateChange.toFixed(2)} ms</td>
            <td>${optimizedResult.stateChange.toFixed(2)} ms</td>
            <td>${calculateImprovement(originalResult.stateChange, optimizedResult.stateChange)}</td>
          </tr>
          <tr>
            <td>Prop Change</td>
            <td>${originalResult.propChange.toFixed(2)} ms</td>
            <td>${optimizedResult.propChange.toFixed(2)} ms</td>
            <td>${calculateImprovement(originalResult.propChange, optimizedResult.propChange)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}