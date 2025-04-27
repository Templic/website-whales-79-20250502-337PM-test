/**
 * Comprehensive React Event Handler Type Definitions
 * 
 * This file provides strongly-typed React event handlers to ensure
 * type safety and consistency for UI interactions.
 */

import React from 'react';

// MOUSE EVENTS
export type MouseHandler = (event: React.MouseEvent<HTMLElement>) => void;
export type ButtonMouseHandler = (event: React.MouseEvent<HTMLButtonElement>) => void;
export type DivMouseHandler = (event: React.MouseEvent<HTMLDivElement>) => void;
export type LinkMouseHandler = (event: React.MouseEvent<HTMLAnchorElement>) => void;
export type InputMouseHandler = (event: React.MouseEvent<HTMLInputElement>) => void;
export type LabelMouseHandler = (event: React.MouseEvent<HTMLLabelElement>) => void;
export type ImageMouseHandler = (event: React.MouseEvent<HTMLImageElement>) => void;

// KEYBOARD EVENTS
export type KeyboardHandler = (event: React.KeyboardEvent<HTMLElement>) => void;
export type InputKeyboardHandler = (event: React.KeyboardEvent<HTMLInputElement>) => void;
export type TextAreaKeyboardHandler = (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
export type DivKeyboardHandler = (event: React.KeyboardEvent<HTMLDivElement>) => void;

// FOCUS EVENTS
export type FocusHandler = (event: React.FocusEvent<HTMLElement>) => void;
export type InputFocusHandler = (event: React.FocusEvent<HTMLInputElement>) => void;
export type TextAreaFocusHandler = (event: React.FocusEvent<HTMLTextAreaElement>) => void;
export type SelectFocusHandler = (event: React.FocusEvent<HTMLSelectElement>) => void;

// FORM EVENTS
export type FormHandler = (event: React.FormEvent<HTMLFormElement>) => void;
export type FormSubmitHandler = (event: React.FormEvent<HTMLFormElement>) => void;
export type InputChangeHandler = (event: React.ChangeEvent<HTMLInputElement>) => void;
export type TextAreaChangeHandler = (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
export type SelectChangeHandler = (event: React.ChangeEvent<HTMLSelectElement>) => void;

// DRAG AND DROP EVENTS
export type DragHandler = (event: React.DragEvent<HTMLElement>) => void;
export type DivDragHandler = (event: React.DragEvent<HTMLDivElement>) => void;
export type ImageDragHandler = (event: React.DragEvent<HTMLImageElement>) => void;
export type LiDragHandler = (event: React.DragEvent<HTMLLIElement>) => void;

// CLIPBOARD EVENTS
export type ClipboardHandler = (event: React.ClipboardEvent<HTMLElement>) => void;
export type InputClipboardHandler = (event: React.ClipboardEvent<HTMLInputElement>) => void;
export type TextAreaClipboardHandler = (event: React.ClipboardEvent<HTMLTextAreaElement>) => void;

// TOUCH EVENTS
export type TouchHandler = (event: React.TouchEvent<HTMLElement>) => void;
export type DivTouchHandler = (event: React.TouchEvent<HTMLDivElement>) => void;
export type ButtonTouchHandler = (event: React.TouchEvent<HTMLButtonElement>) => void;

// WHEEL EVENTS
export type WheelHandler = (event: React.WheelEvent<HTMLElement>) => void;
export type DivWheelHandler = (event: React.WheelEvent<HTMLDivElement>) => void;

// ANIMATION EVENTS
export type AnimationHandler = (event: React.AnimationEvent<HTMLElement>) => void;
export type DivAnimationHandler = (event: React.AnimationEvent<HTMLDivElement>) => void;

// TRANSITION EVENTS
export type TransitionHandler = (event: React.TransitionEvent<HTMLElement>) => void;
export type DivTransitionHandler = (event: React.TransitionEvent<HTMLDivElement>) => void;

// POINTER EVENTS
export type PointerHandler = (event: React.PointerEvent<HTMLElement>) => void;
export type DivPointerHandler = (event: React.PointerEvent<HTMLDivElement>) => void;
export type ButtonPointerHandler = (event: React.PointerEvent<HTMLButtonElement>) => void;

// COMPOSITION EVENTS
export type CompositionHandler = (event: React.CompositionEvent<HTMLElement>) => void;
export type InputCompositionHandler = (event: React.CompositionEvent<HTMLInputElement>) => void;
export type TextAreaCompositionHandler = (event: React.CompositionEvent<HTMLTextAreaElement>) => void;

// COMBINED HANDLER TYPES FOR COMMON COMPONENTS
export interface ButtonHandlers {
  onClick?: ButtonMouseHandler;
  onDoubleClick?: ButtonMouseHandler;
  onMouseDown?: ButtonMouseHandler;
  onMouseUp?: ButtonMouseHandler;
  onMouseEnter?: ButtonMouseHandler;
  onMouseLeave?: ButtonMouseHandler;
  onKeyDown?: KeyboardHandler;
  onKeyUp?: KeyboardHandler;
  onFocus?: FocusHandler;
  onBlur?: FocusHandler;
  onPointerDown?: ButtonPointerHandler;
  onPointerUp?: ButtonPointerHandler;
}

export interface FormFieldHandlers {
  onChange?: InputChangeHandler | TextAreaChangeHandler | SelectChangeHandler;
  onBlur?: FocusHandler;
  onFocus?: FocusHandler;
  onKeyDown?: KeyboardHandler;
  onKeyUp?: KeyboardHandler;
  onKeyPress?: KeyboardHandler;
}

export interface DragAndDropHandlers {
  onDragStart?: DragHandler;
  onDragEnd?: DragHandler;
  onDragOver?: DragHandler;
  onDragEnter?: DragHandler;
  onDragLeave?: DragHandler;
  onDrop?: DragHandler;
}

// SPECIFIC CLICK HANDLER TYPES
export type ButtonClickHandler = (
  event: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement>
) => void;

export type LinkClickHandler = (
  event: React.MouseEvent<HTMLAnchorElement>
) => void;

// UTILITY TYPES
export type EventHandler<E extends React.SyntheticEvent> = (event: E) => void;

export type AnyFunction = (...args: any[]) => any;

export type GenericEventHandler = EventHandler<React.SyntheticEvent>;

// EVENT UTILITY FUNCTIONS
/**
 * Creates a keyboard event handler that only triggers on specific keys
 */
export function onKeys(keys: string[], handler: KeyboardHandler): KeyboardHandler {
  return (event) => {
    if (keys.includes(event.key)) {
      handler(event);
    }
  };
}

/**
 * Prevents default event behavior and calls the handler
 */
export function preventDefault<E extends React.SyntheticEvent>(
  handler: EventHandler<E>
): EventHandler<E> {
  return (event) => {
    event.preventDefault();
    handler(event);
  };
}

/**
 * Stops event propagation and calls the handler
 */
export function stopPropagation<E extends React.SyntheticEvent>(
  handler: EventHandler<E>
): EventHandler<E> {
  return (event) => {
    event.stopPropagation();
    handler(event);
  };
}

/**
 * Debounces an event handler
 */
export function debounce<E extends React.SyntheticEvent>(
  handler: EventHandler<E>,
  delay: number
): EventHandler<E> {
  let timeoutId: NodeJS.Timeout;
  return (event) => {
    // Create a persistent reference to the event to prevent React's pooling
    const persistedEvent = event;
    persistedEvent.persist();
    
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      handler(persistedEvent);
    }, delay);
  };
}

/**
 * Throttles an event handler
 */
export function throttle<E extends React.SyntheticEvent>(
  handler: EventHandler<E>,
  limit: number
): EventHandler<E> {
  let inThrottle = false;
  return (event) => {
    // Create a persistent reference to the event to prevent React's pooling
    const persistedEvent = event;
    persistedEvent.persist();
    
    if (!inThrottle) {
      handler(persistedEvent);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}