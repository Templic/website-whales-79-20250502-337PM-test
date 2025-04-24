/**
 * CSS Optimization Utilities
 * 
 * Provides utilities for optimizing CSS performance, including CSS containment,
 * critical CSS extraction, and layout performance optimizations.
 */

import { useEffect, useRef } from 'react';

/**
 * CSS Containment Types
 */
export type ContainmentType = 
  | 'none'       // No containment
  | 'content'    // Content containment (layout, style, paint, size)
  | 'strict'     // Strict containment (layout, style, paint, size)
  | 'size'       // Size containment only
  | 'layout'     // Layout containment only
  | 'style'      // Style containment only
  | 'paint'      // Paint containment only
  | 'size layout'// Size and layout containment
  | 'layout paint'// Layout and paint containment
  | 'size paint' // Size and paint containment
  | 'layout style paint'; // Layout, style and paint containment

/**
 * CSS Containment Options
 */
export interface ContainmentOptions {
  /** Containment type */
  type?: ContainmentType;
  /** Whether the element contains a replaced element (img, video, canvas, etc.) */
  containsReplaced?: boolean;
  /** Whether to apply will-change optimization */
  willChange?: boolean | string;
  /** Whether to apply content-visibility: auto */
  contentVisibility?: boolean;
  /** Whether to use contain-intrinsic-size */
  intrinsicSize?: string;
  /** Whether to apply overflow: hidden for performance gains */
  clipOverflow?: boolean;
  /** Whether to layer promote the element (transform: translateZ(0)) */
  layerPromote?: boolean;
}

/**
 * Default containment options
 */
const defaultContainmentOptions: ContainmentOptions = {
  type: 'none',
  containsReplaced: false,
  willChange: false,
  contentVisibility: false,
  clipOverflow: false,
  layerPromote: false
};

/**
 * Get CSS containment properties based on options
 * @param options Containment options
 * @returns CSS properties object
 */
export function getContainmentProps(options: ContainmentOptions = {}): React.CSSProperties {
  const {
    type = 'none',
    containsReplaced = false,
    willChange = false,
    contentVisibility = false,
    intrinsicSize,
    clipOverflow = false,
    layerPromote = false
  } = { ...defaultContainmentOptions, ...options };

  const styles: React.CSSProperties = {};

  // Apply containment
  if (type !== 'none') {
    styles.contain = type;
  }

  // Apply will-change
  if (willChange) {
    styles.willChange = typeof willChange === 'string' ? willChange : 'transform';
  }

  // Apply content-visibility
  if (contentVisibility && !containsReplaced) {
    styles.contentVisibility = 'auto';
  }

  // Apply contain-intrinsic-size
  if (intrinsicSize) {
    // @ts-ignore - TypeScript doesn't know about this property yet
    styles.containIntrinsicSize = intrinsicSize;
  }

  // Apply overflow clipping
  if (clipOverflow) {
    styles.overflow = 'hidden';
  }

  // Apply layer promotion
  if (layerPromote) {
    styles.transform = 'translateZ(0)';
  }

  return styles;
}

/**
 * React hook for applying CSS containment
 * @param options Containment options
 * @returns Ref and props to apply to the element
 */
export function useContainment(options: ContainmentOptions = {}) {
  const ref = useRef<HTMLElement>(null);
  const containmentProps = getContainmentProps(options);

  return {
    ref,
    style: containmentProps
  };
}

/**
 * Calculate approximate element size
 * @param element Element to measure
 * @returns Approximate size [width, height]
 */
export function getApproximateSize(element: HTMLElement): [number, number] {
  const style = window.getComputedStyle(element);
  const width = parseInt(style.width, 10) || element.clientWidth;
  const height = parseInt(style.height, 10) || element.clientHeight;
  
  return [width, height];
}

/**
 * Get containment props for a list item
 * @returns CSS containment props for list items
 */
export function getListItemContainment(): React.CSSProperties {
  return getContainmentProps({
    type: 'content',
    clipOverflow: true
  });
}

/**
 * Get containment props for a card component
 * @returns CSS containment props for cards
 */
export function getCardContainment(): React.CSSProperties {
  return getContainmentProps({
    type: 'layout style paint',
    willChange: true,
    clipOverflow: true
  });
}

/**
 * Get containment props for a section component
 * @returns CSS containment props for sections
 */
export function getSectionContainment(): React.CSSProperties {
  return getContainmentProps({
    type: 'layout',
    contentVisibility: true,
    clipOverflow: true
  });
}

/**
 * Get containment props for components with animations
 * @returns CSS containment props for animated components
 */
export function getAnimatedComponentContainment(): React.CSSProperties {
  return getContainmentProps({
    type: 'layout paint',
    willChange: 'transform, opacity',
    layerPromote: true
  });
}

/**
 * Get containment props for modal components
 * @returns CSS containment props for modals
 */
export function getModalContainment(): React.CSSProperties {
  return getContainmentProps({
    type: 'layout paint',
    willChange: 'transform, opacity',
    layerPromote: true
  });
}

/**
 * React hook to optimize an element when it's offscreen
 * @param options Options for content-visibility
 * @returns Ref to attach to the element
 */
export function useContentVisibility(options: {
  enabled?: boolean;
  intrinsicSize?: string;
} = {}) {
  const { enabled = true, intrinsicSize } = options;
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!enabled || !ref.current) return;

    const element = ref.current;
    element.style.contentVisibility = 'auto';
    
    if (intrinsicSize) {
      // @ts-ignore - TypeScript doesn't know about this property yet
      element.style.containIntrinsicSize = intrinsicSize;
    }

    return () => {
      element.style.contentVisibility = '';
      // @ts-ignore
      element.style.containIntrinsicSize = '';
    };
  }, [enabled, intrinsicSize]);

  return ref;
}

/**
 * React hook to prevent layout thrashing when reading and writing DOM properties
 * @returns Functions to safely read and write DOM properties
 */
export function useLayoutOptimization() {
  const readQueue: (() => void)[] = [];
  const writeQueue: (() => void)[] = [];
  const frameRef = useRef<number | null>(null);

  const processQueues = () => {
    // Process all reads first
    readQueue.forEach(read => read());
    readQueue.length = 0;

    // Then process all writes
    writeQueue.forEach(write => write());
    writeQueue.length = 0;

    frameRef.current = null;
  };

  const scheduleProcess = () => {
    if (frameRef.current === null) {
      frameRef.current = requestAnimationFrame(processQueues);
    }
  };

  const read = <T>(callback: () => T): T | null => {
    if (readQueue.length === 0 && writeQueue.length === 0) {
      return callback();
    }

    let result: T | null = null;
    readQueue.push(() => {
      result = callback();
    });

    scheduleProcess();
    return result;
  };

  const write = (callback: () => void): void => {
    writeQueue.push(callback);
    scheduleProcess();
  };

  // Clean up animation frame on unmount
  useEffect(() => {
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return {
    read,
    write,
    flush: processQueues
  };
}

/**
 * Optimizes a critical CSS chunk
 * @param css CSS string
 * @returns Optimized CSS string
 */
export function optimizeCriticalCss(css: string): string {
  // Remove comments
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // Remove whitespace
  css = css.replace(/\s+/g, ' ');
  css = css.replace(/\s*({|}|;|:|,)\s*/g, '$1');
  css = css.replace(/;}/g, '}');
  
  return css.trim();
}

/**
 * Creates a critical CSS style element
 * @param css CSS string
 * @param id ID for the style element
 */
export function injectCriticalCss(css: string, id: string = 'critical-css'): void {
  // Don't add duplicate styles
  if (document.getElementById(id)) {
    return;
  }
  
  const style = document.createElement('style');
  style.id = id;
  style.innerHTML = optimizeCriticalCss(css);
  document.head.appendChild(style);
}

/**
 * Preloads CSS files
 * @param urls Array of CSS URLs to preload
 */
export function preloadCssFiles(urls: string[]): void {
  urls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    link.as = 'style';
    document.head.appendChild(link);
  });
}

/**
 * Preloads font files
 * @param urls Array of font URLs to preload
 * @param fontFormat Font format (e.g. 'woff2', 'woff', 'truetype')
 */
export function preloadFonts(urls: string[], fontFormat: string = 'woff2'): void {
  urls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    link.as = 'font';
    link.type = `font/${fontFormat}`;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
}

/**
 * React hook for font loading optimization
 * @param fontUrls Array of font URLs to preload
 * @param fontFormat Font format
 */
export function useFontPreloading(fontUrls: string[], fontFormat: string = 'woff2'): void {
  useEffect(() => {
    preloadFonts(fontUrls, fontFormat);
  }, [fontUrls, fontFormat]);
}

/**
 * React hook to apply font-display swap
 * @param fontFamilies Font family names to apply font-display: swap
 */
export function useFontDisplaySwap(fontFamilies: string[]): void {
  useEffect(() => {
    const style = document.createElement('style');
    const rules = fontFamilies.map(family => 
      `@font-face { font-family: ${family}; font-display: swap; }`
    ).join('\n');
    
    style.innerHTML = rules;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, [fontFamilies]);
}

/**
 * Apply CSS containment to a DOM element
 * @param element Element to apply containment to
 * @param options Containment options
 */
export function applyContainment(element: HTMLElement, options: ContainmentOptions = {}): void {
  const props = getContainmentProps(options);
  
  Object.entries(props).forEach(([key, value]) => {
    // @ts-ignore
    element.style[key] = value;
  });
}