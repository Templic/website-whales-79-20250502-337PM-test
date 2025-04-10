/**
 * Admin Types
 * 
 * This file contains type definitions for admin-related components and features.
 * These types provide a consistent interface for admin functionality.
 */

import { ReactNode } from 'react';
import { ButtonProps } from '@/components/ui/button';

/**
 * Admin button appearance variants
 */
export type AdminButtonVariant = 
  | 'default'
  | 'cosmic'
  | 'destructive'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'link'
  | 'primary';

/**
 * Admin button size variants
 */
export type AdminButtonSize = 'default' | 'sm' | 'lg' | 'icon' | 'md';

/**
 * Edit button props
 */
export interface EditButtonProps extends Omit<ButtonProps, 'variant' | 'size'> {
  variant?: AdminButtonVariant;
  size?: AdminButtonSize;
  onEdit?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  isEditing?: boolean;
  saveLabel?: string;
  editLabel?: string;
  cancelLabel?: string;
  showIcon?: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
  iconPosition?: 'left' | 'right';
  confirmOnSave?: boolean;
  confirmMessage?: string;
  confirmTitle?: string;
  cancelText?: string;
  confirmText?: string;
  loading?: boolean;
}

/**
 * Format actions for rich text editing
 */
export type FormatAction = 
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strikethrough'
  | 'subscript'
  | 'superscript'
  | 'code'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'bulletList'
  | 'numberedList'
  | 'blockquote'
  | 'link'
  | 'image'
  | 'video'
  | 'table'
  | 'divider'
  | 'clearFormatting'
  | 'undo'
  | 'redo'
  | 'align-left'
  | 'align-center'
  | 'align-right'
  | 'align-justify'
  | 'indent'
  | 'outdent'
  | 'number';

/**
 * Format value for rich text editing
 */
export type FormatValue = {
  type: FormatAction;
  value?: string;
}

/**
 * Edit menu props
 */
export interface EditMenuProps {
  onAction?: (action: FormatAction, value?: string) => void;
  position?: 'top' | 'bottom';
  children?: ReactNode;
  className?: string;
  showAdvanced?: boolean;
  actions?: FormatAction[];
  disabled?: boolean;
}

/**
 * Data table column definition
 */
export interface DataTableColumn<T> {
  id: string;
  header: string;
  accessor: keyof T | ((row: T) => any);
  cell?: (value: any, row: T) => ReactNode;
  sortable?: boolean;
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  className?: string;
  headerClassName?: string;
  hidden?: boolean;
}

/**
 * Data table props
 */
export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  onRowClick?: (row: T) => void;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  loading?: boolean;
  emptyMessage?: string;
  pagination?: {
    pageSize: number;
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
  rowClassName?: string | ((row: T) => string);
  selectedRows?: T[];
  onRowSelect?: (row: T, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  selectable?: boolean;
  className?: string;
  showHeader?: boolean;
  stickyHeader?: boolean;
  highlightOnHover?: boolean;
  striped?: boolean;
  dense?: boolean;
  bordered?: boolean;
}

/**
 * Admin panel props
 */
export interface AdminPanelProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  onCollapse?: (collapsed: boolean) => void;
  loading?: boolean;
}

/**
 * Admin card props
 */
export interface AdminCardProps {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  onClick?: () => void;
  loading?: boolean;
  variant?: 'default' | 'bordered' | 'ghost';
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'cosmic';
}

/**
 * Admin dashboard metrics
 */
export interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  totalSales: number;
  revenue: number;
  newSignups: number;
  growthRate: number;
  conversionRate: number;
  userRetention: number;
  avgSessionDuration: number;
  pageViews: number;
}

/**
 * Admin dashboard chart data
 */
export interface DashboardChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
  }[];
}

/**
 * Security scan result
 */
export interface SecurityScanResult {
  id: string;
  timestamp: string;
  status: 'complete' | 'in_progress' | 'failed';
  issues: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  findings: {
    id: string;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    category: string;
    description: string;
    affected: string;
    recommendation: string;
  }[];
}

/**
 * Admin notification
 */
export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
  link?: string;
  icon?: ReactNode;
}

/**
 * Admin settings
 */
export interface AdminSettings {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    browser: boolean;
    mobile: boolean;
  };
  security: {
    twoFactorAuth: boolean;
    sessionTimeout: number;
    passwordExpiry: number;
  };
  display: {
    denseMode: boolean;
    animate: boolean;
    showHelpText: boolean;
  };
}

/**
 * Admin action log
 */
export interface AdminActionLog {
  id: string;
  user: string;
  action: string;
  target: string;
  timestamp: string;
  details?: string;
  ip?: string;
  userAgent?: string;
}

/**
 * Export admin types namespace
 */
export namespace AdminTypes {
  export type EditButton = EditButtonProps;
  export type EditMenu = EditMenuProps;
  export type DataTable<T> = DataTableProps<T>;
  export type AdminPanel = AdminPanelProps;
  export type AdminCard = AdminCardProps;
  export type Dashboard = DashboardMetrics;
  export type ChartData = DashboardChartData;
  export type SecurityScan = SecurityScanResult;
  export type Notification = AdminNotification;
  export type Settings = AdminSettings;
  export type ActionLog = AdminActionLog;
}

export default AdminTypes;