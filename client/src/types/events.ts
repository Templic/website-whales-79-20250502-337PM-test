/**
 * Comprehensive Event Handler Types
 * 
 * This file provides a collection of common event handler types
 * for use in React components, helping to ensure proper type safety
 * without repetitive type definitions throughout the codebase.
 */

import React from 'react';

// Form Event Handlers
export type FormSubmitHandler = (event: React.FormEvent<HTMLFormElement>) => void;
export type FormChangeHandler = (event: React.ChangeEvent<HTMLFormElement>) => void;

// Input Event Handlers
export type InputChangeHandler = (event: React.ChangeEvent<HTMLInputElement>) => void;
export type TextAreaChangeHandler = (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
export type SelectChangeHandler = (event: React.ChangeEvent<HTMLSelectElement>) => void;

// Combined Input Handlers
export type AnyInputChangeHandler = 
  | InputChangeHandler
  | TextAreaChangeHandler
  | SelectChangeHandler;

// Focus Event Handlers
export type FocusHandler = (event: React.FocusEvent<HTMLElement>) => void;
export type InputFocusHandler = (event: React.FocusEvent<HTMLInputElement>) => void;
export type TextAreaFocusHandler = (event: React.FocusEvent<HTMLTextAreaElement>) => void;

// Blur Event Handlers
export type BlurHandler = (event: React.FocusEvent<HTMLElement>) => void;
export type InputBlurHandler = (event: React.FocusEvent<HTMLInputElement>) => void;
export type TextAreaBlurHandler = (event: React.FocusEvent<HTMLTextAreaElement>) => void;

// Mouse Event Handlers
export type MouseHandler = (event: React.MouseEvent<HTMLElement>) => void;
export type ButtonClickHandler = (event: React.MouseEvent<HTMLButtonElement>) => void;
export type DivClickHandler = (event: React.MouseEvent<HTMLDivElement>) => void;
export type LinkClickHandler = (event: React.MouseEvent<HTMLAnchorElement>) => void;

// Keyboard Event Handlers
export type KeyboardHandler = (event: React.KeyboardEvent<HTMLElement>) => void;
export type InputKeyboardHandler = (event: React.KeyboardEvent<HTMLInputElement>) => void;
export type TextAreaKeyboardHandler = (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;

// Drag Event Handlers
export type DragHandler = (event: React.DragEvent<HTMLElement>) => void;
export type DropHandler = (event: React.DragEvent<HTMLElement>) => void;

// Touch Event Handlers
export type TouchHandler = (event: React.TouchEvent<HTMLElement>) => void;

// Clipboard Event Handlers
export type ClipboardHandler = (event: React.ClipboardEvent<HTMLElement>) => void;

// Specialized Handlers
export type FileChangeHandler = (event: React.ChangeEvent<HTMLInputElement>) => void;

// Generic Handlers with Data
export type GenericChangeHandler<T> = (value: T) => void;
export type GenericEventHandler<E extends React.SyntheticEvent = React.SyntheticEvent> = (event: E) => void;
export type AsyncEventHandler<E extends React.SyntheticEvent = React.SyntheticEvent> = (event: E) => Promise<void>;

// Combined Event Types
export type AnyClickHandler = 
  | ButtonClickHandler
  | DivClickHandler
  | LinkClickHandler
  | MouseHandler;

export type AnyFocusHandler = 
  | FocusHandler
  | InputFocusHandler
  | TextAreaFocusHandler;

export type AnyBlurHandler = 
  | BlurHandler
  | InputBlurHandler
  | TextAreaBlurHandler;

export type AnyKeyboardHandler = 
  | KeyboardHandler
  | InputKeyboardHandler
  | TextAreaKeyboardHandler;

// Common Handler Combinations
export interface FormFieldHandlers {
  onChange?: AnyInputChangeHandler;
  onFocus?: AnyFocusHandler;
  onBlur?: AnyBlurHandler;
  onKeyDown?: AnyKeyboardHandler;
}

export interface ButtonHandlers {
  onClick?: ButtonClickHandler;
  onMouseEnter?: MouseHandler;
  onMouseLeave?: MouseHandler;
  onFocus?: FocusHandler;
  onBlur?: BlurHandler;
}

export interface DragAndDropHandlers {
  onDragStart?: DragHandler;
  onDragEnd?: DragHandler;
  onDragOver?: DragHandler;
  onDragEnter?: DragHandler;
  onDragLeave?: DragHandler;
  onDrop?: DropHandler;
}

// Utils
export const preventDefaultHandler = (event: React.SyntheticEvent): void => {
  event.preventDefault();
};

export const stopPropagationHandler = (event: React.SyntheticEvent): void => {
  event.stopPropagation();
};

export const preventDefaultAndStopPropagation = (event: React.SyntheticEvent): void => {
  event.preventDefault();
  event.stopPropagation();
};