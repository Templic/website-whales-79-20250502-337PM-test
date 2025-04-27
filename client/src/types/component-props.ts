/**
 * Comprehensive Component Prop Types
 * 
 * This file provides reusable component prop types to ensure consistency
 * and type safety throughout the application's React components.
 */

import React from 'react';
import { 
  FormFieldHandlers, 
  ButtonHandlers,
  DragAndDropHandlers,
  InputChangeHandler,
  ButtonClickHandler
} from './events';

// Generic Component Props
export interface BaseComponentProps {
  className?: string;
  style?: React.CSSProperties;
  id?: string;
  'data-testid'?: string;
  'aria-label'?: string;
  tabIndex?: number;
}

// Child-related Props
export interface WithChildrenProps extends BaseComponentProps {
  children: React.ReactNode;
}

export interface WithOptionalChildrenProps extends BaseComponentProps {
  children?: React.ReactNode;
}

// Styling Props
export interface StylingProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'link' | 'default';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  rounded?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

// Layout Props
export interface LayoutProps extends BaseComponentProps {
  direction?: 'row' | 'column';
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
  align?: 'start' | 'end' | 'center' | 'stretch' | 'baseline';
  gap?: number | string;
  wrap?: boolean;
  grow?: boolean;
  shrink?: boolean;
}

// Form Input Props
export interface InputProps extends BaseComponentProps, FormFieldHandlers {
  name: string;
  value: string | number | boolean;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  error?: string;
  type?: string;
  min?: number;
  max?: number;
  step?: number;
  autoComplete?: string;
  autoFocus?: boolean;
  onChange: InputChangeHandler;
}

// Button Props
export interface ButtonProps extends BaseComponentProps, ButtonHandlers, StylingProps {
  type?: 'button' | 'submit' | 'reset';
  onClick?: ButtonClickHandler;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

// Card Props
export interface CardProps extends WithOptionalChildrenProps, StylingProps {
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  clickable?: boolean;
  onClick?: () => void;
  hoverable?: boolean;
  elevated?: boolean;
}

// Data Display Props
export interface DataDisplayProps<T> extends BaseComponentProps {
  data: T[];
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
}

// Modal/Dialog Props
export interface ModalProps extends WithOptionalChildrenProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  closeOnOutsideClick?: boolean;
  closeOnEsc?: boolean;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

// Navigation Props
export interface NavigationProps extends BaseComponentProps {
  links: Array<{
    label: string;
    href: string;
    icon?: React.ReactNode;
    isActive?: boolean;
    isDisabled?: boolean;
    onClick?: () => void;
  }>;
  orientation?: 'horizontal' | 'vertical';
}

// Tab Props
export interface TabsProps extends BaseComponentProps {
  tabs: Array<{
    label: string;
    id: string;
    content?: React.ReactNode;
    icon?: React.ReactNode;
    disabled?: boolean;
  }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

// Authentication Props 
export interface AuthProps extends BaseComponentProps {
  isAuthenticated: boolean;
  user?: {
    id: string;
    name?: string;
    email?: string;
    role?: string;
    [key: string]: unknown;
  };
  onLogin?: () => void;
  onLogout?: () => void;
}

// Drag and Drop Props
export interface DragDropProps extends BaseComponentProps, DragAndDropHandlers {
  draggable?: boolean;
  droppable?: boolean;
  dragData?: unknown;
  dragId?: string;
  dropEffect?: 'none' | 'copy' | 'link' | 'move';
  dragImage?: HTMLImageElement;
}

// Form Props
export interface FormProps extends WithChildrenProps {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  method?: 'get' | 'post';
  action?: string;
  encType?: string;
  autoComplete?: 'on' | 'off';
  noValidate?: boolean;
}

// Utility Props for Transition/Animation
export interface TransitionProps extends BaseComponentProps {
  show: boolean;
  duration?: number;
  delay?: number;
  easing?: string;
  onEnter?: () => void;
  onExit?: () => void;
}

// Media Props
export interface MediaProps extends BaseComponentProps {
  src: string;
  alt?: string;
  fallback?: React.ReactNode;
  loading?: 'eager' | 'lazy';
  onLoad?: () => void;
  onError?: () => void;
}

// Utility type to create strict union props
export type StrictUnionHelper<T, K extends keyof T = keyof T> = 
  T extends unknown ? { [P in K]: T[P] } & { [P in Exclude<keyof T, K>]?: never } : never;

// Utility to combine prop types
export type CombinedProps<A, B> = Omit<A, keyof B> & B;