/**
 * useSelectiveState Hook
 * 
 * This hook optimizes state updates by only triggering re-renders when
 * the parts of state that actually change are the ones components depend on.
 * It uses a proxy-based approach to track which parts of state are accessed
 * and only triggers re-renders when those specific parts change.
 * 
 * @example
 * ```tsx
 * // Instead of using useState and causing full component re-renders:
 * // const [state, setState] = useState({ count: 0, name: 'John', items: [] });
 * 
 * // Use selective state updates to only re-render when accessed properties change:
 * const [state, setState] = useSelectiveState({ count: 0, name: 'John', items: [] });
 * 
 * // Now this component only re-renders when count changes, not when name or items change
 * return <div>{state.count}</div>;
 * ```
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { shallowEqual } from 'react-redux';

/**
 * Type for key paths in an object (e.g., 'user.address.city')
 */
type KeyPath = string;

/**
 * Type for the selector function that tracks which properties are accessed
 */
type TrackedSelector<T, R> = (state: T) => R;

/**
 * Options for the useSelectiveState hook
 */
interface SelectiveStateOptions<T> {
  /**
   * Custom comparison function for state changes
   * @default Object.is
   */
  equalityFn?: (a: any, b: any) => boolean;
  
  /**
   * Whether to use deep tracking (track nested object access)
   * @default true
   */
  deepTracking?: boolean;
  
  /**
   * Whether to batch state updates
   * @default true
   */
  batchUpdates?: boolean;
  
  /**
   * Debug mode to log accessed paths and updates
   * @default false
   */
  debug?: boolean;
  
  /**
   * Initial list of dependencies to track
   * Can be used to pre-declare dependencies instead of relying on access tracking
   */
  initialDependencies?: Array<keyof T | KeyPath>;
}

/**
 * Creates a proxy-based selective state hook that only triggers re-renders
 * when accessed parts of the state change
 * 
 * @param initialState Initial state object
 * @param options Configuration options
 * @returns [state, setState] similar to useState but with selective updates
 */
export function useSelectiveState<T extends object>(
  initialState: T,
  options: SelectiveStateOptions<T> = {}
): [T, (updater: Partial<T> | ((state: T) => Partial<T>)) => void] {
  // Default options
  const {
    equalityFn = Object.is,
    deepTracking = true,
    batchUpdates = true,
    debug = false,
    initialDependencies = []
  } = options;
  
  // Internal state that won't trigger re-renders directly
  const stateRef = useRef<T>({ ...initialState });
  
  // Force render function
  const [, setForceRender] = useState({});
  const forceRender = useCallback(() => setForceRender({}), []);
  
  // For tracking accessed paths in the current render
  const currentlyAccessedPaths = useRef(new Set<KeyPath>());
  
  // Dependencies tracked across renders
  const trackedDependencies = useRef(new Set<KeyPath>());
  
  // Initialize with any initial dependencies
  useEffect(() => {
    initialDependencies.forEach(dep => {
      trackedDependencies.current.add(String(dep));
    });
  }, []);
  
  // Pending updates when batching
  const pendingUpdates = useRef<Array<Partial<T>>>([]);
  const pendingUpdateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Create accessor tracking proxy
  const createTrackingProxy = (
    obj: any,
    path: string = '',
    isRoot: boolean = false
  ): any => {
    if (obj === null || obj === undefined) {
      return obj;
    }
    
    if (typeof obj !== 'object' || obj instanceof Date || obj instanceof RegExp) {
      return obj;
    }
    
    return new Proxy(obj, {
      get(target, prop) {
        if (typeof prop === 'symbol') {
          return target[prop];
        }
        
        const currentPath = path ? `${path}.${prop}` : String(prop);
        
        // Track this access
        if (isRoot) {
          currentlyAccessedPaths.current.add(currentPath);
          trackedDependencies.current.add(currentPath);
          
          if (debug) {
            console.log(`[SelectiveState] Accessing: ${currentPath}`);
          }
        }
        
        const value = target[prop];
        
        // For nested objects, recursively create proxies
        if (deepTracking && typeof value === 'object' && value !== null) {
          return createTrackingProxy(value, currentPath);
        }
        
        return value;
      }
    });
  };
  
  // Create the proxy that tracks access
  const stateProxy = createTrackingProxy(stateRef.current, '', true);
  
  // Function to check if an update affects tracked dependencies
  const shouldTriggerUpdate = (newPartialState: Partial<T>): boolean => {
    const dependencies = Array.from(trackedDependencies.current);
    
    for (const path of dependencies) {
      const pathParts = path.split('.');
      let oldValue = stateRef.current as unknown;
      let newValue = newPartialState as unknown;
      let isAffected = false;
      
      // Navigate to the specific path in both old and new state
      for (let i = 0; i < pathParts.length; i++) {
        const part = pathParts[i];
        
        // If we can't navigate the full path in the new state, it's not affected
        if (i === 0 && !(part in newValue)) {
          break;
        }
        
        if (i === pathParts.length - 1) {
          // We're at the leaf property
          if (part in newValue && !equalityFn(oldValue[part], newValue[part])) {
            isAffected = true;
          }
        } else {
          // Navigate deeper
          oldValue = oldValue[part];
          
          // If the path exists in the new state, navigate deeper there too
          if (part in newValue) {
            newValue = newValue[part];
          } else {
            // This path isn't included in the update
            break;
          }
        }
      }
      
      if (isAffected) {
        if (debug) {
          console.log(`[SelectiveState] Update affects tracked dependency: ${path}`);
        }
        return true;
      }
    }
    
    return false;
  };
  
  // Apply pending updates and trigger render if needed
  const applyPendingUpdates = useCallback(() => {
    if (pendingUpdates.current.length === 0) return;
    
    const updates = pendingUpdates.current;
    pendingUpdates.current = [];
    
    // Merge all updates into a single object
    const mergedUpdate = updates.reduce((acc, update) => ({...acc, ...update}), {});
    
    // Check if any tracked dependency is affected
    const shouldUpdate = shouldTriggerUpdate(mergedUpdate);
    
    // Update the internal state
    stateRef.current = {...stateRef.current, ...mergedUpdate};
    
    // Only re-render if tracked dependencies changed
    if (shouldUpdate) {
      if (debug) {
        console.log('[SelectiveState] Triggering re-render with merged updates', mergedUpdate);
      }
      forceRender();
    } else if (debug) {
      console.log('[SelectiveState] Updates applied but no re-render needed', mergedUpdate);
    }
    
    pendingUpdateTimer.current = null;
  }, [debug, equalityFn, forceRender]);
  
  // Update state function (similar to React's setState)
  const setState = useCallback((updater: Partial<T> | ((state: T) => Partial<T>)) => {
    // Get the update object
    const partialState = typeof updater === 'function' 
      ? updater(stateRef.current)
      : updater;
    
    if (batchUpdates) {
      // Add to pending updates
      pendingUpdates.current.push(partialState);
      
      // Set timer for batched update
      if (!pendingUpdateTimer.current) {
        pendingUpdateTimer.current = setTimeout(applyPendingUpdates, 0);
      }
    } else {
      // Check if tracked dependencies changed
      const shouldUpdate = shouldTriggerUpdate(partialState);
      
      // Update the internal state
      stateRef.current = {...stateRef.current, ...partialState};
      
      // Only re-render if tracked dependencies changed
      if (shouldUpdate) {
        if (debug) {
          console.log('[SelectiveState] Immediate update triggering re-render', partialState);
        }
        forceRender();
      } else if (debug) {
        console.log('[SelectiveState] Update applied but no re-render needed', partialState);
      }
    }
  }, [applyPendingUpdates, batchUpdates, debug, forceRender]);
  
  // Clear tracked paths on each render
  useEffect(() => {
    currentlyAccessedPaths.current = new Set<KeyPath>();
    return () => {
      // Cleanup any pending update timer
      if (pendingUpdateTimer.current) {
        clearTimeout(pendingUpdateTimer.current);
        pendingUpdateTimer.current = null;
      }
    };
  });
  
  return [stateProxy, setState];
}

/**
 * Hook for creating memoized selectors that only recalculate and re-render
 * when the selected parts of state change
 * 
 * @param state The state object to select from
 * @param selector Function that selects and transforms values from state
 * @param deps Additional dependencies array to trigger recalculation
 * @returns The memoized selected value
 */
export function useSelectiveSelector<T extends object, R>(
  state: T,
  selector: TrackedSelector<T, R>,
  deps: unknown[] = []
): R {
  const trackedState = useRef<T>({} as T);
  const previousResult = useRef<R | undefined>(undefined);
  const dependencies = useRef(new Set<KeyPath>());
  const [, setForceRender] = useState({});
  
  // Create tracking proxy for the selector function
  const createTrackingProxy = (obj: any, path: string = ''): any => {
    if (obj === null || obj === undefined) {
      return obj;
    }
    
    if (typeof obj !== 'object' || obj instanceof Date || obj instanceof RegExp) {
      return obj;
    }
    
    return new Proxy(obj, {
      get(target, prop) {
        if (typeof prop === 'symbol') {
          return target[prop];
        }
        
        const currentPath = path ? `${path}.${prop}` : String(prop);
        dependencies.current.add(currentPath);
        
        const value = target[prop];
        
        if (typeof value === 'object' && value !== null) {
          return createTrackingProxy(value, currentPath);
        }
        
        return value;
      }
    });
  };
  
  // Recalculate result only if dependencies changed
  const getResult = (): R => {
    // Clear previous dependencies
    dependencies.current.clear();
    
    // Create tracking proxy for the selector
    const trackingProxy = createTrackingProxy(state);
    
    // Run selector with tracking
    const result = selector(trackingProxy);
    
    // Store reference for future comparisons
    previousResult.current = result;
    trackedState.current = {...state};
    
    return result;
  };
  
  // Check if any tracked dependencies have changed
  const haveDependenciesChanged = (): boolean => {
    if (!trackedState.current || !previousResult.current) {
      return true;
    }
    
    for (const path of dependencies.current) {
      const pathParts = path.split('.');
      let oldValue: any = trackedState.current;
      let newValue: any = state;
      
      // Navigate to the specific path
      for (const part of pathParts) {
        if (oldValue === undefined || newValue === undefined) {
          return true;
        }
        
        oldValue = oldValue[part];
        newValue = newValue[part];
        
        if (!shallowEqual(oldValue, newValue)) {
          return true;
        }
      }
    }
    
    return false;
  };
  
  // Update the result only when needed
  if (!previousResult.current || haveDependenciesChanged() || deps.some((dep, i) => dep !== (deps as unknown)._prevDeps?.[i])) {
    (deps as unknown)._prevDeps = deps;
    return getResult();
  }
  
  return previousResult.current;
}

/**
 * Hook for monitoring render performance of components using useSelectiveState
 * 
 * @param componentName Name of the component for logging
 * @returns Object with dependency tracking functions
 */
export function useSelectiveStatePerformance(componentName: string) {
  const renderCount = useRef(0);
  const renderTime = useRef(0);
  const dependencies = useRef(new Set<string>());
  
  useEffect(() => {
    renderCount.current++;
    console.log(`[Performance] ${componentName} rendered ${renderCount.current} times`);
    console.log(`[Performance] ${componentName} is tracking ${dependencies.current.size} dependencies`);
    
    return () => {
      if (renderTime.current > 0) {
        const elapsed = performance.now() - renderTime.current;
        console.log(`[Performance] ${componentName} render took ${elapsed.toFixed(2)}ms`);
      }
    };
  });
  
  const startRender = () => {
    renderTime.current = performance.now();
  };
  
  const trackDependency = (path: string) => {
    dependencies.current.add(path);
  };
  
  return {
    startRender,
    trackDependency,
    getDependencies: () => Array.from(dependencies.current)
  };
}

export default useSelectiveState;