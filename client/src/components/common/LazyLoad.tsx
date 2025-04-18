/**
 * LazyLoad Component
 * 
 * A wrapper component for lazy loading other components with React.lazy and Suspense.
 * This helps reduce initial page load times by only loading components when needed.
 */

import React, { Suspense, lazy, ComponentType } from 'react';
import { useInView } from '@/lib/performance';

// Fallback loading component with configurable height 
const LoadingFallback = ({ height = '200px' }: { height?: string }) => (
  <div 
    className="flex items-center justify-center w-full" 
    style={{ height }}
    aria-live="polite"
    aria-busy="true"
  >
    <div className="flex flex-col items-center space-y-2">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

interface LazyLoadProps<T> {
  /**
   * Factory function that returns a dynamic import
   * @example () => import('./HeavyComponent')
   */
  factory: () => Promise<{ default: ComponentType<T> }>;
  
  /**
   * Props to pass to the lazy-loaded component
   */
  componentProps?: T;
  
  /**
   * Height of the loading fallback component
   * @default '200px'
   */
  fallbackHeight?: string;
  
  /**
   * Whether to load the component only when it's visible in the viewport
   * @default false
   */
  loadOnlyWhenVisible?: boolean;
}

/**
 * LazyLoad component for optimized component loading
 * 
 * @example
 * ```tsx
 * <LazyLoad 
 *   factory={() => import('./HeavyComponent')}
 *   componentProps={{ title: 'My Component' }}
 *   fallbackHeight="300px"
 *   loadOnlyWhenVisible
 * />
 * ```
 */
export function LazyLoad<T>({
  factory,
  componentProps,
  fallbackHeight = '200px',
  loadOnlyWhenVisible = false
}: LazyLoadProps<T>) {
  // Only load component when it comes into view
  const [ref, isVisible] = useInView({
    rootMargin: '200px', // Start loading 200px before component comes into view
    threshold: 0
  });
  
  // Lazy load the component
  const LazyComponent = lazy(factory);
  
  if (loadOnlyWhenVisible && !isVisible) {
    return <div ref={ref as React.RefObject<HTMLDivElement>} style={{ minHeight: fallbackHeight }} />;
  }
  
  return (
    <Suspense fallback={<LoadingFallback height={fallbackHeight} />}>
      <LazyComponent {...(componentProps as any)} />
    </Suspense>
  );
}

export default LazyLoad;