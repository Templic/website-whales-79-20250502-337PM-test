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
   */
  public generateToken(): CSRFTokenData {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + (this.options.expiryTime || defaultOptions.expiryTime);
    
    return { token, expires };
  }
  
  /**
   * Validate a CSRF token
   */
  public validateToken(request: Request): boolean {
    const cookieName = this.options.cookieName || defaultOptions.cookieName;
    const headerName = this.options.headerName || defaultOptions.headerName;
    
    // Extract tokens
    if (!request.cookies || !request.headers) {
      return false;
    }
    
    const cookieToken = request.cookies[cookieName];
    const headerToken = request.headers[headerName.toLowerCase()] as string;
    
    // Check if tokens exist
    if (!cookieToken || !headerToken) {
      return false;
    }
    
    // Parse cookie token data
    try {
      const cookieTokenData = JSON.parse(Buffer.from(cookieToken, 'base64').toString('utf-8')) as CSRFTokenData;
      
      // Check if token is expired
      if (cookieTokenData.expires < Date.now()) {
        return false;
      }
      
      // If double-submit verification is enabled, check if tokens match
      if (this.options.doubleSubmitVerification !== false) {
        return cookieTokenData.token === headerToken;
      }
      
      return true;
    } catch (error) {
      console.error('Error validating CSRF token:', error);
      return false;
    }
  }
  
  /**
   * Set CSRF token cookie and return the token
   */
  public setTokenCookie(response: Response): string {
    const cookieName = this.options.cookieName || defaultOptions.cookieName;
    const tokenData = this.generateToken();
    const maxAge = this.options.expiryTime || defaultOptions.expiryTime;
    
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
      if (!this.validateToken(req)) {
        // Log security event
        securityBlockchain.addSecurityEvent({
          severity: SecurityEventSeverity.HIGH,
          category: SecurityEventCategory.ATTACK_ATTEMPT,
          message: 'CSRF token validation failed',
          ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
          metadata: {
            method: req.method,
            path: req.path,
            userAgent: req.headers['user-agent']
          }
        }).catch(error => {
          console.error('Error logging CSRF validation failure:', error);
        });
        
        return res.status(403).json({
          error: 'Invalid CSRF token',
          message: 'CSRF validation failed'
        });
      }
      
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