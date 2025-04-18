import React, { useState, useRef, useEffect, ReactNode, CSSProperties, useMemo } from 'react';
import { measureExecutionTime } from '@/lib/performance';
import { useAnimationFrameThrottled } from '@/lib/animation-frame-batch';

export interface VirtualizedListProps<T> {
  items: T[];
  height: number;
  itemHeight: number | ((item: T, index: number) => number);
  renderItem: (item: T, index: number, style: CSSProperties) => ReactNode;
  overscan?: number;
  className?: string;
  style?: CSSProperties;
  onScroll?: (scrollTop: number) => void;
  onItemsRendered?: (params: { visibleStartIndex: number; visibleEndIndex: number }) => void;
  itemKey?: (item: T, index: number) => string | number;
  estimatedItemHeight?: number;
  scrollToIndex?: number;
  initialScrollOffset?: number;
  direction?: 'vertical' | 'horizontal';
  width?: number;
  innerElementType?: React.ElementType;
  outerElementType?: React.ElementType;
}

/**
 * A virtualized list component that only renders items in view (plus overscan)
 * to improve performance for large lists
 */
function VirtualizedList<T>({
  items,
  height,
  width = '100%',
  itemHeight,
  renderItem,
  overscan = 3,
  className = '',
  style = {},
  onScroll,
  onItemsRendered,
  itemKey = (_, index) => index,
  estimatedItemHeight = 50,
  scrollToIndex,
  initialScrollOffset = 0,
  direction = 'vertical',
  innerElementType: InnerElementType = 'div',
  outerElementType: OuterElementType = 'div',
}: VirtualizedListProps<T>) {
  const [scrollOffset, setScrollOffset] = useState(initialScrollOffset);
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const isVertical = direction === 'vertical';
  
  // Memoize item measurements for more stable virtualization
  const itemSizes = useMemo(() => {
    return measureExecutionTime('calculateItemSizes', () => {
      return items.map((item, index) => {
        return typeof itemHeight === 'function'
          ? itemHeight(item, index)
          : itemHeight;
      });
    });
  }, [items, itemHeight]);
  
  // Calculate total size of all items
  const totalSize = useMemo(() => {
    return itemSizes.reduce((total, size) => total + size, 0);
  }, [itemSizes]);
  
  // Calculate item positions
  const itemPositions = useMemo(() => {
    let offset = 0;
    return itemSizes.map(size => {
      const position = offset;
      offset += size;
      return position;
    });
  }, [itemSizes]);
  
  // Determine visible range of items
  const visibleRange = useMemo(() => {
    return measureExecutionTime('calculateVisibleRange', () => {
      const size = isVertical ? height : (typeof width === 'number' ? width : 0);
      
      if (size === 0 || totalSize === 0) {
        return { start: 0, end: 10 }; // Default range
      }
      
      // Binary search to find start index
      let start = 0;
      let end = itemPositions.length - 1;
      let startIndex = 0;
      
      while (start <= end) {
        const mid = Math.floor((start + end) / 2);
        if (itemPositions[mid] <= scrollOffset) {
          startIndex = mid;
          start = mid + 1;
        } else {
          end = mid - 1;
        }
      }
      
      // Find end index by scanning forward
      let endIndex = startIndex;
      const viewportEnd = scrollOffset + size;
      
      while (
        endIndex < itemPositions.length &&
        (itemPositions[endIndex] < viewportEnd || endIndex === startIndex)
      ) {
        endIndex++;
      }
      
      // Apply overscan
      startIndex = Math.max(0, startIndex - overscan);
      endIndex = Math.min(itemPositions.length - 1, endIndex + overscan);
      
      return { start: startIndex, end: endIndex };
    });
  }, [scrollOffset, height, width, isVertical, itemPositions, totalSize, overscan]);
  
  // Handle scroll event with animation frame throttling
  const handleScroll = useAnimationFrameThrottled((e: React.UIEvent<HTMLDivElement>) => {
    const { current } = outerRef;
    if (!current) return;
    
    const newOffset = isVertical ? current.scrollTop : current.scrollLeft;
    setScrollOffset(newOffset);
    
    if (onScroll) {
      onScroll(newOffset);
    }
  });
  
  // Report rendered items to parent if requested
  useEffect(() => {
    if (onItemsRendered) {
      onItemsRendered({
        visibleStartIndex: visibleRange.start,
        visibleEndIndex: visibleRange.end,
      });
    }
  }, [visibleRange, onItemsRendered]);
  
  // Handle scrollToIndex prop change
  useEffect(() => {
    if (scrollToIndex !== undefined && outerRef.current) {
      const index = Math.min(Math.max(0, scrollToIndex), items.length - 1);
      const offset = itemPositions[index];
      
      if (isVertical) {
        outerRef.current.scrollTop = offset;
      } else {
        outerRef.current.scrollLeft = offset;
      }
    }
  }, [scrollToIndex, itemPositions, isVertical, items.length]);
  
  // Create the virtualized items
  const children = useMemo(() => {
    return measureExecutionTime('renderVirtualItems', () => {
      const result = [];
      
      for (let i = visibleRange.start; i <= visibleRange.end; i++) {
        if (i >= items.length) break;
        
        const item = items[i];
        const position = itemPositions[i] || 0;
        const size = itemSizes[i] || estimatedItemHeight;
        
        const itemStyle: CSSProperties = isVertical
          ? { position: 'absolute', top: position, height: size, left: 0, right: 0 }
          : { position: 'absolute', left: position, width: size, top: 0, bottom: 0 };
          
        result.push(
          <div key={itemKey(item, i)} style={itemStyle} data-index={i}>
            {renderItem(item, i, itemStyle)}
          </div>
        );
      }
      
      return result;
    });
  }, [
    visibleRange,
    items,
    itemPositions,
    itemSizes,
    isVertical,
    renderItem,
    itemKey,
    estimatedItemHeight,
  ]);
  
  // Outer container style
  const outerStyle: CSSProperties = {
    position: 'relative',
    overflow: 'auto',
    WebkitOverflowScrolling: 'touch',
    willChange: 'transform',
    ...style,
  };
  
  if (isVertical) {
    outerStyle.height = height;
    outerStyle.width = width;
  } else {
    outerStyle.width = width;
    outerStyle.height = height;
  }
  
  // Inner container style
  const innerStyle: CSSProperties = isVertical
    ? { height: totalSize, position: 'relative' }
    : { width: totalSize, height: '100%', position: 'relative' };
  
  return (
    <OuterElementType
      ref={outerRef}
      className={`virtualized-list ${className}`}
      style={outerStyle}
      onScroll={handleScroll}
    >
      <InnerElementType ref={innerRef} style={innerStyle}>
        {children}
      </InnerElementType>
    </OuterElementType>
  );
}

export default React.memo(VirtualizedList) as typeof VirtualizedList;