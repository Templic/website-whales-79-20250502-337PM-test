/**
 * Bundle Optimization Utilities
 * 
 * Provides utilities for dynamic imports, code splitting, and lazy loading
 * to optimize application bundle size and loading performance.
 */

import React, { lazy, Suspense } from 'react';

/**
 * Configuration for dynamic component loading
 */
interface DynamicImportConfig {
  /** Minimum delay before showing loading state (prevents flicker) */
  minimumLoadingDelay?: number;
  /** Custom loading component */
  loadingComponent?: React.ReactNode;
  /** Error boundary fallback */
  errorComponent?: React.ReactNode;
  /** Prefetch the component (load before needed) */
  prefetch?: boolean;
  /** Callback when component starts loading */
  onLoadStart?: () => void;
  /** Callback when component finishes loading */
  onLoadComplete?: () => void;
  /** Callback when component fails to load */
  onLoadError?: (error: Error) => void;
}

/**
 * Default loading component
 */
const DefaultLoading = () => 
  React.createElement('div', { className: "dynamic-loading-placeholder" },
    React.createElement('div', { className: "loading-spinner" })
  );

/**
 * Default error component
 */
const DefaultError = ({ error }: { error: Error }) =>
  React.createElement('div', { className: "dynamic-loading-error" },
    React.createElement('p', null, 'Failed to load component'),
    React.createElement('small', null, error.message)
  );

/**
 * Create a dynamically imported component with code splitting
 * 
 * @param importFn Function that imports the component module
 * @param config Configuration options for dynamic loading
 * @returns Dynamically loaded component with Suspense wrapper
 */
export function createDynamicComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  config: DynamicImportConfig = {}
): React.ComponentType<React.ComponentProps<T>> {
  const {
    minimumLoadingDelay = 200,
    loadingComponent = React.createElement(DefaultLoading),
    errorComponent,
    prefetch = false,
    onLoadStart,
    onLoadComplete,
    onLoadError,
  } = config;

  // Enhanced import function with callbacks and timing
  const enhancedImport = async () => {
    const startTime = performance.now();
    
    try {
      if (onLoadStart) onLoadStart();
      
      // Artificial minimum delay to prevent loading flicker
      const [moduleResult] = await Promise.all([
        importFn(),
        new Promise(resolve => setTimeout(resolve, minimumLoadingDelay))
      ]);
      
      const loadTime = performance.now() - startTime;
      console.log(`[Bundle] Dynamically loaded component in ${loadTime.toFixed(2)}ms`);
      
      if (onLoadComplete) onLoadComplete();
      return moduleResult;
    } catch (error) {
      const loadError = error instanceof Error ? error : new Error(String(error));
      console.error('[Bundle] Failed to load component:', loadError);
      
      if (onLoadError) onLoadError(loadError);
      throw loadError;
    }
  };

  // Create lazy component
  const LazyComponent = lazy(enhancedImport);

  // Prefetch if requested
  if (prefetch) {
    // Schedule prefetch on next idle period
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        console.log('[Bundle] Prefetching component');
        enhancedImport().catch(() => {
          // Silently catch prefetch errors
        });
      });
    } else {
      // Fallback to setTimeout for browsers without requestIdleCallback
      setTimeout(() => {
        console.log('[Bundle] Prefetching component');
        enhancedImport().catch(() => {
          // Silently catch prefetch errors
        });
      }, 1000);
    }
  }

  // Return wrapped component
  return (props: React.ComponentProps<T>) => 
    React.createElement(
      React.Suspense, 
      { fallback: loadingComponent },
      React.createElement(
        ErrorBoundary, 
        { fallback: errorComponent },
        React.createElement(LazyComponent, props)
      )
    );
}

/**
 * Error boundary component for catching dynamic import errors
 */
class ErrorBoundary extends React.Component<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}, {
  hasError: boolean;
  error: Error | null;
}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return React.createElement(DefaultError, { 
        error: this.state.error || new Error('Unknown error') 
      });
    }

    return this.props.children;
  }
}

/**
 * Create a route configuration with code splitting
 * 
 * @param routes Array of route definitions with import functions
 * @returns Object with loaded route components
 */
export function createDynamicRoutes(
  routes: Array<{
    path: string;
    importFn: () => Promise<{ default: React.ComponentType<any> }>;
    prefetch?: boolean;
  }>
): Record<string, React.ComponentType<any>> {
  const routeComponents: Record<string, React.ComponentType<any>> = {};

  routes.forEach(({ path, importFn, prefetch }) => {
    routeComponents[path] = createDynamicComponent(importFn, { prefetch });
  });

  return routeComponents;
}

/**
 * Preload components based on user navigation patterns or expected use
 * 
 * @param paths Array of module paths to preload
 */
export function preloadComponents(paths: string[]): void {
  if (typeof window === 'undefined') return;

  // Schedule preloading on next idle period
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => {
      console.log('[Bundle] Preloading components:', paths);
      paths.forEach(path => {
        // Use import() to trigger preloading
        import(/* @vite-ignore */ path).catch(() => {
          // Silently catch preload errors
        });
      });
    });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      console.log('[Bundle] Preloading components:', paths);
      paths.forEach(path => {
        // Use import() to trigger preloading
        import(/* @vite-ignore */ path).catch(() => {
          // Silently catch preload errors
        });
      });
    }, 2000);
  }
}

/**
 * Register route based preloading for frequently accessed routes
 * 
 * @param routeMap Map of routes to component paths for preloading
 */
export function registerRoutePreloading(
  routeMap: Record<string, string[]>
): void {
  if (typeof window === 'undefined') return;

  // Listen for route changes
  const handleRouteChange = (path: string) => {
    // Find matching routes that should trigger preloading
    const routesToPreload = Object.entries(routeMap)
      .filter(([route]) => {
        // Simple matching - could be enhanced with pattern matching
        return path.includes(route);
      })
      .flatMap(([_, paths]) => paths);

    if (routesToPreload.length > 0) {
      preloadComponents(routesToPreload);
    }
  };

  // Set up navigation listener
  if ('navigation' in window) {
    // Modern browsers with Navigation API
    (window as any).navigation.addEventListener('navigate', (event: any) => {
      handleRouteChange(event.destination.url);
    });
  } else {
    // Fallback using popstate + manual tracking
    window.addEventListener('popstate', () => {
      handleRouteChange(window.location.pathname);
    });

    // Monkey patch pushState and replaceState
    const originalPushState = history.pushState.bind(history);
    const originalReplaceState = history.replaceState.bind(history);

    history.pushState = function (...args) {
      originalPushState(...args);
      handleRouteChange(window.location.pathname);
    };

    history.replaceState = function (...args) {
      originalReplaceState(...args);
      handleRouteChange(window.location.pathname);
    };
  }
}