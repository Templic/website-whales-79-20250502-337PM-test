/**
 * API Request Type Definitions
 * 
 * This file defines types for API requests.
 * These types ensure consistent request handling and validation.
 */

import { AuthenticatedUser } from '../core/security-types';

/**
 * Base request interface
 */
export interface BaseRequest {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';
  headers: Record<string, string>;
  query: Record<string, string | string[]>;
  params: Record<string, string>;
  body?: any;
  user?: AuthenticatedUser;
  ip?: string;
  protocol?: string;
  secure?: boolean;
  timestamp?: number;
  id?: string;
  correlationId?: string;
}

/**
 * Paginated request interface
 */
export interface PaginatedRequest extends BaseRequest {
  query: {
    page?: string;
    limit?: string;
    sort?: string;
    order?: 'asc' | 'desc';
    [key: string]: string | string[] | undefined;
  };
}

/**
 * Authenticated request interface
 */
export interface AuthenticatedRequest extends BaseRequest {
  user: AuthenticatedUser; // User is guaranteed to exist
}

/**
 * File upload request interface
 */
export interface FileUploadRequest extends BaseRequest {
  files: {
    [fieldname: string]: {
      fieldname: string;
      originalname: string;
      encoding: string;
      mimetype: string;
      size: number;
      destination: string;
      filename: string;
      path: string;
      buffer?: Buffer;
    } | {
      fieldname: string;
      originalname: string;
      encoding: string;
      mimetype: string;
      size: number;
      destination: string;
      filename: string;
      path: string;
      buffer?: Buffer;
    }[];
  };
}

/**
 * Search request interface
 */
export interface SearchRequest extends PaginatedRequest {
  query: {
    q?: string;
    fields?: string | string[];
    filter?: string;
    page?: string;
    limit?: string;
    sort?: string;
    order?: 'asc' | 'desc';
    [key: string]: string | string[] | undefined;
  };
}

/**
 * Login request interface
 */
export interface LoginRequest extends BaseRequest {
  body: {
    username: string;
    password: string;
    remember?: boolean;
  };
}

/**
 * Registration request interface
 */
export interface RegistrationRequest extends BaseRequest {
  body: {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    firstName?: string;
    lastName?: string;
    [key: string]: any;
  };
}

/**
 * Password reset request interface
 */
export interface PasswordResetRequest extends BaseRequest {
  body: {
    token: string;
    password: string;
    confirmPassword: string;
  };
}

/**
 * Webhook request interface
 */
export interface WebhookRequest extends BaseRequest {
  body: {
    event: string;
    timestamp: number;
    data: any;
    signature?: string;
    [key: string]: any;
  };
  headers: {
    'x-webhook-signature'?: string;
    [key: string]: string | undefined;
  };
}

/**
 * API key request interface
 */
export interface ApiKeyRequest extends BaseRequest {
  apiKey: {
    id: string;
    name: string;
    key: string; // Truncated for security
    scopes: string[];
    expiresAt?: Date;
  };
}

/**
 * Batch request interface
 */
export interface BatchRequest extends BaseRequest {
  body: {
    requests: {
      method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      path: string;
      body?: any;
      headers?: Record<string, string>;
      id?: string;
    }[];
  };
}

/**
 * Type guard to check if a request is authenticated
 */
export function isAuthenticatedRequest(request: BaseRequest): request is AuthenticatedRequest {
  return request.user !== undefined;
}

/**
 * Type guard to check if a request is a file upload request
 */
export function isFileUploadRequest(request: BaseRequest): request is FileUploadRequest {
  return 'files' in request && request.files !== undefined;
}

/**
 * Type guard to check if a request is a search request
 */
export function isSearchRequest(request: BaseRequest): request is SearchRequest {
  return 'query' in request && 'q' in request.query;
}

/**
 * Type guard to check if a request is a paginated request
 */
export function isPaginatedRequest(request: BaseRequest): request is PaginatedRequest {
  return 'query' in request && ('page' in request.query || 'limit' in request.query);
}

/**
 * Type guard to check if a request is a login request
 */
export function isLoginRequest(request: BaseRequest): request is LoginRequest {
  return (
    request.method === 'POST' && 
    request.body && 
    typeof request.body === 'object' && 
    'username' in request.body && 
    'password' in request.body
  );
}

/**
 * Type guard to check if a request is a registration request
 */
export function isRegistrationRequest(request: BaseRequest): request is RegistrationRequest {
  return (
    request.method === 'POST' && 
    request.body && 
    typeof request.body === 'object' && 
    'username' in request.body && 
    'email' in request.body && 
    'password' in request.body && 
    'confirmPassword' in request.body
  );
}

/**
 * Type guard to check if a request is a webhook request
 */
export function isWebhookRequest(request: BaseRequest): request is WebhookRequest {
  return (
    request.body && 
    typeof request.body === 'object' && 
    'event' in request.body && 
    'timestamp' in request.body && 
    'data' in request.body
  );
}

/**
 * Request validation result
 */
export interface RequestValidationResult {
  isValid: boolean;
  errors?: Record<string, string>;
  validatedData?: any;
}

/**
 * Generic request validation function
 */
export function validateRequest<T>(
  request: BaseRequest, 
  schema: any, 
  options?: {
    abortEarly?: boolean;
    stripUnknown?: boolean;
  }
): RequestValidationResult {
  try {
    // Mock implementation, would use Zod, Joi, or similar
    const validatedData = schema.parse(request.body);
    return {
      isValid: true,
      validatedData
    };
  } catch (error: unknown) {
    return {
      isValid: false,
      errors: error.errors || { _error: error.message || 'Validation failed' }
    };
  }
}