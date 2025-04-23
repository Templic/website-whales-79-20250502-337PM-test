import React, { useState, useRef, useEffect, CSSProperties, ReactNode, memo } from 'react';
import { useMemoryLeakDetection } from '@/lib/memory-leak-detector';

export interface LazyLoadProps {
  children: ReactNode;
  height?: number | string;
  width?: number | string;
  threshold?: number;
  rootMargin?: string;
  className?: string;
  style?: CSSProperties;
  placeholder?: ReactNode;
  fallback?: ReactNode;
  onVisible?: () => void;
  skip?: boolean;
  once?: boolean;
  delayMs?: number;
  observeScrollContainer?: boolean;
  skeletonComponent?: ReactNode;
  loadingIndicator?: ReactNode;
  fadeInDuration?: number;
  visibleClassName?: string;
  debug?: boolean;
}

/**
 * LazyLoad component that renders children only when they become visible in the viewport
 */
const LazyLoad: React.FC<LazyLoadProps> = ({
  children,
  height,
  width,
  threshold = 0.1,
  rootMargin = '200px 0px',
  className = '',
  style = {},
  placeholder,
  fallback,
  onVisible,
  skip = false,
  once = true,
  delayMs = 0,
  observeScrollContainer = false,
  skeletonComponent,
  loadingIndicator,
  fadeInDuration = 500,
  visibleClassName = 'is-visible',
  debug = false,
}) => {
  // Track this component for memory leak detection
  useMemoryLeakDetection('LazyLoad');
  
  const [isVisible, setIsVisible] = useState(skip);
  const [hasBeenVisible, setHasBeenVisible] = useState(skip);
  const [ready, setReady] = useState(skip);
  const [error, setError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const timeoutRef = useRef<number | null>(null);
  
  // Handle intersection
  useEffect(() => {
    // If skip is true, don't observe
    if (skip) {
      setIsVisible(true);
      setHasBeenVisible(true);
      setReady(true);
      return;
    }
    
    // Handle intersection detection
    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      const newIsVisible = entry.isIntersecting;
      
      if (debug) {
        console.log(`[LazyLoad] Intersection: ${newIsVisible ? 'visible' : 'hidden'}`);
      }
      
      setIsVisible(newIsVisible);
      
      if (newIsVisible && !hasBeenVisible) {
        setHasBeenVisible(true);
        
        // Call onVisible callback
        onVisible?.();
        
        // Set ready state after delay
        if (delayMs > 0) {
          timeoutRef.current = window.setTimeout(() => {
            setReady(true);
          }, delayMs);
        } else {
          setReady(true);
        }
        
        // If once is true, disconnect observer
        if (once && observer.current && containerRef.current) {
          observer.current.unobserve(containerRef.current);
          observer.current.disconnect();
          observer.current = null;
        }
      }
    };
    
    // Create new intersection observer
    if (containerRef.current) {
      const options: IntersectionObserverInit = {
        root: observeScrollContainer ? containerRef.current.parentElement : null,
        rootMargin,
        threshold,
      };
      
      observer.current = new IntersectionObserver(handleIntersect, options);
      observer.current.observe(containerRef.current);
    }
    
    // Cleanup function
    return () => {
      if (observer.current) {
        observer.current.disconnect();
        observer.current = null;
      }
      
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [
    skip,
    hasBeenVisible,
    once,
    rootMargin,
    threshold,
    onVisible,
    delayMs,
    observeScrollContainer,
    debug,
  ]);
  
  // Determine what to render
  const renderContent = () => {
    if (error && fallback) {
      return fallback;
    }
    
    if (!ready && hasBeenVisible) {
      return loadingIndicator || placeholder || skeletonComponent || null;
    }
    
    if (!hasBeenVisible) {
      return placeholder || skeletonComponent || null;
    }
    
    return children;
  };
  
  // Container styles
  const containerStyle: CSSProperties = {
    transition: ready ? `opacity ${fadeInDuration}ms ease-in-out` : undefined,
    opacity: ready ? 1 : 0,
    ...style,
  };
  
  if (height !== undefined) {
    containerStyle.height = height;
  }
  
  if (width !== undefined) {
    containerStyle.width = width;
  }
  
  // Let error boundary catch errors
  try {
    return (
      <div
        ref={containerRef}
        className={`lazy-load ${className} ${hasBeenVisible ? visibleClassName : ''}`}
        style={containerStyle}
      >
        {renderContent()}
      </div>
    );
  } catch (err: unknown) {
    if (debug) {
      console.error('[LazyLoad] Error rendering content:', err);
    }
    setError(true);
    return fallback ? <>{fallback}</> : null;
  }
};

export default memo(LazyLoad);

/**
 * A hook to skip rendering if the component is not visible in the viewport
 * @param rootMargin Distance from viewport to start loading
 * @param threshold Percentage of element that must be visible
 * @param enabled Whether to enable visibility detection
 * @returns Object with isVisible flag and ref to attach to the element
 */
export function useSkipRenderIfInvisible(rootMargin: string = '200px', threshold: number = 0.1, enabled: boolean = true) {
  const [isVisible, setIsVisible] = useState(!enabled);
  const containerRef = useRef<HTMLDivElement>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  
  useEffect(() => {
    if (!enabled) {
      setIsVisible(true);
      return;
    }
    
    const element = containerRef.current;
    if (!element) return;
    
    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        setIsVisible(entry.isIntersecting);
      });
    };
    
    observer.current = new IntersectionObserver(handleIntersect, {
      rootMargin,
      threshold,
    });
    
    observer.current.observe(element);
    
    return () => {
      if (observer.current) {
        observer.current.disconnect();
        observer.current = null;
      }
    };
  }, [rootMargin, threshold, enabled]);
  
  return { isVisible, ref: containerRef };
}