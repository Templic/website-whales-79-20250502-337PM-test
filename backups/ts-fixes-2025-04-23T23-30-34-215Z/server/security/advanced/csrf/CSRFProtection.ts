/**
 * Cross-Site Request Forgery (CSRF) Protection Module
 * 
 * This module provides CSRF protection utilities and middleware for Express applications.
 * It generates, validates, and manages CSRF tokens to protect against CSRF attacks.
 */

import * as crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { securityBlockchain } from '../blockchain/ImmutableSecurityLogs';
import { SecurityEventSeverity, SecurityEventCategory } from '../blockchain/ImmutableSecurityLogs';

// Declare session property on Express Request
declare global {
  namespace Express {
    interface Request {
      session?: {
        id?: string;
        [key: string]: any;
      };
    }
  }
}

/**
 * CSRF configuration options
 */
export interface CSRFOptions {
  /**
   * The name of the CSRF token cookie (default: '_csrf')
   */
  cookieName?: string;
  
  /**
   * The name of the CSRF token header (default: 'x-csrf-token')
   */
  headerName?: string;
  
  /**
   * The expiration time of the CSRF token in milliseconds (default: 24 hours)
   */
  expiryTime?: number;
  
  /**
   * Routes to exclude from CSRF protection (default: [])
   */
  excludeRoutes?: string[];
  
  /**
   * Whether to enable double-submit verification (default: true)
   */
  doubleSubmitVerification?: boolean;
}

/**
 * Default CSRF options
 */
const defaultOptions: CSRFOptions = {
  cookieName: '_csrf',
  headerName: 'x-csrf-token',
  expiryTime: 24 * 60 * 60 * 1000, // 24 hours
  excludeRoutes: [],
  doubleSubmitVerification: true
};

/**
 * CSRF token data
 */
interface CSRFTokenData {
  token: string;
  expires: number;
  /**
   * Unique identifier for this token for tracking purposes
   */
  id?: string;
  /**
   * Session identifier this token is associated with
   */
  sessionId?: string;
  /**
   * Route this token was generated for (if using per-route tokens)
   */
  route?: string;
  /**
   * Whether this token has been used (for one-time tokens)
   */
  used?: boolean;
  /**
   * Creation timestamp
   */
  created: number;
}

/**
 * CSRF protection class
 */
export class CSRFProtection {
  /**
   * CSRF options
   */
  private options: CSRFOptions;
  
  /**
   * Create a new CSRF protection instance
   */
  constructor(options: CSRFOptions = {}) {
    this.options = { ...defaultOptions, ...options };
  }
  
  /**
   * Generate a new CSRF token
   * @param sessionId Optional session ID to associate with the token
   * @param route Optional route this token is for (for per-route tokens)
   */
  public generateToken(sessionId?: string, route?: string): CSRFTokenData {
    const token = crypto.randomBytes(32).toString('hex');
    const expiryTime = this.options.expiryTime ?? defaultOptions.expiryTime ?? 24 * 60 * 60 * 1000; // Default to 24 hours
    const expires = Date.now() + expiryTime;
    const created = Date.now();
    const id = crypto.randomBytes(8).toString('hex');
    
    return { 
      token, 
      expires, 
      created,
      id,
      sessionId,
      route,
      used: false
    };
  }
  
  /**
   * Validate a CSRF token
   * @param request The HTTP request to validate
   * @param route Optional route to validate the token against (for per-route tokens)
   * @returns A validation result with boolean success and potential reason for failure
   */
  public validateToken(request: Request, route?: string): { valid: boolean; reason?: string } {
    const cookieName = this.options.cookieName || defaultOptions.cookieName;
    const headerName = this.options.headerName || defaultOptions.headerName;
    
    // Extract tokens
    if (!request.cookies || !request.headers) {
      return { valid: false, reason: 'No cookies or headers in request' };
    }
    
    if (!cookieName) {
      return { valid: false, reason: 'CSRF cookie name is undefined' };
    }
    
    if (!headerName) {
      return { valid: false, reason: 'CSRF header name is undefined' };
    }
    
    const cookieToken = request.cookies[cookieName];
    const headerToken = request.headers[headerName.toLowerCase()] as string;
    
    // Check if tokens exist
    if (!cookieToken) {
      return { valid: false, reason: 'Missing CSRF cookie token' };
    }
    
    if (!headerToken) {
      return { valid: false, reason: 'Missing CSRF header token' };
    }
    
    // Parse cookie token data
    try {
      const cookieTokenData = JSON.parse(Buffer.from(cookieToken, 'base64').toString('utf-8')) as CSRFTokenData;
      
      // Check if token is expired
      if (cookieTokenData.expires < Date.now()) {
        return { valid: false, reason: 'CSRF token expired' };
      }
      
      // If token is marked as used and this is a one-time token
      if (cookieTokenData.used === true) {
        return { valid: false, reason: 'CSRF token already used (one-time token)' };
      }
      
      // If token was created too recently (potential token stealing attack)
      const minimumTokenAge = 500; // 500ms minimum token age
      if (cookieTokenData.created && (Date.now() - cookieTokenData.created < minimumTokenAge)) {
        return { valid: false, reason: 'CSRF token too new (potential token stealing attack)' };
      }
      
      // If route-specific tokens are being used, validate the route
      if (route && cookieTokenData.route && cookieTokenData.route !== route) {
        return { valid: false, reason: 'CSRF token is for a different route' };
      }
      
      // If double-submit verification is enabled, check if tokens match
      if (this.options.doubleSubmitVerification !== false) {
        if (cookieTokenData.token !== headerToken) {
          return { valid: false, reason: 'CSRF token mismatch between cookie and header' };
        }
      }
      
      // Mark token as used if it's a one-time token
      // In a production system, this would be persisted in a cache/store
      cookieTokenData.used = true;
      
      return { valid: true };
    } catch (error: Error) {
      console.error('Error validating CSRF token:', error);
      return { valid: false, reason: 'Invalid CSRF token format' };
    }
  }
  
  /**
   * Set CSRF token cookie and return the token
   */
  public setTokenCookie(response: Response): string {
    const cookieName = this.options.cookieName || defaultOptions.cookieName;
    const tokenData = this.generateToken();
    const maxAge = this.options.expiryTime || defaultOptions.expiryTime;
    
    if (!cookieName) {
      throw new Error('CSRF cookie name is undefined');
    }
    
    // Set cookie
    response.cookie(cookieName, Buffer.from(JSON.stringify(tokenData)).toString('base64'), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge
    });
    
    return tokenData.token;
  }
  
  /**
   * Create CSRF protection middleware
   */
  public createMiddleware(): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction) => {
      // Skip for non-state-changing methods
      if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
      }
      
      // Skip for excluded routes
      const excludeRoutes = this.options.excludeRoutes || [];
      for (const route of excludeRoutes) {
        if (req.path.startsWith(route)) {
          return next();
        }
      }
      
      // Validate token
      const validationResult = this.validateToken(req, req.path);
      
      if (!validationResult.valid) {
        // Log security event with detailed reason
        securityBlockchain.addSecurityEvent({
          severity: SecurityEventSeverity.HIGH,
          category: SecurityEventCategory.ATTACK_ATTEMPT,
          message: `CSRF token validation failed: ${validationResult.reason || 'Unknown reason'}`,
          ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
          metadata: {
            method: req.method,
            path: req.path,
            reason: validationResult.reason,
            userAgent: req.headers['user-agent']
          }
        }).catch(error => {
          console.error('Error logging CSRF validation failure:', error);
        });
        
        return res.status(403).json({
          error: 'Invalid CSRF token',
          message: 'CSRF validation failed',
          reason: validationResult.reason || 'Token validation failed'
        });
      }
      
      // On successful validation, generate a new token for the next request
      // This implements per-request tokens for maximum security
      const newToken = this.generateToken(
        req.session?.id, // Use session ID if available 
        req.path        // Use current path for route-specific tokens
      );
      
      // Set the new token in the response
      const cookieName = this.options.cookieName || defaultOptions.cookieName;
      if (!cookieName) {
        console.error('CSRF cookie name is undefined');
        return next();
      }
      
      const cookieValue = Buffer.from(JSON.stringify(newToken)).toString('base64');
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        maxAge: this.options.expiryTime || defaultOptions.expiryTime
      };
      
      res.cookie(cookieName, cookieValue, cookieOptions);
      
      // Also set the token header for SPA/AJAX use
      res.setHeader('X-CSRF-Token', newToken.token);
      
      next();
    };
  }
  
  /**
   * Create middleware to set CSRF token
   */
  public createTokenMiddleware(): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction) => {
      // Set token cookie and expose token in header
      const token = this.setTokenCookie(res);
      res.setHeader('X-CSRF-Token', token);
      
      next();
    };
  }
}

/**
 * Default CSRF protection instance
 */
export const csrfProtection = new CSRFProtection();

/**
 * Default CSRF protection middleware
 */
export const csrfMiddleware = csrfProtection.createMiddleware();

/**
 * Default CSRF token middleware
 */
export const csrfTokenMiddleware = csrfProtection.createTokenMiddleware();