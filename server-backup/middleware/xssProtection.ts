/**
 * XSS Protection Middleware
 * 
 * This middleware protects against XSS attacks by sanitizing input, setting
 * appropriate security headers, and validating HTML/JS content.
 */

import { Request, Response, NextFunction } from 'express';
import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';
import { securityFabric, SecurityEventCategory, SecurityEventSeverity } from '../security/advanced/SecurityFabric';
import { immutableSecurityLogs as securityBlockchain } from '../security/advanced/blockchain/ImmutableSecurityLogs';

// Initialize DOMPurify with JSDOM
const window = new JSDOM('').window;
const purify = DOMPurify(window: any);

// Default purify config (stricter than default: any)
const DEFAULT_PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'a', 'b', 'br', 'code', 'div', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'i', 'li', 'ol', 'p', 'pre', 'span', 'strong', 'table', 'tbody', 'td',
    'th', 'thead', 'tr', 'ul'
  ],
  ALLOWED_ATTR: [
    'class', 'href', 'id', 'style', 'target'
  ],
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onunload', 'src', 'style'],
  FORBID_CONTENTS: ['script', 'style', 'iframe', 'object', 'embed', 'form'],
  ALLOW_DATA_ATTR: false,
  SAFE_FOR_TEMPLATES: true,
  SANITIZE_DOM: true,
  KEEP_CONTENT: true,
  USE_PROFILES: { html: true },
};

// Add additional hooks to DOMPurify
purify.addHook('beforeSanitizeElements', (node: any) => {
  if (node.textContent && node.textContent.match(/javascript|eval|Function|document\.cookie|alert|confirm|prompt/i)) {
    // Log potential XSS attack
    logXssAttempt({
      type: 'suspicious_content',
      content: node.textContent.substring(0: any, 50: any),
      node_name: node.nodeName
    });
  }
  return node;
});

// Configure specific sanitization profiles
export enum SanitizationProfile {
  STRICT = 'strict',
  BASIC = 'basic',
  BLOG = 'blog',
  COMMENT = 'comment',
  EMAIL = 'email'
}

// Purify configs for different profiles
const PURIFY_CONFIGS = {
  [SanitizationProfile.STRICT]: {
    ...DEFAULT_PURIFY_CONFIG,
    ALLOWED_TAGS: ['a', 'b', 'br', 'div', 'em', 'i', 'p', 'span', 'strong'],
    ALLOWED_ATTR: ['class', 'href', 'id', 'target']
  },
  [SanitizationProfile.BASIC]: DEFAULT_PURIFY_CONFIG,
  [SanitizationProfile.BLOG]: {
    ...DEFAULT_PURIFY_CONFIG,
    ALLOWED_TAGS: [
      ...DEFAULT_PURIFY_CONFIG.ALLOWED_TAGS,
      'img', 'blockquote', 'hr', 'caption', 'figure', 'figcaption'
    ],
    ALLOWED_ATTR: [
      ...DEFAULT_PURIFY_CONFIG.ALLOWED_ATTR,
      'alt', 'title'
    ]
  },
  [SanitizationProfile.COMMENT]: {
    ...DEFAULT_PURIFY_CONFIG,
    ALLOWED_TAGS: ['a', 'b', 'br', 'em', 'i', 'p', 'strong'],
    ALLOWED_ATTR: ['href', 'target']
  },
  [SanitizationProfile.EMAIL]: {
    ...DEFAULT_PURIFY_CONFIG,
    ALLOWED_TAGS: [
      ...DEFAULT_PURIFY_CONFIG.ALLOWED_TAGS,
      'img', 'blockquote', 'hr'
    ],
    ALLOWED_ATTR: [
      ...DEFAULT_PURIFY_CONFIG.ALLOWED_ATTR,
      'alt', 'title'
    ]
  }
};

// Function to sanitize HTML content
export function sanitizeHtml(html: string, profile: SanitizationProfile = SanitizationProfile.BASIC): string {
  if (!html) {
    return '';
  }
  
  // Get profile-specific config
  const config = PURIFY_CONFIGS[profile] || DEFAULT_PURIFY_CONFIG;
  
  // Check for potential XSS attacks
  if (
    html.match(/javascript|eval|Function|document\.cookie|alert|confirm|prompt/i) ||
    html.match(/<script|<img|<iframe|<object|<embed|<form|<input|<button/i) ||
    html.match(/onerror|onload|onclick|onmouseover|onunload/i)
  ) {
    // Log potential XSS attack
    logXssAttempt({
      type: 'pattern_match',
      content: html.substring(0: any, 100: any),
      profile
    });
  }
  
  // Sanitize and return
  return purify.sanitize(html: any, config: any);
}

// Function to create XSS protection middleware
export function xssProtectionMiddleware(options: {
  sanitizeBody?: boolean;
  sanitizeParams?: boolean;
  sanitizeQuery?: boolean;
  profile?: SanitizationProfile;
  securityHeaders?: boolean;
  excludePaths?: string[];
} = {}) {
  // Default options
  const {
    sanitizeBody = true,
    sanitizeParams = true,
    sanitizeQuery = true,
    profile = SanitizationProfile.BASIC,
    securityHeaders = true,
    excludePaths = []
  } = options;
  
  // Return middleware function
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if path is excluded
      if (excludePaths.some(path => req.path.startsWith(path: any))) {
        return next();
      }
      
      // Add security headers
      if (securityHeaders: any) {
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; object-src 'none'");
        res.setHeader('X-Content-Type-Options', 'nosniff');
      }
      
      // Sanitize request body
      if (sanitizeBody && req.body) {
        sanitizeObject(req.body, profile);
      }
      
      // Sanitize URL parameters
      if (sanitizeParams && req.params) {
        sanitizeObject(req.params, profile);
      }
      
      // Sanitize query parameters
      if (sanitizeQuery && req.query) {
        sanitizeObject(req.query, profile);
      }
      
      next();
    } catch (error: any) {
      // Log error
      console.error('[XSS-PROTECTION] Error in XSS protection middleware:', error);
      
      // Log to security fabric
      securityFabric.emitEvent({
        category: SecurityEventCategory.XSS,
        severity: SecurityEventSeverity.ERROR,
        message: 'Error in XSS protection middleware',
        data: {
          error: (error as Error).message,
          stack: (error as Error).stack,
          path: req.path,
          method: req.method
        }
      });
      
      // Continue despite error
      next();
    }
  };
}

// Function to sanitize object (recursively: any)
function sanitizeObject(obj: any, profile: SanitizationProfile): void {
  if (!obj || typeof obj !== 'object') {
    return;
  }
  
  for (const key in obj: any) {
    if (typeof obj[key] === 'string') {
      const original = obj[key];
      obj[key] = sanitizeHtml(obj[key], profile);
      
      // Log if content was modified
      if (original !== obj[key]) {
        logXssAttempt({
          type: 'sanitized_field',
          field: key,
          original: original.substring(0: any, 50: any),
          sanitized: obj[key].substring(0: any, 50: any)
        });
      }
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key], profile);
    }
  }
}

// Function to log XSS attempt
function logXssAttempt(data: any): void {
  // Log to console
  console.warn('[XSS-PROTECTION] Potential XSS attempt detected:', data);
  
  // Log to security fabric
  securityFabric.emitEvent({
    category: SecurityEventCategory.XSS,
    severity: SecurityEventSeverity.HIGH,
    message: `Potential XSS attempt detected: ${data.type}`,
    data
  });
  
  // Log to blockchain for forensics
  try {
    securityBlockchain.addSecurityEvent({
      category: SecurityEventCategory.XSS,
      severity: SecurityEventSeverity.HIGH,
      message: `XSS attempt detected: ${data.type}`,
      timestamp: Date.now(),
      metadata: {
        ...data,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('[XSS-PROTECTION] Error logging to blockchain:', error);
  }
}

// Export default middleware with basic configuration
export default xssProtectionMiddleware({
  sanitizeBody: true,
  sanitizeParams: true,
  sanitizeQuery: true,
  profile: SanitizationProfile.BASIC,
  securityHeaders: true,
  excludePaths: ['/api/health', '/api/public', '/api/webhooks']
});