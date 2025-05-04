/**
 * PCI Compliance Middleware
 * 
 * This middleware applies PCI DSS compliance requirements to payment-related routes.
 * Key features:
 * - Adds required security headers (PCI DSS Req 6.5.10)
 * - Enforces TLS for all payment interactions (PCI DSS Req 4.1)
 * - Sanitizes request data (PCI DSS Req 6.5.1)
 * - Validates and logs all payment operations (PCI DSS Req 10.2)
 */

import { Request, Response, NextFunction } from 'express';
import { getClientIPFromRequest, redactSensitiveInfo } from '../../utils/security';
import { recordAuditEvent } from '../secureAuditTrail';

/**
 * Middleware to ensure PCI DSS compliance for payment routes
 * Implements requirements 4.1 (encryption), 6.5 (secure coding), and 10.2 (logging)
 */
export function pciComplianceMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Get client IP for audit trail (PCI DSS Req 10.3.1)
  const clientIp = getClientIPFromRequest(req);
  const userId = req.user?.id || req.session?.userId;
  
  // 1. Secure headers for payment routes (PCI DSS Req 6.5.10)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self' https://js.stripe.com; frame-src https://js.stripe.com https://hooks.stripe.com; script-src 'self' https://js.stripe.com");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  
  // 2. Check if using HTTPS (PCI DSS Req 4.1)
  const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
  if (!isSecure && process.env.NODE_ENV === 'production') {
    recordAuditEvent({
      timestamp: new Date().toISOString(),
      action: 'PAYMENT_SECURITY_VIOLATION',
      resource: `payment:${req.path}`,
      userId: userId,
      ipAddress: clientIp,
      result: 'failure',
      severity: 'critical',
      details: {
        violation: 'Non-HTTPS payment request',
        path: req.path
      }
    });
    
    return res.status(403).json({
      success: false,
      message: 'Payment operations require a secure connection'
    });
  }
  
  // 3. Redact PAN data from request body if present (PCI DSS Req 3.4)
  if (req.body) {
    req.body = redactPANFromRequest(req.body);
  }
  
  // 4. Record payment route access (PCI DSS Req 10.2)
  recordAuditEvent({
    timestamp: new Date().toISOString(),
    action: 'PAYMENT_ROUTE_ACCESS',
    resource: `payment:${req.path}`,
    userId: userId,
    ipAddress: clientIp,
    result: 'success',
    severity: 'info',
    details: {
      method: req.method,
      path: req.path
    }
  });
  
  // 5. Override the response methods to ensure PCI compliant responses
  const originalJson = res.json;
  res.json = function(body: any): Response {
    // Ensure sensitive data doesn't leak in responses
    const sanitizedBody = redactSensitiveResponseData(body);
    return originalJson.call(this, sanitizedBody);
  };

  next();
}

/**
 * Helper function to redact PAN data from request body
 * Implements PCI DSS Requirement 3.4 - Render PAN unreadable
 */
function redactPANFromRequest(body: any): any {
  if (!body) return body;
  
  // If it's a string (e.g., JSON string), parse and redact
  if (typeof body === 'string') {
    try {
      const parsed = JSON.parse(body);
      const redacted = redactPANFromRequest(parsed);
      return JSON.stringify(redacted);
    } catch {
      // Not valid JSON, treat as regular string
      return body;
    }
  }
  
  // If it's an array, process each item
  if (Array.isArray(body)) {
    return body.map(item => redactPANFromRequest(item));
  }
  
  // If it's an object, process each property
  if (typeof body === 'object' && body !== null) {
    const redacted: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(body)) {
      // Check for potential card number fields
      if (
        key.toLowerCase().includes('card') ||
        key.toLowerCase().includes('number') ||
        key.toLowerCase().includes('pan') ||
        key.toLowerCase().includes('payment')
      ) {
        // If it's a string and looks like a card number, redact it
        if (typeof value === 'string' && /^\d{13,19}$/.test(value.replace(/[\s-]/g, ''))) {
          const last4 = value.slice(-4);
          redacted[key] = `****-****-****-${last4}`;
          continue;
        }
      }
      
      // For all other properties, recursively process them
      redacted[key] = redactPANFromRequest(value);
    }
    
    return redacted;
  }
  
  // For all other types (number, boolean, etc.), return as is
  return body;
}

/**
 * Helper function to redact sensitive data from responses
 * Implements PCI DSS Requirement 3.4
 */
function redactSensitiveResponseData(data: any): any {
  if (!data) return data;
  
  // Handle JSON string
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      const redacted = redactSensitiveResponseData(parsed);
      return JSON.stringify(redacted);
    } catch {
      // Not valid JSON, treat as regular string
      return data;
    }
  }
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => redactSensitiveResponseData(item));
  }
  
  // Handle objects
  if (typeof data === 'object' && data !== null) {
    const redacted: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(data)) {
      // List of fields that might contain sensitive data
      const sensitiveFields = [
        'cardNumber', 'card_number', 'pan', 'cvv', 'cvc', 'securityCode', 'security_code',
        'apiKey', 'api_key', 'secret', 'password', 'token'
      ];
      
      // Check if this is a sensitive field
      if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
        redacted[key] = '[REDACTED]';
      } else {
        // For all other fields, recursively process them
        redacted[key] = redactSensitiveResponseData(value);
      }
    }
    
    return redacted;
  }
  
  // For all other types (number, boolean, etc.), return as is
  return data;
}