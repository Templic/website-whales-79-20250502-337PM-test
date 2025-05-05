/**
 * XSS Protection Middleware
 * 
 * This middleware protects against XSS attacks by sanitizing input, setting
 * appropriate security headers, and validating HTML/JS content.
 */

import { Request, Response, NextFunction } from 'express';
import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';

// Commented out for now until security infrastructure is properly set up
// import { SecurityFabric } from '../security/advanced/SecurityFabric';
// import { SecurityEventTypes } from '../security/advanced/blockchain/SecurityEventTypes';
// import { immutableSecurityLogs as securityBlockchain } from '../security/advanced/blockchain/ImmutableSecurityLogs';

// Temporary mock for securityBlockchain
const securityBlockchain = {
  addLog: (data: any) => {
    console.log('[SECURITY-BLOCKCHAIN] Would log XSS attempt:', data);
    return Promise.resolve();
  }
};

// Initialize DOMPurify with JSDOM
const window = new JSDOM('').window;
const purify = DOMPurify(window);

// Default purify config (stricter than default)
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
purify.addHook('beforeSanitizeElements', (node) => {
  if (node.textContent && node.textContent.match(/javascript|eval|Function|document\.cookie|alert|confirm|prompt/i)) {
    // Log potential XSS attack
    logXssAttempt({
      type: 'suspicious_content',
      content: node.textContent.substring(0, 50),
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
      content: html.substring(0, 100),
      profile
    });
  }
  
  // Sanitize and return
  return purify.sanitize(html, config);
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
      if (excludePaths.some(path => req.path.startsWith(path))) {
        return next();
      }
      
      // Add security headers
      if (securityHeaders) {
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
    } catch (error) {
      // Log error
      console.error('[XSS-PROTECTION] Error in XSS protection middleware:', error);
      
      // Log security event - temporarily disabled
      // Will be re-enabled once SecurityFabric is implemented
      console.warn('[XSS-PROTECTION] Security event: Error in XSS protection middleware', {
        path: req.path,
        method: req.method,
        error: (error as Error).message
      });
      
      // Continue despite error
      next();
    }
  };
}

// Function to sanitize object (recursively)
function sanitizeObject(obj: any, profile: SanitizationProfile): void {
  if (!obj || typeof obj !== 'object') {
    return;
  }
  
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      const original = obj[key];
      obj[key] = sanitizeHtml(obj[key], profile);
      
      // Log if content was modified
      if (original !== obj[key]) {
        logXssAttempt({
          type: 'sanitized_field',
          field: key,
          original: original.substring(0, 50),
          sanitized: obj[key].substring(0, 50)
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
  
  // Log to security fabric - temporarily disabled
  // Will be re-enabled once SecurityFabric is implemented
  /*
  SecurityFabric.getInstance().emitSecurityEvent({
    type: SecurityEventTypes.SECURITY_VULNERABILITY_DETECTED,
    source: 'xss_protection',
    severity: 'high',
    message: `Potential XSS attempt detected: ${data.type}`,
    attributes: data
  });
  */
  console.warn(`[XSS-PROTECTION] Security event: Potential XSS attempt detected: ${data.type}`);
  
  // Log to blockchain for forensics
  try {
    securityBlockchain.addLog({
      type: 'xss_attempt',
      details: {
        attemptType: data.type,
        data,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
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