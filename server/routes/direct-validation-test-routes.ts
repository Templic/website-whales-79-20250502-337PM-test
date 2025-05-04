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

import { Router, Request, Response } from 'express';
import { noSecurityMiddleware } from '../middleware/noSecurityMiddleware';
import { z } from 'zod';

const router = Router();

// Apply the no-security middleware to all routes in this router
router.use(noSecurityMiddleware);

/**
 * Direct status endpoint
 * GET /api/direct-validation/status
 */
router.get('/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    active: true,
    securityMode: 'COMPLETELY_BYPASSED',
    message: 'Direct validation test API is active'
  });
});

/**
 * Direct basic validation endpoint
 * POST /api/direct-validation/basic
 */
router.post('/basic', (req: Request, res: Response) => {
  // Basic validation schema for contact form
  const schema = z.object({
    name: z.string().min(2, { message: 'Name must be between 2 and 100 characters' }).max(100),
    email: z.string().email({ message: 'Invalid email address' }),
    message: z.string().min(10, { message: 'Message must be between 10 and 2000 characters' }).max(2000)
  });

  try {
    // Attempt to validate the request body
    const result = schema.safeParse(req.body);

    if (result.success) {
      return res.json({
        success: true,
        validation: {
          passed: true,
          securityMode: 'COMPLETELY_BYPASSED'
        },
        data: result.data
      });
    } else {
      // Extract validation errors
      const errors = result.error.errors.map(err => ({
        field: err.path[0],
        error: err.message
      }));

      return res.json({
        success: false,
        validation: {
          passed: false,
          errors,
          securityMode: 'COMPLETELY_BYPASSED'
        }
      });
    }
  } catch (error) {
    console.error('Error in direct validation endpoint:', error);
    return res.status(500).json({
      success: false,
      validation: {
        passed: false,
        errors: [{ field: 'server', error: 'Server error during validation' }],
        securityMode: 'COMPLETELY_BYPASSED'
      },
      error: 'Internal server error'
    });
  }
});

/**
 * Direct security validation endpoint
 * POST /api/direct-validation/security
 */
router.post('/security', (req: Request, res: Response) => {
  try {
    // Extract query and userId from the request body
    const { query, userId } = req.body;

    // Define potential security issues to check for
    const potentialSqlInjection = /\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|UNION|JOIN|WHERE|FROM|INTO|VALUES)\b/i;
    
    // Check for SQL injection in the query
    const hasSqlInjection = potentialSqlInjection.test(query);
    
    // Calculate a security score (0-1, where 1 is perfectly secure)
    let securityScore = 1.0;
    const warnings: string[] = [];

    if (hasSqlInjection) {
      securityScore = 0.2; // Low security score for SQL injection
      warnings.push('Potential SQL injection detected in query');
    }

    return res.json({
      success: true,
      validation: {
        passed: securityScore > 0.5, // Pass if score is above 0.5
        securityScore,
        securityMode: 'COMPLETELY_BYPASSED',
        ...(warnings.length > 0 && { warnings })
      }
    });
  } catch (error) {
    console.error('Error in security validation endpoint:', error);
    return res.status(500).json({
      success: false,
      validation: {
        passed: false,
        securityScore: 0,
        securityMode: 'COMPLETELY_BYPASSED',
        errors: [{ field: 'server', error: 'Server error during security validation' }]
      },
      error: 'Internal server error'
    });
  }
});

/**
 * Direct validation rules endpoint
 * GET /api/direct-validation/rules
 */
router.get('/rules', (req: Request, res: Response) => {
  // Sample validation rules
  const rules = [
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
  ];

  res.json({
    success: true,
    count: rules.length,
    securityMode: 'COMPLETELY_BYPASSED',
    rules
  });
});

/**
 * Direct validation mappings endpoint
 * GET /api/direct-validation/mappings
 */
router.get('/mappings', (req: Request, res: Response) => {
  // Sample validation mappings
  const mappings = [
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
  ];

  res.json({
    success: true,
    securityMode: 'COMPLETELY_BYPASSED',
    mappings
  });
});

export default router;