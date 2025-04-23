/**
 * Event Delegation Utility
 * 
 * A performance optimization that reduces the number of event listeners
 * by attaching handlers to container elements instead of individual elements.
 * 
 * Benefits:
 * - Reduces memory usage by minimizing the number of event handlers
 * - Improves initialization time for pages with many interactive elements
 * - Automatically handles dynamically added elements
 * - Simplifies cleanup when removing elements from the DOM
 */

type EventHandler = (event: Event) => void;

interface DelegatedEvent extends Event {
  delegateTarget?: Element;
}

interface DelegationOptions {
  /**
   * CSS selector to filter child elements that should trigger the event
   */
  selector: string;
  
  /**
   * The event type to listen for (e.g., 'click', 'mouseenter')
   */
  eventType: string;
  
  /**
   * The handler function to call when the event is triggered
   */
  handler: EventHandler;
  
  /**
   * Whether to use event capturing instead of bubbling
   * @default false
   */
  useCapture?: boolean;
  
  /**
   * Whether to prevent the default action when event occurs
   * @default false
   */
  preventDefault?: boolean;
  
  /**
   * Whether to stop event propagation
   * @default false
   */
  stopPropagation?: boolean;
  
  /**
   * Enable debug logging
   * @default false
   */
  debug?: boolean;
}

interface DelegationManager {
  /**
   * Add a delegated event handler
   */
  add: (elementOrSelector: Element | string, options: DelegationOptions) => () => void;
  
  /**
   * Remove all event delegations
   */
  removeAll: () => void;
  
  /**
   * Get the count of active delegations
   */
  getActiveCount: () => number;
}

/**
 * Create an event delegation manager
 * @returns DelegationManager object with methods to add and remove delegated events
 */
export function createEventDelegation(): DelegationManager {
  // Track all active delegations for cleanup
  const activeDelegations: Array<{
    element: Element;
    eventType: string;
    handler: EventHandler;
    useCapture: boolean;
  }> = [];
  
  /**
   * Find matching element based on event target and selector
   */
  const findMatchingElement = (target: Element, selector: string): Element | null => {
    // Check if the target itself matches
    if (target.matches(selector)) {
      return target;
    }
    
    // Check if any parent matches up to the delegated element
    let current = target;
    while (current && current !== document.body) {
      if (current.matches(selector)) {
        return current;
      }
      const parent = current.parentElement;
      if (!parent) break;
      current = parent;
    }
    
    return null;
  };
  
  /**
   * Handle a delegated event
   */
  const handleDelegatedEvent = (
    event: DelegatedEvent,
    selector: string,
    handler: EventHandler,
    options: Partial<DelegationOptions>
  ) => {
    const target = event.target as Element;
    if (!target) return;
    
    const matchingElement = findMatchingElement(target, selector);
    if (matchingElement) {
      // Set the delegateTarget property for reference in the handler
      event.delegateTarget = matchingElement;
      
      // Apply additional options
      if (options.preventDefault) {
        event.preventDefault();
      }
      
      if (options.stopPropagation) {
        event.stopPropagation();
      }
      
      // Call the handler
      handler.call(matchingElement, event);
      
      if (options.debug) {
        console.log(`[EventDelegation] Event '${event.type}' handled for selector '${selector}'`, {
          event,
          delegateTarget: matchingElement
        });
      }
    }
  };
  
  /**
   * Add a delegated event handler
   */
  const add = (
    elementOrSelector: Element | string,
    options: DelegationOptions
  ): (() => void) => {
    const {
      selector,
      eventType,
      handler,
      useCapture = false,
      preventDefault = false,
      stopPropagation = false,
      debug = false
    } = options;
    
    // Find the delegation container element
    const element = typeof elementOrSelector === 'string'
      ? document.querySelector(elementOrSelector)
      : elementOrSelector;
    
    if (!element) {
      console.warn(`[EventDelegation] Cannot find element for selector: ${elementOrSelector}`);
      // Return no-op cleanup function
      return () => {};
    }
    
    // Create the delegated handler
    const delegatedHandler = (event: Event) => {
      handleDelegatedEvent(event as DelegatedEvent, selector, handler, {
        preventDefault,
        stopPropagation,
        debug
      });
    };
    
    // Attach the event listener
    element.addEventListener(eventType, delegatedHandler, useCapture);
    
    if (debug) {
      console.log(`[EventDelegation] Added ${eventType} delegation on `, element, `for selector '${selector}'`);
    }
    
    // Track this delegation
    activeDelegations.push({
      element,
      eventType,
      handler: delegatedHandler,
      useCapture
    });
    
    // Return a cleanup function
    return () => {
      element.removeEventListener(eventType, delegatedHandler, useCapture);
      
      // Remove from active delegations
      const index = activeDelegations.findIndex(d => 
        d.element === element && 
        d.eventType === eventType && 
        d.handler === delegatedHandler
      );
      
      if (index !== -1) {
        activeDelegations.splice(index, 1);
      }
      
      if (debug) {
        console.log(`[EventDelegation] Removed ${eventType} delegation from `, element, `for selector '${selector}'`);
      }
    };
  };
  
  /**
   * Remove all event delegations
   */
  const removeAll = () => {
    activeDelegations.forEach(({ element, eventType, handler, useCapture }) => {
      element.removeEventListener(eventType, handler, useCapture);
    });
    
    activeDelegations.length = 0;
  };
  
  /**
   * Get the count of active delegations
   */
  const getActiveCount = () => {
    return activeDelegations.length;
  };
  
  return {
    add,
    removeAll,
    getActiveCount
  };
}

/**
 * React hook for using event delegation
 */
export const useEventDelegation = () => {
  const delegationManager = React.useMemo(() => createEventDelegation(), []);
  
  React.useEffect(() => {
    return () => {
      delegationManager.removeAll();
    };
  }, [delegationManager]);
  
  return delegationManager;
};

// Create global delegation manager for app-wide usage
export const globalDelegation = createEventDelegation();

export default globalDelegation;