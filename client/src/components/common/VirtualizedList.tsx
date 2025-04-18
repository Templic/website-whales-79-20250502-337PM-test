/**
 * VirtualizedList Component
 * 
 * A lightweight virtualized list implementation to efficiently render large lists
 * by only rendering the items visible in the viewport.
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useThrottle } from '@/lib/performance';

interface VirtualizedListProps<T> {
  /**
   * The data array to render
   */
  items: T[];
  
  /**
   * A render function for each item
   */
  renderItem: (item: T, index: number) => React.ReactNode;
  
  /**
   * Height of each item in pixels
   */
  itemHeight: number;
  
  /**
   * Height of the container in pixels
   */
  height: number;
  
  /**
   * Width of the container
   */
  width?: string | number;
  
  /**
   * Additional CSS classes for the container
   */
  className?: string;
  
  /**
   * Number of items to render beyond the visible area
   * Higher values reduce blank areas during fast scrolling but render more items
   */
  overscan?: number;
}

/**
 * A virtualized list component for efficiently rendering large lists
 * 
 * @example
 * ```tsx
 * <VirtualizedList
 *   items={users}
 *   renderItem={(user, index) => (
 *     <div key={user.id} className="p-4 border-b">
 *       {user.name}
 *     </div>
 *   )}
 *   itemHeight={64}
 *   height={400}
 *   overscan={5}
 * />
 * ```
 */
export function VirtualizedList<T>({
  items,
  renderItem,
  itemHeight,
  height,
  width = '100%',
  className = '',
  overscan = 3
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Calculate which items should be visible
  const { startIndex, endIndex, visibleItems } = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + height) / itemHeight) + overscan
    );
    
    // Map items to include position data
    const visibleItems = items
      .slice(startIndex, endIndex + 1)
      .map((item, index) => ({
        item,
        index: startIndex + index,
        offsetTop: (startIndex + index) * itemHeight,
      }));
    
    return { startIndex, endIndex, visibleItems };
  }, [items, scrollTop, height, itemHeight, overscan]);
  
  // Handle scroll events
  const handleScroll = useThrottle(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, 16); // ~60fps
  
  // Total height of all items
  const totalHeight = items.length * itemHeight;
  
  return (
    <div
      ref={containerRef}
      className={`overflow-auto will-change-transform ${className}`}
      style={{ height, width }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index, offsetTop }) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${itemHeight}px`,
              transform: `translateY(${offsetTop}px)`,
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}

export default VirtualizedList;