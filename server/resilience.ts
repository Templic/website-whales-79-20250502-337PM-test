/**
 * Resilience utilities for handling failures gracefully and preventing cascading failures
 */

import { Request, Response, NextFunction } from 'express';

// Circuit breaker states
type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

// Track circuit breaker state for different services
const circuitBreakers: { 
  [serviceName: string]: {
    state: CircuitBreakerState,
    failureCount: number,
    lastFailureTime: number,
    successCount: number,
    timeout: number,
    threshold: number,
    resetTimeout: number
  } 
} = {};

// Default circuit breaker settings
const DEFAULT_FAILURE_THRESHOLD = 5;
const DEFAULT_RESET_TIMEOUT = 30 * 1000; // 30 seconds
const DEFAULT_TIMEOUT = 10 * 1000; // 10 seconds

/**
 * Initialize resilience components
 */
export function initializeResilienceComponents(): void {
  console.log('Initializing resilience components...');
  
  // Initialize circuit breakers for key services
  createCircuitBreaker('database', {
    threshold: 3,
    resetTimeout: 60 * 1000, // 1 minute
    timeout: 5 * 1000
  });
  
  createCircuitBreaker('externalApi', {
    threshold: 5,
    resetTimeout: 2 * 60 * 1000, // 2 minutes
    timeout: 10 * 1000
  });
  
  // Set up global process error handlers for resilience
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception - Resilience layer caught:', error);
    // Log the error but don't crash the application
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection - Resilience layer caught at:', promise, 'reason:', reason);
    // Log the error but don't crash the application
  });
  
  console.log('Resilience components initialized');
}

/**
 * Shutdown resilience components
 */
export function shutdownResilienceComponents(): void {
  console.log('Shutting down resilience components...');
  // Clean up resources if needed
  console.log('Resilience components shut down');
}

/**
 * Create a circuit breaker for a service
 */
function createCircuitBreaker(
  serviceName: string, 
  options: { 
    threshold?: number,
    resetTimeout?: number,
    timeout?: number
  } = {}
) {
  circuitBreakers[serviceName] = {
    state: 'CLOSED',
    failureCount: 0,
    lastFailureTime: 0,
    successCount: 0,
    threshold: options.threshold || DEFAULT_FAILURE_THRESHOLD,
    resetTimeout: options.resetTimeout || DEFAULT_RESET_TIMEOUT,
    timeout: options.timeout || DEFAULT_TIMEOUT
  };
  
  console.log(`Circuit breaker created for service: ${serviceName}`);
}

/**
 * Check if a circuit is open for a service
 */
export function isCircuitOpen(serviceName: string): boolean {
  const breaker = circuitBreakers[serviceName];
  if (!breaker) return false;
  
  // If in OPEN state, check if it's time to try again
  if (breaker.state === 'OPEN') {
    const now = Date.now();
    if (now - breaker.lastFailureTime > breaker.resetTimeout) {
      // Transition to HALF_OPEN to allow a test request
      breaker.state = 'HALF_OPEN';
      console.log(`Circuit for ${serviceName} transitioning from OPEN to HALF_OPEN`);
      return false;
    }
    return true;
  }
  
  return false;
}

/**
 * Record a successful operation for a service
 */
export function recordSuccess(serviceName: string): void {
  const breaker = circuitBreakers[serviceName];
  if (!breaker) return;
  
  if (breaker.state === 'HALF_OPEN') {
    breaker.successCount++;
    
    // If we've had enough successes in HALF_OPEN, close the circuit
    if (breaker.successCount >= 2) { // Require 2 successful requests to close
      breaker.state = 'CLOSED';
      breaker.failureCount = 0;
      breaker.successCount = 0;
      console.log(`Circuit for ${serviceName} closed after successful test requests`);
    }
  } else if (breaker.state === 'CLOSED') {
    // Reset failure count on success in closed state
    breaker.failureCount = Math.max(0, breaker.failureCount - 1);
  }
}

/**
 * Record a failed operation for a service
 */
export function recordFailure(serviceName: string): void {
  const breaker = circuitBreakers[serviceName];
  if (!breaker) return;
  
  breaker.failureCount++;
  breaker.lastFailureTime = Date.now();
  
  // Check if we need to open the circuit
  if (breaker.state === 'CLOSED' && breaker.failureCount >= breaker.threshold) {
    breaker.state = 'OPEN';
    console.log(`Circuit for ${serviceName} opened after ${breaker.failureCount} failures`);
  } else if (breaker.state === 'HALF_OPEN') {
    // If failed during test request, go back to open
    breaker.state = 'OPEN';
    breaker.successCount = 0;
    console.log(`Circuit for ${serviceName} reopened after test request failure`);
  }
}

/**
 * Execute a function with circuit breaker protection
 */
export async function executeWithCircuitBreaker<T>(
  serviceName: string,
  fn: () => Promise<T>,
  fallbackFn?: () => Promise<T>
): Promise<T> {
  // If circuit is open, don't even try
  if (isCircuitOpen(serviceName)) {
    console.log(`Circuit for ${serviceName} is OPEN, using fallback`);
    if (fallbackFn) {
      return await fallbackFn();
    }
    throw new Error(`Service ${serviceName} is unavailable`);
  }
  
  try {
    // Set up timeout for the operation
    const breaker = circuitBreakers[serviceName];
    const timeout = breaker ? breaker.timeout : DEFAULT_TIMEOUT;
    
    const result = await Promise.race([
      fn(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error(`Operation timed out after ${timeout}ms`)), timeout)
      )
    ]);
    
    // Record success
    recordSuccess(serviceName);
    return result;
  } catch (error) {
    // Record failure
    recordFailure(serviceName);
    
    console.error(`Circuit breaker: operation for ${serviceName} failed:`, error);
    
    // Use fallback if provided
    if (fallbackFn) {
      return await fallbackFn();
    }
    
    throw error;
  }
}

/**
 * Retry an operation with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number,
    initialDelay?: number,
    maxDelay?: number,
    factor?: number,
    shouldRetry?: (error: any) => boolean
  } = {}
): Promise<T> {
  const maxRetries = options.maxRetries || 3;
  const initialDelay = options.initialDelay || 100;
  const maxDelay = options.maxDelay || 5000;
  const factor = options.factor || 2;
  const shouldRetry = options.shouldRetry || (() => true);
  
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt >= maxRetries || !shouldRetry(error)) {
        break;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(initialDelay * Math.pow(factor, attempt), maxDelay);
      
      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 100;
      
      console.log(`Retry attempt ${attempt + 1} for operation after ${delay + jitter}ms`);
      await new Promise(resolve => setTimeout(resolve, delay + jitter));
    }
  }
  
  throw lastError;
}

/**
 * Graceful degradation middleware
 */
export function gracefulDegradation(req: Request, res: Response, next: NextFunction) {
  // Attach degradation helper to the response
  (res as any).degrade = (normalHandler: Function, degradedHandler: Function) => {
    try {
      return normalHandler();
    } catch (error) {
      console.error('Graceful degradation activated due to error:', error);
      return degradedHandler(error);
    }
  };
  
  next();
}

/**
 * Timeout middleware
 */
export function timeoutMiddleware(timeout: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip timeout for specific routes
    if (req.path.includes('/health') || req.path.includes('/api/monitoring')) {
      return next();
    }
    
    // Set timeout
    const timeoutId = setTimeout(() => {
      // Only send timeout response if headers haven't been sent yet
      if (!res.headersSent) {
        console.error(`Request timeout: ${req.method} ${req.originalUrl}`);
        res.status(503).json({
          error: 'Service unavailable',
          message: 'Request timed out',
          retryAfter: 30 // seconds
        });
      }
    }, timeout);
    
    // Clear timeout when response is sent
    res.on('finish', () => {
      clearTimeout(timeoutId);
    });
    
    next();
  };
}

export default {
  initializeResilienceComponents,
  shutdownResilienceComponents,
  executeWithCircuitBreaker,
  retryWithBackoff,
  gracefulDegradation,
  timeoutMiddleware
};