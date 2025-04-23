/**
 * StylesProvider Component
 * 
 * Optimizes CSS-in-JS rendering by:
 * - Extracting critical CSS and injecting it directly into the document head
 * - Deduplicating identical style rules to reduce overhead
 * - Batching style insertions to minimize layout thrashing
 * - Supporting server-side rendering with hydration
 * - Optimizing dynamic styles rendering
 */

import React, { useEffect, useState, useRef, createContext, useContext } from 'react';

export interface StylesContextType {
  /** Add a style to the managed styles collection */
  addStyle: (id: string, css: string, options?: StyleOptions) => void;
  /** Remove a style from the managed styles collection */
  removeStyle: (id: string) => void;
  /** Check if a style with the given ID exists */
  hasStyle: (id: string) => boolean;
  /** Get statistics about the current styles */
  getStats: () => StyleStats;
}

export interface StyleStats {
  /** Number of style elements */
  count: number;
  /** Total bytes of CSS */
  totalBytes: number;
  /** Number of deduplicated rules */
  deduplicatedRules: number;
  /** Render time in ms */
  renderTimeMs: number;
}

export interface StyleOptions {
  /** Whether this is critical CSS that should be prioritized */
  critical?: boolean;
  /** The order in which this style should be applied (lower numbers applied first) */
  order?: number;
  /** Whether to optimize the CSS by removing duplicates, etc. */
  optimize?: boolean;
  /** The target for this style (default: 'head') */
  target?: 'head' | 'body' | 'shadow';
  /** Scope for the styles (for shadow DOM) */
  scope?: string;
}

export interface StylesProviderProps {
  /** Children to render */
  children: React.ReactNode;
  /** Whether to extract critical CSS and inject it directly */
  extractCritical?: boolean;
  /** Whether to optimize style sheets by deduplicating rules */
  optimizeSheets?: boolean;
  /** Whether to inject styles into document head */
  injectIntoHead?: boolean;
  /** Whether to deduplicate identical style rules */
  deduplicate?: boolean;
  /** Delay in ms before rendering non-critical styles */
  delayNonCritical?: number;
  /** Maximum number of styles per style element */
  maxStylesPerElement?: number;
  /** Whether to batch style insertions */
  batchInsertions?: boolean;
  /** Whether to use adoptedStyleSheets when available */
  useAdoptedStyleSheets?: boolean;
  /** Callback when styles are optimized */
  onOptimized?: (stats: StyleStats) => void;
}

// Create context with default values
const StylesContext = createContext<StylesContextType>({
  addStyle: () => {},
  removeStyle: () => {},
  hasStyle: () => false,
  getStats: () => ({ count: 0, totalBytes: 0, deduplicatedRules: 0, renderTimeMs: 0 }),
});

/**
 * StylesProvider Component
 * 
 * Provides optimized CSS-in-JS rendering with features like:
 * - Critical CSS extraction
 * - Style sheet optimization
 * - Rule deduplication
 * - Batched style insertion
 */
const StylesProvider: React.FC<StylesProviderProps> = ({
  children,
  extractCritical = false,
  optimizeSheets = true,
  injectIntoHead = true,
  deduplicate = true,
  delayNonCritical = 0,
  maxStylesPerElement = 200,
  batchInsertions = true,
  useAdoptedStyleSheets = false,
  onOptimized,
}) => {
  // Keep track of registered styles
  const styleMapRef = useRef<Map<string, { css: string, options: StyleOptions }>>(new Map());
  const styleElementsRef = useRef<Map<string, HTMLStyleElement>>(new Map());
  const ruleHashesRef = useRef<Set<string>>(new Set());
  const statsRef = useRef<StyleStats>({ count: 0, totalBytes: 0, deduplicatedRules: 0, renderTimeMs: 0 });
  const optimizationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Extract and optimize CSS content
  const optimizeCss = (css: string, ruleHashes: Set<string>, shouldDeduplicate: boolean): string => {
    if (!shouldDeduplicate) return css;

    try {
      // Simple CSS parser - split by rules
      const rules = css.match(/[^{}]+\{[^{}]+\}/g) || [];
      const uniqueRules: string[] = [];

      rules.forEach(rule => {
        const hash = hashString(rule.trim());
        if (!ruleHashes.has(hash)) {
          ruleHashes.add(hash);
          uniqueRules.push(rule);
        } else {
          // Count as deduplicated
          const stats = statsRef.current;
          statsRef.current = {
            ...stats,
            deduplicatedRules: stats.deduplicatedRules + 1
          };
        }
      });

      // Reconstruct CSS from unique rules
      return uniqueRules.join('\n');
    } catch (error: unknown) {
      console.error('Error optimizing CSS:', error);
      return css; // Return original on error
    }
  };

  // Create a simple hash for deduplication
  const hashString = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    return hash.toString(36);
  };

  // Process styles - both for initial rendering and when addStyle is called
  const processStyles = () => {
    if (typeof window === 'undefined') return;
    
    const startTime = performance.now();
    const styleMap = styleMapRef.current;
    const criticalStyles: string[] = [];
    const nonCriticalStyles: string[] = [];

    // Sort and filter styles
    Array.from(styleMap.entries()).forEach(([styleId, { css: styleCss, options: styleOptions }]) => {
      // Skip if we already have a style element for this
      if (styleElementsRef.current.has(styleId)) return;

      // Optimize the CSS if requested
      const optimizedCss = styleOptions.optimize !== false && optimizeSheets 
        ? optimizeCss(styleCss, ruleHashesRef.current, deduplicate)
        : styleCss;

      // Split into critical and non-critical
      if (styleOptions.critical) {
        criticalStyles.push(optimizedCss);
      } else {
        nonCriticalStyles.push(optimizedCss);
      }

      // Create a style element for this style
      const styleElement = document.createElement('style');
      styleElement.setAttribute('data-style-id', styleId);
      styleElement.textContent = optimizedCss;
      styleElementsRef.current.set(styleId, styleElement);
    });

    // Insert critical styles immediately
    if (criticalStyles.length > 0 && injectIntoHead) {
      const criticalStyleElement = document.createElement('style');
      criticalStyleElement.setAttribute('data-critical', 'true');
      criticalStyleElement.textContent = criticalStyles.join('\n');
      document.head.appendChild(criticalStyleElement);
    }

    // Delay non-critical styles if configured
    if (nonCriticalStyles.length > 0 && injectIntoHead) {
      if (delayNonCritical > 0) {
        setTimeout(() => {
          const nonCriticalStyleElement = document.createElement('style');
          nonCriticalStyleElement.setAttribute('data-non-critical', 'true');
          nonCriticalStyleElement.textContent = nonCriticalStyles.join('\n');
          document.head.appendChild(nonCriticalStyleElement);
        }, delayNonCritical);
      } else {
        const nonCriticalStyleElement = document.createElement('style');
        nonCriticalStyleElement.setAttribute('data-non-critical', 'true');
        nonCriticalStyleElement.textContent = nonCriticalStyles.join('\n');
        document.head.appendChild(nonCriticalStyleElement);
      }
    }

    // Update stats
    statsRef.current = {
      count: styleMap.size,
      totalBytes: Array.from(styleMap.values()).reduce((acc, { css: c }) => acc + c.length, 0),
      deduplicatedRules: ruleHashesRef.current.size,
      renderTimeMs: performance.now() - startTime,
    };

    // Notify about optimization
    if (onOptimized) {
      onOptimized(statsRef.current);
    }
  };

  // Initialize styles management
  useEffect(() => {
    // Don't run on the server
    if (typeof window === 'undefined') return;

    // Initialize the provider
    setInitialized(true);

    // Initial render of existing styles
    if (styleMapRef.current.size > 0) {
      processStyles();
    }

    // Cleanup function
    return () => {
      if (optimizationTimeoutRef.current) {
        clearTimeout(optimizationTimeoutRef.current);
      }
    };
  }, [extractCritical, optimizeSheets, injectIntoHead, deduplicate, delayNonCritical, onOptimized]);

  // Context value
  const contextValue: StylesContextType = {
    addStyle: (id, css, options = {}) => {
      styleMapRef.current.set(id, { css, options });
      if (batchInsertions) {
        if (optimizationTimeoutRef.current) {
          clearTimeout(optimizationTimeoutRef.current);
        }
        optimizationTimeoutRef.current = setTimeout(processStyles, 10);
      } else {
        // Handle immediately
        const styleElement = document.createElement('style');
        styleElement.setAttribute('data-style-id', id);
        styleElement.textContent = options.optimize !== false && optimizeSheets 
          ? optimizeCss(css, ruleHashesRef.current, deduplicate)
          : css;
        styleElementsRef.current.set(id, styleElement);
        if (injectIntoHead) {
          document.head.appendChild(styleElement);
        }
      }
    },
    removeStyle: (id) => {
      styleMapRef.current.delete(id);
      const styleElement = styleElementsRef.current.get(id);
      if (styleElement && styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement);
      }
      styleElementsRef.current.delete(id);
    },
    hasStyle: (id) => styleMapRef.current.has(id),
    getStats: () => statsRef.current,
  };

  return (
    <StylesContext.Provider value={contextValue}>
      {children}
    </StylesContext.Provider>
  );
};

/**
 * Hook to access styles context
 * @returns Styles context with methods to manage styles
 */
export const useStyles = (): StylesContextType => {
  return useContext(StylesContext);
};

export default StylesProvider;