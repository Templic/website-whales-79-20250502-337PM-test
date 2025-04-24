# TypeScript Error Handling Examples

This document provides examples of how to use the TypeScript error handling system implemented in this project.

## Table of Contents

1. [Basic Error Handling](#basic-error-handling)
2. [Specialized Error Types](#specialized-error-types)
3. [API Error Handling](#api-error-handling)
4. [Database Error Handling](#database-error-handling)
5. [Validation Error Handling](#validation-error-handling)
6. [Using Type Guards](#using-type-guards)
7. [Async Error Handling](#async-error-handling)
8. [Express Middleware](#express-middleware)
9. [React Component Error Handling](#react-component-error-handling)
10. [Best Practices](#best-practices)

## Basic Error Handling

### Creating and Handling Basic Errors

```typescript
import { handleError } from '../server/utils/error-handler';

// Handle a standard Error object
try {
  throw new Error('Something went wrong');
} catch (error) {
  const typedError = handleError(error);
  console.error(`Error (${typedError.code}): ${typedError.message}`);
}

// Handle a non-Error object
try {
  // @ts-ignore - Simulating an unexpected error type
  throw 'String error';
} catch (error) {
  const typedError = handleError(error);
  console.error(`Error (${typedError.code}): ${typedError.message}`);
}
```

### Creating Custom Error Responses

```typescript
import { createErrorResponse } from '../server/utils/error-handler';

// Create a standard error response
const errorResponse = createErrorResponse(
  'Invalid input data',
  400,
  'VALIDATION_ERROR'
);

// Create a detailed error response
const detailedErrorResponse = createErrorResponse(
  'Database operation failed',
  500,
  'DB_ERROR',
  {
    operation: 'insert',
    table: 'users',
    details: 'Unique constraint violation'
  }
);
```

## Specialized Error Types

### Security Errors

```typescript
import { handleSecurityError } from '../server/utils/error-handler';

function handleUnauthorizedAccess(userId: string, resource: string) {
  const error = new Error(`User does not have access to ${resource}`);
  
  const securityError = handleSecurityError(
    error,
    'high',
    {
      userId,
      resourceType: 'document',
      resourceId: resource,
      ipAddress: '192.168.1.1',
      endpoint: `/api/documents/${resource}`
    }
  );
  
  // Log security event
  logSecurityEvent(securityError);
  
  // Return appropriate response
  return {
    success: false,
    error: {
      message: securityError.message,
      code: securityError.code
    }
  };
}
```

### Validation Errors

```typescript
import { handleValidationError } from '../server/utils/error-handler';

function validateUserInput(data: any) {
  const errors: Record<string, string> = {};
  
  if (!data.username) {
    errors.username = 'Username is required';
  } else if (data.username.length < 3) {
    errors.username = 'Username must be at least 3 characters';
  }
  
  if (!data.email) {
    errors.email = 'Email is required';
  } else if (!/^[^@]+@[^@]+\.[^@]+$/.test(data.email)) {
    errors.email = 'Email format is invalid';
  }
  
  if (Object.keys(errors).length > 0) {
    const validationError = handleValidationError(
      new Error('Validation failed'),
      errors
    );
    
    throw validationError;
  }
  
  return data;
}
```

### Database Errors

```typescript
import { handleDatabaseError } from '../server/utils/error-handler';

async function getUserById(id: string) {
  try {
    // Example database query
    const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
  } catch (error) {
    throw handleDatabaseError(
      error,
      'query',
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
  }
}
```

### API Errors

```typescript
import { handleApiError } from '../server/utils/error-handler';

async function fetchExternalData(apiUrl: string) {
  try {
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    throw handleApiError(
      error,
      apiUrl,
      'GET'
    );
  }
}
```

## API Error Handling

### Using the API Handler

```typescript
import { createApiHandler } from '../server/utils/api-handler';
import { validate } from '../server/utils/validation-util';

// Create a schema for request validation
const userSchema = {
  type: 'object',
  properties: {
    username: {
      type: 'string',
      minLength: 3,
      maxLength: 50
    },
    email: {
      type: 'string',
      format: 'email'
    },
    age: {
      type: 'number',
      min: 18
    }
  },
  required: ['username', 'email']
};

// Create an API handler for creating users
const createUserHandler = createApiHandler(
  async (request) => {
    // Process the validated request
    const user = request.body;
    
    // Save user to database
    const result = await db.users.create(user);
    
    // Return the created user
    return {
      id: result.id,
      username: result.username,
      email: result.email
    };
  },
  {
    // Validation options
    validation: {
      schema: userSchema
    },
    
    // Response options
    response: {
      successCode: 201,
      headers: {
        'X-API-Version': '1.0'
      }
    }
  }
);

// Use in Express
app.post('/api/users', createUserHandler);
```

### Protected API Endpoints

```typescript
import { createAuthenticatedHandler } from '../server/utils/api-handler';

// Create a protected API handler that requires authentication
const getUserProfileHandler = createAuthenticatedHandler(
  async (request) => {
    // User is guaranteed to exist in authenticated requests
    const userId = request.user.id;
    
    // Get user profile from database
    const profile = await db.profiles.findByUserId(userId);
    
    return profile;
  },
  {
    // Add role requirements
    auth: {
      roles: ['user', 'admin']
    }
  }
);

// Use in Express
app.get('/api/profile', getUserProfileHandler);
```

## Database Error Handling

### Transaction Error Handling

```typescript
import { withErrorHandling, handleDatabaseError } from '../server/utils/error-handler';

// Run a database transaction with error handling
async function transferFunds(fromAccountId: string, toAccountId: string, amount: number) {
  return withErrorHandling(async () => {
    const transaction = await db.beginTransaction();
    
    try {
      // Deduct from source account
      await transaction.query(
        'UPDATE accounts SET balance = balance - $1 WHERE id = $2',
        [amount, fromAccountId]
      );
      
      // Add to destination account
      await transaction.query(
        'UPDATE accounts SET balance = balance + $1 WHERE id = $2',
        [amount, toAccountId]
      );
      
      // Commit the transaction
      await transaction.commit();
      
      return { success: true };
    } catch (error) {
      // Rollback the transaction
      await transaction.rollback();
      
      // Convert to typed error
      throw handleDatabaseError(
        error,
        'transaction',
        'Transfer funds transaction',
        [amount, fromAccountId, toAccountId]
      );
    }
  });
}
```

## Validation Error Handling

### Using the Validation Utility

```typescript
import { validateString, validateNumber, validateObject } from '../server/utils/validation-util';

// Validate individual fields
function validateProduct(data: any) {
  // Validate name (string)
  const nameResult = validateString(data.name, {
    minLength: 3,
    maxLength: 100,
    allowEmpty: false
  });
  
  if (!nameResult.isValid) {
    return {
      isValid: false,
      errors: { name: Object.values(nameResult.errors || {})[0] }
    };
  }
  
  // Validate price (number)
  const priceResult = validateNumber(data.price, {
    min: 0.01,
    positive: true
  });
  
  if (!priceResult.isValid) {
    return {
      isValid: false,
      errors: { price: Object.values(priceResult.errors || {})[0] }
    };
  }
  
  // All validations passed
  return {
    isValid: true,
    validatedData: {
      name: nameResult.value,
      price: priceResult.value
    }
  };
}

// Validate an entire object
function validateProductObject(data: any) {
  const result = validateObject(data, {
    name: (value) => validateString(value, { minLength: 3, maxLength: 100 }),
    price: (value) => validateNumber(value, { min: 0.01, positive: true }),
    description: (value) => validateString(value, { required: false, maxLength: 1000 })
  }, {
    requiredKeys: ['name', 'price']
  });
  
  return result;
}
```

### Validation in API Handlers

```typescript
import { createApiHandler } from '../server/utils/api-handler';
import { validate, validateOrThrow } from '../server/utils/validation-util';

// Create a product schema
const productSchema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      minLength: 3,
      maxLength: 100
    },
    price: {
      type: 'number',
      min: 0.01
    },
    description: {
      type: 'string',
      maxLength: 1000
    },
    categories: {
      type: 'array',
      items: {
        type: 'string'
      },
      maxLength: 5
    }
  },
  required: ['name', 'price']
};

// Create API handler with validation
const createProductHandler = createApiHandler(
  async (request) => {
    // The body has already been validated by the API handler
    const product = request.body;
    
    // Additional custom validation if needed
    if (product.price > 1000 && !product.description) {
      throw new Error('Description is required for high-value products');
    }
    
    // Save the product
    const result = await db.products.create(product);
    
    return result;
  },
  {
    validation: {
      schema: productSchema
    }
  }
);
```

## Using Type Guards

### Error Type Guards

```typescript
import { 
  isValidationError, 
  isDatabaseError,
  isApiError,
  isAuthError
} from '../server/types/core/error-types';

function handleApplicationError(error: unknown) {
  // Use type guards to handle different error types
  if (isValidationError(error)) {
    // Handle validation error
    return {
      status: 400,
      errors: error.fieldErrors,
      message: 'Validation failed'
    };
  }
  
  if (isDatabaseError(error)) {
    // Handle database error
    console.error(`Database error (${error.code}): ${error.message}`, {
      operation: error.operation,
      query: error.query
    });
    
    return {
      status: 500,
      message: 'Database operation failed'
    };
  }
  
  if (isApiError(error)) {
    // Handle API error
    return {
      status: error.statusCode || 500,
      message: `API error: ${error.message}`,
      endpoint: error.endpoint
    };
  }
  
  if (isAuthError(error)) {
    // Handle auth error
    return {
      status: error.statusCode,
      message: 'Authentication error',
      type: error.authErrorType
    };
  }
  
  // Handle unknown errors
  console.error('Unknown error:', error);
  return {
    status: 500,
    message: 'An unexpected error occurred'
  };
}
```

### Request and Response Type Guards

```typescript
import { 
  isAuthenticatedRequest,
  isFileUploadRequest,
  isSearchRequest
} from '../server/types/api/request-types';

import {
  isSuccessResponse,
  isErrorResponse,
  isPaginatedResponse
} from '../server/types/api/response-types';

function processRequest(request: any) {
  // Check request types
  if (isAuthenticatedRequest(request)) {
    // Process authenticated request
    const userId = request.user.id;
    // ...
  }
  
  if (isFileUploadRequest(request)) {
    // Process file upload request
    const files = request.files;
    // ...
  }
  
  if (isSearchRequest(request)) {
    // Process search request
    const query = request.query.q;
    const page = request.query.page;
    // ...
  }
}

function processResponse(response: any) {
  // Check response types
  if (isSuccessResponse(response)) {
    // Process success response
    const data = response.data;
    // ...
  }
  
  if (isErrorResponse(response)) {
    // Process error response
    const message = response.error.message;
    const code = response.error.code;
    // ...
  }
  
  if (isPaginatedResponse(response)) {
    // Process paginated response
    const items = response.data;
    const pagination = response.meta.pagination;
    // ...
  }
}
```

## Async Error Handling

### Using withErrorHandling

```typescript
import { withErrorHandling } from '../server/utils/error-handler';

// Use withErrorHandling for consistent error handling
async function fetchUserData(userId: string) {
  return withErrorHandling(async () => {
    // Perform async operations
    const userData = await api.getUser(userId);
    const userPosts = await api.getUserPosts(userId);
    
    return {
      user: userData,
      posts: userPosts
    };
  });
}

// With custom error handler
async function processPayment(paymentData: any) {
  return withErrorHandling(
    async () => {
      // Perform payment processing
      const result = await paymentGateway.process(paymentData);
      return result;
    },
    (error) => {
      // Custom error handling
      if (error.code === 'PAYMENT_DECLINED') {
        return {
          ...error,
          message: 'Your payment was declined. Please check your payment details.',
          statusCode: 400,
          userFriendly: true
        };
      }
      
      // Pass through other errors
      return error;
    }
  );
}
```

### Try-Catch Pattern

```typescript
import { handleError, handleApiError } from '../server/utils/error-handler';

async function fetchAndProcessData(url: string) {
  try {
    // Fetch data
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Process data
    return processData(data);
  } catch (error) {
    // Convert to typed error
    if (error instanceof Error && error.message.includes('API responded')) {
      throw handleApiError(error, url, 'GET');
    } else {
      throw handleError(error, 'Failed to fetch and process data');
    }
  }
}
```

## Express Middleware

### Error Handler Middleware

```typescript
import { createErrorHandlerMiddleware } from '../server/utils/error-handler';
import express from 'express';

const app = express();

// Add routes
app.get('/api/users', getUsersHandler);
app.post('/api/users', createUserHandler);

// Add error handler middleware
app.use(createErrorHandlerMiddleware({
  logErrors: true,
  exposeErrors: process.env.NODE_ENV !== 'production',
  defaultMessage: 'An unexpected error occurred'
}));

// Start server
app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### Authentication Middleware

```typescript
import { handleAuthError } from '../server/utils/error-handler';
import express from 'express';

// Authentication middleware
function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    // Get token from headers
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      throw handleAuthError(
        new Error('No authentication token provided'),
        'missing_token',
        { path: req.path, method: req.method }
      );
    }
    
    // Verify token
    const decoded = verifyToken(token);
    
    // Set user on request
    req.user = decoded;
    
    // Continue to next middleware
    next();
  } catch (error) {
    // Pass to error handler middleware
    next(error);
  }
}

// Use middleware
app.use('/api/protected', authMiddleware);
```

## React Component Error Handling

### Using Error Boundaries

```tsx
import React, { ErrorInfo } from 'react';
import { handleError } from '../server/utils/error-handler';

interface ErrorBoundaryProps {
  fallback?: React.ReactNode;
  children: React.ReactNode;
  onError?: (error: Error) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Process error using our error handling system
    const typedError = handleError(error);
    
    console.error('Component error:', typedError, errorInfo);
    
    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      // Render fallback UI
      return this.props.fallback || (
        <div className="error-container">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage
function App() {
  return (
    <ErrorBoundary
      fallback={<div>An error occurred. Please try again.</div>}
      onError={(error) => {
        // Report error to monitoring service
        reportError(error);
      }}
    >
      <YourComponent />
    </ErrorBoundary>
  );
}
```

### Error Handling in Hooks

```tsx
import { useState, useEffect } from 'react';
import { handleApiError } from '../server/utils/error-handler';

function useFetchData<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`API responded with status ${response.status}`);
        }
        
        const result = await response.json();
        
        if (isMounted) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          // Convert to typed error
          const typedError = handleApiError(err, url, 'GET');
          setError(typedError);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, [url]);

  return { data, loading, error };
}

// Usage
function UserProfile({ userId }: { userId: string }) {
  const { data, loading, error } = useFetchData(`/api/users/${userId}`);
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (error) {
    return (
      <div className="error">
        <h3>Error: {error.message}</h3>
        <button onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }
  
  return (
    <div className="user-profile">
      <h2>{data?.name}</h2>
      <p>{data?.email}</p>
    </div>
  );
}
```

## Best Practices

### Error Logging

```typescript
import { handleError } from '../server/utils/error-handler';

// Create a consistent error logging function
function logError(error: unknown, context: Record<string, any> = {}) {
  const typedError = handleError(error);
  
  // Add extra context
  const logContext = {
    ...context,
    errorName: typedError.name,
    errorCode: typedError.code,
    errorStack: typedError.stack,
    timestamp: new Date().toISOString()
  };
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error(`[ERROR] ${typedError.message}`, logContext);
  }
  
  // Send to logging service in production
  if (process.env.NODE_ENV === 'production') {
    loggingService.logError(typedError.message, {
      level: typedError.statusCode >= 500 ? 'error' : 'warn',
      context: logContext
    });
  }
  
  return typedError;
}
```

### Centralized Error Handling

```typescript
import { 
  handleError, 
  handleApiError, 
  handleDatabaseError,
  handleValidationError,
  handleAuthError
} from '../server/utils/error-handler';

// Create a centralized error handler
function handleAppError(error: unknown, context: Record<string, any> = {}): Error {
  let typedError;
  
  // Determine error type based on context
  if (context.type === 'api' && context.endpoint) {
    typedError = handleApiError(error, context.endpoint, context.method);
  } else if (context.type === 'database' && context.operation) {
    typedError = handleDatabaseError(error, context.operation, context.query);
  } else if (context.type === 'validation' && context.fieldErrors) {
    typedError = handleValidationError(error, context.fieldErrors);
  } else if (context.type === 'auth') {
    typedError = handleAuthError(error, context.authErrorType);
  } else {
    typedError = handleError(error);
  }
  
  // Log the error
  logError(typedError, context);
  
  return typedError;
}

// Usage
try {
  // Some operation
} catch (error) {
  throw handleAppError(error, {
    type: 'api',
    endpoint: '/api/users',
    method: 'GET',
    userId: '123'
  });
}
```

### Error Recovery Strategies

```typescript
import { withErrorHandling } from '../server/utils/error-handler';

// Implement retry logic
async function fetchWithRetry(url: string, maxRetries = 3) {
  return withErrorHandling(async () => {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`API responded with status ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        lastError = error;
        
        // Log retry attempt
        console.warn(`Fetch attempt ${attempt} failed, retrying...`, error);
        
        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
        }
      }
    }
    
    // All retries failed
    throw handleApiError(
      lastError || new Error('All retry attempts failed'),
      url,
      'GET'
    );
  });
}

// Circuit breaker pattern
class CircuitBreaker {
  private failureCount: number = 0;
  private lastFailureTime?: number;
  private isOpen: boolean = false;
  
  constructor(
    private maxFailures: number = 5,
    private resetTimeout: number = 30000 // 30 seconds
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.isOpen) {
      // Check if reset timeout has passed
      if (this.lastFailureTime && Date.now() - this.lastFailureTime > this.resetTimeout) {
        // Reset circuit to half-open state
        this.isOpen = false;
      } else {
        throw new Error('Circuit is open, request rejected');
      }
    }
    
    try {
      // Execute operation
      const result = await operation();
      
      // Reset failure count on success
      this.failureCount = 0;
      
      return result;
    } catch (error) {
      // Increment failure count
      this.failureCount++;
      this.lastFailureTime = Date.now();
      
      // Open circuit if failure threshold is reached
      if (this.failureCount >= this.maxFailures) {
        this.isOpen = true;
        console.warn('Circuit breaker opened due to multiple failures');
      }
      
      // Rethrow the error
      throw error;
    }
  }
}

// Usage
const apiCircuitBreaker = new CircuitBreaker();

async function getUser(userId: string) {
  return apiCircuitBreaker.execute(async () => {
    const response = await fetch(`/api/users/${userId}`);
    
    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }
    
    return response.json();
  });
}
```

These examples demonstrate how to use the TypeScript error handling system in various contexts. Adapt them to your specific needs and project requirements.