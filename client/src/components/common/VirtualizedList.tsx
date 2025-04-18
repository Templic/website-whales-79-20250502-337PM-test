/**
 * VirtualizedList Component
 * 
 * Renders only the items currently in view, significantly improving performance
 * for large lists. Supports both fixed-height and variable-height items.
 * 
 * Features:
 * - Virtual scrolling for large datasets
 * - Configurable overscan for smooth scrolling
 * - Support for dynamic height items
 * - Customizable rendering of list items
 */

import React, { useState, useRef, useCallback, memo } from 'react';

interface VirtualizedListProps<T> {
  /** Array of items to render */
  items: T[];
  /** Height of the list container in pixels */
  height: number;
  /** Width of the list container (px, %, etc.) */
  width: number | string;
  /** Height of each item, either fixed or calculated per item */
  itemHeight: number | ((item: T, index: number) => number);
  /** Function to render each item */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Function to get a unique key for each item */
  getItemKey: (item: T, index: number) => string | number;
  /** Number of extra items to render above/below viewport */
  overscan?: number;
  /** CSS class for the container */
  className?: string;
  /** Additional style properties */
  style?: React.CSSProperties;
  /** Callback when scroll position changes */
  onScroll?: (event: React.UIEvent<HTMLDivElement>) => void;
  /** Callback when visible items change */
  onVisibleItemsChange?: (startIndex: number, endIndex: number) => void;
}

/**
 * VirtualizedList Component - Efficiently renders large lists
 */
function VirtualizedList<T>({
  items,
  height,
  width,
  itemHeight,
  renderItem,
  getItemKey,
  overscan = 3,
  className = '',
  style = {},
  onScroll,
  onVisibleItemsChange,
}: VirtualizedListProps<T>) {
  // Track scroll position
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Get item height (safely handles both fixed and variable height)
  const getItemHeightValue = useCallback(
    (index: number): number => {
      if (typeof itemHeight === 'function' && index >= 0 && index < items.length) {
        // Safe access with index check
        return itemHeight(items[index], index);
      }
      return typeof itemHeight === 'number' ? itemHeight : 0;
    },
    [itemHeight, items]
  );
  
  // Calculate the total height of all items
  const totalHeight = useTotalHeight(items, getItemHeightValue);
  
  // Calculate which items should be visible
  const { startIndex, endIndex, paddingTop } = useVisibleRange(
    items.length,
    getItemHeightValue,
    scrollTop,
    height,
    overscan
  );
  
  // Handle scroll events
  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const newScrollTop = event.currentTarget.scrollTop;
      setScrollTop(newScrollTop);
      
      if (onScroll) {
        onScroll(event);
      }
    },
    [onScroll]
  );
  
  // Notify when visible items change
  React.useEffect(() => {
    if (onVisibleItemsChange && startIndex !== undefined && endIndex !== undefined) {
      onVisibleItemsChange(startIndex, endIndex);
    }
  }, [startIndex, endIndex, onVisibleItemsChange]);
  
  // Slice only the visible items
  const visibleItems = startIndex !== undefined && endIndex !== undefined 
    ? items.slice(startIndex, endIndex + 1) 
    : [];
  
  return (
    <div
      ref={containerRef}
      className={`virtualized-list-container ${className}`}
      style={{
        height,
        width,
        overflow: 'auto',
        position: 'relative',
        ...style,
      }}
      onScroll={handleScroll}
    >
      <div
        className="virtualized-list-content"
        style={{
          height: totalHeight,
          position: 'relative',
        }}
      >
        <div
          className="virtualized-list-items"
          style={{
            position: 'absolute',
            top: paddingTop,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, localIndex) => {
            const index = startIndex !== undefined ? startIndex + localIndex : localIndex;
            return (
              <div
                key={getItemKey(item, index)}
                className="virtualized-list-item"
                style={{
                  height: getItemHeightValue(index),
                }}
                data-index={index}
              >
                {renderItem(item, index)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Calculate the total height of all items
function useTotalHeight<T>(
  items: T[],
  getItemHeight: (index: number) => number
): number {
  return items.reduce((height, _, index) => height + getItemHeight(index), 0);
}

// Calculate which items should be visible based on scroll position
function useVisibleRange(
  itemCount: number,
  getItemHeight: (index: number) => number,
  scrollTop: number,
  viewportHeight: number,
  overscan: number
): { startIndex: number; endIndex: number; paddingTop: number } {
  // Find the first visible item
  let startIndex = 0;
  let currentOffset = 0;
  
  // Find the first item that starts after the current scroll position
  while (startIndex < itemCount && currentOffset < scrollTop) {
    currentOffset += getItemHeight(startIndex);
    startIndex++;
  }
  
  // Adjust for overscan (items above the viewport)
  startIndex = Math.max(0, startIndex - overscan);
  
  // Calculate padding from the top
  let paddingTop = 0;
  for (let i = 0; i < startIndex; i++) {
    paddingTop += getItemHeight(i);
  }
  
  // Find the last visible item
  let endIndex = startIndex;
  let visibleHeight = 0;
  
  // Add items until we've filled the viewport plus overscan
  while (
    endIndex < itemCount &&
    visibleHeight < viewportHeight + getItemHeight(Math.min(endIndex, itemCount - 1))
  ) {
    visibleHeight += getItemHeight(endIndex);
    endIndex++;
  }
  
  // Adjust for overscan (items below the viewport)
  endIndex = Math.min(itemCount - 1, endIndex + overscan);
  
  return { startIndex, endIndex, paddingTop };
}

export default memo(VirtualizedList) as typeof VirtualizedList;