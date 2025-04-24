/**
 * @file performance-test-utils.tsx
 * @description Utility functions for measuring component performance and re-renders
 * @author Replit AI Agent
 * @created 2025-04-15
 * @updated 2025-04-15
 * @status Active
 */

import React, { useState, useEffect, useRef, FunctionComponent } from 'react'

/**
 * Options for the component performance test
 */
interface PerformanceTestOptions {
  /**
   * Number of times to render the component for more accurate measurements
   * @default 50
   */
  iterations?: number

  /**
   * Function to run before each render to reset state if needed
   */
  beforeEach?: () => void

  /**
   * Function to run after all tests are complete
   */
  onComplete?: (results: PerformanceResults) => void

  /**
   * Props to pass to the component
   */
  props?: Record<string, any>
}

/**
 * Results from the performance test
 */
export interface PerformanceResults {
  /**
   * Average time in milliseconds to render the component
   */
  averageRenderTime: number

  /**
   * Median time in milliseconds to render the component
   */
  medianRenderTime: number

  /**
   * Minimum time in milliseconds to render the component
   */
  minRenderTime: number

  /**
   * Maximum time in milliseconds to render the component
   */
  maxRenderTime: number

  /**
   * All render times collected during the test
   */
  allRenderTimes: number[]

  /**
   * Number of renders performed
   */
  totalRenders: number

  /**
   * Component name that was tested
   */
  componentName: string
}

/**
 * Component render counter for tracking re-renders
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   return <RenderCounter name="MyComponent" />;
 * }
 * ```
 */
export function RenderCounter({ name = 'Component' }: { name?: string }) {
  const renderCount = useRef(0)
  
  // Increment render count
  renderCount.current++
  
  // Log render
  console.log(`${name} render #${renderCount.current}`)
  
  return null
}

/**
 * Higher-order component to track component re-renders
 * 
 * @example
 * ```tsx
 * const TrackedButton = withRenderTracking(Button, 'Button')
 * ```
 */
export function withRenderTracking<P = any>(
  Component: FunctionComponent<P>,
  displayName: string
): FunctionComponent<P> {
  const TrackedComponent = (props: P) => {
    const renderCount = useRef(0)
    renderCount.current++
    
    useEffect(() => {
      console.log(`${displayName} mounted`)
      return () => {
        console.log(`${displayName} unmounted after ${renderCount.current} renders`)
      }
    }, [])
    
    console.log(`${displayName} render #${renderCount.current}`)
    
    return <Component {...props} />
  }
  
  TrackedComponent.displayName = `Tracked${displayName}`
  return TrackedComponent
}

/**
 * Measures the performance of a component render
 * 
 * @param Component - The component to test
 * @param options - Test options
 * 
 * @example
 * ```tsx
 * // Simple usage
 * measureComponentPerformance(MyComponent)
 * 
 * // With options
 * measureComponentPerformance(MyComponent, {
 *   iterations: 100,
 *   props: { disabled: false, label: "Test" },
 *   onComplete: (results) => console.table(results)
 * })
 * ```
 */
export function measureComponentPerformance(
  Component: FunctionComponent<any>,
  options: PerformanceTestOptions = {}
): void {
  const {
    iterations = 50,
    beforeEach = () => {},
    onComplete = (results) => console.table(results),
    props = {}
  } = options

  const componentName = Component.displayName || Component.name || 'UnknownComponent'
  
  // Performance test component
  const PerformanceTester = () => {
    const [, forceRender] = useState<number>(0)
    const renderTimes = useRef<number[]>([])
    const startTimeRef = useRef<number>(0)
    const iterationCount = useRef<number>(0)
    
    // Measure render time
    useEffect(() => {
      const renderTime = performance.now() - startTimeRef.current
      renderTimes.current.push(renderTime)
      
      iterationCount.current++
      
      if (iterationCount.current < iterations) {
        // Wait a moment before next render to avoid browser throttling
        setTimeout(() => {
          beforeEach()
          startTimeRef.current = performance.now()
          forceRender(prev => prev + 1)
        }, 5)
      } else {
        // Calculate results
        const allTimes = [...renderTimes.current]
        
        // Sort times for median
        allTimes.sort((a, b) => a - b)
        
        const results: PerformanceResults = {
          componentName,
          averageRenderTime: allTimes.reduce((sum, time) => sum + time, 0) / allTimes.length,
          medianRenderTime: allTimes[Math.floor(allTimes.length / 2)],
          minRenderTime: Math.min(...allTimes),
          maxRenderTime: Math.max(...allTimes),
          allRenderTimes: allTimes,
          totalRenders: allTimes.length
        }
        
        onComplete(results)
      }
    })
    
    // Start measuring on initial render
    if (iterationCount.current === 0) {
      startTimeRef.current = performance.now()
    }
    
    // Render the target component
    return <Component {...props} />
  }
  
  // Create and mount a test container
  const testContainer = document.createElement('div')
  testContainer.style.position = 'absolute'
  testContainer.style.left = '-9999px'
  testContainer.style.width = '500px'
  testContainer.style.height = '500px'
  document.body.appendChild(testContainer)
  
  console.log(`Starting performance test for ${componentName}...`)
  
  // Render the tester
  // Note: In a real implementation, you would use ReactDOM or similar
  // This is simplified for documentation purposes
  console.log(`Testing ${componentName} with ${iterations} iterations...`)
  
  // Cleanup when done
  const cleanup = () => {
    document.body.removeChild(testContainer)
  }
  
  // In this prototype, we're not actually rendering since we don't want to
  // include ReactDOM as a dependency. In a real implementation, you would:
  // 
  // ReactDOM.render(<PerformanceTester />, testContainer);
  
  console.log(`Performance test for ${componentName} initialized`)
  console.log(`NOTE: This is a prototype implementation. To run actual tests, use:`)
  console.log(`import { createRoot } from 'react-dom/client';`)
  console.log(`const root = createRoot(testContainer);`)
  console.log(`root.render(<PerformanceTester />);`)
  
  // Mock cleanup after 1 second
  setTimeout(cleanup, 1000)
}

/**
 * Compare the performance of two components with the same props
 * 
 * @example
 * ```tsx
 * compareComponentPerformance({
 *   original: OriginalComponent,
 *   optimized: OptimizedComponent,
 *   props: { label: "Test Button" },
 *   iterations: 100
 * })
 * ```
 */
export function compareComponentPerformance({
  original,
  optimized,
  props = {},
  iterations = 50
}: {
  original: FunctionComponent<any>
  optimized: FunctionComponent<any>
  props?: Record<string, any>
  iterations?: number
}): void {
  const originalName = original.displayName || original.name || 'OriginalComponent'
  const optimizedName = optimized.displayName || optimized.name || 'OptimizedComponent'
  
  let originalResults: PerformanceResults | null = null
  let optimizedResults: PerformanceResults | null = null
  
  const compareResults = () => {
    if (originalResults && optimizedResults) {
      console.group('Performance Comparison Results')
      console.log('-'.repeat(50))
      console.log(`Component: ${originalName} vs ${optimizedName}`)
      console.log('-'.repeat(50))
      
      const improvementPct = (
        (originalResults.averageRenderTime - optimizedResults.averageRenderTime) /
        originalResults.averageRenderTime * 100
      ).toFixed(2)
      
      console.log(`Average Render Time: ${originalResults.averageRenderTime.toFixed(2)}ms vs ${optimizedResults.averageRenderTime.toFixed(2)}ms (${improvementPct}% improvement)`)
      console.log(`Median Render Time: ${originalResults.medianRenderTime.toFixed(2)}ms vs ${optimizedResults.medianRenderTime.toFixed(2)}ms`)
      console.log(`Min Render Time: ${originalResults.minRenderTime.toFixed(2)}ms vs ${optimizedResults.minRenderTime.toFixed(2)}ms`)
      console.log(`Max Render Time: ${originalResults.maxRenderTime.toFixed(2)}ms vs ${optimizedResults.maxRenderTime.toFixed(2)}ms`)
      
      console.log('-'.repeat(50))
      
      if (optimizedResults.averageRenderTime < originalResults.averageRenderTime) {
        console.log(`✅ Optimized component is ${improvementPct}% faster on average`)
      } else {
        console.log(`❌ Optimized component is not faster (${improvementPct}% change)`)
      }
      
      console.groupEnd()
    }
  }
  
  // Measure original component
  measureComponentPerformance(original, {
    iterations,
    props,
    onComplete: (results) => {
      originalResults = results
      compareResults()
    }
  })
  
  // Measure optimized component
  measureComponentPerformance(optimized, {
    iterations,
    props,
    onComplete: (results) => {
      optimizedResults = results
      compareResults()
    }
  })
}

/**
 * Creates a test case for comparing re-render behavior between components
 * 
 * @example
 * ```tsx
 * const { TestCase, runTest } = createRerenderTestCase({
 *   original: OriginalComponent,
 *   optimized: OptimizedComponent,
 *   props: { disabled: false }
 * })
 * 
 * // Render the test case and interact with it
 * // Then run the test to see results
 * runTest()
 * ```
 */
export function createRerenderTestCase<P>({
  original,
  optimized,
  props
}: {
  original: FunctionComponent<P>
  optimized: FunctionComponent<P>
  props: P
}): {
  TestCase: FunctionComponent<{}>
  runTest: () => void
} {
  const originalRenderCount = { current: 0 }
  const optimizedRenderCount = { current: 0 }
  
  const TrackingOriginal = (p: P) => {
    originalRenderCount.current++
    return <original {...p} />
  }
  
  const TrackingOptimized = (p: P) => {
    optimizedRenderCount.current++
    return <optimized {...p} />
  }
  
  TrackingOriginal.displayName = `Tracking${original.displayName || original.name}`
  TrackingOptimized.displayName = `Tracking${optimized.displayName || optimized.name}`
  
  const TestCase = () => {
    const [, setRefresh] = useState(0)
    
    // Force rerender button handler
    const handleRerender = () => {
      setRefresh(prev => prev + 1)
    }
    
    return (
      <div className="p-4 border rounded-md my-4">
        <h3 className="text-lg font-bold mb-4">Re-render Test Case</h3>
        
        <div className="flex space-x-4 mb-4">
          <div className="flex-1 p-4 border rounded-md">
            <h4 className="font-medium mb-2">Original Component</h4>
            <TrackingOriginal {...props} />
          </div>
          
          <div className="flex-1 p-4 border rounded-md">
            <h4 className="font-medium mb-2">Optimized Component</h4>
            <TrackingOptimized {...props} />
          </div>
        </div>
        
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded-md"
          onClick={handleRerender}
        >
          Force Parent Re-render
        </button>
      </div>
    )
  }
  
  const runTest = () => {
    console.group('Re-render Test Results')
    console.log('-'.repeat(50))
    
    const originalName = original.displayName || original.name
    const optimizedName = optimized.displayName || optimized.name
    
    console.log(`Original Component (${originalName}): ${originalRenderCount.current} renders`)
    console.log(`Optimized Component (${optimizedName}): ${optimizedRenderCount.current} renders`)
    
    const diff = originalRenderCount.current - optimizedRenderCount.current
    
    if (diff > 0) {
      console.log(`✅ Optimized component rendered ${diff} fewer times`)
    } else if (diff === 0) {
      console.log(`ℹ️ Both components rendered the same number of times`)
    } else {
      console.log(`❌ Optimized component rendered ${Math.abs(diff)} more times`)
    }
    
    console.log('-'.repeat(50))
    console.groupEnd()
  }
  
  return { TestCase, runTest }
}

export default {
  measureComponentPerformance,
  compareComponentPerformance,
  createRerenderTestCase,
  RenderCounter,
  withRenderTracking
}