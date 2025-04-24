/**
 * Component Type Definitions
 * 
 * This file contains type definitions for React components.
 */

import React from 'react';

/**
 * Common component properties
 */
interface CommonComponentProps {
  /** Optional class name */
  className?: string;
  
  /** Optional id attribute */
  id?: string;
  
  /** Optional style object */
  style?: React.CSSProperties;
  
  /** Optional ref */
  ref?: React.Ref<any>;
  
  /** Optional aria label */
  'aria-label'?: string;
  
  /** Optional data attributes */
  [dataAttr: `data-${string}`]: string | number | boolean;
}

/**
 * Button component props
 */
interface ButtonProps extends CommonComponentProps {
  /** Button text content */
  children: React.ReactNode;
  
  /** Click handler */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  
  /** Button type */
  type?: 'button' | 'submit' | 'reset';
  
  /** Whether the button is disabled */
  disabled?: boolean;
  
  /** Loading state */
  loading?: boolean;
  
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'tertiary' | 'outline' | 'link' | 'danger';
  
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  
  /** Full width button */
  fullWidth?: boolean;
  
  /** Start icon */
  startIcon?: React.ReactNode;
  
  /** End icon */
  endIcon?: React.ReactNode;
  
  /** Additional attributes */
  [x: string]: any;
}

/**
 * Input component props
 */
interface InputProps extends CommonComponentProps {
  /** Input name */
  name: string;
  
  /** Input label */
  label?: string;
  
  /** Input type */
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'date';
  
  /** Input value */
  value?: string | number;
  
  /** Default value */
  defaultValue?: string | number;
  
  /** Change handler */
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  
  /** Blur handler */
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  
  /** Focus handler */
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  
  /** Placeholder text */
  placeholder?: string;
  
  /** Whether the input is disabled */
  disabled?: boolean;
  
  /** Whether the input is required */
  required?: boolean;
  
  /** Error message */
  error?: string;
  
  /** Helper text */
  helperText?: string;
  
  /** Start adornment */
  startAdornment?: React.ReactNode;
  
  /** End adornment */
  endAdornment?: React.ReactNode;
  
  /** Maximum length */
  maxLength?: number;
  
  /** Minimum length */
  minLength?: number;
  
  /** Input mask */
  mask?: string;
  
  /** Autocomplete attribute */
  autoComplete?: string;
  
  /** Input size */
  size?: 'sm' | 'md' | 'lg';
  
  /** Whether the input is full width */
  fullWidth?: boolean;
  
  /** Additional attributes */
  [x: string]: any;
}

/**
 * Select component props
 */
interface SelectProps extends CommonComponentProps {
  /** Select name */
  name: string;
  
  /** Select label */
  label?: string;
  
  /** Select options */
  options: Array<{
    value: string | number;
    label: string;
    disabled?: boolean;
  }>;
  
  /** Selected value */
  value?: string | number;
  
  /** Default value */
  defaultValue?: string | number;
  
  /** Change handler */
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  
  /** Blur handler */
  onBlur?: (event: React.FocusEvent<HTMLSelectElement>) => void;
  
  /** Placeholder text */
  placeholder?: string;
  
  /** Whether the select is disabled */
  disabled?: boolean;
  
  /** Whether the select is required */
  required?: boolean;
  
  /** Error message */
  error?: string;
  
  /** Helper text */
  helperText?: string;
  
  /** Whether the select allows multiple selection */
  multiple?: boolean;
  
  /** Select size */
  size?: 'sm' | 'md' | 'lg';
  
  /** Whether the select is full width */
  fullWidth?: boolean;
  
  /** Additional attributes */
  [x: string]: any;
}

/**
 * Checkbox component props
 */
interface CheckboxProps extends CommonComponentProps {
  /** Checkbox name */
  name: string;
  
  /** Checkbox label */
  label?: string;
  
  /** Whether the checkbox is checked */
  checked?: boolean;
  
  /** Default checked state */
  defaultChecked?: boolean;
  
  /** Change handler */
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  
  /** Whether the checkbox is disabled */
  disabled?: boolean;
  
  /** Whether the checkbox is required */
  required?: boolean;
  
  /** Error message */
  error?: string;
  
  /** Helper text */
  helperText?: string;
  
  /** Checkbox size */
  size?: 'sm' | 'md' | 'lg';
  
  /** Additional attributes */
  [x: string]: any;
}

/**
 * Radio component props
 */
interface RadioProps extends CommonComponentProps {
  /** Radio name */
  name: string;
  
  /** Radio label */
  label?: string;
  
  /** Radio value */
  value: string | number;
  
  /** Whether the radio is checked */
  checked?: boolean;
  
  /** Default checked state */
  defaultChecked?: boolean;
  
  /** Change handler */
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  
  /** Whether the radio is disabled */
  disabled?: boolean;
  
  /** Whether the radio is required */
  required?: boolean;
  
  /** Radio size */
  size?: 'sm' | 'md' | 'lg';
  
  /** Additional attributes */
  [x: string]: any;
}

/**
 * Table component props
 */
interface TableProps extends CommonComponentProps {
  /** Column definitions */
  columns: Array<{
    key: string;
    title: string;
    render?: (value: any, row: any, index: number) => React.ReactNode;
    width?: string | number;
    align?: 'left' | 'center' | 'right';
    sortable?: boolean;
  }>;
  
  /** Table data */
  data: any[];
  
  /** Loading state */
  loading?: boolean;
  
  /** Empty state message */
  emptyMessage?: string;
  
  /** Error message */
  error?: string;
  
  /** Current sort column */
  sortColumn?: string;
  
  /** Current sort direction */
  sortDirection?: 'asc' | 'desc';
  
  /** Sort change handler */
  onSortChange?: (column: string, direction: 'asc' | 'desc') => void;
  
  /** Row click handler */
  onRowClick?: (row: any, index: number) => void;
  
  /** Row key function */
  rowKey?: (row: any) => string;
  
  /** Whether the table has striped rows */
  striped?: boolean;
  
  /** Whether the table has bordered cells */
  bordered?: boolean;
  
  /** Whether the table has hover state */
  hover?: boolean;
  
  /** Whether the table is condensed */
  condensed?: boolean;
  
  /** Whether the table is responsive */
  responsive?: boolean;
  
  /** Additional attributes */
  [x: string]: any;
}

/**
 * Modal component props
 */
interface ModalProps extends CommonComponentProps {
  /** Whether the modal is open */
  isOpen: boolean;
  
  /** Close handler */
  onClose: () => void;
  
  /** Modal title */
  title?: string;
  
  /** Modal content */
  children: React.ReactNode;
  
  /** Footer content */
  footer?: React.ReactNode;
  
  /** Whether to show close button */
  showCloseButton?: boolean;
  
  /** Whether to close on overlay click */
  closeOnOverlayClick?: boolean;
  
  /** Whether to close on escape key */
  closeOnEsc?: boolean;
  
  /** Modal size */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  
  /** Whether the modal is centered */
  centered?: boolean;
  
  /** Whether the modal has scrollable content */
  scrollable?: boolean;
  
  /** Whether the modal is static (doesn't close on backdrop click) */
  static?: boolean;
  
  /** Animation duration in ms */
  animationDuration?: number;
  
  /** Z-index */
  zIndex?: number;
  
  /** Additional attributes */
  [x: string]: any;
}

/**
 * Card component props
 */
interface CardProps extends CommonComponentProps {
  /** Card title */
  title?: string;
  
  /** Card content */
  children: React.ReactNode;
  
  /** Card footer */
  footer?: React.ReactNode;
  
  /** Card header */
  header?: React.ReactNode;
  
  /** Card image */
  image?: {
    src: string;
    alt?: string;
    position?: 'top' | 'bottom';
  };
  
  /** Whether the card is hoverable */
  hoverable?: boolean;
  
  /** Whether the card has a shadow */
  shadow?: boolean;
  
  /** Card border */
  border?: boolean;
  
  /** Card padding */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  
  /** Card variant */
  variant?: 'default' | 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'danger';
  
  /** Click handler */
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  
  /** Additional attributes */
  [x: string]: any;
}

/**
 * Alert component props
 */
interface AlertProps extends CommonComponentProps {
  /** Alert type */
  type: 'info' | 'success' | 'warning' | 'error';
  
  /** Alert title */
  title?: string;
  
  /** Alert content */
  children: React.ReactNode;
  
  /** Whether the alert is dismissible */
  dismissible?: boolean;
  
  /** Dismiss handler */
  onDismiss?: () => void;
  
  /** Whether to show icon */
  showIcon?: boolean;
  
  /** Icon override */
  icon?: React.ReactNode;
  
  /** Additional attributes */
  [x: string]: any;
}

/**
 * Form component props
 */
interface FormProps extends CommonComponentProps {
  /** Form children */
  children: React.ReactNode;
  
  /** Submit handler */
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
  
  /** Whether the form is disabled */
  disabled?: boolean;
  
  /** Whether the form is loading */
  loading?: boolean;
  
  /** Form method */
  method?: 'get' | 'post';
  
  /** Form action */
  action?: string;
  
  /** Form layout */
  layout?: 'vertical' | 'horizontal' | 'inline';
  
  /** Whether to prevent default submit behavior */
  preventDefault?: boolean;
  
  /** Additional attributes */
  [x: string]: any;
}

/**
 * Pagination component props
 */
interface PaginationProps extends CommonComponentProps {
  /** Current page */
  currentPage: number;
  
  /** Total pages */
  totalPages: number;
  
  /** Page change handler */
  onChange: (page: number) => void;
  
  /** Whether to show first/last buttons */
  showFirstLast?: boolean;
  
  /** Whether to show previous/next buttons */
  showPrevNext?: boolean;
  
  /** Whether to show page numbers */
  showPageNumbers?: boolean;
  
  /** Maximum number of page buttons to show */
  maxButtons?: number;
  
  /** Whether the component is disabled */
  disabled?: boolean;
  
  /** Pagination size */
  size?: 'sm' | 'md' | 'lg';
  
  /** Additional attributes */
  [x: string]: any;
}

/**
 * Tabs component props
 */
interface TabsProps extends CommonComponentProps {
  /** Active tab key */
  activeKey: string;
  
  /** Tab change handler */
  onChange: (key: string) => void;
  
  /** Tab items */
  items: Array<{
    key: string;
    label: React.ReactNode;
    content: React.ReactNode;
    disabled?: boolean;
    icon?: React.ReactNode;
  }>;
  
  /** Tab position */
  position?: 'top' | 'bottom' | 'left' | 'right';
  
  /** Tab type */
  type?: 'line' | 'card' | 'pill';
  
  /** Whether to animate tab transitions */
  animated?: boolean;
  
  /** Whether tabs are centered */
  centered?: boolean;
  
  /** Additional attributes */
  [x: string]: any;
}

/**
 * Tooltip component props
 */
interface TooltipProps extends CommonComponentProps {
  /** Tooltip content */
  content: React.ReactNode;
  
  /** Child element to attach tooltip to */
  children: React.ReactElement;
  
  /** Tooltip position */
  position?: 'top' | 'bottom' | 'left' | 'right';
  
  /** Tooltip trigger */
  trigger?: 'hover' | 'click' | 'focus';
  
  /** Whether the tooltip is visible */
  visible?: boolean;
  
  /** Delay before showing/hiding (ms) */
  delay?: number;
  
  /** Whether tooltip should have an arrow */
  arrow?: boolean;
  
  /** Maximum width */
  maxWidth?: number | string;
  
  /** Z-index */
  zIndex?: number;
  
  /** Additional attributes */
  [x: string]: any;
}

/**
 * Icon component props
 */
interface IconProps extends CommonComponentProps {
  /** Icon name */
  name: string;
  
  /** Icon size */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  
  /** Icon color */
  color?: string;
  
  /** Whether the icon is spinning */
  spin?: boolean;
  
  /** Whether the icon is pulsing */
  pulse?: boolean;
  
  /** Icon role attribute */
  role?: string;
  
  /** Additional attributes */
  [x: string]: any;
}

/**
 * Avatar component props
 */
interface AvatarProps extends CommonComponentProps {
  /** Avatar source URL */
  src?: string;
  
  /** Alternative text */
  alt?: string;
  
  /** Avatar size */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  
  /** Avatar shape */
  shape?: 'circle' | 'square' | 'rounded';
  
  /** Fallback content (initials or icon) */
  fallback?: React.ReactNode;
  
  /** Whether to show badge */
  badge?: boolean | 'online' | 'offline' | 'away' | 'busy';
  
  /** Badge position */
  badgePosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  
  /** Click handler */
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  
  /** Background color */
  bgColor?: string;
  
  /** Text color */
  textColor?: string;
  
  /** Whether to show border */
  border?: boolean;
  
  /** Border color */
  borderColor?: string;
  
  /** Additional attributes */
  [x: string]: any;
}

/**
 * Badge component props
 */
interface BadgeProps extends CommonComponentProps {
  /** Badge content */
  content: React.ReactNode;
  
  /** Optional count to display */
  count?: number;
  
  /** Maximum count to display before showing "+" */
  maxCount?: number;
  
  /** Whether to show zero count */
  showZero?: boolean;
  
  /** Whether the badge is a dot */
  dot?: boolean;
  
  /** Badge variant */
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'danger';
  
  /** Badge size */
  size?: 'sm' | 'md' | 'lg';
  
  /** Whether to use an outline style */
  outline?: boolean;
  
  /** Badge placement when wrapping children */
  placement?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  
  /** Badge offset */
  offset?: [number, number];
  
  /** Children to wrap with badge */
  children?: React.ReactNode;
  
  /** Additional attributes */
  [x: string]: any;
}

// Export types for use in other files
export {
  CommonComponentProps,
  ButtonProps,
  InputProps,
  SelectProps,
  CheckboxProps,
  RadioProps,
  TableProps,
  ModalProps,
  CardProps,
  AlertProps,
  FormProps,
  PaginationProps,
  TabsProps,
  TooltipProps,
  IconProps,
  AvatarProps,
  BadgeProps
};