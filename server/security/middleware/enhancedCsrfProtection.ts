/**
 * Enhanced CSRF Protection Middleware
 * 
 * This module provides comprehensive CSRF protection for the application that can be
 * applied universally to all routes requiring protection.
 * 
 * Features:
 * - Double submit cookie pattern
 * - SameSite cookie protection
 * - Per-request token rotation
 * - Multiple token validation methods
 * - Cryptographically secure token generation
 * - Support for both web and API routes
 * - Memory-based token storage with cleanup
 * - Automatic token refreshing for SPAs
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// Simple security logging function to track events
function logSecurityEvent(eventType: string, data, level: string): void {
  console.log(`[SECURITY] ${level.toUpperCase()} - ${eventType}: ${JSON.stringify(data)}`);
}

// Security log levels
const SecurityLogLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error'
};

// Generate a secure random token of specified length
function generateSecureToken(length = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

// In-memory token store
const memoryTokenStore: Record<string, {
  token: string;
  issued: Date;
  expires: Date;
  nonce?: string;
}> = {};

// Token serialization helpers
function serializeTokenData(token: string, nonce?: string): string {
  if (!nonce) return token;
  return `${token}.${nonce}`;
}

function deserializeTokenData(serialized: string): { token: string; nonce?: string } {
  if (!serialized.includes('.')) return { token: serialized };
  
  const parts = serialized.split('.');
  const token = parts[0];
  const nonce = parts.length > 1 ? parts[1] : undefined;
  return { token, nonce };
}

// Configuration options
const CSRF_HEADER = 'X-CSRF-Token';
const CSRF_COOKIE = 'csrf_token';
const CSRF_FIELD = '_csrf';
const TOKEN_EXPIRY = 2 * 60 * 60 * 1000; // 2 hours
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/'
};

// Routes that should be exempt from CSRF protection
const EXEMPT_ROUTES = [
  // External API webhooks that need to bypass CSRF
  '/api/webhooks/',
  '/api/external-service-callback',
  '/api/stripe-webhook',
  // Add other routes that need exemption here
];

// Setup token cleanup for memory store
const cleanupExpiredTokens = () => {
  const now = new Date();
  Object.keys(memoryTokenStore).forEach(key => {
    if (memoryTokenStore[key].expires < now) {
      delete memoryTokenStore[key];
    }
  });
};

setInterval(cleanupExpiredTokens, 15 * 60 * 1000); // every 15 minutes

/**
 * Check if a route should be exempt from CSRF protection
 * 
 * @param path Route path to check
 * @returns Whether the route is exempt
 */
function isExemptRoute(path: string): boolean {
  return EXEMPT_ROUTES.some(exempt => path.startsWith(exempt));
}

/**
 * Generate a cryptographically secure CSRF token
 * 
 * @param req Express request
 * @param useNonce Whether to include a nonce in the token
 * @returns The generated token and optional nonce
 */
export function generateEnhancedCsrfToken(req: Request, useNonce = false): { token: string; nonce?: string } {
  // Generate primary token with high entropy
  const token = generateSecureToken(48); // Increased from 32 to 48 bytes
  
  // Optionally generate a nonce for double verification
  const nonce = useNonce ? crypto.randomBytes(8).toString('hex') : undefined;
  
  // Get a stable session identifier
  const sessionId = req.sessionID || req.cookies?.sid || crypto.randomUUID();
  
  // Set expiry data
  const now = new Date();
  const expires = new Date(now.getTime() + TOKEN_EXPIRY);
  
  // Store token data
  memoryTokenStore[sessionId] = {
    token,
    issued: now,
    expires,
    nonce
  };
  
  // Log token generation with security event
  logSecurityEvent('CSRF_TOKEN_GENERATED', {
    sessionId,
    expires,
    useNonce,
    timestamp: now
  }, SecurityLogLevel.DEBUG);
  
  return { token, nonce };
}

/**
 * Verify a CSRF token against the stored token
 * 
 * @param req Express request
 * @param token CSRF token to verify
 * @param providedNonce Optional nonce for additional verification
 * @returns Whether the token is valid
 */
function verifyEnhancedCsrfToken(req: Request, token: string, providedNonce?: string): boolean {
  if (!token) return false;
  
  // Get session identifier
  const sessionId = req.sessionID || req.cookies?.sid;
  if (!sessionId) return false;
  
  const storedData = memoryTokenStore[sessionId];
  
  if (!storedData) return false;
  
  // Check if token has expired
  if (storedData.expires < new Date()) {
    delete memoryTokenStore[sessionId];
    return false;
  }
  
  // If nonce is provided, verify it matches
  if (providedNonce && storedData.nonce && providedNonce !== storedData.nonce) {
    return false;
  }
  
  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(token),
      Buffer.from(storedData.token)
    );
  } catch (error) {
    // Handle case where token lengths don't match
    logSecurityEvent('CSRF_TOKEN_COMPARISON_ERROR', {
      sessionId,
      error: (error as Error).message,
      timestamp: new Date()
    }, SecurityLogLevel.WARN);
    return false;
  }
}

/**
 * Enhanced CSRF protection middleware factory
 * Provides enhanced protection with various options
 * 
 * @param options Optional configuration for the middleware
 * @returns Express middleware function
 */
export function enhancedCsrfProtection(options: {
  useNonce?: boolean;
  exemptRoutes?: string[];
  cookieName?: string;
  headerName?: string;
  formFieldName?: string;
  cookieOptions?: Record<string, unknown>;
} = {}) {
  // Apply custom options
  const customExemptRoutes = options.exemptRoutes || [];
  const cookieName = options.cookieName || CSRF_COOKIE;
  const headerName = options.headerName || CSRF_HEADER;
  const formFieldName = options.formFieldName || CSRF_FIELD;
  const useNonce = options.useNonce || false;
  const cookieOptions = {
    ...COOKIE_OPTIONS,
    ...(options.cookieOptions || {})
  };
  
  // Combined exempt routes
  const allExemptRoutes = [...EXEMPT_ROUTES, ...customExemptRoutes];
  
  // Return the middleware function
  return (req: Request, res: Response, next: NextFunction) => {
    // Check if route is exempt from CSRF protection
    if (allExemptRoutes.some(exempt => req.path.startsWith(exempt))) {
      return next();
    }
    
    // Skip CSRF protection for GET, HEAD, OPTIONS requests (safe methods)
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      // Generate and attach a new token for the next request
      const { token, nonce } = generateEnhancedCsrfToken(req, useNonce);
      
      // Set token in cookie
      const tokenData = useNonce ? serializeTokenData(token, nonce) : token;
      res.cookie(cookieName, tokenData, cookieOptions);
      
      // Store token in session if available
      if (req.session) {
        // We need to use type assertion here because the SessionData interface
        // doesn't include our custom fields by default
        (req.session as any).csrfToken = token;
        if (useNonce) {
          (req.session as any).csrfNonce = nonce;
        }
      }
      
      // Add token to response headers
      res.setHeader(headerName, token);
      
      // Make token available to views
      res.locals.csrfToken = token;
      
      return next();
    }
    
    // For POST, PUT, DELETE, PATCH requests, validate the token
    let token: string | undefined;
    let nonce: string | undefined;
    
    // Check multiple sources for token
    // 1. Custom header (SPA/API clients)
    if (req.headers[headerName.toLowerCase()]) {
      token = req.headers[headerName.toLowerCase()] as string;
    } 
    // 2. Form field (traditional form submissions)
    else if (req.body && req.body[formFieldName]) {
      token = req.body[formFieldName] as string;
    } 
    // 3. Query parameter (alternative for GET state modifications)
    else if (req.query && req.query[formFieldName]) {
      token = req.query[formFieldName] as string;
    } 
    // 4. Cookie value (fallback)
    else if (req.cookies && req.cookies[cookieName]) {
      const cookieValue = req.cookies[cookieName];
      
      // Check if token contains nonce
      if (useNonce && cookieValue.includes('.')) {
        const parts = cookieValue.split('.');
        token = parts[0];
        nonce = parts[1];
      } else {
        token = cookieValue;
      }
    }
    
    // If no token found, reject the request
    if (!token) {
      logSecurityEvent('CSRF_VALIDATION_FAILURE', {
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        reason: 'Missing CSRF token',
        timestamp: new Date()
      }, SecurityLogLevel.WARN);
      
      return res.status(403).json({
        status: 'error',
        message: 'CSRF protection: Token missing or invalid',
        code: 'CSRF_MISSING_TOKEN'
      });
    }
    
    // Verify token
    if (!verifyEnhancedCsrfToken(req, token, nonce)) {
      logSecurityEvent('CSRF_VALIDATION_FAILURE', {
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        reason: 'Invalid CSRF token',
        timestamp: new Date()
      }, SecurityLogLevel.WARN);
      
      return res.status(403).json({
        status: 'error',
        message: 'CSRF protection: Token verification failed',
        code: 'CSRF_INVALID_TOKEN'
      });
    }
    
    // Token verified successfully, rotate for enhanced security
    const { token: newToken, nonce: newNonce } = generateEnhancedCsrfToken(req, useNonce);
    
    // Set new token in cookie
    const newTokenData = useNonce ? serializeTokenData(newToken, newNonce) : newToken;
    res.cookie(cookieName, newTokenData, cookieOptions);
    
    // Update session
    if (req.session) {
      (req.session as any).csrfToken = newToken;
      if (useNonce) {
        (req.session as any).csrfNonce = newNonce;
      }
    }
    
    // Update response headers
    res.setHeader(headerName, newToken);
    
    // Make available to views
    res.locals.csrfToken = newToken;
    
    // Log token rotation
    logSecurityEvent('CSRF_TOKEN_ROTATED', {
      method: req.method,
      path: req.path,
      ip: req.ip,
      timestamp: new Date()
    }, SecurityLogLevel.DEBUG);
    
    next();
  };
}

/**
 * Get the CSRF token and optional nonce from a request
 * 
 * @param req Express request
 * @returns The CSRF token and optional nonce
 */
export function getEnhancedCsrfToken(req: Request): { token?: string; nonce?: string } {
  if (req.session && (req.session as any).csrfToken) {
    return { 
      token: (req.session as any).csrfToken,
      nonce: (req.session as any).csrfNonce
    };
  } else if (req.cookies && req.cookies[CSRF_COOKIE]) {
    const cookieValue = req.cookies[CSRF_COOKIE];
    
    // Check if token contains nonce
    if (cookieValue.includes('.')) {
      const parts = cookieValue.split('.');
      return {
        token: parts[0],
        nonce: parts[1]
      };
    } else {
      return { token: cookieValue };
    }
  }
  
  return {};
}

/**
 * Set CSRF token header in response
 * 
 * @param req Express request
 * @param res Express response
 */
export function setEnhancedCsrfTokenHeader(req: Request, res: Response): void {
  const { token } = getEnhancedCsrfToken(req);
  const finalToken = token || generateEnhancedCsrfToken(req).token;
  res.setHeader(CSRF_HEADER, finalToken);
}

/**
 * Add CSRF token to an object (for template rendering)
 * 
 * @param req Express request
 * @param data Data object to add token to
 * @returns The same object with token added
 */
export function addEnhancedCsrfToken<T extends Record<string, any>>(req: Request, data: T): T & { csrfToken: string } {
  const { token } = getEnhancedCsrfToken(req);
  const finalToken = token || generateEnhancedCsrfToken(req).token;
  
  return {
    ...data,
    csrfToken: finalToken
  };
}

/**
 * Create a CSRF compatible form field for templates
 * 
 * @param req Express request
 * @returns HTML string containing a hidden input field with the CSRF token
 */
export function createCsrfFormField(req: Request): string {
  const { token } = getEnhancedCsrfToken(req);
  const finalToken = token || generateEnhancedCsrfToken(req).token;
  
  return `<input type="hidden" name="${CSRF_FIELD}" value="${finalToken}">`;
}