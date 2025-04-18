/**
 * LazyLoad Component
 * 
 * A component that defers loading its children until they are 
 * about to enter the viewport.
 * 
 * Features:
 * - Uses Intersection Observer for performance
 * - Configurable threshold and root margin
 * - Custom placeholder support
 * - Prevents layout shifts by maintaining dimensions
 */

import React, { useState, useEffect, useRef } from 'react';

interface LazyLoadProps {
  /** The content to lazy load */
  children: React.ReactNode;
  /** Custom placeholder to show before content is loaded */
  placeholder?: React.ReactNode;
  /** Height to maintain (prevents layout shift) */
  height?: string | number;
  /** Width to maintain (prevents layout shift) */
  width?: string | number;
  /** Intersection observer threshold (0-1) */
  threshold?: number;
  /** Intersection observer root margin */
  margin?: string;
  /** Load immediately without waiting for intersection */
  immediate?: boolean;
  /** CSS class for container */
  className?: string;
  /** Unique identifier */
  id?: string;
  /** Callback function called when content becomes visible */
  onVisible?: () => void;
}

/**
 * LazyLoad Component
 * 
 * Improves initial page load performance by deferring the loading of
 * off-screen components until they're about to be viewed.
 */
const LazyLoad: React.FC<LazyLoadProps> = ({
  children,
  placeholder,
  height,
  width,
  threshold = 0.1,
  margin = '100px',
  immediate = false,
  className = '',
  id,
  onVisible,
}) => {
  // Track if component is visible and rendered
  const [isVisible, setIsVisible] = useState(immediate);
  const [hasRendered, setHasRendered] = useState(immediate);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Set up intersection observer to detect when component is visible
  useEffect(() => {
    // Skip if already visible or we've requested immediate loading
    if (isVisible || immediate) {
      setHasRendered(true);
      return;
    }
    
    // Get the container element to observe
    const container = containerRef.current;
    if (!container) {
      return;
    }
    
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        
        if (entry && entry.isIntersecting) {
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
    return undefined; // Explicitly return for the case when no cleanup needed
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