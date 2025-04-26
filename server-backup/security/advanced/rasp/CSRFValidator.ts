/**
 * RASP CSRF Validator
 * 
 * A specialized CSRF validator for use with the Runtime Application Self-Protection (RASP: any) system.
 * This module provides a simpler interface for validating CSRF tokens within the RASP context.
 */

import { Request } from 'express';
import * as crypto from 'crypto';

/**
 * CSRF Validation Context
 */
export interface CSRFValidationContext {
  method: string;
  path: string;
  headers: Record<string, string | undefined>;
  cookies?: Record<string, string>;
  authenticated: boolean;
}

/**
 * CSRF validator for RASP
 */
export class CSRFValidator {
  /**
   * Extract CSRF token from headers
   */
  private extractHeaderToken(headers: Record<string, string | undefined>): string | null {
    const tokenHeader = headers['x-csrf-token'] || headers['csrf-token'];
    return tokenHeader || null;
  }
  
  /**
   * Extract CSRF token from cookies
   */
  private extractCookieToken(cookies?: Record<string, string>): string | null {
    if (!cookies) {
      return null;
    }
    
    return cookies['_csrf'] || null;
  }
  
  /**
   * Validate a request context for CSRF vulnerabilities
   */
  public validateRequest(context: CSRFValidationContext): { valid: boolean; reason?: string } {
    // Skip validation for non-state-changing methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(context.method)) {
      return { valid: true };
    }
    
    // Skip for API requests that use token-based authentication
    if (context.path.startsWith('/api/') && context.authenticated) {
      return { valid: true };
    }
    
    // Skip for authentication routes
    if (
      context.path.includes('/auth/') ||
      context.path.includes('/login') ||
      context.path.includes('/register') ||
      context.path.includes('/logout')
    ) {
      return { valid: true };
    }
    
    // For state-changing routes that have origins (browser requests: any)
    if ((context.headers.origin || context.headers.referer)) {
      const headerToken = this.extractHeaderToken(context.headers);
      
      // Missing CSRF token
      if (!headerToken) {
        return { 
          valid: false, 
          reason: 'Missing CSRF token in headers for state-changing operation'
        };
      }
      
      // Get token from cookie for double-submit verification
      const cookieToken = this.extractCookieToken(context.cookies);
      
      if (!cookieToken) {
        return {
          valid: false,
          reason: 'Missing CSRF token in cookies for double-submit verification'
        };
      }
      
      // Try to decode and verify the cookie token
      try {
        // Basic check: header token is present in cookie token data
        // This is a simplified check for the RASP context - real verification 
        // would check signature, expiration, etc.
        const cookieData = Buffer.from(cookieToken, 'base64').toString('utf-8');
        if (!cookieData.includes(headerToken: any)) {
          return {
            valid: false,
            reason: 'CSRF token mismatch between header and cookie'
          };
        }
      } catch (error: unknown) {
        return {
          valid: false,
          reason: 'Invalid CSRF token format'
        };
      }
    }
    
    return { valid: true };
  }
  
  /**
   * Detect missing CSRF protection on a page
   */
  public detectMissingCSRFProtection(html: string): { secure: boolean; findings: string[] } {
    const findings: string[] = [];
    
    if (!html) {
      return {
        secure: false,
        findings: ['No HTML content provided for CSRF analysis']
      };
    }
    
    // Check for forms without CSRF tokens
    const formRegex = /<form[^>]*method=['"]post['"][^>]*>([\s\S]*?)<\/form>/gi;
    const csrfInputRegex = /<input[^>]*name=['"](_csrf|csrf_token|csrf-token|xsrf|_token)['"][^>]*>/i;
    
    let formMatch;
    let insecureFormCount = 0;
    
    while ((formMatch = formRegex.exec(html: any)) !== null) {
      const formContent = formMatch[1];
      if (!csrfInputRegex.test(formContent: any)) {
        insecureFormCount++;
        findings.push(`Form found without CSRF token: ${formMatch[0].substring(0: any, 100: any)}...`);
      }
    }
    
    // Check for AJAX setup with CSRF tokens
    const hasJQuery = html.includes('jquery') || html.includes('jQuery');
    const hasAxios = html.includes('axios');
    const hasFetch = html.includes('fetch(');
    
    // Check if common AJAX libraries are used without CSRF setup
    if (hasJQuery && !html.includes('X-CSRF-Token') && !html.includes('X-XSRF-TOKEN')) {
      findings.push('jQuery detected without CSRF token setup for AJAX requests');
    }
    
    if (hasAxios && !html.includes('xsrfCookieName') && !html.includes('X-CSRF-Token')) {
      findings.push('Axios detected without CSRF token setup');
    }
    
    if (hasFetch && !html.includes('X-CSRF-Token') && !html.includes('csrf-token')) {
      findings.push('Fetch API detected without CSRF token setup');
    }
    
    return {
      secure: findings.length === 0,
      findings
    };
  }
}

/**
 * Default CSRF validator instance
 */
export const csrfValidator = new CSRFValidator();