/**
 * XSS Protection Middleware
 * 
 * This module provides Express middleware to protect against XSS attacks
 * by applying security headers and input sanitization.
 */

import { Request, Response, NextFunction } from 'express';
import { securityHeadersMiddleware, xssMiddleware } from '../security/xss/XssPrevention';
import { SecurityEventCategory, SecurityEventSeverity } from '../security/advanced/blockchain/SecurityEventTypes';
import { securityBlockchain } from '../security/advanced/blockchain/ImmutableSecurityLogs';

/**
 * Apply all XSS protection middleware at once
 */
export function applyXssProtection(app: any) {
  console.log('[SECURITY] Applying XSS protection middleware');
  
  // Log the initialization
  securityBlockchain.addSecurityEvent({
    category: SecurityEventCategory.SECURITY_INITIALIZATION as any,
    severity: SecurityEventSeverity.INFO,
    message: 'XSS protection middleware initialized',
    timestamp: Date.now(),
    metadata: {
      component: 'xssProtection',
      protections: [
        'Content-Security-Policy',
        'X-XSS-Protection',
        'X-Content-Type-Options',
        'X-Frame-Options',
        'Referrer-Policy',
        'Input sanitization'
      ]
    }
  }).catch(err => {
    console.error('[SECURITY ERROR] Failed to log XSS middleware initialization:', err);
  });
  
  // Apply security headers
  app.use(securityHeadersMiddleware({
    csp: true,
    xssProtection: true,
    noSniff: true,
    frameOptions: 'DENY',
    referrerPolicy: 'strict-origin-when-cross-origin',
    nonce: true
  }));
  
  // Apply input sanitization
  app.use(xssMiddleware({
    allowHtmlInBody: false,  // Disallow HTML in request body by default
    scanBody: true,          // Scan request body
    scanQuery: true,         // Scan query parameters
    scanParams: true,        // Scan URL parameters
    scanHeaders: false       // Don't scan headers (can cause issues with some proxies)
  }));
  
  // Advanced XSS attack detection and logging
  app.use(xssAttackDetectionMiddleware());
}

/**
 * Middleware to detect potential XSS attacks in real-time
 */
function xssAttackDetectionMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Known XSS attack patterns to detect
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/i,
      /javascript:/i,
      /data:text\/html/i,
      /vbscript:/i,
      /expression\s*\(/i,
      /on\w+\s*=\s*["']/i,
      /<iframe/i,
      /<embed/i,
      /<object/i,
      /document\.cookie/i,
      /document\.location/i,
      /document\.write/i,
      /localStorage/i,
      /sessionStorage/i,
      /alert\s*\(/i,
      /eval\s*\(/i,
      /setTimeout\s*\(/i,
      /setInterval\s*\(/i,
      /innerHTML/i,
      /outerHTML/i
    ];
    
    // Function to check a single value against XSS patterns
    const checkValue = (value: any, path: string) => {
      if (typeof value !== 'string') return false;
      
      for (const pattern of xssPatterns) {
        if (pattern.test(value)) {
          // Potential XSS attack detected
          const match = value.match(pattern);
          
          // Log the attack
          securityBlockchain.addSecurityEvent({
            category: SecurityEventCategory.ATTACK_ATTEMPT as any,
            severity: SecurityEventSeverity.MEDIUM,
            message: 'Potential XSS attack detected',
            timestamp: Date.now(),
            metadata: {
              path: req.path,
              method: req.method,
              ip: req.ip,
              dataPath: path,
              pattern: pattern.toString(),
              match: match ? match[0] : null,
              // Don't log the full value to avoid sensitive data exposure
              valuePreview: value.substring(0, 50) + (value.length > 50 ? '...' : '')
            }
          }).catch(err => {
            console.error('[SECURITY ERROR] Failed to log XSS attack:', err);
          });
          
          return true;
        }
      }
      
      return false;
    };
    
    // Function to recursively scan objects for XSS payloads
    const scanObject = (obj: any, path: string) => {
      if (!obj || typeof obj !== 'object') return false;
      
      if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
          const itemPath = `${path}[${i}]`;
          if (typeof obj[i] === 'string') {
            if (checkValue(obj[i], itemPath)) return true;
          } else if (typeof obj[i] === 'object') {
            if (scanObject(obj[i], itemPath)) return true;
          }
        }
      } else {
        for (const key in obj) {
          const valuePath = path ? `${path}.${key}` : key;
          if (typeof obj[key] === 'string') {
            if (checkValue(obj[key], valuePath)) return true;
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            if (scanObject(obj[key], valuePath)) return true;
          }
        }
      }
      
      return false;
    };
    
    // Scan request components
    let attackDetected = false;
    
    // Scan URL
    attackDetected = attackDetected || checkValue(req.url, 'req.url');
    
    // Scan query parameters
    attackDetected = attackDetected || scanObject(req.query, 'req.query');
    
    // Scan parameters
    attackDetected = attackDetected || scanObject(req.params, 'req.params');
    
    // Scan body
    attackDetected = attackDetected || scanObject(req.body, 'req.body');
    
    // If attack is highly suspicious, we can block the request
    // This is commented out by default to avoid false positives
    /*
    if (attackDetected) {
      // Log the blocked attack
      securityBlockchain.addSecurityEvent({
        category: SecurityEventCategory.ATTACK_BLOCKED,
        severity: SecurityEventSeverity.HIGH,
        message: 'XSS attack blocked',
        timestamp: Date.now(),
        metadata: {
          path: req.path,
          method: req.method,
          ip: req.ip
        }
      }).catch(err => {
        console.error('[SECURITY ERROR] Failed to log blocked XSS attack:', err);
      });
      
      return res.status(403).send({ 
        error: 'Request blocked due to security concerns',
        code: 'SECURITY_VIOLATION'
      });
    }
    */
    
    next();
  };
}

/**
 * Middleware to add a Content-Security-Policy nonce to the response locals
 * so it can be used in templates
 */
export function cspNonceMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const crypto = require('crypto');
    res.locals.cspNonce = crypto.randomBytes(16).toString('base64');
    
    // Set CSP header with nonce
    const csp = `default-src 'self'; script-src 'self' 'nonce-${res.locals.cspNonce}'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests;`;
    
    res.setHeader('Content-Security-Policy', csp);
    next();
  };
}

/**
 * Example usage:
 * 
 * import express from 'express';
 * import { applyXssProtection } from './middleware/xssProtection';
 * 
 * const app = express();
 * 
 * // Apply all XSS protection middleware
 * applyXssProtection(app);
 * 
 * // Rest of application
 */