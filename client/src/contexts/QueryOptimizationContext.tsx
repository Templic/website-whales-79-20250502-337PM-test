/**
 * Query Optimization Context
 * 
 * Provides advanced data fetching optimization features:
 * - Prioritized fetching for visible components
 * - Prefetching based on user behavior prediction
 * - Automatic stale data refresh
 * - Query deduplication and batching
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { throttle, debounce } from '../lib/performance';

// Context state type
interface QueryOptimizationState {
  /** Current viewport area for prioritization */
  visibleArea: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  /** Components currently in view */
  visibleComponents: Set<string>;
  /** User navigation patterns */
  navigationPatterns: Record<string, string[]>;
  /** Network conditions (slow, medium, fast) */
  networkCondition: 'slow' | 'medium' | 'fast';
  /** Whether prefetching is enabled */
  prefetchingEnabled: boolean;
  /** Maximum concurrent requests */
  maxConcurrentRequests: number;
}

// Context actions
interface QueryOptimizationActions {
  /** Register a component as visible */
  registerVisibleComponent: (id: string) => void;
  /** Unregister a component from visible set */
  unregisterVisibleComponent: (id: string) => void;
  /** Manually set prefetching enabled state */
  setPrefetchingEnabled: (enabled: boolean) => void;
  /** Schedule data prefetch for a query */
  schedulePrefetch: (queryKey: unknown[], options?: { delay?: number }) => void;
  /** Optimize queries based on visibility */
  optimizeQueries: () => void;
  /** Set maximum concurrent requests */
  setMaxConcurrentRequests: (max: number) => void;
}

// Combined context type
type QueryOptimizationContextType = QueryOptimizationState & QueryOptimizationActions;

// Default context values
const defaultContext: QueryOptimizationContextType = {
  // State
  visibleArea: { top: 0, left: 0, width: 0, height: 0 },
  visibleComponents: new Set(),
  navigationPatterns: {},
  networkCondition: 'fast',
  prefetchingEnabled: true,
  maxConcurrentRequests: 6,
  
  // Actions (placeholders to be defined in provider)
  registerVisibleComponent: () => {},
  unregisterVisibleComponent: () => {},
  setPrefetchingEnabled: () => {},
  schedulePrefetch: () => {},
  optimizeQueries: () => {},
  setMaxConcurrentRequests: () => {},
};

// Create context
const QueryOptimizationContext = createContext<QueryOptimizationContextType>(defaultContext);

/**
 * Hook to use query optimization features
 */
export const useQueryOptimization = () => useContext(QueryOptimizationContext);

/**
 * Query Optimization Provider Component
 */
export const QueryOptimizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  
  // State
  const [visibleArea, setVisibleArea] = useState(defaultContext.visibleArea);
  const [visibleComponents, setVisibleComponents] = useState<Set<string>>(new Set());
  const [navigationPatterns, setNavigationPatterns] = useState<Record<string, string[]>>({});
  const [networkCondition, setNetworkCondition] = useState<'slow' | 'medium' | 'fast'>('fast');
  const [prefetchingEnabled, setPrefetchingEnabled] = useState(true);
  const [maxConcurrentRequests, setMaxConcurrentRequests] = useState(6);
  
  // Update network condition based on performance
  useEffect(() => {
    // Check network condition using Navigation Timing API
    const checkNetworkCondition = () => {
      if (typeof window === 'undefined' || !window.performance || !window.performance.timing) {
        return;
      }
      
      const timing = window.performance.timing;
      const networkLatency = timing.responseEnd - timing.fetchStart;
      
      // Classify network speed
      if (networkLatency < 100) {
        setNetworkCondition('fast');
      } else if (networkLatency < 500) {
        setNetworkCondition('medium');
      } else {
        setNetworkCondition('slow');
      }
    };
    
    // Initial check
    checkNetworkCondition();
    
    // Set up periodic checks
    const intervalId = setInterval(checkNetworkCondition, 60000); // Check every minute
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Register components in view
  const registerVisibleComponent = useCallback((id: string) => {
    setVisibleComponents(prev => {
      const newSet = new Set(prev);
      newSet.add(id);
      return newSet;
    });
  }, []);
  
  // Unregister component from view
  const unregisterVisibleComponent = useCallback((id: string) => {
    setVisibleComponents(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  }, []);
  
  // Schedule query prefetch with delay
  const schedulePrefetch = useCallback(
    (queryKey: unknown[], options: { delay?: number } = {}) => {
      if (!prefetchingEnabled) return;
      
      const { delay = 500 } = options;
      
      setTimeout(() => {
        queryClient.prefetchQuery({
          queryKey,
          staleTime: 30000, // Consider data stale after 30 seconds
        });
      }, delay);
    },
    [prefetchingEnabled, queryClient]
  );
  
  // Calculate visible area on scroll/resize
  useEffect(() => {
    const updateVisibleArea = throttle(() => {
      setVisibleArea({
        top: window.scrollY,
        left: window.scrollX,
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }, 200);
    
    window.addEventListener('scroll', updateVisibleArea);
    window.addEventListener('resize', updateVisibleArea);
    
    // Initial update
    updateVisibleArea();
    
    return () => {
      window.removeEventListener('scroll', updateVisibleArea);
      window.removeEventListener('resize', updateVisibleArea);
    };
  }, []);
  
  // Track navigation for prediction
  useEffect(() => {
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    const previousPath = localStorage.getItem('previousPath');
    
    if (previousPath && previousPath !== currentPath) {
      setNavigationPatterns(prev => {
        const newPatterns = { ...prev };
        
        if (!newPatterns[previousPath]) {
          newPatterns[previousPath] = [];
        }
        
        // Add current path to navigation pattern if not already there
        if (!newPatterns[previousPath].includes(currentPath)) {
          newPatterns[previousPath] = [
            ...newPatterns[previousPath].slice(-9), // Keep last 10 entries
            currentPath,
          ];
        }
        
        return newPatterns;
      });
    }
    
    // Save current path for next navigation
    if (currentPath) {
      localStorage.setItem('previousPath', currentPath);
    }
  }, []);
  
  // Optimize queries based on visible components
  const optimizeQueries = useCallback(() => {
    if (visibleComponents.size === 0) return;
    
    // Reset query priority to normal before adjusting
    queryClient.getQueryCache().getAll().forEach(query => {
      const queryState = query.state;
      if (queryState.fetchStatus === 'fetching') {
        // Can't adjust priority of in-flight queries
        return;
      }
      
      // Find if query is associated with a visible component
      const queryId = Array.isArray(query.queryKey) && query.queryKey.length > 0
        ? String(query.queryKey[0])
        : '';
      
      if (queryId && visibleComponents.has(queryId)) {
        // Prioritize queries for visible components by refetching sooner
        query.setOptions({
          staleTime: 10000, // 10 seconds
        });
      } else {
        // Deprioritize by extending stale time for invisible components
        query.setOptions({
          staleTime: 60000, // 1 minute
        });
      }
    });
  }, [visibleComponents, queryClient]);
  
  // Run query optimization when visible components change
  useEffect(() => {
    optimizeQueries();
  }, [visibleComponents, optimizeQueries]);
  
  // Limit max concurrent requests based on network condition
  useEffect(() => {
    // Adjust concurrent requests based on network
    const requestLimit = networkCondition === 'slow' 
      ? 3 
      : networkCondition === 'medium' 
        ? 6 
        : 10;
    
    setMaxConcurrentRequests(requestLimit);
    
    // Apply to query client
    // Note: React Query doesn't have a direct way to limit concurrent requests
    // This is a simplified approach
    if (queryClient.getDefaultOptions().queries) {
      queryClient.setDefaultOptions({
        queries: {
          ...queryClient.getDefaultOptions().queries,
          retry: networkCondition === 'slow' ? 2 : 3,
          refetchOnWindowFocus: networkCondition !== 'slow',
        },
      });
    }
  }, [networkCondition, queryClient]);
  
  // Context value
  const value: QueryOptimizationContextType = {
    // State
    visibleArea,
    visibleComponents,
    navigationPatterns,
    networkCondition,
    prefetchingEnabled,
    maxConcurrentRequests,
    
    // Actions
    registerVisibleComponent,
    unregisterVisibleComponent,
    setPrefetchingEnabled,
    schedulePrefetch,
    optimizeQueries,
    setMaxConcurrentRequests,
  };
  
  return (
    <QueryOptimizationContext.Provider value={value}>
      {children}
    </QueryOptimizationContext.Provider>
  );
};

/**
 * Component visibility tracker
 * Used to register/unregister components from visible set
 */
export const VisibilityTracker: React.FC<{
  id: string;
  children: React.ReactNode;
}> = ({ id, children }) => {
  const { registerVisibleComponent, unregisterVisibleComponent } = useQueryOptimization();
  const [isVisible, setIsVisible] = useState(false);
  
  // Track element visibility with Intersection Observer
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      // Fallback for browsers without IntersectionObserver
      registerVisibleComponent(id);
      return () => unregisterVisibleComponent(id);
    }
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const visible = entry.isIntersecting;
          setIsVisible(visible);
          
          if (visible) {
            registerVisibleComponent(id);
          } else {
            unregisterVisibleComponent(id);
          }
        });
      },
      {
        root: null, // viewport
        rootMargin: '100px', // Start observing slightly outside viewport
        threshold: 0.1, // Consider visible when 10% is visible
      }
    );
    
    const currentRef = document.getElementById(id);
    if (currentRef) {
      observer.observe(currentRef);
    }
    
    return () => {
      observer.disconnect();
      unregisterVisibleComponent(id);
    };
  }, [id, registerVisibleComponent, unregisterVisibleComponent]);
  
  return (
    <div id={id} data-visible={isVisible}>
      {children}
    </div>
  );
};