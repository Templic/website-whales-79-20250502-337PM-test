/**
 * ResourceHintsManager Component
 * 
 * Manages resource hints for optimizing loading performance:
 * - preload: High-priority fetch for critical resources needed for current navigation
 * - prefetch: Low-priority fetch for resources likely needed for future navigations
 * - preconnect: Set up early connections to origins
 * - dns-prefetch: Early DNS resolution
 * 
 * This component adds appropriate <link> tags to the document head
 * based on the provided configuration and current application state.
 */

import React, { useEffect, useRef } from 'react';

type ResourceType = 'image' | 'style' | 'script' | 'font' | 'document' | 'fetch';

export type ResourceHintType = 'preload' | 'prefetch' | 'preconnect' | 'dns-prefetch';

interface ResourceHint {
  /** Type of resource hint */
  type: ResourceHintType;
  
  /** URL of the resource */
  href: string;
  
  /** Type of resource (for preload) */
  as?: ResourceType;
  
  /** Whether crossorigin attribute should be set */
  crossOrigin?: boolean;
  
  /** Media query for when this resource should be loaded */
  media?: string;
  
  /** MIME type of the resource */
  mimeType?: string;
  
  /** When the resource hint should be added */
  when?: 'immediate' | 'visible' | 'idle';
  
  /** Display name for debugging */
  name?: string;
  
  /** Priority for this hint (higher gets added first) */
  priority?: number;
}

export interface ResourceHintsManagerProps {
  /** Array of resource hints to manage */
  hints: ResourceHint[];
  
  /** Whether to automatically clean up hints on unmount */
  cleanupOnUnmount?: boolean;
  
  /** Maximum number of hints to add (for performance) */
  maxHints?: number;
  
  /** Whether to prioritize hints by type */
  prioritizeByType?: boolean;
  
  /** Debug mode */
  debug?: boolean;
  
  /** Whether to show performance impact estimates */
  showPerformanceImpact?: boolean;
}

/**
 * Adds resource hints like preload, prefetch, preconnect to optimize resource loading
 */
export const ResourceHintsManager: React.FC<ResourceHintsManagerProps> = ({
  hints,
  cleanupOnUnmount = true,
  maxHints = 30,
  prioritizeByType = true,
  debug = false,
  showPerformanceImpact = false,
}) => {
  // Store created elements for cleanup
  const createdElements = useRef<HTMLLinkElement[]>([]);
  
  // Process and add resource hints
  useEffect(() => {
    // Don't run on server
    if (typeof document === 'undefined') return;
    
    if (debug) {
      console.log(`[ResourceHints] Processing ${hints.length} hints`);
    }
    
    // Track hints for cleanup
    const elements: HTMLLinkElement[] = [];
    
    // Prioritize hints
    let prioritizedHints = [...hints];
    
    // Sort by explicit priority first
    prioritizedHints.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    
    // Then by type if enabled
    if (prioritizeByType) {
      // Type priority: preload > preconnect > dns-prefetch > prefetch
      const typePriority: Record<ResourceHintType, number> = {
        'preload': 4,
        'preconnect': 3,
        'dns-prefetch': 2,
        'prefetch': 1,
      };
      
      prioritizedHints.sort((a, b) => {
        // Only use type priority as a secondary sort
        if (b.priority === a.priority) {
          return typePriority[b.type] - typePriority[a.type];
        }
        return 0;
      });
    }
    
    // Limit number of hints for performance
    prioritizedHints = prioritizedHints.slice(0, maxHints);
    
    // Process each hint
    prioritizedHints.forEach(hint => {
      // Skip hints that should not be added immediately
      if (hint.when === 'visible' || hint.when === 'idle') {
        return;
      }
      
      // Create link element
      const linkEl = document.createElement('link');
      linkEl.rel = hint.type;
      linkEl.href = hint.href;
      
      // Add additional attributes when needed
      if (hint.as && hint.type === 'preload') {
        linkEl.setAttribute('as', hint.as);
      }
      
      if (hint.crossOrigin) {
        linkEl.crossOrigin = 'anonymous';
      }
      
      if (hint.media) {
        linkEl.media = hint.media;
      }
      
      if (hint.mimeType) {
        linkEl.type = hint.mimeType;
      }
      
      // Add custom attribute for tracking
      if (hint.name) {
        linkEl.dataset.hintName = hint.name;
      }
      
      // Add the link element to the head
      document.head.appendChild(linkEl);
      
      // Save reference for cleanup
      elements.push(linkEl);
      
      if (debug) {
        console.log(`[ResourceHints] Added ${hint.type} for ${hint.href}${hint.name ? ` (${hint.name})` : ''}`);
      }
    });
    
    // Store created elements for cleanup
    createdElements.current = elements;
    
    // Add hints when visible or during idle time
    const handleIdleAndVisibleHints = () => {
      const idleHints = prioritizedHints.filter(hint => hint.when === 'idle');
      const visibleHints = prioritizedHints.filter(hint => hint.when === 'visible');
      
      // Process visible hints
      if (visibleHints.length > 0) {
        // Use IntersectionObserver for visible hints
        const observer = new IntersectionObserver(entries => {
          if (entries[0].isIntersecting) {
            visibleHints.forEach(hint => {
              const linkEl = document.createElement('link');
              linkEl.rel = hint.type;
              linkEl.href = hint.href;
              
              if (hint.as && hint.type === 'preload') {
                linkEl.setAttribute('as', hint.as);
              }
              
              if (hint.crossOrigin) {
                linkEl.crossOrigin = 'anonymous';
              }
              
              document.head.appendChild(linkEl);
              elements.push(linkEl);
              
              if (debug) {
                console.log(`[ResourceHints] Added visible ${hint.type} for ${hint.href}`);
              }
            });
            
            // Stop observing after adding
            observer.disconnect();
          }
        });
        
        // Observe the document body
        observer.observe(document.body);
      }
      
      // Process idle hints
      if (idleHints.length > 0 && 'requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => {
          idleHints.forEach(hint => {
            const linkEl = document.createElement('link');
            linkEl.rel = hint.type;
            linkEl.href = hint.href;
            
            if (hint.as && hint.type === 'preload') {
              linkEl.setAttribute('as', hint.as);
            }
            
            if (hint.crossOrigin) {
              linkEl.crossOrigin = 'anonymous';
            }
            
            document.head.appendChild(linkEl);
            elements.push(linkEl);
            
            if (debug) {
              console.log(`[ResourceHints] Added idle ${hint.type} for ${hint.href}`);
            }
          });
        });
      }
    };
    
    // Handle idle and visible hints
    handleIdleAndVisibleHints();
    
    // Show performance impact estimates if needed
    if (showPerformanceImpact && typeof performance !== 'undefined') {
      const preconnectCount = prioritizedHints.filter(h => h.type === 'preconnect').length;
      const preloadCount = prioritizedHints.filter(h => h.type === 'preload').length;
      const prefetchCount = prioritizedHints.filter(h => h.type === 'prefetch').length;
      
      console.log('[ResourceHints] Estimated performance impact:');
      console.log(`- Preconnects (${preconnectCount}): ~${preconnectCount * 100}ms connection time saved`);
      console.log(`- Preloads (${preloadCount}): Critical render path optimized`);
      console.log(`- Prefetches (${prefetchCount}): Future navigations optimized`);
    }
    
    // Cleanup function
    return () => {
      if (cleanupOnUnmount) {
        elements.forEach(el => {
          if (el.parentNode) {
            el.parentNode.removeChild(el);
          }
        });
        
        if (debug) {
          console.log(`[ResourceHints] Cleaned up ${elements.length} hints`);
        }
      }
    };
  }, [hints, cleanupOnUnmount, maxHints, prioritizeByType, debug, showPerformanceImpact]);
  
  // Empty render, this is a utility component
  return null;
};

/**
 * Hook for dynamically adding resource hints
 */
export const useResourceHints = (initialHints: ResourceHint[] = []) => {
  const [hints, setHints] = React.useState<ResourceHint[]>(initialHints);
  
  const addHint = React.useCallback((hint: ResourceHint) => {
    setHints(prev => [...prev, hint]);
  }, []);
  
  const removeHint = React.useCallback((hrefToRemove: string) => {
    setHints(prev => prev.filter(hint => hint.href !== hrefToRemove));
  }, []);
  
  const clearHints = React.useCallback(() => {
    setHints([]);
  }, []);
  
  return {
    hints,
    addHint,
    removeHint,
    clearHints,
  };
};

export default ResourceHintsManager;