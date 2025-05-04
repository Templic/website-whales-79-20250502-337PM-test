/**
 * Validation Bypass Routes
 * 
 * These routes are specifically designed to bypass ALL security checks
 * for API validation testing. This includes CSRF protection,
 * authentication, and other security middleware.
 * 
 * WARNING: NEVER enable these routes in a production environment.
 */

import express, { Request, Response } from 'express';

const router = express.Router();

/**
 * Get validation status
 */
router.get('/status', (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      message: 'Validation bypass test routes active',
      timestamp: new Date().toISOString(),
      securityBypass: true,
      csrfProtection: false,
      authenticationRequired: false
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

/**
 * Test basic validation
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
          errors
        }
      });
    }
    
    res.json({
      success: true,
      validation: {
        passed: true,
        bypassRoute: true
      },
      data: { name, email, message }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

/**
 * Test security validation
 */
router.post('/security', (req: Request, res: Response) => {
  try {
    // Parse the request body
    const { query, userId } = req.body;
    
    // Check for SQL injection
    const hasSqlInjection = 
      typeof query === 'string' && (
        query.toLowerCase().includes('select') ||
        query.toLowerCase().includes('from') ||
        query.toLowerCase().includes('drop') ||
        query.toLowerCase().includes('table') ||
        query.toLowerCase().includes(';') ||
        query.toLowerCase().includes('--')
      );
      
    // Check for other suspicious patterns
    const hasSuspiciousUserId = 
      typeof userId === 'string' && (
        userId.includes(';') ||
        userId.includes('--') ||
        userId.includes('\'') ||
        userId.includes('"')
      );
      
    // Generate results
    if (hasSqlInjection || hasSuspiciousUserId) {
      return res.json({
        success: true,
        validation: {
          passed: false,
          securityScore: 0.2,
          bypassRoute: true,
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
        bypassRoute: true
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

/**
 * Get validation rules
 */
router.get('/rules', (req: Request, res: Response) => {
  try {
    // Return a set of validation rules for testing
    res.json({
      success: true,
      message: 'Validation rules retrieved successfully',
      bypassRoute: true,
      rules: [
        {
          id: 'contact-form-bypass',
          name: 'Contact Form Validation (Bypass)',
          description: 'Validates contact form submissions with security bypass',
          target: 'body',
          priority: 10,
          isActive: true,
          tags: ['form', 'contact', 'bypass']
        },
        {
          id: 'security-test-bypass',
          name: 'Security Test Validation (Bypass)',
          description: 'Validates security test inputs with security bypass',
          target: 'body',
          priority: 20,
          isActive: true,
          tags: ['security', 'test', 'bypass']
        }
      ]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

/**
 * Get validation mappings
 */
router.get('/mappings', (req: Request, res: Response) => {
  try {
    // Return validation mappings for testing
    res.json({
      success: true,
      message: 'Validation mappings retrieved successfully',
      bypassRoute: true,
      mappings: [
        {
          route: '/api/validation-bypass/basic',
          method: 'POST',
          rules: ['contact-form-bypass'],
          priority: 10
        },
        {
          route: '/api/validation-bypass/security',
          method: 'POST',
          rules: ['security-test-bypass'],
          priority: 20
        }
      ]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

export default router;