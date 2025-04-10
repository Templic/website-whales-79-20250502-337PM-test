/**
 * Admin Component Types
 * 
 * This file centralizes type definitions for admin-related components.
 * It provides consistent typing for admin UI components, modals, and pages.
 */

/**
 * Admin portal page props
 */
export interface AdminPortalPageProps {
  defaultTab?: AdminPortalTab;
}

/**
 * Admin portal tabs
 */
export type AdminPortalTab = 'dashboard' | 'analytics' | 'security' | 'users' | 'posts' | 'music';

/**
 * Admin dashboard card props
 */
export interface AdminDashboardCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  loading?: boolean;
}

/**
 * Admin table column definition
 */
export interface AdminTableColumn<T> {
  id: string;
  header: string;
  accessorKey?: keyof T;
  accessorFn?: (row: T) => any;
  cell?: (info: { row: { original: T } }) => React.ReactNode;
  enableSorting?: boolean;
  enableFiltering?: boolean;
}

/**
 * Analytics dashboard props
 */
export interface AnalyticsDashboardProps {
  period?: AnalyticsPeriod;
  onPeriodChange?: (period: AnalyticsPeriod) => void;
}

/**
 * Analytics time period
 */
export type AnalyticsPeriod = '24h' | '7d' | '30d' | '90d' | '1y';

/**
 * Analytics data point
 */
export interface AnalyticsDataPoint {
  timestamp: string;
  value: number;
}

/**
 * Analytics series for charts
 */
export interface AnalyticsSeries {
  name: string;
  data: AnalyticsDataPoint[];
  color?: string;
}

/**
 * Security settings page props
 */
export interface SecuritySettingsPageProps {
  initialTab?: SecuritySettingsTab;
}

/**
 * Security settings tabs
 */
export type SecuritySettingsTab = 'overview' | 'access' | 'audit' | 'services';

/**
 * Security audit log entry
 */
export interface SecurityAuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  status: 'success' | 'failure' | 'warning';
  ipAddress: string;
  userAgent?: string;
  details?: string;
}

/**
 * User management table props
 */
export interface UserManagementTableProps {
  onEditUser?: (userId: string) => void;
  onDeleteUser?: (userId: string) => void;
  onSuspendUser?: (userId: string) => void;
  onUnsuspendUser?: (userId: string) => void;
}

/**
 * User edit form props
 */
export interface UserEditFormProps {
  userId: string;
  onComplete?: () => void;
  onCancel?: () => void;
}

/**
 * Content management table props
 */
export interface ContentManagementTableProps {
  contentType: 'posts' | 'albums' | 'tracks';
  onEditItem?: (itemId: string) => void;
  onDeleteItem?: (itemId: string) => void;
  onPublishItem?: (itemId: string) => void;
  onUnpublishItem?: (itemId: string) => void;
}

/**
 * Content edit form props
 */
export interface ContentEditFormProps {
  contentType: 'post' | 'album' | 'track';
  itemId?: string;
  onComplete?: () => void;
  onCancel?: () => void;
}

/**
 * Format action for edit buttons
 */
export type FormatAction = 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code' | 'link' | 'heading' | 'quote' | 'bullet' | 'number' | 'image' | 'video' | 'table';

/**
 * Edit button props
 */
export interface EditButtonProps {
  action: FormatAction;
  icon?: React.ReactNode;
  label?: string;
  tooltip?: string;
  isActive?: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

/**
 * Edit menu props
 */
export interface EditMenuProps {
  actions: FormatAction[];
  activeActions?: FormatAction[];
  onActionToggle: (action: FormatAction) => void;
  disabled?: boolean;
  compact?: boolean;
  position?: 'top' | 'bottom';
}