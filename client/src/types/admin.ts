/**
 * Admin Types
 * 
 * This file contains type definitions for admin-related components and features.
 * These types are used across the admin interfaces and dashboards.
 */

import { ReactNode } from 'react';
import { ButtonHTMLAttributes } from 'react';

/**
 * Button variant types for admin UI
 */
export type AdminButtonVariant = 
  | 'default'
  | 'primary'
  | 'secondary'
  | 'destructive'
  | 'outline'
  | 'subtle'
  | 'ghost'
  | 'link'
  | 'cosmic';

/**
 * Button size types for admin UI
 */
export type AdminButtonSize = 'sm' | 'default' | 'lg' | 'icon';

/**
 * Format actions for rich text editing
 */
export type FormatAction = 
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strikethrough'
  | 'code'
  | 'heading'
  | 'subheading'
  | 'paragraph'
  | 'quote'
  | 'bullet'
  | 'number'
  | 'link'
  | 'image'
  | 'color'
  | 'align-left'
  | 'align-center'
  | 'align-right'
  | 'align-justify'
  | 'indent'
  | 'outdent';

/**
 * Value for format actions
 */
export interface FormatValue {
  type: string;
  value?: string | number | boolean;
  url?: string;
  color?: string;
  level?: number;
}

/**
 * Admin namespace to group related admin types
 */
export namespace AdminTypes {
  /**
   * Edit button props
   */
  export interface EditButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    content?: string;
    contentId?: string;
    variant?: AdminButtonVariant;
    size?: AdminButtonSize;
    text?: string;
    iconOnly?: boolean;
    showFormatMenu?: boolean;
    menuPosition?: 'top' | 'bottom' | 'left' | 'right';
    onFormatApply?: (format: FormatAction | FormatValue) => void;
    className?: string;
  }

  /**
   * Edit menu props
   */
  export interface EditMenuProps {
    contentId?: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
    isOpen?: boolean;
    onClose?: () => void;
    onFormatApply?: (format: FormatAction | FormatValue) => void;
    className?: string;
  }

  /**
   * Analytics chart type
   */
  export type ChartType = 'line' | 'bar' | 'pie' | 'doughnut' | 'radar' | 'polarArea';

  /**
   * Analytics time range
   */
  export type TimeRange = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

  /**
   * Analytics chart props
   */
  export interface AnalyticsChartProps {
    type: ChartType;
    data: {
      labels: string[];
      datasets: {
        label: string;
        data: number[];
        backgroundColor?: string | string[];
        borderColor?: string | string[];
        borderWidth?: number;
        fill?: boolean;
      }[];
    };
    timeRange?: TimeRange;
    title?: string;
    subtitle?: string;
    height?: number | string;
    width?: number | string;
    options?: Record<string, any>;
    loading?: boolean;
    error?: Error | null;
    className?: string;
  }

  /**
   * Dashboard widget props
   */
  export interface DashboardWidgetProps {
    title: string;
    value: number | string;
    previousValue?: number | string;
    percentChange?: number;
    icon?: ReactNode;
    trend?: 'up' | 'down' | 'neutral';
    loading?: boolean;
    error?: Error | null;
    className?: string;
    onClick?: () => void;
  }

  /**
   * Dashboard section props
   */
  export interface DashboardSectionProps {
    title: string;
    subtitle?: string;
    children: ReactNode;
    className?: string;
    collapsible?: boolean;
    defaultCollapsed?: boolean;
  }

  /**
   * Data table column definition
   */
  export interface TableColumn<T> {
    header: string;
    accessor: keyof T | ((row: T) => any);
    cell?: (value, row: T) => ReactNode;
    sortable?: boolean;
    filterable?: boolean;
    width?: number | string;
    align?: 'left' | 'center' | 'right';
    className?: string;
  }

  /**
   * Data table props
   */
  export interface DataTableProps<T> {
    data: T[];
    columns: TableColumn<T>[];
    pagination?: {
      pageSize: number;
      page: number;
      totalItems: number;
      totalPages: number;
      onPageChange: (page: number) => void;
      onPageSizeChange?: (pageSize: number) => void;
    };
    sorting?: {
      sortBy: keyof T | null;
      sortDirection: 'asc' | 'desc';
      onSortChange: (sortBy: keyof T | null, sortDirection: 'asc' | 'desc') => void;
    };
    selection?: {
      selectedItems: T[];
      onSelectionChange: (selectedItems: T[]) => void;
      selectionMode?: 'single' | 'multiple';
    };
    loading?: boolean;
    error?: Error | null;
    emptyMessage?: string;
    className?: string;
  }

  /**
   * Admin form field
   */
  export interface FormField {
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'number' | 'email' | 'password' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'date' | 'time' | 'datetime' | 'file' | 'color' | 'richtext';
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
    options?: { label: string; value: string | number | boolean }[];
    defaultValue?: any;
    validation?: {
      min?: number;
      max?: number;
      minLength?: number;
      maxLength?: number;
      pattern?: string;
      patternMessage?: string;
    };
    helpText?: string;
    className?: string;
  }

  /**
   * Admin form props
   */
  export interface AdminFormProps {
    fields: FormField[];
    onSubmit: (values: Record<string, any>) => void;
    initialValues?: Record<string, any>;
    submitText?: string;
    cancelText?: string;
    onCancel?: () => void;
    loading?: boolean;
    error?: Error | null;
    successMessage?: string;
    className?: string;
  }

  /**
   * User role for admin purposes
   */
  export type UserRole = 'user' | 'admin' | 'super_admin' | 'moderator' | 'editor' | 'guest';

  /**
   * Permission for admin features
   */
  export type Permission = 
    | 'view:users' 
    | 'create:users' 
    | 'edit:users' 
    | 'delete:users'
    | 'view:content' 
    | 'create:content' 
    | 'edit:content' 
    | 'delete:content'
    | 'view:analytics' 
    | 'manage:settings'
    | 'manage:payments'
    | 'manage:security';

  /**
   * Security level for access control
   */
  export type SecurityLevel = 'low' | 'medium' | 'high' | 'critical';

  /**
   * Notification type for admin alerts
   */
  export type NotificationType = 'info' | 'success' | 'warning' | 'error';

  /**
   * Admin notification
   */
  export interface AdminNotification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
    actionUrl?: string;
    actionText?: string;
  }

  /**
   * Admin menu item
   */
  export interface AdminMenuItem {
    id: string;
    label: string;
    icon?: ReactNode;
    url?: string;
    onClick?: () => void;
    children?: AdminMenuItem[];
    requiredPermission?: Permission;
    badge?: {
      value: number | string;
      type?: 'default' | 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
    };
    divider?: boolean;
  }
}