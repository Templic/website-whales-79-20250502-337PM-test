/**
 * LazyLoad Component
 * 
 * Renders children only when the component enters the viewport.
 * Optimizes performance by preventing offscreen components from rendering.
 * 
 * Features:
 * - Uses Intersection Observer API for efficient detection
 * - Configurable thresholds, offsets, and placeholders
 * - Supports fallback for browsers without Intersection Observer
 */

import React, { useState, useRef, useEffect } from 'react';

interface LazyLoadProps {
  /** Content to lazy load */
  children: React.ReactNode;
  /** Height of the placeholder (px, %, etc.) */
  height?: number | string;
  /** Width of the placeholder (px, %, etc.) */
  width?: number | string;
  /** Percentage of element visible before loading (0-1) */
  threshold?: number;
  /** Additional margin around element for earlier loading */
  rootMargin?: string;
  /** Class name for container */
  className?: string;
  /** Callback when the element becomes visible */
  onVisible?: () => void;
  /** Custom placeholder component */
  placeholder?: React.ReactNode;
  /** Component always renders immediately */
  disabled?: boolean;
  /** Custom loading component */
  loadingComponent?: React.ReactNode;
  /** Class name for loading state */
  loadingClassName?: string;
}

/**
 * LazyLoad Component - Renders content only when it enters the viewport
 */
const LazyLoad: React.FC<LazyLoadProps> = ({
  children,
  height,
  width,
  threshold = 0.1,
  rootMargin = '200px 0px',
  className = '',
  onVisible,
  placeholder,
  disabled = false,
  loadingComponent,
  loadingClassName = '',
}) => {
  const [isVisible, setIsVisible] = useState(disabled);
  const [hasLoaded, setHasLoaded] = useState(disabled);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Create observer and handle intersection
  useEffect(() => {
    // Return early if disabled (always visible)
    if (disabled) return;
    
    const currentRef = containerRef.current;
    
    // Check if Intersection Observer is supported
    if (!('IntersectionObserver' in window) || !currentRef) {
      // Fallback to immediately visible in unsupported browsers
      setIsVisible(true);
      setHasLoaded(true);
      if (onVisible) onVisible();
      return;
    }
    
    // Create observer with config
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          
          // Element is visible in viewport, mark content for loading
          setIsVisible(true);
          
          // Call onVisible callback if provided
          if (onVisible) onVisible();
          
          // Unobserve after becoming visible
          if (currentRef) observer.unobserve(currentRef);
        });
      },
      {
        root: null, // Use viewport as root
        rootMargin, // Load earlier with margin
        threshold, // Percentage visible before loading
      }
    );
    
    // Start observing
    observer.observe(currentRef);
    
    // Clean up observer
    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [disabled, rootMargin, threshold, onVisible]);
  
  // Mark as fully loaded after content renders
  useEffect(() => {
    if (isVisible && !hasLoaded) {
      // Use requestAnimationFrame to give browser time to render children
      const timeoutId = setTimeout(() => {
        setHasLoaded(true);
      }, 100); // Small delay to ensure content has time to load
      
      return () => clearTimeout(timeoutId);
    }
  }, [isVisible, hasLoaded]);
  
  // Determine height/width values with units
  const heightStyle = typeof height === 'number' ? `${height}px` : height;
  const widthStyle = typeof width === 'number' ? `${width}px` : width;
  
  // Placeholder while loading content
  const renderPlaceholder = () => {
    if (placeholder) {
      return placeholder;
    }
    
    // Show loading component if provided
    if (loadingComponent) {
      return (
        <div className={`lazy-load-loading ${loadingClassName}`}>
          {loadingComponent}
        </div>
      );
    }
    
    // Default empty placeholder with height/width
    return null;
  };
  
  // Container style with dimensions
  const containerStyle: React.CSSProperties = {
    height: heightStyle,
    width: widthStyle,
    display: 'block',
    overflow: 'hidden',
  };
  
  return (
    <div
      ref={containerRef}
      className={`lazy-load-container ${className} ${isVisible ? 'is-visible' : ''} ${hasLoaded ? 'has-loaded' : ''}`}
      style={containerStyle}
    >
      {isVisible ? (
        <>
          {/* Children visible but not fully loaded yet */}
          {!hasLoaded && loadingComponent && (
            <div className={`lazy-load-loading ${loadingClassName}`}>
              {loadingComponent}
            </div>
          )}
          
          {/* Content with smooth fade-in */}
          <div
            className="lazy-load-content"
            style={{
              opacity: hasLoaded ? 1 : 0,
              transition: 'opacity 0.5s ease-in-out',
            }}
          >
            {children}
          </div>
        </>
      ) : (
        // Show placeholder until visible
        renderPlaceholder()
      )}
    </div>
  );
};

export default LazyLoad;