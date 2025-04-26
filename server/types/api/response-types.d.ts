/**
 * API Response Type Definitions
 * 
 * This file defines types for API responses.
 * These types ensure consistent response formatting and error handling.
 */

import { BaseError } from '../core/error-types';
import { PaginationParams } from '../core/common-types';

/**
 * Base response interface
 */
export interface BaseResponse {
  success: boolean;
  statusCode: number;
  timestamp: number;
  requestId?: string;
  correlationId?: string;
}

/**
 * Success response interface
 */
export interface SuccessResponse<T = any> extends BaseResponse {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

/**
 * Error response interface
 */
export interface ErrorResponse extends BaseResponse {
  success: false;
  error: {
    message: string;
    code: string | number;
    details?: any;
    stack?: string;
  };
}

/**
 * Paginated response interface
 */
export interface PaginatedResponse<T = any> extends SuccessResponse<T[]> {
  meta: {
    pagination: PaginationParams;
    [key: string]: any;
  };
}

/**
 * Empty success response interface
 */
export interface EmptyResponse extends BaseResponse {
  success: true;
}

/**
 * File response interface
 */
export interface FileResponse extends BaseResponse {
  success: true;
  data: {
    url: string;
    filename: string;
    mimetype: string;
    size: number;
    id?: string;
    [key: string]: any;
  };
}

/**
 * Batch response interface
 */
export interface BatchResponse extends BaseResponse {
  success: true;
  data: Array<{
    id?: string;
    success: boolean;
    statusCode: number;
    data?: any;
    error?: {
      message: string;
      code: string | number;
    };
  }>;
}

/**
 * Auth token response interface
 */
export interface AuthTokenResponse extends SuccessResponse {
  data: {
    accessToken: string;
    refreshToken?: string;
    tokenType: 'Bearer';
    expiresIn: number;
    user?: {
      id: string;
      username: string;
      email?: string;
      roles: string[];
      [key: string]: any;
    };
  };
}

/**
 * Health check response interface
 */
export interface HealthCheckResponse extends SuccessResponse {
  data: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    version: string;
    uptime: number;
    checks: {
      name: string;
      status: 'pass' | 'warn' | 'fail';
      message?: string;
      details?: any;
    }[];
  };
}

/**
 * Stream response interface
 */
export interface StreamResponse {
  type: 'stream';
  stream: any; // NodeJS.ReadableStream
  headers?: Record<string, string>;
  statusCode?: number;
}

/**
 * Redirect response interface
 */
export interface RedirectResponse {
  type: 'redirect';
  url: string;
  statusCode?: 301 | 302 | 303 | 307 | 308;
}

/**
 * Rendered view response interface
 */
export interface ViewResponse {
  type: 'view';
  view: string;
  data?: any;
  layout?: string;
  statusCode?: number;
}

/**
 * Response type unions
 */
export type Response<T = any> = SuccessResponse<T> | ErrorResponse;
export type ApiResponse<T = any> = Response<T> | PaginatedResponse<T> | EmptyResponse | FileResponse | BatchResponse;
export type SpecialResponse = StreamResponse | RedirectResponse | ViewResponse;
export type AnyResponse<T = any> = ApiResponse<T> | SpecialResponse;

/**
 * Type guards
 */

/**
 * Type guard to check if a response is a success response
 */
export function isSuccessResponse<T = any>(response: Response<T>): response is SuccessResponse<T> {
  return response.success === true;
}

/**
 * Type guard to check if a response is an error response
 */
export function isErrorResponse(response: Response): response is ErrorResponse {
  return response.success === false;
}

/**
 * Type guard to check if a response is a paginated response
 */
export function isPaginatedResponse<T = any>(response: Response<T>): response is PaginatedResponse<T> {
  return (
    isSuccessResponse(response) && 
    'meta' in response && 
    response.meta !== undefined && 
    'pagination' in response.meta
  );
}

/**
 * Type guard to check if a response is a stream response
 */
export function isStreamResponse(response: AnyResponse): response is StreamResponse {
  return (
    'type' in response && 
    response.type === 'stream' && 
    'stream' in response
  );
}

/**
 * Type guard to check if a response is a redirect response
 */
export function isRedirectResponse(response: AnyResponse): response is RedirectResponse {
  return (
    'type' in response && 
    response.type === 'redirect' && 
    'url' in response
  );
}

/**
 * Type guard to check if a response is a view response
 */
export function isViewResponse(response: AnyResponse): response is ViewResponse {
  return (
    'type' in response && 
    response.type === 'view' && 
    'view' in response
  );
}

/**
 * Response creation helpers
 */

/**
 * Creates a success response
 */
export function createSuccessResponse<T = any>(
  data: T, 
  options?: {
    statusCode?: number;
    meta?: Record<string, unknown>;
    requestId?: string;
    correlationId?: string;
  }
): SuccessResponse<T> {
  return {
    success: true,
    statusCode: options?.statusCode || 200,
    timestamp: Date.now(),
    requestId: options?.requestId,
    correlationId: options?.correlationId,
    data,
    meta: options?.meta
  };
}

/**
 * Creates an error response
 */
export function createErrorResponse(
  error: Error | BaseError | string,
  options?: {
    statusCode?: number;
    errorCode?: string | number;
    details?: any;
    includeStack?: boolean;
    requestId?: string;
    correlationId?: string;
  }
): ErrorResponse {
  const isErrorObject = error instanceof Error;
  const baseError = isErrorObject ? error : new Error(error as string);
  
  // Extract error code and status code if available
  const errorCode = 
    options?.errorCode || 
    (isErrorObject && 'code' in baseError ? (baseError as any).code : undefined) || 
    'ERROR';
  
  const statusCode = 
    options?.statusCode || 
    (isErrorObject && 'statusCode' in baseError ? (baseError as any).statusCode : undefined) || 
    500;
  
  // Extract error details if available
  const details = 
    options?.details || 
    (isErrorObject && 'details' in baseError ? (baseError as any).details : undefined);
  
  return {
    success: false,
    statusCode,
    timestamp: Date.now(),
    requestId: options?.requestId,
    correlationId: options?.correlationId,
    error: {
      message: baseError.message,
      code: errorCode,
      details,
      stack: options?.includeStack ? baseError.stack : undefined
    }
  };
}

/**
 * Creates a paginated response
 */
export function createPaginatedResponse<T = any>(
  data: T[],
  pagination: PaginationParams,
  options?: {
    statusCode?: number;
    meta?: Omit<Record<string, any>, 'pagination'>;
    requestId?: string;
    correlationId?: string;
  }
): PaginatedResponse<T> {
  return {
    success: true,
    statusCode: options?.statusCode || 200,
    timestamp: Date.now(),
    requestId: options?.requestId,
    correlationId: options?.correlationId,
    data,
    meta: {
      pagination,
      ...options?.meta
    }
  };
}

/**
 * Creates an empty success response
 */
export function createEmptyResponse(
  options?: {
    statusCode?: number;
    requestId?: string;
    correlationId?: string;
  }
): EmptyResponse {
  return {
    success: true,
    statusCode: options?.statusCode || 204,
    timestamp: Date.now(),
    requestId: options?.requestId,
    correlationId: options?.correlationId
  };
}

/**
 * Creates a file response
 */
export function createFileResponse(
  fileData: {
    url: string;
    filename: string;
    mimetype: string;
    size: number;
    id?: string;
    [key: string]: any;
  },
  options?: {
    statusCode?: number;
    requestId?: string;
    correlationId?: string;
  }
): FileResponse {
  return {
    success: true,
    statusCode: options?.statusCode || 200,
    timestamp: Date.now(),
    requestId: options?.requestId,
    correlationId: options?.correlationId,
    data: fileData
  };
}

/**
 * Creates a stream response
 */
export function createStreamResponse(
  stream: any, // NodeJS.ReadableStream,
  options?: {
    headers?: Record<string, string>;
    statusCode?: number;
  }
): StreamResponse {
  return {
    type: 'stream',
    stream,
    headers: options?.headers,
    statusCode: options?.statusCode || 200
  };
}

/**
 * Creates a redirect response
 */
export function createRedirectResponse(
  url: string,
  options?: {
    statusCode?: 301 | 302 | 303 | 307 | 308;
  }
): RedirectResponse {
  return {
    type: 'redirect',
    url,
    statusCode: options?.statusCode || 302
  };
}

/**
 * Creates a view response
 */
export function createViewResponse(
  view: string,
  data?: any,
  options?: {
    layout?: string;
    statusCode?: number;
  }
): ViewResponse {
  return {
    type: 'view',
    view,
    data,
    layout: options?.layout,
    statusCode: options?.statusCode || 200
  };
}