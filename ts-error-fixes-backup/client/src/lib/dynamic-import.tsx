/**
 * Dynamic Import Utilities
 * 
 * Utilities for route-based code splitting and dynamic imports to reduce 
 * initial bundle size and improve loading performance.
 */

import React, { useState, useEffect, Suspense, lazy, ComponentType } from 'react';

interface LoadableOptions {
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  preload?: boolean;
  ssr?: boolean;
}

/**
 * Component that loads another component dynamically with a loading indicator
 * @param importFunc Function that returns the component import promise
 * @param options Configuration options for dynamic loading
 * @returns Dynamically loaded component
 */
export function loadable<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options: LoadableOptions = {}
): React.ComponentType<React.ComponentProps<T>> {
  const {
    fallback = <DefaultLoadingIndicator />,
    errorFallback = <DefaultErrorIndicator />,
    preload = false,
    ssr = true
  } = options;

  // Create lazy component
  const LazyComponent = lazy(importFunc);

  // Maybe preload the component
  if (preload) {
    importFunc().catch(err => console.error('Failed to preload component:', err));
  }

  // Return wrapped component
  return function LoadableComponent(props: React.ComponentProps<T>) {
    const [error, setError] = useState<Error | null>(null);

    // Handle import errors
    useEffect(() => {
      importFunc().catch(err => {
        console.error('Failed to load component:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      });
    }, []);

    // If error, show error indicator
    if (error) {
      return errorFallback as JSX.Element;
    }

    // Handle SSR
    if (!ssr && typeof window === 'undefined') {
      return fallback as JSX.Element;
    }

    // Return component with Suspense
    return (
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

/**
 * Default loading indicator component
 */
export function DefaultLoadingIndicator() {
  return (
    <div className="min-h-[200px] flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"></div>
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    </div>
  );
}

/**
 * Default error indicator component
 */
export function DefaultErrorIndicator() {
  return (
    <div className="min-h-[200px] bg-red-50 border border-red-100 rounded-md flex items-center justify-center">
      <div className="flex flex-col items-center gap-2 p-4">
        <div className="text-red-600 text-xl">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3a1 1 0 102 0V7zm-1 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="text-sm text-red-700">Failed to load this component.</div>
        <button 
          className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    </div>
  );
}

/**
 * Utility to create a split point with a loading state and error handling
 * @param importFunc Function that returns the import promise
 * @param LoadingComponent Component to show while loading
 * @param ErrorComponent Component to show on error
 * @returns Component with proper loading and error states
 */
export function createSplitPoint<T>(
  importFunc: () => Promise<T>,
  LoadingComponent: React.ComponentType = DefaultLoadingIndicator,
  ErrorComponent: React.ComponentType<{ error: Error }> = ({ error }) => <DefaultErrorIndicator />
) {
  return function SplitPoint(): JSX.Element {
    const [Component, setComponent] = useState<React.ComponentType | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      let mounted = true;

      importFunc()
        .then((module$2 => {
          if (!mounted) return;
          const Component = module.default || module;
          setComponent(() => Component);
          setLoading(false);
        })
        .catch(err => {
          if (!mounted) return;
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        });

      return () => { mounted = false; };
    }, []);

    if (loading) {
      return <LoadingComponent />;
    }

    if (error) {
      return <ErrorComponent error={error} />;
    }

    if (!Component) {
      return <DefaultErrorIndicator />;
    }

    return <Component />;
  };
}

/**
 * Utility to preload a component or page for better UX
 * @param importFunc Function that returns the import promise
 */
export function preloadComponent(importFunc: () => Promise<any>) {
  return importFunc().catch(err => {
    console.error('Failed to preload component:', err);
  });
}

/**
 * Preload multiple components or pages
 * @param importFuncs Functions that return import promises
 */
export function preloadComponents(importFuncs: Array<() => Promise<any>>) {
  importFuncs.forEach(preloadComponent);
}

// Map to track preloaded routes
const preloadedRoutes = new Set<string>();

/**
 * Preload a route by path
 * @param routePath Route path to preload
 * @param routeModuleMap Map of route paths to import functions
 * @returns Promise that resolves when the route is preloaded
 */
export function preloadRoute(
  routePath: string,
  routeModuleMap: Record<string, () => Promise<any>>
): Promise<any> | undefined {
  if (preloadedRoutes.has(routePath)) {
    return undefined;
  }

  const importFunc = routeModuleMap[routePath];
  if (!importFunc) {
    console.warn(`No import function found for route: ${routePath}`);
    return undefined;
  }

  preloadedRoutes.add(routePath);
  return importFunc().catch(err => {
    console.error(`Failed to preload route "${routePath}":`, err);
    preloadedRoutes.delete(routePath);
  });
}

/**
 * Preload routes that may be navigated to next
 * @param currentRoute Current route path
 * @param relatedRoutes Related route paths
 * @param routeModuleMap Map of route paths to import functions
 */
export function preloadRelatedRoutes(
  currentRoute: string,
  relatedRoutes: Record<string, string[]>,
  routeModuleMap: Record<string, () => Promise<any>>
): void {
  const routes = relatedRoutes[currentRoute] || [];
  
  // Preload each related route
  routes.forEach(route => {
    preloadRoute(route, routeModuleMap);
  });
}

/**
 * Higher-order component for code splitting
 * @param importFunc Function that returns the component import promise
 * @param options Configuration options
 * @returns Wrapped component with code splitting
 */
export function withCodeSplitting<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options: LoadableOptions = {}
): React.ComponentType<React.ComponentProps<T>> {
  return loadable(importFunc, options);
}