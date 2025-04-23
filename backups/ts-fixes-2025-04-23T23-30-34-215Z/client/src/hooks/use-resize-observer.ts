/**
 * useResizeObserver Hook
 * 
 * A custom hook for efficiently monitoring element size changes using ResizeObserver.
 * This hook provides a callback-based API for responding to size changes without
 * causing unnecessary re-renders.
 * 
 * Features:
 * - Uses native ResizeObserver API for efficient size tracking
 * - Debounces resize events for better performance
 * - Provides width, height, and entry information
 * - Supports ref callback pattern for easy integration
 * - Includes cleanup on unmount to prevent memory leaks
 */

import { useCallback, useEffect, useRef } from 'react';

type ResizeHandler = (width: number, height: number, entry: ResizeObserverEntry) => void;

interface ResizeObserverOptions {
  /**
   * Debounce time in milliseconds
   * @default 0 (no debounce)
   */
  debounceTime?: number;
  
  /**
   * Whether to trigger the callback immediately on mount
   * @default false
   */
  triggerOnMount?: boolean;
  
  /**
   * Whether to use animation frame for handling resize events
   * @default true
   */
  useRAF?: boolean;
  
  /**
   * Box model to observe
   * @default 'content-box'
   */
  box?: 'border-box' | 'content-box' | 'device-pixel-content-box';
}

/**
 * Hook for observing element size changes
 * 
 * @param onResize Callback function called when element size changes
 * @param options Configuration options
 * @returns Ref callback to attach to the element to observe
 */
export function useResizeObserver(
  onResize: ResizeHandler,
  options: ResizeObserverOptions = {}
): (element: Element | null) => void {
  const {
    debounceTime = 0,
    triggerOnMount = false,
    useRAF = true,
    box = 'content-box'
  } = options;
  
  // Refs to avoid recreating resize observer on each render
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const onResizeRef = useRef(onResize);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const elementRef = useRef<Element | null>(null);
  
  // Keep callback reference updated
  useEffect(() => {
    onResizeRef.current = onResize;
  }, [onResize]);
  
  // Cleanup function for timers
  const cleanup = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    
    if (resizeObserverRef.current && elementRef.current) {
      resizeObserverRef.current.unobserve(elementRef.current);
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
      elementRef.current = null;
    }
  }, []);
  
  // Handle resize with debouncing and requestAnimationFrame
  const handleResize = useCallback((entries: ResizeObserverEntry[]) => {
    const entry = entries[0];
    if (!entry) return;
    
    // Get box size based on options
    const boxSize = entry.contentBoxSize || entry.borderBoxSize || [];
    
    // Get dimensions
    const contentRect = entry.contentRect;
    const width = contentRect.width;
    const height = contentRect.height;
    
    const processResize = () => {
      // Call the resize callback with width, height, and entry
      onResizeRef.current(width, height, entry);
    };
    
    // Cancel any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Cancel any existing animation frame
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    
    if (debounceTime > 0) {
      // Debounce the resize
      debounceTimerRef.current = setTimeout(() => {
        if (useRAF) {
          rafRef.current = requestAnimationFrame(processResize);
        } else {
          processResize();
        }
      }, debounceTime);
    } else if (useRAF) {
      // Use requestAnimationFrame without debounce
      rafRef.current = requestAnimationFrame(processResize);
    } else {
      // Immediate execution
      processResize();
    }
  }, [debounceTime, useRAF]);
  
  // Ref callback to attach observer to element
  const setRef = useCallback((element: Element | null) => {
    // Clean up previous observer
    cleanup();
    
    // If no element, just return
    if (!element) return;
    
    // Store element reference
    elementRef.current = element;
    
    // Skip if ResizeObserver is not available
    if (typeof ResizeObserver === 'undefined') {
      console.warn('ResizeObserver is not supported in this browser');
      return;
    }
    
    // Create and attach new observer
    const observer = new ResizeObserver(handleResize);
    resizeObserverRef.current = observer;
    
    // Start observing
    observer.observe(element, { box: box as ResizeObserverBoxOptions });
    
    // Trigger initial resize if needed
    if (triggerOnMount) {
      const width = element.clientWidth;
      const height = element.clientHeight;
      
      const mockEntry = {
        target: element,
        contentRect: {
          width,
          height,
          x: 0,
          y: 0,
          top: 0,
          left: 0,
          right: width,
          bottom: height
        },
        borderBoxSize: [{ inlineSize: width, blockSize: height }],
        contentBoxSize: [{ inlineSize: width, blockSize: height }],
        devicePixelContentBoxSize: [{ inlineSize: width, blockSize: height }]
      } as ResizeObserverEntry;
      
      handleResize([mockEntry]);
    }
  }, [handleResize, cleanup, triggerOnMount, box]);
  
  // Clean up on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);
  
  return setRef;
}

export default useResizeObserver;