/**
 * VirtualizedList Component
 * 
 * A component that renders only the visible items within a long list,
 * improving performance for large datasets.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';

interface VirtualizedListProps<T> {
  /** All items in the list */
  items: T[];
  /** Function to render an individual item */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Height of each item in pixels */
  itemHeight: number;
  /** Height of the container in pixels or CSS value */
  height: number | string;
  /** Extra items to render outside viewport (improves scroll experience) */
  overscan?: number;
  /** CSS class for container */
  className?: string;
  /** Unique identifier */
  id?: string;
  /** Optional width */
  width?: number | string;
  /** Custom on scroll callback */
  onScroll?: (event: React.UIEvent<HTMLDivElement>) => void;
  /** Whether to use fixed height (better performance) or variable height items */
  fixedHeight?: boolean;
  /** Key extractor function for items */
  keyExtractor?: (item: T, index: number) => string | number;
}

/**
 * VirtualizedList Component
 * 
 * Efficiently renders large lists by only rendering items that are visible
 * or about to become visible as the user scrolls.
 */
function VirtualizedList<T>({
  items,
  renderItem,
  itemHeight,
  height,
  overscan = 5,
  className = '',
  id,
  width = '100%',
  onScroll,
  fixedHeight = true,
  keyExtractor,
}: VirtualizedListProps<T>) {
  // Refs
  const listRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  
  // Calculate indexes of visible items
  const visibleItemCount = typeof height === 'number' 
    ? Math.ceil(height / itemHeight) + 2 * overscan
    : 20 + 2 * overscan; // Default if height is a CSS value
  
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(items.length, startIndex + visibleItemCount);
  
  // Handle scroll events
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = event.currentTarget;
    setScrollTop(scrollTop);
    if (onScroll) {
      onScroll(event);
    }
  };
  
  // Calculate total height of all items
  const totalHeight = items.length * itemHeight;
  
  // Get visible items
  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex);
  }, [items, startIndex, endIndex]);
  
  // Generate key for each item
  const getKey = (item: T, index: number): string | number => {
    if (keyExtractor) {
      return keyExtractor(item, index + startIndex);
    }
    
    // Default key handling using index
    if (item && typeof item === 'object' && 'id' in item) {
      return (item as any).id;
    }
    
    return `item-${index + startIndex}`;
  };
  
  // Container style
  const containerStyle: React.CSSProperties = {
    height: typeof height === 'number' ? `${height}px` : height,
    width,
    overflow: 'auto',
    position: 'relative',
  };
  
  // Style for the spacer to maintain correct scroll height
  const spacerStyle: React.CSSProperties = {
    height: `${totalHeight}px`,
    width: '1px',
    position: 'absolute',
    pointerEvents: 'none',
  };
  
  // Calculate item position
  const getItemStyle = (index: number): React.CSSProperties => {
    return {
      position: 'absolute',
      top: `${(index + startIndex) * itemHeight}px`,
      left: 0,
      right: 0,
      height: fixedHeight ? `${itemHeight}px` : 'auto',
    };
  };
  
  // Render
  return (
    <div 
      ref={listRef}
      className={`virtualized-list ${className}`}
      style={containerStyle}
      onScroll={handleScroll}
      id={id}
    >
      {/* Spacer div to maintain scroll area */}
      <div style={spacerStyle} aria-hidden="true" />
      
      {/* Only render visible items */}
      {visibleItems.map((item, index) => (
        <div 
          key={getKey(item, index)}
          style={getItemStyle(index)}
          className="virtualized-list-item"
        >
          {renderItem(item, index + startIndex)}
        </div>
      ))}
    </div>
  );
}

export default VirtualizedList;