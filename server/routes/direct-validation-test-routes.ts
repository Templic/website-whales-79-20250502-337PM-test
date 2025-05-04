/**
 * Direct Validation Test Routes
 * 
 * These routes are completely unsecured and bypass ALL security measures including:
 * - CSRF protection
 * - Rate limiting
 * - Authentication
 * - Any other security middleware
 * 
 * They are ONLY for testing the API validation functionality and should never be 
 * enabled in a production environment.
 * 
 * WARNING: These routes represent a security risk if exposed in production.
 */

import express, { Request, Response } from 'express';

const router = express.Router();

/**
 * Direct status endpoint
 * GET /api/direct-validation/status
 */
router.get('/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Direct validation test routes active',
    timestamp: new Date().toISOString(),
    securityMode: 'COMPLETELY_BYPASSED',
    noSecurity: true,
    noCsrf: true,
    noRateLimiting: true,
    noAuthentication: true
  });
});

/**
 * Direct basic validation endpoint
 * POST /api/direct-validation/basic
 */
router.post('/basic', (req: Request, res: Response) => {
  try {
    const { name, email, message } = req.body;
    
    // Simple validation
    const errors = [];
    
    if (!name || name.length < 2 || name.length > 100) {
      errors.push({ field: 'name', error: 'Name must be between 2 and 100 characters' });
    }
    
    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      errors.push({ field: 'email', error: 'Invalid email address' });
    }
    
    if (!message || message.length < 10 || message.length > 2000) {
      errors.push({ field: 'message', error: 'Message must be between 10 and 2000 characters' });
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        validation: {
          passed: false,
          errors,
          securityMode: 'COMPLETELY_BYPASSED'
        }
      });
    }
    
    res.json({
      success: true,
      validation: {
        passed: true,
        securityMode: 'COMPLETELY_BYPASSED'
      },
      data: { name, email, message }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
      securityMode: 'COMPLETELY_BYPASSED'
    });
  }
});

/**
 * Direct security validation endpoint
 * POST /api/direct-validation/security
 */
router.post('/security', (req: Request, res: Response) => {
  try {
    const { query, userId } = req.body;
    
    // Check for SQL injection patterns
    const hasSqlInjection = 
      typeof query === 'string' && (
        query.toLowerCase().includes('select') ||
        query.toLowerCase().includes('from') ||
        query.toLowerCase().includes('drop') ||
        query.toLowerCase().includes('table') ||
        query.toLowerCase().includes(';') ||
        query.toLowerCase().includes('--')
      );
      
    // Check for suspicious user ID patterns
    const hasSuspiciousUserId = 
      typeof userId === 'string' && (
        userId.includes(';') ||
        userId.includes('--') ||
        userId.includes('\'') ||
        userId.includes('"')
      );
      
    if (hasSqlInjection || hasSuspiciousUserId) {
      return res.json({
        success: true,
        validation: {
          passed: false,
          securityScore: 0.2,
          securityMode: 'COMPLETELY_BYPASSED',
          warnings: [
            ...(hasSqlInjection ? ['Potential SQL injection detected in query'] : []),
            ...(hasSuspiciousUserId ? ['Suspicious characters detected in userId'] : [])
          ]
        }
      });
    }
    
    res.json({
      success: true,
      validation: {
        passed: true,
        securityScore: 0.9,
        securityMode: 'COMPLETELY_BYPASSED'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
      securityMode: 'COMPLETELY_BYPASSED'
    });
  }
});

/**
 * Direct validation rules endpoint
 * GET /api/direct-validation/rules
 */
router.get('/rules', (req: Request, res: Response) => {
  res.json({
    success: true,
    count: 2,
    securityMode: 'COMPLETELY_BYPASSED',
    rules: [
      {
        id: 'direct-basic-validation',
        name: 'Direct Basic Validation',
        description: 'Validates basic form input without security checks',
        target: 'body',
        priority: 10,
        isActive: true,
        tags: ['form', 'direct', 'no-security']
      },
      {
        id: 'direct-security-validation',
        name: 'Direct Security Validation',
        description: 'Validates security-related input without security checks',
        target: 'body',
        priority: 20,
        isActive: true,
        tags: ['security', 'direct', 'no-security']
      }
    ]
  });
});

/**
 * Direct validation mappings endpoint
 * GET /api/direct-validation/mappings
 */
router.get('/mappings', (req: Request, res: Response) => {
  res.json({
    success: true,
    securityMode: 'COMPLETELY_BYPASSED',
    mappings: [
      {
        route: '/api/direct-validation/basic',
        method: 'POST',
        rules: ['direct-basic-validation'],
        priority: 10,
        securityLevel: 'none'
      },
      {
        route: '/api/direct-validation/security',
        method: 'POST',
        rules: ['direct-security-validation'],
        priority: 20,
        securityLevel: 'none'
      }
    ]
  });
});

export default router;