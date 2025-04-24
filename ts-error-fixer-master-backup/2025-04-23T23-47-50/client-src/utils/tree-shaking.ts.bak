/**
 * Tree-Shaking Utilities
 * 
 * This module provides utilities for optimizing imports and enabling effective
 * tree-shaking to reduce final bundle size. Tree-shaking is a build optimization
 * technique that removes unused code from the final bundle.
 * 
 * These utilities help with:
 * 1. Creating optimized imports for large libraries
 * 2. Analyzing import usage to identify optimization opportunities
 * 3. Providing dynamic import helpers that are tree-shaking friendly
 * 4. Supporting conditional code loading patterns
 */

/**
 * Dynamically imports a module only when needed
 * This helps tree-shaking by not including unused code in the bundle
 * 
 * @param importFn Function that returns a dynamic import
 * @returns A proxy that will load the module on first use
 */
export function lazyImport<T extends object, I extends keyof T>(
  importFn: () => Promise<T>,
  importedName?: I
): (I extends undefined ? T : T[I]) {
  // For named imports (import { X } from 'y')
  if (importedName) {
    return new Proxy({} as any, {
      get: (_target, property) => {
        // Only load when accessed
        return async () => {
          const module = await importFn();
          if (!module[importedName as keyof T]) {
            throw new Error(`Module ${importedName} does not exist in imported module`);
          }
          const namedExport = module[importedName as keyof T];
          
          if (property === Symbol.for('importedModule')) {
            return namedExport;
          }
          
          // Return the property from the named export
          return namedExport[property as keyof typeof namedExport];
        };
      },
    });
  }
  
  // For default imports (import X from 'y')
  return new Proxy({} as any, {
    get: (_target, property) => {
      return async () => {
        const module = await importFn();
        if (property === Symbol.for('importedModule')) {
          return module;
        }
        return module[property as keyof T];
      };
    },
  });
}

/**
 * Optimized JSON imports - only loads what's needed
 * Helps reduce bundle size when importing large JSON files
 * 
 * @param importFn Function that returns a dynamic import of a JSON file
 * @param selector Function to select only needed properties
 * @returns Promise that resolves to the selected data
 */
export async function selectiveJsonImport<T, R>(
  importFn: () => Promise<{ default: T }>,
  selector: (data: T) => R
): Promise<R> {
  const module = await importFn();
  return selector(module.default);
}

/**
 * Creates a tree-shakable component that's only included in the bundle
 * if it's actually used
 * 
 * @param importFn Function that returns a dynamic import
 * @returns A lazy-loaded component
 */
export function lazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    const module = await importFn();
    return { default: module.default };
  });
}

/**
 * Creates a tree-shakable hook that's only included in the bundle
 * if it's actually used
 * 
 * @param importFn Function that returns a dynamic import
 * @param hookName Name of the hook to import
 * @returns The hook function
 */
export function lazyHook<T extends Function>(
  importFn: () => Promise<{ [key: string]: T }>,
  hookName: string
): T {
  let hookFn: T | null = null;
  
  // Return a wrapper function with the same signature
  const wrapperFn = ((...args: any[]) => {
    if (hookFn === null) {
      throw new Error(
        `Hook "${hookName}" was called before it was loaded. ` +
        `Make sure to use React.useEffect to load it before calling it.`
      );
    }
    return hookFn(...args);
  }) as unknown as T;
  
  // Attach a preload method
  (wrapperFn as any).preload = async () => {
    const module = await importFn();
    hookFn = module[hookName];
    return hookFn;
  };
  
  return wrapperFn;
}

/**
 * Utility to help identify unused exports for better tree-shaking
 * Run this during development to see what can be optimized
 * 
 * @param moduleName Name of the module being analyzed
 * @param exportedKeys Array of exported keys from the module
 */
export function analyzeUnusedExports(
  moduleName: string,
  exportedKeys: string[]
): void {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }
  
  // Store usage data
  const usageMap = new Map<string, boolean>();
  exportedKeys.forEach(key => usageMap.set(key, false));
  
  // Create proxy to track usage
  const trackUsage = (key: string) => {
    if (usageMap.has(key)) {
      usageMap.set(key, true);
    }
  };
  
  // Log results after timeout
  setTimeout(() => {
    const unusedExports = Array.from(usageMap.entries())
      .filter(([_, used]) => !used)
      .map(([key]) => key);
    
    if (unusedExports.length > 0) {
      console.warn(
        `[Tree-Shaking] Unused exports detected in "${moduleName}":`,
        unusedExports.join(', '),
        '\nConsider using selective imports to improve bundle size.'
      );
    }
  }, 5000);
  
  return trackUsage as any;
}

/**
 * Conditionally imports a module based on feature flag or environment
 * Allows better tree-shaking by excluding code paths that aren't used
 * 
 * @param condition Condition that determines if the module should be imported
 * @param importFn Function that returns a dynamic import
 * @returns Promise that resolves to the module or null
 */
export async function conditionalImport<T>(
  condition: boolean,
  importFn: () => Promise<T>
): Promise<T | null> {
  if (condition) {
    return await importFn();
  }
  return null;
}

/**
 * Exports a selective subset of a large library to improve tree-shaking
 * 
 * @param lib The entire library
 * @param selections Array of keys to select from the library
 * @returns Object containing only the selected functions
 */
export function selectiveExport<T extends object, K extends keyof T>(
  lib: T,
  selections: K[]
): Pick<T, K> {
  return selections.reduce((acc, key) => {
    acc[key] = lib[key];
    return acc;
  }, {} as Pick<T, K>);
}

// Add React import for lazyComponent
import React from 'react';

export default {
  lazyImport,
  selectiveJsonImport,
  lazyComponent,
  lazyHook,
  analyzeUnusedExports,
  conditionalImport,
  selectiveExport
};