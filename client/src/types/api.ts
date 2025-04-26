/**
 * API Types
 * 
 * This file contains type definitions for API-related data structures.
 * These types represent the shape of request and response objects for API calls.
 */

/**
 * Generic API response structure
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: Record<string, string[]>;
  timestamp?: string;
}

/**
 * Error response with validation errors
 */
export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  code?: string;
  timestamp?: string;
}

/**
 * Response for paginated data
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

/**
 * JSON-API specific response format
 */
export interface JsonApiResponse<T> {
  data: {
    id: string;
    type: string;
    attributes: T;
    relationships?: Record<string, {
      data: { id: string; type: string; } | { id: string; type: string; }[] | null;
    }>;
  } | {
    id: string;
    type: string;
    attributes: T;
    relationships?: Record<string, {
      data: { id: string; type: string; } | { id: string; type: string; }[] | null;
    }>;
  }[];
  included?: {
    id: string;
    type: string;
    attributes: Record<string, unknown>;
  }[];
  meta?: Record<string, unknown>;
  links?: {
    self?: string;
    first?: string;
    last?: string;
    prev?: string;
    next?: string;
  };
}

/**
 * Health check response
 */
export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'down';
  version: string;
  timestamp: string;
  services: {
    database: {
      status: 'ok' | 'degraded' | 'down';
      responseTime?: number;
    };
    cache?: {
      status: 'ok' | 'degraded' | 'down';
      responseTime?: number;
    };
    externalServices?: Record<string, {
      status: 'ok' | 'degraded' | 'down';
      responseTime?: number;
    }>;
  };
  uptime: number;
}

/**
 * Authentication request
 */
export interface AuthRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Authentication response
 */
export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

/**
 * Registration request
 */
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  confirmPassword: string;
}

/**
 * Password reset request
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Password update request
 */
export interface PasswordUpdateRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

/**
 * Response for file uploads
 */
export interface FileUploadResponse {
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  id: string;
}

/**
 * Analytics data point
 */
export interface AnalyticsDataPoint {
  date: string;
  value: number;
}

/**
 * Analytics time series data
 */
export interface AnalyticsTimeSeriesData {
  label: string;
  data: AnalyticsDataPoint[];
}

/**
 * Analytics metrics response
 */
export interface AnalyticsMetricsResponse {
  timeSeries: AnalyticsTimeSeriesData[];
  totalCount: number;
  previousPeriodCount: number;
  percentChange: number;
  topItems?: {
    label: string;
    value: number;
  }[];
}

/**
 * Notification API response
 */
export interface NotificationResponse {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
}