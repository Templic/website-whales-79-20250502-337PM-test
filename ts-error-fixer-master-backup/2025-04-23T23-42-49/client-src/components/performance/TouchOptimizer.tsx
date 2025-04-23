/**
 * TouchOptimizer Component
 * 
 * Optimizes touch interactions on mobile devices by:
 * - Eliminating the 300ms tap delay on mobile browsers
 * - Providing smooth touch feedback and effects
 * - Implementing fast-click for improving responsiveness
 * - Optimizing touch event handling to reduce jank
 * - Supporting advanced gestures (swipe, pinch, pan) with optimized performance
 * 
 * This component should wrap interactive sections of your application
 * that require responsive touch interactions, particularly on mobile.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';

// Supported gestures for touch optimization
export type OptimizedGesture = 
  | 'tap'
  | 'double-tap'
  | 'swipe'
  | 'pinch'
  | 'pan'
  | 'rotate'
  | 'long-press';

// Touch feedback types
export type TouchFeedback = 
  | 'ripple'
  | 'highlight'
  | 'scale'
  | 'none';

export interface TouchOptimizerProps {
  /** Content to render within the touch-optimized container */
  children: React.ReactNode;
  
  /** Which gestures to optimize */
  gestures?: OptimizedGesture[];
  
  /** Visual feedback to show on touch */
  feedback?: TouchFeedback;
  
  /** CSS class for the container */
  className?: string;
  
  /** CSS style for the container */
  style?: React.CSSProperties;
  
  /** 
   * The delay in ms before triggering long press
   * @default 500
   */
  longPressDelay?: number;
  
  /**
   * The distance in pixels that a touch can move before
   * canceling a tap event
   * @default 10
   */
  tapMoveThreshold?: number;
  
  /**
   * The time in ms between taps for double-tap detection
   * @default 300
   */
  doubleTapDelay?: number;
  
  /**
   * The minimum distance in pixels required for a swipe
   * @default 50
   */
  swipeThreshold?: number;
  
  /**
   * Enable debug mode with visual indicators
   * @default false
   */
  debug?: boolean;
  
  /**
   * Whether to use passive event listeners for better scroll performance
   * @default true
   */
  passive?: boolean;
  
  /** Called when a gesture starts */
  onGestureStart?: (gesture: OptimizedGesture, event: TouchEvent) => void;
  
  /** Called when a gesture ends */
  onGestureEnd?: (gesture: OptimizedGesture, event: TouchEvent) => void;
  
  /** 
   * Handler for any detected gesture
   */
  onGesture?: (
    gesture: OptimizedGesture, 
    details: {
      originalEvent: TouchEvent;
      x: number;
      y: number;
      direction?: 'up' | 'down' | 'left' | 'right';
      distance?: number;
      duration?: number;
    }
  ) => void;
}

/**
 * TouchOptimizer Component
 * 
 * Provides optimized touch interactions for mobile devices
 */
export const TouchOptimizer: React.FC<TouchOptimizerProps> = ({
  children,
  gestures = ['tap', 'swipe'],
  feedback = 'highlight',
  className = '',
  style = {},
  longPressDelay = 500,
  tapMoveThreshold = 10,
  doubleTapDelay = 300,
  swipeThreshold = 50,
  debug = false,
  passive = true,
  onGestureStart,
  onGestureEnd,
  onGesture,
}) => {
  // Container ref for touch handling
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State for tracking touches
  const touchStateRef = useRef({
    startX: 0,
    startY: 0,
    startTime: 0,
    isLongPressing: false,
    lastTapTime: 0,
    longPressTimer: null as NodeJS.Timeout | null,
    currentGesture: null as OptimizedGesture | null,
  });
  
  // For visual feedback
  const [isTouching, setIsTouching] = useState(false);
  const [touchPosition, setTouchPosition] = useState({ x: 0, y: 0 });
  const [showRipple, setShowRipple] = useState(false);
  
  // Use intersection observer to avoid optimizing offscreen elements
  const { ref: inViewRef, inView } = useInView({
    threshold: 0,
  });
  
  // Combine refs
  const setRefs = (node: HTMLDivElement | null) => {
    containerRef.current = node;
    inViewRef(node);
  };
  
  // Install touch optimizations
  useEffect(() => {
    // Skip if not in view
    if (!inView) return;
    
    const container = containerRef.current;
    if (!container) return;
    
    if (debug) {
      console.log('[TouchOptimizer] Installing touch optimizations', gestures);
    }
    
    // Eliminate 300ms tap delay with touch-action CSS
    container.style.touchAction = 'manipulation';
    
    // Enable hardware acceleration for smoother animations
    container.style.transform = 'translateZ(0)';
    container.style.backfaceVisibility = 'hidden';
    
    // Initialize touch state
    const state = touchStateRef.current;
    
    // Handler for touch start
    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      
      const touch = event.touches[0];
      state.startX = touch.clientX;
      state.startY = touch.clientY;
      state.startTime = Date.now();
      
      // Update UI feedback
      setIsTouching(true);
      setTouchPosition({ x: touch.clientX, y: touch.clientY });
      
      // Show ripple effect if enabled
      if (feedback === 'ripple') {
        setShowRipple(true);
        
        // Hide ripple after animation
        setTimeout(() => {
          setShowRipple(false);
        }, 400);
      }
      
      // Start long press timer if needed
      if (gestures.includes('long-press')) {
        state.longPressTimer = setTimeout(() => {
          state.isLongPressing = true;
          state.currentGesture = 'long-press';
          
          // Fire gesture callbacks
          onGestureStart?.('long-press', event);
          onGesture?.('long-press', {
            originalEvent: event,
            x: touch.clientX,
            y: touch.clientY,
            duration: longPressDelay,
          });
          
          if (debug) {
            console.log('[TouchOptimizer] Long press detected');
          }
        }, longPressDelay);
      }
      
      // Note: always set current gesture to null at start
      state.currentGesture = null;
    };
    
    // Handler for touch move
    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      
      const touch = event.touches[0];
      const deltaX = touch.clientX - state.startX;
      const deltaY = touch.clientY - state.startY;
      const distanceMoved = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      // Update position for feedback
      setTouchPosition({ x: touch.clientX, y: touch.clientY });
      
      // If moved beyond threshold, cancel tap and long press
      if (distanceMoved > tapMoveThreshold) {
        if (state.longPressTimer) {
          clearTimeout(state.longPressTimer);
          state.longPressTimer = null;
        }
        
        // Check if we've moved enough to be a swipe
        if (gestures.includes('swipe') && distanceMoved > swipeThreshold / 2) {
          // Only set currentGesture if we haven't set it yet
          if (!state.currentGesture) {
            state.currentGesture = 'swipe';
            onGestureStart?.('swipe', event);
          }
        }
        
        // Check if we've moved enough to be a pan
        if (gestures.includes('pan') && !state.currentGesture) {
          state.currentGesture = 'pan';
          onGestureStart?.('pan', event);
        }
      }
      
      // If we're in a pan or swipe gesture, notify
      if (state.currentGesture === 'pan' || state.currentGesture === 'swipe') {
        // Determine direction
        let direction: 'up' | 'down' | 'left' | 'right';
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          direction = deltaX > 0 ? 'right' : 'left';
        } else {
          direction = deltaY > 0 ? 'down' : 'up';
        }
        
        // Fire active gesture
        onGesture?.(state.currentGesture, {
          originalEvent: event,
          x: touch.clientX,
          y: touch.clientY,
          direction,
          distance: distanceMoved,
        });
      }
    };
    
    // Handler for touch end
    const handleTouchEnd = (event: TouchEvent) => {
      // Get final data
      const endTime = Date.now();
      const touchDuration = endTime - state.startTime;
      
      // Reset visual feedback
      setIsTouching(false);
      
      // Clear any pending long press
      if (state.longPressTimer) {
        clearTimeout(state.longPressTimer);
        state.longPressTimer = null;
      }
      
      // If we already identified a gesture (swipe, pan, long-press), complete it
      if (state.currentGesture) {
        onGestureEnd?.(state.currentGesture, event);
        state.currentGesture = null;
        state.isLongPressing = false;
        return;
      }
      
      // If we haven't moved much, it's a tap
      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - state.startX;
      const deltaY = touch.clientY - state.startY;
      const distanceMoved = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      if (distanceMoved <= tapMoveThreshold) {
        // Check for double tap
        const now = Date.now();
        const timeSinceLastTap = now - state.lastTapTime;
        
        if (gestures.includes('double-tap') && timeSinceLastTap < doubleTapDelay) {
          // It's a double tap
          state.lastTapTime = 0; // Reset to prevent triple-tap
          
          onGestureStart?.('double-tap', event);
          onGesture?.('double-tap', {
            originalEvent: event,
            x: touch.clientX,
            y: touch.clientY,
            duration: touchDuration,
          });
          onGestureEnd?.('double-tap', event);
          
          if (debug) {
            console.log('[TouchOptimizer] Double tap detected');
          }
        } else {
          // It's a single tap
          state.lastTapTime = now;
          
          if (gestures.includes('tap')) {
            onGestureStart?.('tap', event);
            onGesture?.('tap', {
              originalEvent: event,
              x: touch.clientX,
              y: touch.clientY,
              duration: touchDuration,
            });
            onGestureEnd?.('tap', event);
            
            if (debug) {
              console.log('[TouchOptimizer] Tap detected');
            }
          }
        }
      }
      
      // Reset long press state
      state.isLongPressing = false;
    };
    
    // Use passive listeners for better performance when supported
    const listenerOptions = {
      passive: passive ? true : false,
      capture: false,
    };
    
    // Add event listeners
    container.addEventListener('touchstart', handleTouchStart as EventListener, listenerOptions);
    container.addEventListener('touchmove', handleTouchMove as EventListener, listenerOptions);
    container.addEventListener('touchend', handleTouchEnd as EventListener, listenerOptions);
    
    // Cleanup
    return () => {
      container.removeEventListener('touchstart', handleTouchStart as EventListener);
      container.removeEventListener('touchmove', handleTouchMove as EventListener);
      container.removeEventListener('touchend', handleTouchEnd as EventListener);
      
      if (state.longPressTimer) {
        clearTimeout(state.longPressTimer);
        state.longPressTimer = null;
      }
    };
  }, [
    inView, 
    gestures, 
    feedback,
    longPressDelay,
    tapMoveThreshold,
    doubleTapDelay,
    swipeThreshold,
    debug,
    passive,
    onGestureStart,
    onGestureEnd,
    onGesture
  ]);
  
  // Generate class names
  const combinedClassName = [
    className,
    'touch-optimizer',
    isTouching ? 'touching' : '',
    feedback === 'highlight' && isTouching ? 'touch-highlight' : '',
    feedback === 'scale' && isTouching ? 'touch-scale' : '',
  ].filter(Boolean).join(' ');
  
  // Generate combined styles
  const combinedStyles: React.CSSProperties = {
    ...style,
    position: 'relative',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    userSelect: 'none',
    cursor: 'pointer',
    ...(feedback === 'scale' && isTouching ? { transform: 'scale(0.98)' } : {}),
    ...(feedback === 'highlight' && isTouching ? { backgroundColor: 'rgba(0,0,0,0.05)' } : {}),
  };
  
  return (
    <div 
      ref={setRefs} 
      className={combinedClassName} 
      style={combinedStyles}
      data-touch-optimized="true"
    >
      {children}
      
      {/* Ripple effect */}
      {feedback === 'ripple' && showRipple && (
        <div 
          className="touch-ripple"
          style={{ 
            position: 'absolute',
            width: 140,
            height: 140,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.15)',
            transform: 'translate(-50%, -50%) scale(0)',
            animation: 'touch-ripple 400ms ease-out',
            top: touchPosition.y - (containerRef.current?.getBoundingClientRect().top || 0),
            left: touchPosition.x - (containerRef.current?.getBoundingClientRect().left || 0),
            pointerEvents: 'none',
           }}
        />
      )}
      
      {/* Debug UI */}
      {debug && (
        <div 
          className="touch-debug" 
          style={{ 
            position: 'absolute',
            top: 0,
            right: 0,
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '4px',
            fontSize: 10,
            pointerEvents: 'none',
           }}
        >
          Touch: {isTouching ? 'Yes' : 'No'}<br />
          X: {touchPosition.x}<br />
          Y: {touchPosition.y}<br />
          Gesture: {touchStateRef.current.currentGesture || 'none'}
        </div>
      )}
    </div>
  );
};

// Add keyframes for ripple animation to document
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes touch-ripple {
      0% {
        transform: translate(-50%, -50%) scale(0);
        opacity: 1;
      }
      100% {
        transform: translate(-50%, -50%) scale(1);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

export default TouchOptimizer;