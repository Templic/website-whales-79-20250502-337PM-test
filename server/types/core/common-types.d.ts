/**
 * Common Type Definitions
 * 
 * This file defines common types used throughout the application.
 * These types provide consistent structures for basic functionality.
 */

/**
 * Pagination parameters for list requests
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
  totalItems?: number;
  totalPages?: number;
}

/**
 * Sorting parameters for list requests
 */
export interface SortingParams {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * Filtering parameters for list requests
 */
export interface FilteringParams {
  field: string;
  operator: FilterOperator;
  value: any;
}

/**
 * Filter operators for query filtering
 */
export type FilterOperator =
  | 'eq'      // equals
  | 'neq'     // not equals
  | 'gt'      // greater than
  | 'gte'     // greater than or equals
  | 'lt'      // less than
  | 'lte'     // less than or equals
  | 'in'      // in array
  | 'nin'     // not in array
  | 'like'    // string contains
  | 'nlike'   // string does not contain
  | 'starts'  // string starts with
  | 'ends'    // string ends with
  | 'exists'  // field exists
  | 'nexists'; // field does not exist

/**
 * Standard API request structure
 */
export interface ApiRequest<T = any> {
  body?: T;
  query?: Record<string, unknown>;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  user?: any;
}

/**
 * Standard API response structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string | number;
    details?: any;
  };
  meta?: {
    pagination?: PaginationParams;
    timestamp: number;
    [key: string]: any;
  };
}

/**
 * Standard list response with pagination
 */
export interface ListResponse<T = any> {
  items: T[];
  pagination: PaginationParams;
}

/**
 * Result object for async operations
 */
export interface Result<T = any> {
  success: boolean;
  data?: T;
  error?: Error;
  meta?: Record<string, unknown>;
}

/**
 * Base entity properties
 */
export interface BaseEntity {
  id: string;
  createdAt: number | Date;
  updatedAt: number | Date;
}

/**
 * Soft-deletable entity properties
 */
export interface SoftDeletableEntity extends BaseEntity {
  deletedAt?: number | Date;
  isDeleted: boolean;
}

/**
 * Audit properties for entities
 */
export interface AuditableEntity extends BaseEntity {
  createdBy?: string;
  updatedBy?: string;
}

/**
 * Versioned entity properties
 */
export interface VersionedEntity extends BaseEntity {
  version: number;
  versionHistory?: Array<{
    version: number;
    updatedAt: number | Date;
    updatedBy?: string;
    changes: Record<string, unknown>;
  }>;
}

/**
 * Cache control settings
 */
export interface CacheControl {
  maxAge: number;
  sMaxAge?: number;
  staleWhileRevalidate?: number;
  staleIfError?: number;
  mustRevalidate?: boolean;
  noCache?: boolean;
  noStore?: boolean;
  private?: boolean;
  public?: boolean;
}

/**
 * Webhook payload structure
 */
export interface WebhookPayload<T = any> {
  event: string;
  timestamp: number;
  data: T;
  signature?: string;
  apiVersion?: string;
}

/**
 * Configuration for feature flags
 */
export interface FeatureFlag {
  name: string;
  enabled: boolean;
  description?: string;
  conditions?: {
    userIds?: string[];
    userRoles?: string[];
    percentage?: number;
    startDate?: number | Date;
    endDate?: number | Date;
    environments?: string[];
    custom?: Record<string, unknown>;
  };
}

/**
 * Health check status
 */
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Array<{
    name: string;
    status: 'pass' | 'warn' | 'fail';
    message?: string;
    timestamp: number;
    duration?: number;
    metadata?: Record<string, unknown>;
  }>;
  version?: string;
  timestamp: number;
}

/**
 * Job task configuration
 */
export interface JobTask {
  id: string;
  name: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'critical';
  data: any;
  options?: {
    timeout?: number;
    retries?: number;
    backoff?: number;
    removeOnComplete?: boolean;
    removeOnFail?: boolean;
  };
  progress?: number;
  result?: any;
  error?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

/**
 * Metadata for uploaded files
 */
export interface FileMetadata {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  encoding: string;
  size: number;
  url?: string;
  path?: string;
  bucket?: string;
  tags?: string[];
  uploadedBy?: string;
  uploadedAt: number;
  metadata?: Record<string, unknown>;
}

/**
 * Service response wrapper for consistent API
 */
export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: Error;
  meta?: Record<string, unknown>;
}

/**
 * User preference settings
 */
export interface UserPreferences {
  userId: string;
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  timezone?: string;
  dateFormat?: string;
  timeFormat?: string;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  smsNotifications?: boolean;
  customPreferences?: Record<string, unknown>;
}

/**
 * Type guards
 */

export function isPaginationParams(obj: unknown): obj is PaginationParams {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'page' in obj &&
    'pageSize' in obj
  );
}

export function isApiResponse<T = any>(obj: unknown): obj is ApiResponse<T> {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'success' in obj &&
    typeof (obj as any).success === 'boolean'
  );
}

export function isResult<T = any>(obj: unknown): obj is Result<T> {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'success' in obj &&
    typeof (obj as any).success === 'boolean'
  );
}

export function isBaseEntity(obj: unknown): obj is BaseEntity {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'createdAt' in obj &&
    'updatedAt' in obj
  );
}

/**
 * Type utilities
 */

// Makes all properties in an object required and non-nullable
export type Required<T> = {
  [P in keyof T]-?: NonNullable<T[P]>;
};

// Makes all properties in an object optional
export type Optional<T> = {
  [P in keyof T]?: T[P];
};

// Creates a type with only the specified keys from another type
export type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

// Removes specified keys from a type
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

// Deep partial type for nested objects
export type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: DeepPartial<T[P]>;
} : T;

// Converts all properties in an object to readonly
export type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

// Nullish value type
export type Nullish<T> = T | null | undefined;