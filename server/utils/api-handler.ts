/**
 * API Request Handler Utility
 * 
 * This utility provides a type-safe way to handle API requests.
 * It ensures proper request validation, error handling, and response formatting.
 */

import {
  handleError,
  handleValidationError,
  handleAuthError,
  createErrorResponse
} from './error-handler';
import { validate } from './validation-util';
import type { 
  BaseRequest,
  AuthenticatedRequest, 
  RequestValidationResult 
} from '../types/api/request-types';
import type {
  Response,
  SuccessResponse,
  ErrorResponse,
  SpecialResponse
} from '../types/api/response-types';
import type { AuthenticatedUser } from '../types/core/security-types';

/**
 * Options for API request handler
 */
export interface ApiHandlerOptions<TRequest, TResponse> {
  // Authentication
  auth?: {
    required?: boolean;
    roles?: string[];
    permissions?: string[];
  };
  
  // Request validation
  validation?: {
    schema?: any;
    customValidator?: (request: TRequest) => RequestValidationResult;
  };
  
  // Response customization
  response?: {
    successCode?: number;
    errorCode?: number;
    cors?: boolean;
    headers?: Record<string, string>;
    cache?: {
      maxAge?: number;
      private?: boolean;
      revalidate?: boolean;
    };
  };
  
  // Other options
  onSuccess?: (result: TResponse, request: TRequest) => void;
  onError?: (error: any, request: TRequest) => any;
}

/**
 * Handler function type
 */
export type ApiHandler<
  TRequest extends BaseRequest, 
  TResponse
> = (request: TRequest) => Promise<TResponse | SpecialResponse | void> | TResponse | SpecialResponse | void;

/**
 * Express middleware function type
 */
export type ExpressMiddleware = (req: any, res: any, next: (error?: any) => void) => void;

/**
 * Creates an Express middleware handler with built-in error handling
 */
export function createApiHandler<
  TRequest extends BaseRequest, 
  TResponse
>(
  handler: ApiHandler<TRequest, TResponse>,
  options: ApiHandlerOptions<TRequest, TResponse> = {}
): ExpressMiddleware {
  return async (req: any, res: any, next: (error?: any) => void) => {
    try {
      // Convert Express request to our internal request type
      const request = mapExpressRequest<TRequest>(req);
      
      // Handle authentication if required
      if (options.auth?.required) {
        if (!request.user) {
          const authError = handleAuthError(
            new Error('Authentication required'),
            'unauthorized',
            { endpoint: request.path ? request.path.toString() : '', method: request.method }
          );
          return sendErrorResponse(res, authError);
        }
        
        // Check roles if specified
        if (options.auth.roles && options.auth.roles.length > 0) {
          const hasRole = checkUserRoles(request.user, options.auth.roles);
          if (!hasRole) {
            const authError = handleAuthError(
              new Error('Insufficient role permissions'),
              'forbidden',
              { 
                endpoint: request.path ? request.path.toString() : '', 
                method: request.method,
                requiredRoles: options.auth.roles,
                userRoles: request.user.roles
              }
            );
            return sendErrorResponse(res, authError);
          }
        }
        
        // Check permissions if specified
        if (options.auth.permissions && options.auth.permissions.length > 0) {
          const hasPermission = checkUserPermissions(request.user, options.auth.permissions);
          if (!hasPermission) {
            const authError = handleAuthError(
              new Error('Insufficient permissions'),
              'forbidden',
              { 
                endpoint: request.path ? request.path.toString() : '', 
                method: request.method,
                requiredPermissions: options.auth.permissions,
                userPermissions: request.user.permissions
              }
            );
            return sendErrorResponse(res, authError);
          }
        }
      }
      
      // Validate request if schema is provided
      if (options.validation) {
        let validationResult: RequestValidationResult;
        
        if (options.validation.customValidator) {
          validationResult = options.validation.customValidator(request);
        } else if (options.validation.schema) {
          const result = validate(request.body, options.validation.schema);
          validationResult = {
            isValid: result.isValid,
            errors: result.errors,
            validatedData: result.value
          };
        } else {
          validationResult = { isValid: true };
        }
        
        if (!validationResult.isValid) {
          const validationError = handleValidationError(
            new Error('Request validation failed'),
            validationResult.errors
          );
          return sendErrorResponse(res, validationError);
        }
        
        // Update request body with validated data if available
        if (validationResult.validatedData) {
          request.body = validationResult.validatedData;
        }
      }
      
      // Execute handler
      const result = await handler(request);
      
      // Handle response
      if (result === undefined || result === null) {
        // Send empty response (204 No Content)
        return sendEmptyResponse(res, options);
      }
      
      // Handle special responses (like redirects, streams, etc.)
      if (isSpecialResponse(result)) {
        return handleSpecialResponse(res, result);
      }
      
      // Execute onSuccess callback if provided
      if (options.onSuccess) {
        options.onSuccess(result as TResponse, request);
      }
      
      // Send success response
      sendSuccessResponse(res, result, options);
    } catch (error) {
      // Pass to next middleware if this isn't for us
      if ((error as any)?.isPassthrough) {
        return next(error);
      }
      
      // Convert error to proper format
      const formattedError = handleError(error);
      
      // Execute onError callback if provided
      if (options.onError) {
        const customError = options.onError(formattedError, req);
        if (customError) {
          return sendErrorResponse(res, customError);
        }
      }
      
      // Send error response
      sendErrorResponse(res, formattedError);
    }
  };
}

/**
 * Maps an Express request to our internal request type
 */
function mapExpressRequest<T extends BaseRequest>(req: any): T {
  const {
    path,
    method,
    headers,
    query,
    params,
    body,
    user,
    ip,
    protocol,
    secure,
    id,
    correlationId,
    files
  } = req;
  
  return {
    path: path ? path.toString() : '',
    method: method ? method.toUpperCase() : 'GET',
    headers: headers || {},
    query: query || {},
    params: params || {},
    body,
    user,
    ip,
    protocol,
    secure,
    id,
    correlationId,
    files,
    timestamp: Date.now()
  } as T;
}

/**
 * Sends a success response
 */
function sendSuccessResponse<T>(
  res: any,
  data: T,
  options: ApiHandlerOptions<any, any> = {}
): void {
  // Set status code
  const statusCode = options.response?.successCode || 200;
  
  // Set headers
  if (options.response?.headers) {
    for (const [key, value] of Object.entries(options.response.headers)) {
      res.setHeader(key, value);
    }
  }
  
  // Set cache headers if specified
  if (options.response?.cache) {
    const { maxAge, private: isPrivate, revalidate } = options.response.cache;
    
    let cacheControl = [];
    
    if (isPrivate) {
      cacheControl.push('private');
    } else {
      cacheControl.push('public');
    }
    
    if (maxAge !== undefined) {
      cacheControl.push(`max-age=${maxAge}`);
    }
    
    if (revalidate) {
      cacheControl.push('must-revalidate');
    }
    
    if (cacheControl.length > 0) {
      res.setHeader('Cache-Control', cacheControl.join(', '));
    }
  }
  
  // Set CORS headers if enabled
  if (options.response?.cors) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  
  // Create response object
  const response: SuccessResponse<T> = {
    success: true,
    statusCode,
    timestamp: Date.now(),
    data
  };
  
  // Send response
  res.status(statusCode).json(response);
}

/**
 * Sends an empty response
 */
function sendEmptyResponse(
  res: any,
  options: ApiHandlerOptions<any, any> = {}
): void {
  // Set status code
  const statusCode = options.response?.successCode || 204;
  
  // Set headers
  if (options.response?.headers) {
    for (const [key, value] of Object.entries(options.response.headers)) {
      res.setHeader(key, value);
    }
  }
  
  // Set CORS headers if enabled
  if (options.response?.cors) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  
  // Send response with no content
  res.status(statusCode).end();
}

/**
 * Sends an error response
 */
function sendErrorResponse(
  res: any,
  error: any
): void {
  // Extract error information
  const typedError = handleError(error);
  const statusCode = typedError.statusCode || 500;
  
  // Create error response object
  const response: ErrorResponse = {
    success: false,
    statusCode,
    timestamp: Date.now(),
    error: {
      message: typedError.message,
      code: typedError.code,
      details: typedError.details
    }
  };
  
  // Send response
  res.status(statusCode).json(response);
}

/**
 * Handles special responses like redirects, streams, etc.
 */
function handleSpecialResponse(
  res: any,
  response: SpecialResponse
): void {
  switch (response.type) {
    case 'redirect':
      res.redirect(response.statusCode || 302, response.url);
      break;
      
    case 'stream':
      if (response.headers) {
        for (const [key, value] of Object.entries(response.headers)) {
          res.setHeader(key, value);
        }
      }
      
      if (response.statusCode) {
        res.status(response.statusCode);
      }
      
      response.stream.pipe(res);
      break;
      
    case 'view':
      res.status(response.statusCode || 200).render(
        response.view,
        response.data,
        response.layout ? { layout: response.layout } : undefined
      );
      break;
  }
}

/**
 * Checks if a user has any of the required roles
 */
function checkUserRoles(
  user: AuthenticatedUser,
  requiredRoles: string[]
): boolean {
  if (!user.roles || user.roles.length === 0) {
    return false;
  }
  
  return requiredRoles.some(role => user.roles.includes(role));
}

/**
 * Checks if a user has all of the required permissions
 */
function checkUserPermissions(
  user: AuthenticatedUser,
  requiredPermissions: string[]
): boolean {
  if (!user.permissions || user.permissions.length === 0) {
    return false;
  }
  
  return requiredPermissions.every(permission => user.permissions!.includes(permission));
}

/**
 * Type guard to check if response is a special response
 */
function isSpecialResponse(response: any): response is SpecialResponse {
  return (
    response &&
    typeof response === 'object' &&
    'type' in response &&
    (
      response.type === 'redirect' ||
      response.type === 'stream' ||
      response.type === 'view'
    )
  );
}

/**
 * Helper method to create an authenticated-only API handler
 */
export function createAuthenticatedHandler<TResponse>(
  handler: ApiHandler<AuthenticatedRequest, TResponse>,
  options: Omit<ApiHandlerOptions<AuthenticatedRequest, TResponse>, 'auth'> = {}
): ExpressMiddleware {
  return createApiHandler(handler, {
    ...options,
    auth: {
      required: true,
      ...(options.auth || {})
    }
  });
}

/**
 * Helper to create a handler for specific HTTP methods
 */
export function createMethodHandler(
  methods: Array<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD'>,
  handler: ApiHandler<BaseRequest, any>,
  options: ApiHandlerOptions<BaseRequest, any> = {}
): ExpressMiddleware {
  return (req: any, res: any, next: (error?: any) => void) => {
    const method = req.method.toUpperCase();
    
    if (!methods.includes(method as any)) {
      // Pass to next handler if method doesn't match
      return next();
    }
    
    return createApiHandler(handler, options)(req, res, next);
  };
}

export default {
  createApiHandler,
  createAuthenticatedHandler,
  createMethodHandler
};