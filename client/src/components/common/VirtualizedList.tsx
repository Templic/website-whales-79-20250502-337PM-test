import React, { 
  useState, 
  useRef, 
  useEffect, 
  useCallback,
  ReactNode, 
  CSSProperties, 
  useMemo 
} from 'react';
import { measureExecutionTime } from '@/lib/performance';
import { useAnimationFrameThrottled } from '@/lib/animation-frame-batch';
import { useResizeObserver } from '@/hooks/use-resize-observer';
import { useSelectiveState } from '@/hooks/use-selective-state';
import { useMemoryLeakDetection } from '@/utils/memory-leak-detector';

export interface VirtualizedListProps<T> {
  /** Array of items to render in the list */
  items: T[];
  /** Height of the list container */
  height: number;
  /** Height of each item, or function to calculate height */
  itemHeight: number | ((item: T, index: number) => number);
  /** Function to render each item */
  renderItem: (item: T, index: number, style: CSSProperties) => ReactNode;
  /** Number of items to render outside of the visible area */
  overscan?: number;
  /** CSS class for the outer container */
  className?: string;
  /** CSS styles for the outer container */
  style?: CSSProperties;
  /** Called when list is scrolled */
  onScroll?: (scrollOffset: number) => void;
  /** Called when visible items change */
  onItemsRendered?: (params: { visibleStartIndex: number; visibleEndIndex: number }) => void;
  /** Function to generate a unique key for each item */
  itemKey?: (item: T, index: number) => string | number;
  /** Fallback height for items when real height is unknown */
  estimatedItemHeight?: number;
  /** Index to scroll to when first rendering */
  scrollToIndex?: number;
  /** Initial scroll offset */
  initialScrollOffset?: number;
  /** List orientation */
  direction?: 'vertical' | 'horizontal';
  /** Width of the list container */
  width?: number | string;
  /** Element type for the inner container */
  innerElementType?: React.ElementType;
  /** Element type for the outer container */
  outerElementType?: React.ElementType;
  /** Whether to use windowing optimization */
  useWindowing?: boolean;
  /** Whether to use stable item keys for better React reconciliation */
  useStableItemKey?: boolean;
  /** Whether to recalculate when container resizes */
  observeResize?: boolean;
  /** Whether to enable incremental rendering for large lists */
  useIncrementalRendering?: boolean;
  /** Whether to use passive scroll listeners for better scroll performance */
  usePassiveEvents?: boolean;
  /** Whether to store itemSizes in a cache for better memory usage */
  useItemCache?: boolean;
  /** Whether to use intersection observer for visibility tracking */
  useIntersectionObserver?: boolean;
  /** Whether to skip rendering completely when list is not visible */
  skipRenderWhenNotVisible?: boolean;
  /** Whether to defer measurements until after the first render */
  deferMeasurements?: boolean;
  /** Whether to auto-adjust overscan based on scroll velocity */
  dynamicOverscan?: boolean;
}

/**
 * A virtualized list component that only renders items in view (plus overscan)
 * to improve performance for large lists. This enhanced version includes optimizations
 * for large datasets, memory usage, and rendering performance.
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
  useWindowing = true,
  useStableItemKey = true,
  observeResize = true,
  useIncrementalRendering = false,
  usePassiveEvents = true,
  useWeakReferences = true,
  useIntersectionObserver = true,
  skipRenderWhenNotVisible = false,
  deferMeasurements = true,
  dynamicOverscan = true,
}: VirtualizedListProps<T>) {
  // Use selective state for better performance with large lists
  const [state, setState] = useSelectiveState({
    scrollOffset: initialScrollOffset,
    isScrolling: false,
    scrollDirection: 'forward' as 'forward' | 'backward',
    scrollVelocity: 0,
    lastScrollTime: 0,
    effectiveOverscan: overscan,
    isVisible: !skipRenderWhenNotVisible || !useIntersectionObserver,
    containerWidth: typeof width === 'number' ? width : 0,
    containerHeight: height,
    hasInitialMeasurements: !deferMeasurements,
    sizeCache: new Map<number, number>(),
    renderedStartIndex: 0,
    renderedEndIndex: 0,
    heightCache: {} as Record<number, number>,
  });

  // Add memory leak detection 
  useMemoryLeakDetection('VirtualizedList');
  
  // Refs
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const sizeCache = useRef(new Map<number, number>());
  const weakItemsMap = useRef(new WeakMap<object, number>());
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const isVertical = direction === 'vertical';
  const isInitialRender = useRef(true);
  const lastRenderTime = useRef(Date.now());
  const prevItemsLength = useRef(items.length);
  
  // Use resize observer to update measurements when container size changes
  const handleResize = useCallback((width: number, height: number) => {
    if (isVertical && height !== state.containerHeight) {
      setState({ containerHeight: height });
    } else if (!isVertical && width !== state.containerWidth) {
      setState({ containerWidth: width });
    }
  }, [isVertical, setState, state.containerHeight, state.containerWidth]);
  
  // Apply resize observer if enabled
  const resizeRef = observeResize ? useResizeObserver(handleResize) : null;

  // Attach resize observer to the outer container
  const setOuterRef = useCallback((element: HTMLDivElement | null) => {
    outerRef.current = element;
    if (resizeRef) {
      (resizeRef as any)(element);
    }
  }, [resizeRef]);
  
  // Handle intersection observer for visibility tracking
  useEffect(() => {
    if (!useIntersectionObserver || !skipRenderWhenNotVisible) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries[0]?.isIntersecting ?? true;
        setState({ isVisible });
      },
      { threshold: 0.01 }
    );
    
    if (outerRef.current) {
      observer.observe(outerRef.current);
    }
    
    return () => observer.disconnect();
  }, [useIntersectionObserver, skipRenderWhenNotVisible, setState]);
  
  // Initialize measurements on first render if deferred
  useEffect(() => {
    if (deferMeasurements && !state.hasInitialMeasurements) {
      // Defer measurements to next tick
      const timer = setTimeout(() => {
        setState({ hasInitialMeasurements: true });
      }, 0);
      
      return () => clearTimeout(timer);
    }
  }, [deferMeasurements, state.hasInitialMeasurements, setState]);
  
  // Optimize item keys if using stable keys
  const getItemKey = useCallback(
    (item: T, index: number) => {
      if (useStableItemKey && typeof item === 'object' && item !== null) {
        const cachedIndex = weakItemsMap.current.get(item);
        if (cachedIndex !== undefined) {
          return itemKey(item, cachedIndex);
        }
        weakItemsMap.current.set(item, index);
      }
      return itemKey(item, index);
    },
    [itemKey, useStableItemKey]
  );
  
  // Prepare item measurements and caching
  const getItemSize = useCallback(
    (item: T, index: number): number => {
      // Try to get from cache first
      if (useWeakReferences && typeof item === 'object' && item !== null) {
        const cachedSize = sizeCache.current.get(getItemKey(item, index) as number);
        if (cachedSize !== undefined) {
          return cachedSize;
        }
      }
      
      // Otherwise calculate the size
      const size = typeof itemHeight === 'function'
        ? itemHeight(item, index)
        : itemHeight;
      
      // Cache the result
      if (useWeakReferences && typeof item === 'object' && item !== null) {
        sizeCache.current.set(getItemKey(item, index) as number, size);
      }
      
      return size;
    },
    [itemHeight, getItemKey, useWeakReferences]
  );
  
  // Memoize item measurements for stable virtualization
  const itemSizes = useMemo(() => {
    if (!state.hasInitialMeasurements) {
      return Array(items.length).fill(estimatedItemHeight);
    }
    
    return measureExecutionTime('calculateItemSizes', () => {
      return items.map(getItemSize);
    });
  }, [items, getItemSize, state.hasInitialMeasurements, estimatedItemHeight]);
  
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
  
  // Dynamic overscan based on scroll velocity
  useEffect(() => {
    if (dynamicOverscan && state.scrollVelocity) {
      const base = overscan;
      const multiplier = Math.min(Math.abs(state.scrollVelocity) / 50, 3);
      const dynamicValue = Math.ceil(base * multiplier);
      
      // Only update if it would change by more than 1
      if (Math.abs(dynamicValue - state.effectiveOverscan) > 1) {
        setState({ effectiveOverscan: dynamicValue });
      }
    }
  }, [dynamicOverscan, state.scrollVelocity, overscan, state.effectiveOverscan, setState]);
  
  // Determine visible range of items
  const visibleRange = useMemo(() => {
    if (!state.hasInitialMeasurements || !state.isVisible) {
      return { start: 0, end: Math.min(10, items.length - 1) };
    }
    
    return measureExecutionTime('calculateVisibleRange', () => {
      const size = isVertical 
        ? state.containerHeight 
        : (typeof width === 'number' ? width : state.containerWidth);
      
      if (size === 0 || totalSize === 0) {
        return { start: 0, end: Math.min(10, items.length - 1) };
      }
      
      // Binary search to find start index (much faster for large lists)
      let start = 0;
      let end = itemPositions.length - 1;
      let startIndex = 0;
      
      while (start <= end) {
        const mid = Math.floor((start + end) / 2);
        if (itemPositions[mid] <= state.scrollOffset) {
          startIndex = mid;
          start = mid + 1;
        } else {
          end = mid - 1;
        }
      }
      
      // Find end index by scanning forward
      let endIndex = startIndex;
      const viewportEnd = state.scrollOffset + size;
      
      while (
        endIndex < itemPositions.length &&
        (itemPositions[endIndex] < viewportEnd || endIndex === startIndex)
      ) {
        endIndex++;
      }
      
      // Apply effective overscan (dynamically calculated or fixed)
      const effectiveOverscan = dynamicOverscan 
        ? state.effectiveOverscan 
        : overscan;
        
      // Add direction-based overscan
      const overscanBefore = state.scrollDirection === 'backward' 
        ? effectiveOverscan 
        : Math.min(effectiveOverscan, 2);
        
      const overscanAfter = state.scrollDirection === 'forward' 
        ? effectiveOverscan 
        : Math.min(effectiveOverscan, 2);
      
      startIndex = Math.max(0, startIndex - overscanBefore);
      endIndex = Math.min(itemPositions.length - 1, endIndex + overscanAfter);
      
      return { start: startIndex, end: endIndex };
    });
  }, [
    isVertical,
    state.containerHeight,
    state.containerWidth,
    width,
    totalSize,
    itemPositions,
    state.scrollOffset,
    dynamicOverscan,
    state.effectiveOverscan,
    overscan,
    state.scrollDirection,
    items.length,
    state.hasInitialMeasurements,
    state.isVisible
  ]);
  
  // Incremental rendering implementation
  useEffect(() => {
    if (!useIncrementalRendering || !state.hasInitialMeasurements) return;
    
    // If the list has dramatically increased in size, render in chunks
    if (items.length > prevItemsLength.current + 100) {
      let renderedEnd = state.renderedEndIndex;
      const targetEnd = visibleRange.end;
      
      const renderNextChunk = () => {
        const newEnd = Math.min(renderedEnd + 50, targetEnd);
        setState({ renderedEndIndex: newEnd });
        
        if (newEnd < targetEnd) {
          renderedEnd = newEnd;
          rafRef.current = requestAnimationFrame(renderNextChunk);
        }
      };
      
      setState({ renderedStartIndex: visibleRange.start });
      rafRef.current = requestAnimationFrame(renderNextChunk);
      
      return () => {
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }
      };
    } else {
      // Regular update for normal size changes
      setState({
        renderedStartIndex: visibleRange.start,
        renderedEndIndex: visibleRange.end
      });
    }
    
    prevItemsLength.current = items.length;
  }, [
    visibleRange, 
    items.length, 
    useIncrementalRendering, 
    setState, 
    state.renderedEndIndex,
    state.hasInitialMeasurements
  ]);
  
  // Calculate effective range (either incremental or direct)
  const effectiveRange = useIncrementalRendering
    ? {
        start: state.renderedStartIndex,
        end: state.renderedEndIndex
      }
    : visibleRange;
  
  // Handle scroll event with optimizations
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    e.preventDefault();
    const { current } = outerRef;
    if (!current) return;
    
    const now = Date.now();
    const newOffset = isVertical ? current.scrollTop : current.scrollLeft;
    const delta = newOffset - state.scrollOffset;
    const direction = delta >= 0 ? 'forward' : 'backward';
    
    // Calculate velocity (pixels per second)
    const timeDelta = Math.max(1, now - state.lastScrollTime);
    const velocity = Math.round((delta / timeDelta) * 1000);
    
    // Use requestAnimationFrame for optimal scroll performance
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    
    rafRef.current = requestAnimationFrame(() => {
      setState({
        scrollOffset: newOffset,
        scrollDirection: direction,
        scrollVelocity: velocity,
        lastScrollTime: now,
        isScrolling: true
      });
      
      // Clear any existing scroll end timer
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
        scrollTimerRef.current = null;
      }
      
      // Set timer to mark scrolling as ended after a delay
      scrollTimerRef.current = setTimeout(() => {
        setState({ isScrolling: false, scrollVelocity: 0 });
      }, 150);
      
      // Notify parent of scroll position
      if (onScroll) {
        onScroll(newOffset);
      }
    });
  }, [
    isVertical, 
    setState, 
    state.scrollOffset, 
    state.lastScrollTime, 
    onScroll
  ]);
  
  // Report rendered items to parent if requested
  useEffect(() => {
    if (onItemsRendered && state.hasInitialMeasurements) {
      onItemsRendered({
        visibleStartIndex: effectiveRange.start,
        visibleEndIndex: effectiveRange.end,
      });
    }
  }, [effectiveRange, onItemsRendered, state.hasInitialMeasurements]);
  
  // Handle scrollToIndex prop change
  useEffect(() => {
    if (scrollToIndex !== undefined && outerRef.current && state.hasInitialMeasurements) {
      const index = Math.min(Math.max(0, scrollToIndex), items.length - 1);
      const offset = itemPositions[index] || 0;
      
      if (isVertical) {
        outerRef.current.scrollTop = offset;
      } else {
        outerRef.current.scrollLeft = offset;
      }
    }
  }, [scrollToIndex, itemPositions, isVertical, items.length, state.hasInitialMeasurements]);
  
  // Create the virtualized items with performance optimizations
  const children = useMemo(() => {
    if (!state.hasInitialMeasurements || (skipRenderWhenNotVisible && !state.isVisible)) {
      return null;
    }
    
    return measureExecutionTime('renderVirtualItems', () => {
      const result = [];
      
      const { start, end } = effectiveRange;
      const isScrolling = state.isScrolling;
      
      for (let i = start; i <= end; i++) {
        if (i >= items.length) break;
        
        const item = items[i];
        const position = itemPositions[i] || 0;
        const size = itemSizes[i] || estimatedItemHeight;
        
        const itemStyle: CSSProperties = isVertical
          ? { 
              position: 'absolute', 
              top: position, 
              height: size, 
              left: 0, 
              right: 0,
              // Optimizations for scroll performance
              willChange: isScrolling ? 'transform' : 'auto',
              // Use transform instead of top for better performance during scrolling
              transform: isScrolling ? `translateY(${position}px)` : undefined,
              ...(isScrolling ? { top: 0 } : { top: position }),
            }
          : { 
              position: 'absolute', 
              left: position, 
              width: size, 
              top: 0, 
              bottom: 0,
              willChange: isScrolling ? 'transform' : 'auto',
              transform: isScrolling ? `translateX(${position}px)` : undefined,
              ...(isScrolling ? { left: 0 } : { left: position }),
            };
        
        const key = getItemKey(item, i);
        
        result.push(
          <div 
            key={key} 
            style={itemStyle} 
            data-index={i}
            data-item-key={key}
            aria-rowindex={i + 1} // For accessibility
          >
            {renderItem(item, i, itemStyle)}
          </div>
        );
      }
      
      return result;
    });
  }, [
    effectiveRange,
    items,
    itemPositions,
    itemSizes,
    isVertical,
    renderItem,
    getItemKey,
    estimatedItemHeight,
    state.isScrolling,
    state.hasInitialMeasurements,
    state.isVisible,
    skipRenderWhenNotVisible
  ]);
  
  // Record performance metrics
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
    } else {
      const renderTime = Date.now() - lastRenderTime.current;
      if (renderTime > 16) { // Frame threshold (16.67ms)
        console.log(`[VirtualizedList] Slow render: ${renderTime}ms for ${
          (effectiveRange.end - effectiveRange.start + 1)
        } items`);
      }
    }
    lastRenderTime.current = Date.now();
  });
  
  // Clean up timers and animation frames
  useEffect(() => {
    return () => {
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);
  
  // Outer container style with optimizations
  const outerStyle: CSSProperties = {
    position: 'relative',
    overflow: 'auto',
    WebkitOverflowScrolling: 'touch',
    willChange: 'transform',
    // Optimize repaint performance during scrolling
    backfaceVisibility: 'hidden',
    // Enable GPU acceleration
    transform: 'translateZ(0)',
    // Prevent blurry text in some browsers during scrolling
    fontSmooth: 'always',
    ...style,
  };
  
  if (isVertical) {
    outerStyle.height = height;
    outerStyle.width = width;
  } else {
    outerStyle.width = width;
    outerStyle.height = height;
  }
  
  // Inner container style with optimizations
  const innerStyle: CSSProperties = isVertical
    ? { 
        height: totalSize, 
        position: 'relative',
        pointerEvents: state.isScrolling ? 'none' : 'auto', // Disable pointer events during scroll for better performance
      }
    : { 
        width: totalSize, 
        height: '100%', 
        position: 'relative',
        pointerEvents: state.isScrolling ? 'none' : 'auto',
      };
  
  // Skip rendering during initial measurement phase if deferring
  if (deferMeasurements && !state.hasInitialMeasurements) {
    return (
      <OuterElementType
        ref={setOuterRef}
        className={`virtualized-list ${className}`}
        style={outerStyle}
      >
        <InnerElementType ref={innerRef} style={{ height: estimatedItemHeight * items.length }}>
          <div style={{ padding: '4px', textAlign: 'center' }}>Loading...</div>
        </InnerElementType>
      </OuterElementType>
    );
  }
  
  // Skip rendering when not visible if configured
  if (skipRenderWhenNotVisible && !state.isVisible) {
    return (
      <OuterElementType
        ref={setOuterRef}
        className={`virtualized-list ${className}`}
        style={outerStyle}
      />
    );
  }
  
  // Use passive events for better scroll performance
  const scrollHandlerProps = usePassiveEvents
    ? {
        // Use a DOM property for passive event listeners
        // @ts-ignore - non-standard but widely supported
        onScroll: { handleEvent: handleScroll, passive: true },
      }
    : { onScroll: handleScroll };
  
  // Render the full component
  return (
    <OuterElementType
      ref={setOuterRef}
      className={`virtualized-list ${className}${state.isScrolling ? ' is-scrolling' : ''}`}
      style={outerStyle}
      data-total-items={items.length}
      {...scrollHandlerProps}
    >
      <InnerElementType 
        ref={innerRef} 
        style={innerStyle}
        data-scroll-direction={state.scrollDirection}
      >
        {children}
      </InnerElementType>
    </OuterElementType>
  );
}

export default React.memo(VirtualizedList) as typeof VirtualizedList;