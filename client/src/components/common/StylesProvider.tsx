/**
 * Styles Provider Component
 * 
 * Optimizes CSS-in-JS rendering and stylesheet management for better performance.
 * Provides deduplication, critical CSS extraction, and stylesheet optimization.
 */

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';

/**
 * Types of style sheets
 */
export type StyleSheetType = 
  | 'critical' // Critical styles needed for above-the-fold content
  | 'main'     // Main application styles
  | 'lazy'     // Styles that can be loaded lazily
  | 'print'    // Print-specific styles
  | 'dark'     // Dark mode styles
  | 'rtl'      // Right-to-left styles
  | 'theme';   // Theme-specific styles

/**
 * Style sheet definition
 */
export interface StyleSheet {
  /** Unique identifier for the style sheet */
  id: string;
  /** CSS content */
  css: string;
  /** Type of style sheet */
  type: StyleSheetType;
  /** Order of application (lower numbers applied first) */
  order?: number;
  /** Whether the style sheet is already in the DOM */
  mounted?: boolean;
  /** Whether to mount the style sheet immediately */
  immediate?: boolean;
  /** Media query for conditional application */
  media?: string;
  /** Whether this is a vendor style sheet */
  vendor?: boolean;
  /** Whether to remove the style sheet on component unmount */
  removeOnUnmount?: boolean;
  /** Additional attributes for the style element */
  attributes?: Record<string, string>;
}

/**
 * Context for style sheet management
 */
export interface StylesContextValue {
  /** Register a new style sheet */
  registerSheet: (sheet: StyleSheet) => void;
  /** Unregister a style sheet */
  unregisterSheet: (id: string) => void;
  /** Update an existing style sheet */
  updateSheet: (id: string, css: string) => void;
  /** Enable or disable a style sheet */
  toggleSheet: (id: string, enabled: boolean) => void;
  /** Get current mounted style sheets */
  getSheets: () => StyleSheet[];
  /** Get critical CSS */
  getCriticalCSS: () => string;
  /** Flush all style sheets */
  flush: () => void;
  /** Apply critical CSS */
  applyCritical: () => void;
}

// Create context with default values
const StylesContext = createContext<StylesContextValue>({
  registerSheet: () => {},
  unregisterSheet: () => {},
  updateSheet: () => {},
  toggleSheet: () => {},
  getSheets: () => [],
  getCriticalCSS: () => '',
  flush: () => {},
  applyCritical: () => {}
});

export interface StylesProviderProps {
  /** Child components */
  children: React.ReactNode;
  /** Whether to server-side render styles */
  ssr?: boolean;
  /** Whether to deduplicate styles */
  deduplicate?: boolean;
  /** Whether to automatically extract critical CSS */
  extractCritical?: boolean;
  /** Time in milliseconds to delay non-critical style sheet insertion */
  delayNonCritical?: number;
  /** Whether to optimize style sheets */
  optimizeSheets?: boolean;
  /** Whether to disable all style injections (for SSR only) */
  disableInjection?: boolean;
  /** When true, all styles will be injected into the head instead of style tags in the component tree */
  injectIntoHead?: boolean;
  /** Custom target for style injection */
  target?: HTMLElement;
  /** Callback when styles change */
  onStylesChange?: (css: string) => void;
}

/**
 * Optimizes CSS by removing comments, whitespace, and duplicate rules
 * @param css CSS string to optimize
 * @returns Optimized CSS string
 */
function optimizeCSS(css: string): string {
  // Remove comments
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // Remove whitespace
  css = css.replace(/\s+/g, ' ');
  css = css.replace(/\s*([{}:;,])\s*/g, '$1');
  css = css.replace(/;}/g, '}');
  
  // Remove duplicate rules (simple deduplication)
  const rules: string[] = [];
  const uniqueRules = new Set<string>();
  
  // Extract rules with a regex
  const ruleRegex = /([^{}]*){([^{}]*)}/g;
  let match;
  
  while ((match = ruleRegex.exec(css)) !== null) {
    const selector = match[1].trim();
    const declaration = match[2].trim();
    const rule = `${selector}{${declaration}}`;
    
    if (!uniqueRules.has(rule)) {
      uniqueRules.add(rule);
      rules.push(rule);
    }
  }
  
  return rules.join('');
}

/**
 * Styles Provider Component
 */
export const StylesProvider: React.FC<StylesProviderProps> = ({
  children,
  ssr = false,
  deduplicate = true,
  extractCritical = true,
  delayNonCritical = 100,
  optimizeSheets = true,
  disableInjection = false,
  injectIntoHead = true,
  target,
  onStylesChange
}) => {
  // Track all registered style sheets
  const [sheets, setSheets] = useState<StyleSheet[]>([]);
  // Track style sheets that have been mounted to the DOM
  const [mountedSheets, setMountedSheets] = useState<Set<string>>(new Set());
  
  // Register a new style sheet
  const registerSheet = useMemo(() => (sheet: StyleSheet) => {
    setSheets(prevSheets => {
      // Check for duplicates if deduplication is enabled
      if (deduplicate && prevSheets.some(s => s.id === sheet.id)) {
        return prevSheets.map(s => 
          s.id === sheet.id ? { ...s, css: sheet.css } : s
        );
      }
      
      return [...prevSheets, sheet];
    });
    
    // Mount the style sheet immediately if requested
    if (sheet.immediate && !disableInjection) {
      mountStyleSheet(sheet);
    }
  }, [deduplicate, disableInjection]);
  
  // Unregister a style sheet
  const unregisterSheet = useMemo(() => (id: string) => {
    setSheets(prevSheets => prevSheets.filter(sheet => sheet.id !== id));
    
    // Remove from DOM if mounted
    if (!disableInjection && mountedSheets.has(id)) {
      unmountStyleSheet(id);
      setMountedSheets(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, [disableInjection, mountedSheets]);
  
  // Update an existing style sheet
  const updateSheet = useMemo(() => (id: string, css: string) => {
    setSheets(prevSheets => 
      prevSheets.map(sheet => 
        sheet.id === id ? { ...sheet, css } : sheet
      )
    );
    
    // Update in DOM if mounted
    if (!disableInjection && mountedSheets.has(id)) {
      const styleElement = document.getElementById(`style-${id}`);
      if (styleElement instanceof HTMLStyleElement) {
        styleElement.textContent = optimizeSheets ? optimizeCSS(css) : css;
      }
    }
  }, [disableInjection, mountedSheets, optimizeSheets]);
  
  // Toggle a style sheet's activation
  const toggleSheet = useMemo(() => (id: string, enabled: boolean) => {
    if (!disableInjection) {
      const styleElement = document.getElementById(`style-${id}`);
      if (styleElement instanceof HTMLStyleElement) {
        styleElement.disabled = !enabled;
      }
    }
  }, [disableInjection]);
  
  // Get all currently registered style sheets
  const getSheets = useMemo(() => () => {
    return [...sheets].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [sheets]);
  
  // Get critical CSS for server-side rendering
  const getCriticalCSS = useMemo(() => () => {
    const criticalSheets = sheets
      .filter(sheet => sheet.type === 'critical')
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    
    let css = criticalSheets.map(sheet => sheet.css).join('\n');
    
    if (optimizeSheets) {
      css = optimizeCSS(css);
    }
    
    return css;
  }, [sheets, optimizeSheets]);
  
  // Flush all style sheets (useful for SSR)
  const flush = useMemo(() => () => {
    setSheets([]);
    setMountedSheets(new Set());
    
    if (!disableInjection) {
      // Remove all style elements created by this provider
      document.querySelectorAll('[data-styles-provider]').forEach(el => {
        el.parentNode?.removeChild(el);
      });
    }
  }, [disableInjection]);
  
  // Apply critical CSS
  const applyCritical = useMemo(() => () => {
    if (disableInjection || !extractCritical) return;
    
    const criticalCSS = getCriticalCSS();
    
    if (criticalCSS) {
      // Create a style element for critical CSS
      const styleElement = document.createElement('style');
      styleElement.id = 'critical-css';
      styleElement.setAttribute('data-styles-provider', 'critical');
      styleElement.textContent = criticalCSS;
      
      // Insert at the top of the head
      if (document.head.firstChild) {
        document.head.insertBefore(styleElement, document.head.firstChild);
      } else {
        document.head.appendChild(styleElement);
      }
    }
  }, [disableInjection, extractCritical, getCriticalCSS]);
  
  // Mount a style sheet to the DOM
  function mountStyleSheet(sheet: StyleSheet) {
    if (disableInjection || mountedSheets.has(sheet.id)) return;
    
    const styleElement = document.createElement('style');
    styleElement.id = `style-${sheet.id}`;
    styleElement.setAttribute('data-styles-provider', sheet.type);
    
    // Apply any additional attributes
    if (sheet.attributes) {
      Object.entries(sheet.attributes).forEach(([key, value]) => {
        styleElement.setAttribute(key, value);
      });
    }
    
    // Apply media query if provided
    if (sheet.media) {
      styleElement.media = sheet.media;
    }
    
    // Optimize CSS if enabled
    styleElement.textContent = optimizeSheets ? optimizeCSS(sheet.css) : sheet.css;
    
    // Determine where to inject the style
    const targetElement = target || (injectIntoHead ? document.head : document.body);
    
    // Append to target
    targetElement.appendChild(styleElement);
    
    // Track mounted state
    setMountedSheets(prev => {
      const next = new Set(prev);
      next.add(sheet.id);
      return next;
    });
  }
  
  // Unmount a style sheet from the DOM
  function unmountStyleSheet(id: string) {
    const styleElement = document.getElementById(`style-${id}`);
    if (styleElement) {
      styleElement.parentNode?.removeChild(styleElement);
    }
  }
  
  // Initial mount of style sheets
  useEffect(() => {
    if (disableInjection) return;
    
    // Apply critical CSS immediately
    if (extractCritical) {
      const criticalSheets = sheets.filter(sheet => sheet.type === 'critical');
      criticalSheets.forEach(sheet => {
        if (!mountedSheets.has(sheet.id)) {
          mountStyleSheet(sheet);
        }
      });
    }
    
    // Delay mounting of non-critical style sheets
    const timeoutId = setTimeout(() => {
      const nonCriticalSheets = sheets.filter(sheet => 
        sheet.type !== 'critical' && !mountedSheets.has(sheet.id)
      );
      
      nonCriticalSheets.forEach(sheet => {
        mountStyleSheet(sheet);
      });
    }, delayNonCritical);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [sheets, disableInjection, extractCritical]);
  
  // Notify about style changes
  useEffect(() => {
    if (onStylesChange) {
      const allCSS = sheets
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map(sheet => sheet.css)
        .join('\n');
      
      onStylesChange(optimizeSheets ? optimizeCSS(allCSS) : allCSS);
    }
  }, [sheets, onStylesChange, optimizeSheets]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (!disableInjection) {
        sheets.forEach(sheet => {
          if (sheet.removeOnUnmount) {
            unmountStyleSheet(sheet.id);
          }
        });
      }
    };
  }, [disableInjection, sheets]);
  
  // Context value
  const contextValue = useMemo(() => ({
    registerSheet,
    unregisterSheet,
    updateSheet,
    toggleSheet,
    getSheets,
    getCriticalCSS,
    flush,
    applyCritical
  }), [
    registerSheet,
    unregisterSheet,
    updateSheet,
    toggleSheet,
    getSheets,
    getCriticalCSS,
    flush,
    applyCritical
  ]);
  
  return (
    <StylesContext.Provider value={contextValue}>
      {children}
    </StylesContext.Provider>
  );
};

/**
 * Hook to use the styles context
 * @returns Styles context value
 */
export function useStyles() {
  return useContext(StylesContext);
}

/**
 * Hook to register a style sheet
 * @param sheet Style sheet to register
 * @param deps Dependencies for style sheet update
 */
export function useStyleSheet(sheet: StyleSheet, deps: React.DependencyList = []) {
  const { registerSheet, unregisterSheet, updateSheet } = useStyles();
  
  useEffect(() => {
    registerSheet(sheet);
    
    return () => {
      if (sheet.removeOnUnmount) {
        unregisterSheet(sheet.id);
      }
    };
  }, [sheet.id, ...deps]);
  
  // Function to update the style sheet
  const update = React.useCallback((css: string) => {
    updateSheet(sheet.id, css);
  }, [sheet.id, updateSheet]);
  
  return { update };
}

/**
 * Component to inject a style sheet
 */
export const StyleSheet: React.FC<{
  id: string;
  css: string;
  type?: StyleSheetType;
  order?: number;
  media?: string;
  immediate?: boolean;
  removeOnUnmount?: boolean;
}> = ({
  id,
  css,
  type = 'main',
  order = 0,
  media,
  immediate = false,
  removeOnUnmount = true
}) => {
  useStyleSheet({
    id,
    css,
    type,
    order,
    media,
    immediate,
    removeOnUnmount
  }, [css, type, order, media, immediate]);
  
  return null;
};

export default StylesProvider;