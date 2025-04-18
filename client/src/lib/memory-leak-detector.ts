/**
 * Memory Leak Detection Utilities
 * 
 * Tools for detecting and diagnosing memory leaks in React applications
 * by tracking component lifecycles, DOM nodes, event listeners, and closures.
 */

/**
 * Configuration options for memory leak detection
 */
interface MemoryDetectorConfig {
  /** Enable verbose logging for debugging */
  verbose?: boolean;
  /** Log interval in milliseconds */
  logInterval?: number;
  /** Threshold for component instance count warnings */
  instanceCountThreshold?: number;
  /** Threshold for DOM node count increase warnings */
  domGrowthThreshold?: number;
  /** Minimum memory growth (MB) to trigger warning */
  memoryGrowthThreshold?: number;
  /** Custom ignore patterns for components */
  ignoreComponents?: string[];
}

/**
 * Component instance tracking info
 */
interface ComponentTrackingInfo {
  /** Component display name */
  name: string;
  /** Count of current instances */
  count: number;
  /** Maximum observed count */
  maxCount: number;
  /** Mount count (total mounts over time) */
  mountCount: number;
  /** Unmount count (total unmounts over time) */
  unmountCount: number;
  /** Timestamps of recent mounts */
  recentMounts: number[];
  /** Timestamps of recent unmounts */
  recentUnmounts: number[];
}

// Singleton state for tracking
class MemoryTracker {
  private static instance: MemoryTracker;
  
  private config: MemoryDetectorConfig = {
    verbose: false,
    logInterval: 10000,
    instanceCountThreshold: 10,
    domGrowthThreshold: 100,
    memoryGrowthThreshold: 10,
    ignoreComponents: [],
  };
  
  private isInitialized = false;
  private loggingIntervalId: ReturnType<typeof setInterval> | null = null;
  private baselineMemory: number | null = null;
  private baselineDomCount: number | null = null;
  private componentTrackingMap = new Map<string, ComponentTrackingInfo>();
  private eventListenerMap = new Map<Element, Map<string, Set<Function>>>();
  private detachedDomNodes: WeakSet<Node> = new WeakSet();
  private memoryUsageHistory: Array<{ timestamp: number, usage: number }> = [];
  private domNodeCountHistory: Array<{ timestamp: number, count: number }> = [];
  
  private constructor() {}
  
  /**
   * Get singleton instance
   */
  public static getInstance(): MemoryTracker {
    if (!MemoryTracker.instance) {
      MemoryTracker.instance = new MemoryTracker();
    }
    return MemoryTracker.instance;
  }
  
  /**
   * Initialize memory tracking
   */
  public initialize(config: MemoryDetectorConfig = {}): void {
    if (this.isInitialized) {
      return;
    }
    
    this.config = { ...this.config, ...config };
    
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      console.warn('[Memory] Not initializing memory tracking in server environment');
      return;
    }
    
    // Take baseline measurements
    this.captureBaseline();
    
    // Start periodic logging
    this.loggingIntervalId = setInterval(() => {
      this.checkMemoryUsage();
    }, this.config.logInterval);
    
    this.isInitialized = true;
    console.log('[Memory] Memory leak detection initialized');
  }
  
  /**
   * Capture baseline measurements for comparison
   */
  private captureBaseline(): void {
    // Capture memory usage if available
    if ('performance' in window && 'memory' in (performance as any)) {
      this.baselineMemory = (performance as any).memory.usedJSHeapSize / (1024 * 1024);
      if (this.config.verbose) {
        console.log(`[Memory] Baseline memory usage: ${this.baselineMemory.toFixed(2)} MB`);
      }
    }
    
    // Capture DOM node count
    this.baselineDomCount = document.querySelectorAll('*').length;
    if (this.config.verbose) {
      console.log(`[Memory] Baseline DOM node count: ${this.baselineDomCount}`);
    }
  }
  
  /**
   * Check memory usage for significant growth
   */
  private checkMemoryUsage(): void {
    if (!this.baselineMemory && !this.baselineDomCount) {
      // No baseline measurements, capture them now
      this.captureBaseline();
      return;
    }
    
    // Check current memory usage if API is available
    if ('performance' in window && 'memory' in (performance as any)) {
      const currentMemory = (performance as any).memory.usedJSHeapSize / (1024 * 1024);
      const timestamp = Date.now();
      
      // Store historical data
      this.memoryUsageHistory.push({ timestamp, usage: currentMemory });
      
      // Trim history to last 50 entries
      if (this.memoryUsageHistory.length > 50) {
        this.memoryUsageHistory.shift();
      }
      
      // Check if memory usage has grown significantly
      if (this.baselineMemory !== null) {
        const growthMB = currentMemory - this.baselineMemory;
        if (growthMB > this.config.memoryGrowthThreshold!) {
          console.warn(
            `[Memory] Possible memory leak detected: Memory usage increased by ${growthMB.toFixed(2)} MB ` +
            `since baseline (${this.baselineMemory.toFixed(2)} MB → ${currentMemory.toFixed(2)} MB)`
          );
          
          // Check for continuous growth pattern
          this.checkGrowthPattern();
        }
      }
    }
    
    // Check current DOM node count
    const currentDomCount = document.querySelectorAll('*').length;
    const timestamp = Date.now();
    
    // Store historical data
    this.domNodeCountHistory.push({ timestamp, count: currentDomCount });
    
    // Trim history to last 50 entries
    if (this.domNodeCountHistory.length > 50) {
      this.domNodeCountHistory.shift();
    }
    
    // Check if DOM node count has grown significantly
    if (this.baselineDomCount !== null) {
      const growth = currentDomCount - this.baselineDomCount;
      if (growth > this.config.domGrowthThreshold!) {
        console.warn(
          `[Memory] Possible DOM leak detected: DOM node count increased by ${growth} ` +
          `since baseline (${this.baselineDomCount} → ${currentDomCount})`
        );
        
        // Analyze DOM growth
        this.analyzeDomGrowth();
      }
    }
    
    // Check component instance counts
    this.checkComponentLeaks();
  }
  
  /**
   * Check for continuous growth pattern in memory usage
   */
  private checkGrowthPattern(): void {
    if (this.memoryUsageHistory.length < 5) {
      return; // Not enough data points
    }
    
    // Check if memory usage has been consistently increasing
    let isGrowing = true;
    for (let i = 1; i < this.memoryUsageHistory.length; i++) {
      if (this.memoryUsageHistory[i].usage <= this.memoryUsageHistory[i-1].usage) {
        isGrowing = false;
        break;
      }
    }
    
    if (isGrowing) {
      console.error(
        '[Memory] Confirmed memory leak: Memory usage is continuously growing. ' +
        'Check for unmounted components with active subscriptions or timers.'
      );
    }
  }
  
  /**
   * Analyze DOM growth to identify problematic nodes
   */
  private analyzeDomGrowth(): void {
    // Count element types to identify suspicious growth
    const elementCounts = new Map<string, number>();
    
    document.querySelectorAll('*').forEach(element => {
      const tagName = element.tagName.toLowerCase();
      const count = elementCounts.get(tagName) || 0;
      elementCounts.set(tagName, count + 1);
    });
    
    // Log elements with unusually high counts
    elementCounts.forEach((count, tagName) => {
      if (count > 100) { // Threshold for suspicion
        console.warn(`[Memory] Potential DOM leak: Found ${count} <${tagName}> elements`);
        
        // For divs and spans, check for patterns in class names
        if (['div', 'span'].includes(tagName) && count > 200) {
          this.analyzeElementsByClass(tagName);
        }
      }
    });
    
    // Check for detached DOM nodes that might be leaking
    this.checkDetachedNodes();
  }
  
  /**
   * Track component mount
   */
  public trackMount(componentName: string): void {
    if (!this.isInitialized) {
      return;
    }
    
    // Skip ignored components
    if (this.config.ignoreComponents?.includes(componentName)) {
      return;
    }
    
    // Get or create tracking info
    let info = this.componentTrackingMap.get(componentName);
    if (!info) {
      info = {
        name: componentName,
        count: 0,
        maxCount: 0,
        mountCount: 0,
        unmountCount: 0,
        recentMounts: [],
        recentUnmounts: [],
      };
      this.componentTrackingMap.set(componentName, info);
    }
    
    // Update tracking info
    info.count++;
    info.mountCount++;
    info.maxCount = Math.max(info.maxCount, info.count);
    info.recentMounts.push(Date.now());
    
    // Trim recent mounts array
    if (info.recentMounts.length > 10) {
      info.recentMounts.shift();
    }
    
    if (this.config.verbose) {
      console.log(`[Memory] Component mounted: ${componentName} (count: ${info.count})`);
    }
  }
  
  /**
   * Track component unmount
   */
  public trackUnmount(componentName: string): void {
    if (!this.isInitialized) {
      return;
    }
    
    // Skip ignored components
    if (this.config.ignoreComponents?.includes(componentName)) {
      return;
    }
    
    // Get tracking info
    const info = this.componentTrackingMap.get(componentName);
    if (!info) {
      console.warn(`[Memory] Unmounted component ${componentName} was never tracked for mounting`);
      return;
    }
    
    // Update tracking info
    info.count--;
    info.unmountCount++;
    info.recentUnmounts.push(Date.now());
    
    // Trim recent unmounts array
    if (info.recentUnmounts.length > 10) {
      info.recentUnmounts.shift();
    }
    
    if (this.config.verbose) {
      console.log(`[Memory] Component unmounted: ${componentName} (count: ${info.count})`);
    }
  }
  
  /**
   * Check for component instance leaks (components that mount but don't unmount)
   */
  private checkComponentLeaks(): void {
    this.componentTrackingMap.forEach((info, componentName) => {
      // Check for components with accumulating instances
      if (info.count > this.config.instanceCountThreshold!) {
        console.warn(
          `[Memory] Possible component leak: ${componentName} has ${info.count} instances ` +
          `(mounted ${info.mountCount} times, unmounted ${info.unmountCount} times)`
        );
      }
      
      // Check for components with high instance turnover
      const mountRate = info.recentMounts.length / (this.config.logInterval! / 1000);
      if (mountRate > 5 && info.recentMounts.length > 5) {
        console.warn(
          `[Memory] High component turnover: ${componentName} is mounting at a rate of ` +
          `approximately ${mountRate.toFixed(2)} instances per second`
        );
      }
    });
  }
  
  /**
   * Track event listener registration
   */
  public trackEventListener(
    element: Element,
    eventType: string,
    handler: Function
  ): void {
    if (!this.isInitialized) {
      return;
    }
    
    // Get or create element listeners map
    let elementListeners = this.eventListenerMap.get(element);
    if (!elementListeners) {
      elementListeners = new Map<string, Set<Function>>();
      this.eventListenerMap.set(element, elementListeners);
    }
    
    // Get or create event type set
    let handlerSet = elementListeners.get(eventType);
    if (!handlerSet) {
      handlerSet = new Set<Function>();
      elementListeners.set(eventType, handlerSet);
    }
    
    // Add handler to set
    handlerSet.add(handler);
    
    if (this.config.verbose) {
      console.log(
        `[Memory] Event listener registered: ${eventType} on ${element.tagName} ` +
        `(total for this element: ${handlerSet.size})`
      );
    }
  }
  
  /**
   * Track event listener removal
   */
  public trackEventListenerRemoval(
    element: Element,
    eventType: string,
    handler: Function
  ): void {
    if (!this.isInitialized) {
      return;
    }
    
    // Get element listeners map
    const elementListeners = this.eventListenerMap.get(element);
    if (!elementListeners) {
      return;
    }
    
    // Get event type set
    const handlerSet = elementListeners.get(eventType);
    if (!handlerSet) {
      return;
    }
    
    // Remove handler from set
    handlerSet.delete(handler);
    
    // Clean up empty sets
    if (handlerSet.size === 0) {
      elementListeners.delete(eventType);
    }
    
    // Clean up empty maps
    if (elementListeners.size === 0) {
      this.eventListenerMap.delete(element);
    }
    
    if (this.config.verbose) {
      console.log(
        `[Memory] Event listener removed: ${eventType} from ${element.tagName}`
      );
    }
  }
  
  /**
   * Track node removal from DOM
   */
  public trackNodeRemoval(node: Node): void {
    if (!this.isInitialized) {
      return;
    }
    
    // Check if the node has active event listeners
    if (node instanceof Element && this.eventListenerMap.has(node)) {
      // Track that this node was removed but still has listeners
      this.detachedDomNodes.add(node);
      
      if (this.config.verbose) {
        console.log(
          `[Memory] Potential leak: Node removed from DOM but still has event listeners: ` +
          `${node.tagName}${node.id ? '#' + node.id : ''}`
        );
      }
    }
  }
  
  /**
   * Check for detached DOM nodes with active event listeners
   */
  private checkDetachedNodes(): void {
    // Not much we can do with the WeakSet, since we can't iterate over it.
    // For debugging purposes, we add attributes to elements in the trackNodeRemoval method.
  }
  
  /**
   * Analyze elements by class to identify patterns in DOM leaks
   */
  private analyzeElementsByClass(tagName: string): void {
    const classCounts = new Map<string, number>();
    
    document.querySelectorAll(tagName).forEach(element => {
      if (element.className) {
        const classNames = element.className.split(' ');
        classNames.forEach(className => {
          if (className.trim()) {
            const count = classCounts.get(className) || 0;
            classCounts.set(className, count + 1);
          }
        });
      }
    });
    
    // Find classes with suspiciously high counts
    classCounts.forEach((count, className) => {
      if (count > 50) {
        console.warn(
          `[Memory] Potential DOM leak pattern: Found ${count} elements with class "${className}"`
        );
      }
    });
  }
  
  /**
   * Get memory usage report
   */
  public getReport(): string {
    if (!this.isInitialized) {
      return 'Memory leak detection not initialized';
    }
    
    let report = 'Memory Usage Report:\n';
    
    // Memory usage
    if ('performance' in window && 'memory' in (performance as any)) {
      const currentMemory = (performance as any).memory.usedJSHeapSize / (1024 * 1024);
      report += `\nCurrent Memory: ${currentMemory.toFixed(2)} MB\n`;
      
      if (this.baselineMemory !== null) {
        const growthMB = currentMemory - this.baselineMemory;
        report += `Memory Growth: ${growthMB > 0 ? '+' : ''}${growthMB.toFixed(2)} MB since baseline\n`;
      }
    }
    
    // DOM count
    const currentDomCount = document.querySelectorAll('*').length;
    report += `\nCurrent DOM Nodes: ${currentDomCount}\n`;
    
    if (this.baselineDomCount !== null) {
      const growth = currentDomCount - this.baselineDomCount;
      report += `DOM Growth: ${growth > 0 ? '+' : ''}${growth} nodes since baseline\n`;
    }
    
    // Component instances
    report += '\nComponent Instances:\n';
    this.componentTrackingMap.forEach((info) => {
      if (info.count > 0) {
        report += `- ${info.name}: ${info.count} instances (max: ${info.maxCount}, mounted: ${info.mountCount}, unmounted: ${info.unmountCount})\n`;
      }
    });
    
    // Event listeners on detached elements
    report += '\nEvent Listeners:\n';
    let listenersCount = 0;
    this.eventListenerMap.forEach((elementListeners) => {
      elementListeners.forEach((handlerSet) => {
        listenersCount += handlerSet.size;
      });
    });
    report += `- Total tracked listeners: ${listenersCount}\n`;
    
    return report;
  }
  
  /**
   * Clean up resources
   */
  public cleanup(): void {
    if (this.loggingIntervalId) {
      clearInterval(this.loggingIntervalId);
      this.loggingIntervalId = null;
    }
    
    this.componentTrackingMap.clear();
    this.eventListenerMap.clear();
    this.memoryUsageHistory.length = 0;
    this.domNodeCountHistory.length = 0;
    
    this.isInitialized = false;
    console.log('[Memory] Memory leak detection cleaned up');
  }
}

// Singleton instance
const memoryTracker = MemoryTracker.getInstance();

/**
 * Initialize memory leak detection
 */
export function initializeMemoryDetection(config: MemoryDetectorConfig = {}): void {
  memoryTracker.initialize(config);
}

/**
 * React hook for tracking component lifecycle for memory leak detection
 * 
 * @param componentName Name of the component to track
 */
export function useMemoryTracker(componentName: string): void {
  React.useEffect(() => {
    memoryTracker.trackMount(componentName);
    
    return () => {
      memoryTracker.trackUnmount(componentName);
    };
  }, [componentName]);
}

/**
 * Wrapped addEventListener that tracks event listeners for memory leak detection
 */
export function trackableAddEventListener<K extends keyof HTMLElementEventMap>(
  element: Element,
  type: K,
  listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
  options?: boolean | AddEventListenerOptions
): void {
  element.addEventListener(type, listener, options);
  memoryTracker.trackEventListener(element, type, listener);
}

/**
 * Wrapped removeEventListener that tracks event listener removal
 */
export function trackableRemoveEventListener<K extends keyof HTMLElementEventMap>(
  element: Element,
  type: K,
  listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
  options?: boolean | EventListenerOptions
): void {
  element.removeEventListener(type, listener, options);
  memoryTracker.trackEventListenerRemoval(element, type, listener);
}

/**
 * Get memory usage report
 */
export function getMemoryReport(): string {
  return memoryTracker.getReport();
}

/**
 * Cleanup memory tracking
 */
export function cleanupMemoryTracking(): void {
  memoryTracker.cleanup();
}

/**
 * MutationObserver to track DOM node removal
 */
export function initializeNodeRemovalTracking(): void {
  // Only run in browser environment
  if (typeof window === 'undefined' || typeof MutationObserver === 'undefined') {
    return;
  }
  
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        mutation.removedNodes.forEach(node => {
          memoryTracker.trackNodeRemoval(node);
        });
      }
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

/**
 * Auto-track all event listeners by monkey patching the EventTarget prototype
 */
export function initializeAutoEventListenerTracking(): void {
  // Only run in browser environment
  if (typeof window === 'undefined') {
    return;
  }
  
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  const originalRemoveEventListener = EventTarget.prototype.removeEventListener;
  
  EventTarget.prototype.addEventListener = function(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions
  ): void {
    originalAddEventListener.call(this, type, listener, options);
    
    // Only track Element nodes to avoid tracking too many things
    if (this instanceof Element && typeof listener === 'function') {
      memoryTracker.trackEventListener(this, type, listener);
    }
  };
  
  EventTarget.prototype.removeEventListener = function(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | EventListenerOptions
  ): void {
    originalRemoveEventListener.call(this, type, listener, options);
    
    // Only track Element nodes to avoid tracking too many things
    if (this instanceof Element && typeof listener === 'function') {
      memoryTracker.trackEventListenerRemoval(this, type, listener);
    }
  };
}

/**
 * React higher-order component for tracking component lifecycle
 */
export function withMemoryTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
): React.ComponentType<P> {
  const displayName = componentName || Component.displayName || Component.name || 'Component';
  
  const WrappedComponent: React.FC<P> = (props) => {
    useMemoryTracker(displayName);
    return React.createElement(Component, props);
  };
  
  WrappedComponent.displayName = `WithMemoryTracking(${displayName})`;
  
  return WrappedComponent;
}