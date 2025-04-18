/**
 * LazyLoad Component
 * 
 * A component that lazily loads its children only when they enter the viewport.
 * Useful for deferring the loading of heavy components until they're needed.
 */

import React, { useEffect, useState, useRef } from 'react';

interface LazyLoadProps {
  /** The content to load lazily */
  children: React.ReactNode;
  /** Height to take up before loading (to prevent layout shifts) */
  height?: string | number;
  /** Width to take up before loading (to prevent layout shifts) */
  width?: string | number;
  /** Margin around the element that will trigger loading (in pixels or with units) */
  margin?: string;
  /** Threshold value between 0 and 1 indicating what percentage of the target must be visible */
  threshold?: number;
  /** Placeholder to show while content is loading */
  placeholder?: React.ReactNode;
  /** Whether to load content immediately regardless of visibility */
  immediate?: boolean;
  /** Function called when the component becomes visible */
  onVisible?: () => void;
  /** CSS class to apply to the wrapper */
  className?: string;
  /** Unique identifier for tracking */
  id?: string;
}

/**
 * LazyLoad Component
 * 
 * Renders children only when they become visible in the viewport
 */
const LazyLoad: React.FC<LazyLoadProps> = ({
  children,
  height,
  width,
  margin = '100px',
  threshold = 0.1,
  placeholder,
  immediate = false,
  onVisible,
  className = '',
  id,
}) => {
  const [isVisible, setIsVisible] = useState(immediate);
  const [hasRendered, setHasRendered] = useState(immediate);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Skip if set to immediate load or already visible
    if (immediate || isVisible) {
      return;
    }
    
    const container = containerRef.current;
    if (!container) {
      return;
    }
    
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (onVisible) {
            onVisible();
          }
          
          // Once content is visible, no need to keep observing
          observer.disconnect();
        }
      },
      {
        root: null, // viewport
        rootMargin: margin,
        threshold,
      }
    );
    
    observer.observe(container);
    
    return () => {
      observer.disconnect();
    };
  }, [immediate, isVisible, margin, onVisible, threshold]);
  
  // After becoming visible, render the content with a short delay
  // to prevent jank during scrolling
  useEffect(() => {
    if (isVisible && !hasRendered) {
      const timer = setTimeout(() => {
        setHasRendered(true);
      }, 10);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, hasRendered]);
  
  // Style for the placeholder
  const style: React.CSSProperties = {};
  if (height !== undefined) {
    style.height = height;
  }
  if (width !== undefined) {
    style.width = width;
  }
  
  return (
    <div
      ref={containerRef}
      className={`lazy-load-container ${className}`}
      style={hasRendered ? {} : style}
      id={id}
      data-loaded={hasRendered}
    >
      {hasRendered ? (
        children
      ) : (
        placeholder || (
          <div 
            className="lazy-load-placeholder"
            style={{ 
              height: '100%', 
              width: '100%', 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div className="lazy-load-spinner" />
          </div>
        )
      )}
    </div>
  );
};

export default LazyLoad;