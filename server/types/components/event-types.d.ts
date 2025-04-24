/**
 * Event Type Definitions
 * 
 * This file defines event-related types for UI components.
 * These types ensure consistent event handling and prop interfaces.
 */

import { 
  FormEvent, 
  MouseEvent, 
  ChangeEvent, 
  KeyboardEvent, 
  FocusEvent, 
  DragEvent, 
  ClipboardEvent,
  TouchEvent,
  WheelEvent
} from 'react';

/**
 * Generic change event handler type
 */
export type ChangeEventHandler<T = Element> = (event: ChangeEvent<T>) => void;

/**
 * Generic focus event handler type
 */
export type FocusEventHandler<T = Element> = (event: FocusEvent<T>) => void;

/**
 * Generic mouse event handler type
 */
export type MouseEventHandler<T = Element> = (event: MouseEvent<T>) => void;

/**
 * Generic keyboard event handler type
 */
export type KeyboardEventHandler<T = Element> = (event: KeyboardEvent<T>) => void;

/**
 * Generic drag event handler type
 */
export type DragEventHandler<T = Element> = (event: DragEvent<T>) => void;

/**
 * Generic form event handler type
 */
export type FormEventHandler<T = Element> = (event: FormEvent<T>) => void;

/**
 * Generic clipboard event handler type
 */
export type ClipboardEventHandler<T = Element> = (event: ClipboardEvent<T>) => void;

/**
 * Generic touch event handler type
 */
export type TouchEventHandler<T = Element> = (event: TouchEvent<T>) => void;

/**
 * Generic wheel event handler type
 */
export type WheelEventHandler<T = Element> = (event: WheelEvent<T>) => void;

/**
 * Event handler with value type
 */
export type ValueChangeHandler<T, E = Element> = (value: T, event: ChangeEvent<E>) => void;

/**
 * Keyboard key event information
 */
export interface KeyboardAction {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  action: () => void;
}

/**
 * Form submission event
 */
export interface FormSubmitEvent<T = any> {
  data: T;
  event: FormEvent<HTMLFormElement>;
  isValid: boolean;
  errors?: Record<string, string>;
}

/**
 * Form value change event
 */
export interface FormValueChangeEvent<T = any> {
  name: string;
  value: any;
  formValues: T;
  isValid: boolean;
  errors?: Record<string, string>;
}

/**
 * Drag and drop action types
 */
export enum DragActionType {
  START = 'start',
  OVER = 'over',
  ENTER = 'enter',
  LEAVE = 'leave',
  DROP = 'drop',
  END = 'end'
}

/**
 * Drag and drop event information
 */
export interface DragDropEvent<T = any> {
  type: DragActionType;
  item: T;
  source: {
    id: string;
    index: number;
    containerId?: string;
  };
  target?: {
    id: string;
    index: number;
    containerId?: string;
  };
  event: DragEvent;
}

/**
 * Sort event information
 */
export interface SortEvent<T = any> {
  items: T[];
  oldIndex: number;
  newIndex: number;
  item: T;
}

/**
 * Pagination event information
 */
export interface PaginationEvent {
  page: number;
  pageSize: number;
  totalItems?: number;
  totalPages?: number;
}

/**
 * Selection change event information
 */
export interface SelectionChangeEvent<T = any> {
  items: T[];
  selectedItems: T[];
  selectedIndexes: number[];
  isAllSelected: boolean;
  lastSelectedItem?: T;
}

/**
 * Table sort event information
 */
export interface TableSortEvent {
  columnId: string;
  direction: 'asc' | 'desc' | null;
  multiSort?: Record<string, 'asc' | 'desc'>;
}

/**
 * Table filter event information
 */
export interface TableFilterEvent {
  columnId: string;
  value: any;
  operator?: string;
  filters: Record<string, any>;
}

/**
 * Resize event information
 */
export interface ResizeEvent {
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  direction: 'horizontal' | 'vertical' | 'both';
  element: HTMLElement;
}

/**
 * Context menu event information
 */
export interface ContextMenuEvent {
  x: number;
  y: number;
  target: HTMLElement;
  event: MouseEvent;
}

/**
 * Toast action event information
 */
export interface ToastActionEvent {
  id: string;
  action: string;
  data?: any;
}

/**
 * Modal action event information
 */
export interface ModalActionEvent {
  id: string;
  action: 'close' | 'confirm' | 'cancel' | 'custom';
  data?: any;
}

/**
 * File upload event information
 */
export interface FileUploadEvent {
  files: File[];
  acceptedFiles: File[];
  rejectedFiles: File[];
  event: ChangeEvent<HTMLInputElement>;
  errors?: Array<{
    file: File;
    errors: Array<{
      code: string;
      message: string;
    }>;
  }>;
}

/**
 * Scroll event information
 */
export interface ScrollEvent {
  scrollTop: number;
  scrollLeft: number;
  scrollHeight: number;
  scrollWidth: number;
  clientHeight: number;
  clientWidth: number;
  isAtTop: boolean;
  isAtBottom: boolean;
  isAtLeft: boolean;
  isAtRight: boolean;
  direction: 'up' | 'down' | 'left' | 'right' | 'none';
  event: Event;
}

/**
 * Intersection event information
 */
export interface IntersectionEvent {
  isIntersecting: boolean;
  intersectionRatio: number;
  target: Element;
  entry: IntersectionObserverEntry;
}

/**
 * Navigation event information
 */
export interface NavigationEvent {
  from: string;
  to: string;
  type: 'push' | 'replace' | 'pop' | 'back' | 'forward';
  params?: Record<string, string>;
  query?: Record<string, string>;
  canNavigate: boolean;
  preventDefault: () => void;
}

/**
 * Theme change event information
 */
export interface ThemeChangeEvent {
  theme: 'light' | 'dark' | 'system';
  previousTheme: 'light' | 'dark' | 'system';
  systemTheme: 'light' | 'dark';
}

/**
 * Animation event information
 */
export interface AnimationEvent {
  animation: string;
  phase: 'start' | 'end' | 'cancel';
  element: HTMLElement;
  elapsed: number;
  event?: Event;
}

/**
 * Search event information
 */
export interface SearchEvent {
  query: string;
  previousQuery: string;
  isCleared: boolean;
}

/**
 * Input value information
 */
export interface InputValueEvent<T = string> {
  name: string;
  value: T;
  previousValue?: T;
  isValid?: boolean;
  error?: string;
}

/**
 * Visibility change event information
 */
export interface VisibilityEvent {
  isVisible: boolean;
  element: HTMLElement;
}

/**
 * Authentication event information
 */
export interface AuthEvent {
  type: 'login' | 'logout' | 'register' | 'password-reset';
  user?: any;
  error?: Error;
}

/**
 * Network status event information
 */
export interface NetworkStatusEvent {
  isOnline: boolean;
  previousStatus: boolean;
  timestamp: number;
}

/**
 * Type guards
 */

/**
 * Type guard to check if an event is a file upload event
 */
export function isFileUploadEvent(event: any): event is FileUploadEvent {
  return (
    typeof event === 'object' &&
    event !== null &&
    'files' in event &&
    'acceptedFiles' in event &&
    'rejectedFiles' in event &&
    'event' in event
  );
}

/**
 * Type guard to check if an event is a form submit event
 */
export function isFormSubmitEvent<T = any>(event: any): event is FormSubmitEvent<T> {
  return (
    typeof event === 'object' &&
    event !== null &&
    'data' in event &&
    'event' in event &&
    'isValid' in event
  );
}

/**
 * Type guard to check if an event is a selection change event
 */
export function isSelectionChangeEvent<T = any>(event: any): event is SelectionChangeEvent<T> {
  return (
    typeof event === 'object' &&
    event !== null &&
    'items' in event &&
    'selectedItems' in event &&
    'selectedIndexes' in event &&
    'isAllSelected' in event
  );
}